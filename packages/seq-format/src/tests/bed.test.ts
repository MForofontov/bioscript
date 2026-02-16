/**
 * Tests for BED parser and formatter.
 */

import { parseBEDLine, formatBEDLine, parseBED, formatBED } from '../bed';
import type { BEDRecord } from '../types';

describe('parseBEDLine', () => {
  it('1. should parse BED3 line', () => {
    const line = 'chr1\t1000\t2000';
    const record = parseBEDLine(line);

    expect(record.chrom).toBe('chr1');
    expect(record.chromStart).toBe(1000);
    expect(record.chromEnd).toBe(2000);
  });

  it('2. should parse BED6 line', () => {
    const line = 'chr1\t1000\t2000\tfeature1\t500\t+';
    const record = parseBEDLine(line);

    expect(record.chrom).toBe('chr1');
    expect(record.name).toBe('feature1');
    expect(record.score).toBe(500);
    expect(record.strand).toBe('+');
  });

  it('3. should parse BED12 line', () => {
    const line = 'chr1\t1000\t5000\tgene1\t1000\t+\t1200\t4900\t0\t3\t300,400,200\t0,1500,3800';
    const record = parseBEDLine(line);

    expect(record.blockCount).toBe(3);
    expect(record.blockSizes).toEqual([300, 400, 200]);
    expect(record.blockStarts).toEqual([0, 1500, 3800]);
  });

  it('4. should parse strand symbols', () => {
    const plus = parseBEDLine('chr1\t1\t10\ttest\t0\t+');
    const minus = parseBEDLine('chr1\t1\t10\ttest\t0\t-');
    const dot = parseBEDLine('chr1\t1\t10\ttest\t0\t.');

    expect(plus.strand).toBe('+');
    expect(minus.strand).toBe('-');
    expect(dot.strand).toBe('.');
  });

  it('5. should throw TypeError when input is not a string', () => {
    expect(() => parseBEDLine(123 as any)).toThrow(TypeError);
  });

  it('6. should throw Error for comment lines', () => {
    expect(() => parseBEDLine('# comment')).toThrow(Error);
  });

  it('7. should throw Error when field count is less than 3', () => {
    const line = 'chr1\t1000';
    expect(() => parseBEDLine(line)).toThrow(Error);
    expect(() => parseBEDLine(line)).toThrow('expected at least 3 fields');
  });

  it('8. should throw Error for invalid coordinates', () => {
    const line = 'chr1\t2000\t1000'; // start > end
    expect(() => parseBEDLine(line)).toThrow(Error);
  });

  it('9. should throw Error for negative coordinates', () => {
    const line = 'chr1\t-10\t100';
    expect(() => parseBEDLine(line)).toThrow(Error);
  });

  it('10. should throw Error for invalid strand', () => {
    const line = 'chr1\t1\t10\ttest\t0\tX';
    expect(() => parseBEDLine(line)).toThrow(Error);
    expect(() => parseBEDLine(line)).toThrow('Invalid strand');
  });
});

describe('formatBEDLine', () => {
  it('1. should format BED3 record', () => {
    const record: BEDRecord = {
      chrom: 'chr1',
      chromStart: 1000,
      chromEnd: 2000,
    };
    const line = formatBEDLine(record);

    expect(line).toBe('chr1\t1000\t2000');
  });

  it('2. should format BED6 record', () => {
    const record: BEDRecord = {
      chrom: 'chr1',
      chromStart: 1000,
      chromEnd: 2000,
      name: 'feature1',
      score: 500,
      strand: '+',
    };
    const line = formatBEDLine(record);

    expect(line).toBe('chr1\t1000\t2000\tfeature1\t500\t+');
  });

  it('3. should format BED12 record', () => {
    const record: BEDRecord = {
      chrom: 'chr1',
      chromStart: 1000,
      chromEnd: 5000,
      name: 'gene1',
      score: 1000,
      strand: '+',
      thickStart: 1200,
      thickEnd: 4900,
      itemRgb: '0',
      blockCount: 3,
      blockSizes: [300, 400, 200],
      blockStarts: [0, 1500, 3800],
    };
    const line = formatBEDLine(record);

    expect(line).toContain('chr1\t1000\t5000');
    expect(line).toContain('300,400,200');
    expect(line).toContain('0,1500,3800');
  });

  it('4. should stop at first missing optional field', () => {
    const record: BEDRecord = {
      chrom: 'chr1',
      chromStart: 1000,
      chromEnd: 2000,
      name: 'feature1',
      // score is undefined - should stop here
    };
    const line = formatBEDLine(record);

    expect(line).toBe('chr1\t1000\t2000\tfeature1');
  });

  it('5. should throw TypeError when input is not an object', () => {
    expect(() => formatBEDLine(null as any)).toThrow(TypeError);
  });
});

describe('parseBED', () => {
  const bedText = `track name=test description="test regions"
chr1\t1000\t2000\tfeature1\t500\t+
# comment
chr1\t3000\t4000\tfeature2\t600\t-
chr2\t5000\t6000\tfeature3\t700\t+
`;

  it('1. should parse multiple BED lines', () => {
    const records = parseBED(bedText);

    expect(records.length).toBe(3);
    expect(records[0].name).toBe('feature1');
    expect(records[1].name).toBe('feature2');
    expect(records[2].name).toBe('feature3');
  });

  it('2. should skip track and comment lines', () => {
    const records = parseBED(bedText);

    records.forEach((record) => {
      expect(record.chrom).not.toContain('#');
      expect(record.chrom).not.toContain('track');
    });
  });

  it('3. should handle empty input', () => {
    const records = parseBED('');
    expect(records.length).toBe(0);
  });

  it('4. should throw TypeError when input is not a string', () => {
    expect(() => parseBED(123 as any)).toThrow(TypeError);
  });
});

describe('formatBED', () => {
  const records: BEDRecord[] = [
    {
      chrom: 'chr1',
      chromStart: 1000,
      chromEnd: 2000,
      name: 'feature1',
      score: 500,
      strand: '+',
    },
    {
      chrom: 'chr1',
      chromStart: 3000,
      chromEnd: 4000,
      name: 'feature2',
      score: 600,
      strand: '-',
    },
  ];

  it('1. should format multiple records', () => {
    const bedText = formatBED(records, false);
    const lines = bedText.trim().split('\n');

    expect(lines.length).toBe(2);
  });

  it('2. should include track header when requested', () => {
    const bedText = formatBED(records, true, 'myRegions');

    expect(bedText).toContain('track name=myRegions');
  });

  it('3. should not include header when not requested', () => {
    const bedText = formatBED(records, false);

    expect(bedText).not.toContain('track');
  });

  it('4. should throw TypeError when records is not an array', () => {
    expect(() => formatBED('not array' as any)).toThrow(TypeError);
  });
});
