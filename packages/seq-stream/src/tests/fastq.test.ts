import {
  FastqParser,
  FastqWriter,
  QualityEncoding,
  convertQualityScores,
  decodeQualityScores,
  encodeQualityScores,
  type FastqRecord,
} from '../fastq';
import { Readable, Writable } from 'stream';
import { pipeline } from 'stream/promises';

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
