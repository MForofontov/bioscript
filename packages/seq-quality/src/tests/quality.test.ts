import {
  meanQuality,
  minQuality,
  detectQualityEncoding,
  filterByLength,
  filterByMeanQuality,
  filterByNContent,
  trimFixed,
  hardClip,
  trimEndsByQuality,
  trimAdapter,
  trimAdapters,
  ILLUMINA_ADAPTERS,
  qualityReport,
  QualityEncoding,
} from '../index';
import type { FastqRecord } from '@bioscript/seq-stream';

function rec(id: string, sequence: string, quality: string): FastqRecord {
  return { id, sequence, quality };
}

describe('encode', () => {
  it('computes mean and min quality', () => {
    // Phred33 'I' = 40
    expect(meanQuality('IIII')).toBe(40);
    expect(minQuality('I5II')).toBe(20); // '5' = 53-33=20
    expect(meanQuality('')).toBe(0);
  });

  it('detects Phred33 vs Phred64', () => {
    expect(detectQualityEncoding('IIII')).toBe(QualityEncoding.Phred33);
    expect(detectQualityEncoding('hhhh')).toBe(QualityEncoding.Phred64); // 104
  });
});

describe('filter', () => {
  const records = [
    rec('a', 'AAAA', 'IIII'),
    rec('b', 'AA', 'II'),
    rec('c', 'NNNN', 'IIII'),
    rec('d', 'ACGT', '!!!!'), // Q0
  ];

  it('filters by length', () => {
    expect(filterByLength(records, 4).map((r) => r.id)).toEqual(['a', 'c', 'd']);
    expect(filterByLength(records, 2, 2).map((r) => r.id)).toEqual(['b']);
  });

  it('filters by mean quality and N content', () => {
    expect(filterByMeanQuality(records, 30).map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(filterByNContent(records, 0).map((r) => r.id).includes('c')).toBe(false);
    expect(filterByNContent(records, 1).map((r) => r.id).includes('c')).toBe(true);
  });
});

describe('trim', () => {
  it('trims fixed and hard clips', () => {
    const r = rec('x', 'ACGTACGT', 'IIIIIIII');
    expect(trimFixed(r, 2, 2).sequence).toBe('GTAC');
    expect(hardClip(r, 1, 5).sequence).toBe('CGTA');
  });

  it('trims low-quality ends', () => {
    // Low Q at ends (!=0), high in middle (I=40)
    const r = rec('x', 'ACGTACGT', '!!IIII!!');
    const trimmed = trimEndsByQuality(r, { minQuality: 20, windowSize: 2 });
    expect(trimmed.sequence.length).toBeLessThan(r.sequence.length);
    expect(trimmed.sequence).toContain('GTAC');
  });
});

describe('adapters', () => {
  it('trims exact adapter match', () => {
    const adapter = ILLUMINA_ADAPTERS.NexteraTransposase;
    const r = rec('x', 'ACGT' + adapter + 'TTTT', 'I'.repeat(4 + adapter.length + 4));
    const trimmed = trimAdapter(r, adapter);
    expect(trimmed.sequence).toBe('ACGT');
  });

  it('allows mismatches and picks shortest among adapters', () => {
    const adapter = ILLUMINA_ADAPTERS.NexteraTransposase;
    const mutated = adapter.slice(0, 5) + 'A' + adapter.slice(6);
    const r = rec('x', 'GG' + mutated, 'I'.repeat(2 + mutated.length));
    const trimmed = trimAdapter(r, adapter, { maxMismatch: 1, minOverlap: 5 });
    expect(trimmed.sequence).toBe('GG');
    const multi = trimAdapters(r, [adapter], { maxMismatch: 1, minOverlap: 5 });
    expect(multi.sequence.length).toBeLessThanOrEqual(r.sequence.length);
  });
});

describe('report', () => {
  it('aggregates FastQC-lite metrics', () => {
    const records = [
      rec('a', 'ACGT', 'IIII'),
      rec('b', 'AAAAAA', 'IIIIII'),
    ];
    const report = qualityReport(records);
    expect(report.readCount).toBe(2);
    expect(report.totalBases).toBe(10);
    expect(report.meanLength).toBe(5);
    expect(report.perPositionMeanQuality.length).toBe(6);
    expect(report.lengthHistogram[4]).toBe(1);
    expect(report.meanGcPercent).toBeGreaterThan(0);
  });

  it('computes per-base mean quality for variable-length reads', () => {
    const records = [
      rec('long', 'A'.repeat(100), 'I'.repeat(100)),
      rec('short', 'A'.repeat(10), '!'.repeat(10)),
    ];
    const report = qualityReport(records);
    expect(report.meanQuality).toBeGreaterThan(30);
    expect(report.meanQuality).toBeLessThan(40);
  });

  it('handles empty input', () => {
    const report = qualityReport([]);
    expect(report.readCount).toBe(0);
    expect(report.meanLength).toBe(0);
  });

  it('throws on sequence/quality length mismatch', () => {
    const records = [rec('bad', 'ACGT', 'III')];
    expect(() => qualityReport(records)).toThrow(TypeError);
  });
});

describe('trim length validation', () => {
  it('throws on sequence/quality length mismatch', () => {
    const r = rec('bad', 'ACGT', 'III');
    expect(() => trimFixed(r, 1)).toThrow(TypeError);
    expect(() => hardClip(r, 0, 2)).toThrow(TypeError);
  });
});
