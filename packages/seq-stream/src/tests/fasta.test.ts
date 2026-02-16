import {
  FastaParser,
  FastaWriter,
  createFastaParser,
  createFastaWriter,
  type FastaRecord,
} from '../fasta';
import { Readable, Writable } from 'stream';
import { pipeline } from 'stream/promises';
import { unlinkSync } from 'fs';
import { join } from 'path';

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

describe('FASTA gzip support', () => {
  const fixturesDir = join(__dirname, 'fixtures');
  const testFile = join(fixturesDir, 'test.fasta');
  const gzipFile = join(fixturesDir, 'test.fasta.gz');
  const outputGzipFile = join(fixturesDir, 'output.fasta.gz');

  afterEach(() => {
    // Clean up output files
    try {
      unlinkSync(outputGzipFile);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  test('1. reads gzip-compressed FASTA file', async () => {
    // Test parsing gzip-compressed FASTA
    const records: FastaRecord[] = [];

    await new Promise<void>((resolve, reject) => {
      createFastaParser(gzipFile)
        .on('data', (record: FastaRecord) => records.push(record))
        .on('end', resolve)
        .on('error', reject);
    });

    expect(records).toHaveLength(2);
    expect(records[0].id).toBe('seq1');
    expect(records[0].sequence).toBe('ACGTACGT');
    expect(records[1].id).toBe('seq2');
    expect(records[1].sequence).toBe('TGCATGCA');
  });

  test('2. writes gzip-compressed FASTA file', async () => {
    // Test writing gzip-compressed FASTA
    const records: FastaRecord[] = [
      { id: 'test1', sequence: 'AAAA' },
      { id: 'test2', description: 'compressed', sequence: 'TTTT' },
    ];

    const writer = createFastaWriter(outputGzipFile) as FastaWriter;

    // Write all records
    for (const record of records) {
      writer.write(record);
    }

    // Wait for the stream to finish
    await new Promise<void>((resolve, reject) => {
      writer.on('error', reject);
      writer.end(() => {
        // Give time for gzip to flush
        setTimeout(resolve, 100);
      });
    });

    // Verify the file was created and can be read back
    const readRecords: FastaRecord[] = [];
    await new Promise<void>((resolve, reject) => {
      createFastaParser(outputGzipFile)
        .on('data', (record: FastaRecord) => readRecords.push(record))
        .on('end', resolve)
        .on('error', reject);
    });

    expect(readRecords).toHaveLength(2);
    expect(readRecords[0].id).toBe('test1');
    expect(readRecords[0].sequence).toBe('AAAA');
    expect(readRecords[1].id).toBe('test2');
    expect(readRecords[1].description).toBe('compressed');
    expect(readRecords[1].sequence).toBe('TTTT');
  });

  test('3. gzip and non-gzip files produce same output', async () => {
    // Compare parsing gzip vs non-gzip
    const gzipRecords: FastaRecord[] = [];
    const plainRecords: FastaRecord[] = [];

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        createFastaParser(gzipFile)
          .on('data', (record: FastaRecord) => gzipRecords.push(record))
          .on('end', resolve)
          .on('error', reject);
      }),
      new Promise<void>((resolve, reject) => {
        createFastaParser(testFile)
          .on('data', (record: FastaRecord) => plainRecords.push(record))
          .on('end', resolve)
          .on('error', reject);
      }),
    ]);

    expect(gzipRecords).toEqual(plainRecords);
  });
});
