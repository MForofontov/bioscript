import {
  FastqParser,
  FastqWriter,
  createFastqParser,
  createFastqWriter,
  QualityEncoding,
  convertQualityScores,
  decodeQualityScores,
  encodeQualityScores,
  type FastqRecord,
} from '../fastq';
import { Readable, Writable } from 'stream';
import { pipeline } from 'stream/promises';
import { join } from 'path';
import { unlinkSync } from 'fs';

describe('FastqParser', () => {
  test('parses simple FASTQ record', async () => {
    const input = '@seq1 test\nACGT\n+\nIIII\n';
    const records: FastqRecord[] = [];

    const readable = Readable.from([input]);
    const parser = new FastqParser();

    parser.on('data', (record: FastqRecord) => {
      records.push(record);
    });

    await pipeline(readable, parser);

    expect(records).toHaveLength(1);
    expect(records[0].id).toBe('seq1');
    expect(records[0].description).toBe('test');
    expect(records[0].sequence).toBe('ACGT');
    expect(records[0].quality).toBe('IIII');
  });

  test('parses multiple FASTQ records', async () => {
    const input = '@seq1\nACGT\n+\nIIII\n@seq2\nTGCA\n+\nHHHH\n';
    const records: FastqRecord[] = [];

    const readable = Readable.from([input]);
    const parser = new FastqParser();

    parser.on('data', (record: FastqRecord) => {
      records.push(record);
    });

    await pipeline(readable, parser);

    expect(records).toHaveLength(2);
    expect(records[0].id).toBe('seq1');
    expect(records[1].id).toBe('seq2');
  });

  test('throws error on sequence/quality length mismatch', async () => {
    const input = '@seq1\nACGT\n+\nII\n';

    const readable = Readable.from([input]);
    const parser = new FastqParser();

    await expect(pipeline(readable, parser)).rejects.toThrow(/length mismatch/);
  });
});

describe('FastqWriter', () => {
  test('writes FASTQ record correctly', async () => {
    const record: FastqRecord = {
      id: 'seq1',
      description: 'test',
      sequence: 'ACGT',
      quality: 'IIII',
    };

    const chunks: string[] = [];
    const writable = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk.toString());
        callback();
      },
    });

    const writer = new FastqWriter();
    writer.pipe(writable);

    writer.write(record);
    writer.end();

    await new Promise((resolve) => writable.on('finish', resolve));

    const output = chunks.join('');
    expect(output).toBe('@seq1 test\nACGT\n+\nIIII\n');
  });
});

describe('Quality score conversion', () => {
  test('converts Phred+33 to Phred+64', () => {
    const phred33 = '!!II';
    const phred64 = convertQualityScores(phred33, QualityEncoding.Phred33, QualityEncoding.Phred64);
    expect(phred64).toBe('@@hh');
  });

  test('converts Phred+64 to Phred+33', () => {
    const phred64 = '@@hh';
    const phred33 = convertQualityScores(phred64, QualityEncoding.Phred64, QualityEncoding.Phred33);
    expect(phred33).toBe('!!II');
  });

  test('decodes quality scores', () => {
    const quality = '!!II';
    const scores = decodeQualityScores(quality, QualityEncoding.Phred33);
    expect(scores).toEqual([0, 0, 40, 40]);
  });

  test('encodes quality scores', () => {
    const scores = [0, 0, 40, 40];
    const quality = encodeQualityScores(scores, QualityEncoding.Phred33);
    expect(quality).toBe('!!II');
  });
});

describe('FASTQ gzip support', () => {
  const fixturesDir = join(__dirname, 'fixtures');
  const testFile = join(fixturesDir, 'test.fastq');
  const gzipFile = join(fixturesDir, 'test.fastq.gz');
  const outputGzipFile = join(fixturesDir, 'output.fastq.gz');

  afterEach(() => {
    // Clean up output files
    try {
      unlinkSync(outputGzipFile);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  test('1. reads gzip-compressed FASTQ file', async () => {
    // Test parsing gzip-compressed FASTQ
    const records: FastqRecord[] = [];

    await new Promise<void>((resolve, reject) => {
      createFastqParser(gzipFile)
        .on('data', (record: FastqRecord) => records.push(record))
        .on('end', resolve)
        .on('error', reject);
    });

    expect(records).toHaveLength(2);
    expect(records[0].id).toBe('seq1');
    expect(records[0].sequence).toBe('ACGT');
    expect(records[0].quality).toBe('IIII');
    expect(records[1].id).toBe('seq2');
    expect(records[1].sequence).toBe('TGCA');
    expect(records[1].quality).toBe('HHHH');
  });

  test('2. writes gzip-compressed FASTQ file', async () => {
    // Test writing gzip-compressed FASTQ
    const records: FastqRecord[] = [
      { id: 'test1', sequence: 'AAAA', quality: 'IIII' },
      { id: 'test2', description: 'compressed', sequence: 'TTTT', quality: 'JJJJ' },
    ];

    const writer = createFastqWriter(outputGzipFile) as FastqWriter;

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
    const readRecords: FastqRecord[] = [];
    await new Promise<void>((resolve, reject) => {
      createFastqParser(outputGzipFile)
        .on('data', (record: FastqRecord) => readRecords.push(record))
        .on('end', resolve)
        .on('error', reject);
    });

    expect(readRecords).toHaveLength(2);
    expect(readRecords[0].id).toBe('test1');
    expect(readRecords[0].sequence).toBe('AAAA');
    expect(readRecords[0].quality).toBe('IIII');
    expect(readRecords[1].id).toBe('test2');
    expect(readRecords[1].description).toBe('compressed');
    expect(readRecords[1].sequence).toBe('TTTT');
    expect(readRecords[1].quality).toBe('JJJJ');
  });

  test('3. gzip and non-gzip files produce same output', async () => {
    // Compare parsing gzip vs non-gzip
    const gzipRecords: FastqRecord[] = [];
    const plainRecords: FastqRecord[] = [];

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        createFastqParser(gzipFile)
          .on('data', (record: FastqRecord) => gzipRecords.push(record))
          .on('end', resolve)
          .on('error', reject);
      }),
      new Promise<void>((resolve, reject) => {
        createFastqParser(testFile)
          .on('data', (record: FastqRecord) => plainRecords.push(record))
          .on('end', resolve)
          .on('error', reject);
      }),
    ]);

    expect(gzipRecords).toEqual(plainRecords);
  });
});
