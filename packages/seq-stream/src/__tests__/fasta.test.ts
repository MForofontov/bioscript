import type { FastaRecord } from '../fasta.js';
import { FastaParser, FastaWriter } from '../fasta.js';
import { Readable, Writable } from 'stream';
import { pipeline } from 'stream/promises';

describe('FastaParser', () => {
  test('parses simple FASTA record', async () => {
    const input = '>seq1 test sequence\nACGTACGT\nAAAA\n';
    const records: FastaRecord[] = [];

    const readable = Readable.from([input]);
    const parser = new FastaParser();

    parser.on('data', (record: FastaRecord) => {
      records.push(record);
    });

    await pipeline(readable, parser);

    expect(records).toHaveLength(1);
    expect(records[0].id).toBe('seq1');
    expect(records[0].description).toBe('test sequence');
    expect(records[0].sequence).toBe('ACGTACGTAAAA');
  });

  test('parses multiple FASTA records', async () => {
    const input = '>seq1\nACGT\n>seq2\nTGCA\n>seq3\nGGGG\n';
    const records: FastaRecord[] = [];

    const readable = Readable.from([input]);
    const parser = new FastaParser();

    parser.on('data', (record: FastaRecord) => {
      records.push(record);
    });

    await pipeline(readable, parser);

    expect(records).toHaveLength(3);
    expect(records[0].id).toBe('seq1');
    expect(records[0].sequence).toBe('ACGT');
    expect(records[1].id).toBe('seq2');
    expect(records[1].sequence).toBe('TGCA');
    expect(records[2].id).toBe('seq3');
    expect(records[2].sequence).toBe('GGGG');
  });

  test('handles FASTA without description', async () => {
    const input = '>seq1\nACGT\n';
    const records: FastaRecord[] = [];

    const readable = Readable.from([input]);
    const parser = new FastaParser();

    parser.on('data', (record: FastaRecord) => {
      records.push(record);
    });

    await pipeline(readable, parser);

    expect(records).toHaveLength(1);
    expect(records[0].id).toBe('seq1');
    expect(records[0].description).toBeUndefined();
    expect(records[0].sequence).toBe('ACGT');
  });
});

describe('FastaWriter', () => {
  test('writes FASTA record correctly', async () => {
    const record: FastaRecord = {
      id: 'seq1',
      description: 'test sequence',
      sequence: 'ACGTACGTACGTACGT',
    };

    const chunks: string[] = [];
    const writable = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk.toString());
        callback();
      },
    });

    const writer = new FastaWriter(8);
    writer.pipe(writable);

    writer.write(record);
    writer.end();

    await new Promise((resolve) => writable.on('finish', resolve));

    const output = chunks.join('');
    expect(output).toContain('>seq1 test sequence\n');
    expect(output).toContain('ACGTACGT\n');
    expect(output).toContain('ACGTACGT\n');
  });

  test('writes FASTA without description', async () => {
    const record: FastaRecord = {
      id: 'seq1',
      sequence: 'ACGT',
    };

    const chunks: string[] = [];
    const writable = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk.toString());
        callback();
      },
    });

    const writer = new FastaWriter();
    writer.pipe(writable);

    writer.write(record);
    writer.end();

    await new Promise((resolve) => writable.on('finish', resolve));

    const output = chunks.join('');
    expect(output).toBe('>seq1\nACGT\n');
  });
});
