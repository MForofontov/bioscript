import { Readable } from 'stream';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { FastaParser, FastaWriter, createFastaParser, createFastaWriter } from '../fasta';
import { FastqParser, createFastqParser } from '../fastq';

async function collect(stream: NodeJS.ReadableStream): Promise<unknown[]> {
  const records: unknown[] = [];
  for await (const record of stream as Readable) records.push(record);
  return records;
}

describe('stream reliability', () => {
  const directory = mkdtempSync(join(tmpdir(), 'bioscript-stream-'));
  afterAll(() => rmSync(directory, { recursive: true, force: true }));

  test('preserves UTF-8 headers and records across every byte boundary', async () => {
    const data = Buffer.from('@read café\r\nACGT\r\n+\r\n!!!!');
    const parser = new FastqParser();
    const result = collect(parser);
    Readable.from([...data].map((byte) => Buffer.from([byte]))).pipe(parser);
    expect(await result).toEqual([
      { id: 'read', description: 'café', sequence: 'ACGT', quality: '!!!!' },
    ]);
  });

  test.each(['@read\n', '@read\nAC\n', '@read\nAC\n+\n', '@read\nAC\n+\n!'])(
    'rejects incomplete or mismatched FASTQ: %p',
    async (text) => {
      const parser = new FastqParser();
      const result = collect(parser);
      parser.end(text);
      await expect(result).rejects.toThrow();
    }
  );

  test.each([0, -1, 1.5, NaN, Infinity])('rejects unsafe FASTA width %p', (width) => {
    expect(() => new FastaWriter(width)).toThrow();
  });

  test.each([createFastaParser, createFastqParser])(
    'propagates file and gzip errors',
    async (createParser) => {
      await expect(collect(createParser(join(directory, 'missing')))).rejects.toThrow();
      const path = join(directory, 'corrupt.gz');
      writeFileSync(path, 'not gzip');
      await expect(collect(createParser(path))).rejects.toThrow();
    }
  );

  test('propagates writer errors', async () => {
    const writer = createFastaWriter(join(directory, 'missing', 'output'));
    const error = new Promise<Error>((resolve) => writer.once('error', resolve));
    (writer as import('stream').Writable).end({ id: 'read', sequence: 'AC' });
    expect(await error).toMatchObject({ code: 'ENOENT' });
  });

  test('supports a slow consumer and early destruction', async () => {
    const parser = new FastaParser();
    Readable.from(Array.from({ length: 100 }, (_, i) => `>r${i}\nAC\n`)).pipe(parser);
    let count = 0;
    for await (const record of parser) {
      expect(record.sequence).toBe('AC');
      if (++count === 3) break;
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
    expect(parser.destroyed).toBe(true);
  });

  test('pauses record production within a single large input chunk', async () => {
    const parser = new FastqParser();
    parser.end('@r\nAC\n+\n!!\n'.repeat(1000));
    expect(parser.readableLength).toBeLessThanOrEqual(parser.readableHighWaterMark);
    expect(await collect(parser)).toHaveLength(1000);
  });

  test('resumes across many input chunks after reaching readable and writable watermarks', async () => {
    const parser = new FastaParser();
    Readable.from(Array.from({ length: 10000 }, (_, i) => `>r${i}\n${'ACGT'.repeat(25)}\n`)).pipe(
      parser
    );
    expect(await collect(parser)).toHaveLength(10000);
  });
});
