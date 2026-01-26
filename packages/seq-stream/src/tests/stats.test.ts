import { StatsCalculator, calculateN50, calculateL50, LengthFilter } from '../stats';
import type { FastaRecord } from '../fasta';
import { QualityEncoding, type FastqRecord } from '../fastq';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

describe('StatsCalculator', () => {
  test('calculates basic statistics for FASTA', async () => {
    const records: FastaRecord[] = [
      { id: 'seq1', sequence: 'ACGTACGT' }, // 8bp, 50% GC
      { id: 'seq2', sequence: 'GGCCGGCC' }, // 8bp, 100% GC
      { id: 'seq3', sequence: 'AAAATTTT' }, // 8bp, 0% GC
    ];

    const readable = Readable.from(records);
    const stats = new StatsCalculator();

    await pipeline(readable, stats);

    const results = stats.getStats();
    expect(results.totalSequences).toBe(3);
    expect(results.totalBases).toBe(24);
    expect(results.gcContent).toBeCloseTo(50, 1);
    expect(results.meanLength).toBe(8);
    expect(results.minLength).toBe(8);
    expect(results.maxLength).toBe(8);
  });

  test('calculates statistics with N content', async () => {
    const records: FastaRecord[] = [
      { id: 'seq1', sequence: 'ACGTNNNN' }, // 50% N
    ];

    const readable = Readable.from(records);
    const stats = new StatsCalculator();

    await pipeline(readable, stats);

    const results = stats.getStats();
    expect(results.nContent).toBeCloseTo(50, 1);
  });

  test('calculates mean quality for FASTQ', async () => {
    const records: FastqRecord[] = [
      { id: 'seq1', sequence: 'ACGT', quality: 'IIII', description: '' }, // Q=40 for each
    ];

    const readable = Readable.from(records);
    const stats = new StatsCalculator(QualityEncoding.Phred33);

    await pipeline(readable, stats);

    const results = stats.getStats();
    expect(results.meanQuality).toBe(40);
  });
});

describe('N50/L50 calculations', () => {
  test('calculates N50 correctly', () => {
    const lengths = [100, 200, 300, 400, 500];
    const n50 = calculateN50(lengths);
    // Total = 1500, half = 750
    // 500 + 400 = 900 >= 750, so N50 = 400
    expect(n50).toBe(400);
  });

  test('calculates L50 correctly', () => {
    const lengths = [100, 200, 300, 400, 500];
    const l50 = calculateL50(lengths);
    // Need 2 largest contigs to reach half
    expect(l50).toBe(2);
  });

  test('handles empty array', () => {
    expect(calculateN50([])).toBe(0);
    expect(calculateL50([])).toBe(0);
  });
});

describe('LengthFilter', () => {
  test('filters sequences by minimum length', async () => {
    const records: FastaRecord[] = [
      { id: 'seq1', sequence: 'AC' },
      { id: 'seq2', sequence: 'ACGTACGT' },
      { id: 'seq3', sequence: 'ACGT' },
    ];

    const filtered: FastaRecord[] = [];
    const readable = Readable.from(records);
    const filter = new LengthFilter(4);

    filter.on('data', (record: FastaRecord) => {
      filtered.push(record);
    });

    await pipeline(readable, filter);

    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe('seq2');
    expect(filtered[1].id).toBe('seq3');
  });

  test('filters sequences by maximum length', async () => {
    const records: FastaRecord[] = [
      { id: 'seq1', sequence: 'AC' },
      { id: 'seq2', sequence: 'ACGTACGT' },
      { id: 'seq3', sequence: 'ACGT' },
    ];

    const filtered: FastaRecord[] = [];
    const readable = Readable.from(records);
    const filter = new LengthFilter(0, 4);

    filter.on('data', (record: FastaRecord) => {
      filtered.push(record);
    });

    await pipeline(readable, filter);

    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe('seq1');
    expect(filtered[1].id).toBe('seq3');
  });

  test('calculates comprehensive statistics including new metrics', async () => {
    const records: FastqRecord[] = [
      { id: 'seq1', sequence: 'ACGTACGT', quality: '########', description: '' }, // 8bp, 50% GC, Q8
      { id: 'seq2', sequence: 'GGCC', quality: 'IIII', description: '' }, // 4bp, 100% GC, Q40
      { id: 'seq3', sequence: 'AATTNNRR', quality: '55555555', description: '' }, // 8bp, 0% GC, 25% N, 25% ambiguous, Q20
    ];

    const readable = Readable.from(records);
    const stats = new StatsCalculator(QualityEncoding.Phred33);

    await pipeline(readable, stats);

    const results = stats.getStats();

    // Basic stats
    expect(results.totalSequences).toBe(3);
    expect(results.totalBases).toBe(20);

    // GC and AT content
    // seq1: 4 GC, 4 AT
    // seq2: 4 GC, 0 AT
    // seq3: 0 GC, 4 AT, 2 N, 2 R
    // Total: 8 GC, 8 AT out of 20 bases
    expect(results.gcContent).toBeCloseTo(40, 1); // 8 GC out of 20
    expect(results.atContent).toBeCloseTo(40, 1); // 8 AT out of 20

    // N and ambiguous bases
    expect(results.nContent).toBeCloseTo(10, 1); // 2 N out of 20
    expect(results.ambiguousBasesCount).toBe(2); // 2 R bases

    // Length stats
    expect(results.minLength).toBe(4);
    expect(results.maxLength).toBe(8);
    expect(results.meanLength).toBe(20 / 3);
    expect(results.medianLength).toBe(4); // Sorted lengths [4, 8, 8], median at index floor(3/2) = 1 -> value 4
    expect(results.stdDevLength).toBeGreaterThan(0);

    // N50/L50
    expect(results.n50).toBe(8);
    expect(results.l50).toBe(2);

    // Quality stats
    expect(results.meanQuality).toBeGreaterThan(0);
    expect(results.minQuality).toBe(2); // # = Q2
    expect(results.maxQuality).toBe(40); // I = Q40
    expect(results.q20Percent).toBeGreaterThan(0);
    expect(results.q30Percent).toBeGreaterThan(0);
  });
});
