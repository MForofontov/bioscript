/**
 * Unit tests for banded alignment.
 * Tests cover: normal usage, edge cases, error handling.
 */

import { bandedAlign } from '../banded';
import { DNA_SIMPLE } from '../matrices';

describe('bandedAlign', () => {
  // SECTION 1: Normal/typical usage (60% of tests)

  it('1. should align similar sequences efficiently', () => {
    const result = bandedAlign('ACGTACGT', 'ACGTACGT', {
      bandwidth: 5,
    });

    expect(result.score).toBeGreaterThan(0);
    expect(result.identity).toBe(8);
  });

  it('2. should handle sequences with small differences', () => {
    const result = bandedAlign('ACGTACGT', 'ACGTCCGT', {
      matrix: 'DNA_SIMPLE',
      bandwidth: 3,
    });

    expect(result.identity).toBeGreaterThanOrEqual(7);
    expect((result.alignmentLength - result.identity - (result.alignedSeq1.split("-").length - 1))).toBeLessThanOrEqual(1);
  });

  it('3. should work with custom matrix', () => {
    const result = bandedAlign('ACGT', 'ACGT', {
      matrix: DNA_SIMPLE,
      bandwidth: 2,
    });

    expect(result.score).toBe(20); // 4 matches * 5
    expect(result.alignedSeq1).toBe('ACGT');
    expect(result.alignedSeq2).toBe('ACGT');
  });

  it('4. should handle protein sequences', () => {
    const result = bandedAlign('HEAGAWGHEE', 'HEAGAWGHEE', {
      matrix: 'BLOSUM62',
      bandwidth: 5,
    });

    expect(result.identity).toBe(10);
    expect(result.alignedSeq1.split("-").length - 1).toBe(0);
  });

  it('5. should return alignment metadata', () => {
    const result = bandedAlign('ACGT', 'ACGT', { bandwidth: 2 });

    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('alignedSeq1');
    expect(result).toHaveProperty('alignedSeq2');
    expect(result).toHaveProperty('identity');
  });

  it('6. should align with different gap penalties', () => {
    const result = bandedAlign('ACGTACGT', 'ACGTACGT', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -10,
      gapExtend: -5,
      bandwidth: 3,
    });

    expect(result.score).toBe(40); // 8 matches, no gaps
  });

  it('7. should handle sequences with indels within band', () => {
    const result = bandedAlign('ACGTACGT', 'ACGACGT', {
      matrix: 'DNA_SIMPLE',
      bandwidth: 5,
    });

    // May or may not have gaps depending on scoring
    expect(result.identity).toBeGreaterThan(5);
  });

  it('8. should work with narrow band', () => {
    const result = bandedAlign('AAAA', 'AAAA', {
      matrix: 'DNA_SIMPLE',
      bandwidth: 1,
    });

    expect(result.identity).toBe(4);
    expect(result.score).toBe(20);
  });

  it('9. should work with wide band', () => {
    const result = bandedAlign('ACGTACGT', 'ACGTACGT', {
      matrix: 'DNA_SIMPLE',
      bandwidth: 10,
    });

    expect(result.identity).toBe(8);
  });

  it('10. should handle identical sequences', () => {
    const result = bandedAlign('ACGTACGT', 'ACGTACGT', {
      bandwidth: 5,
    });

    expect(result.identity).toBe(8);
    expect(result.alignedSeq1.split("-").length - 1).toBe(0);
    expect((result.alignmentLength - result.identity - (result.alignedSeq1.split("-").length - 1))).toBe(0);
  });

  it('11. should handle sequences of different lengths', () => {
    const result = bandedAlign('ACGTACGT', 'ACGT', {
      matrix: 'DNA_SIMPLE',
      bandwidth: 6,
    });

    expect(result.identity).toBeGreaterThanOrEqual(4);
  });

  it('12. should handle very long sequences', () => {
    const seq1 = 'A'.repeat(1000);
    const seq2 = 'A'.repeat(1000);

    const result = bandedAlign(seq1, seq2, {
      matrix: 'DNA_SIMPLE',
      bandwidth: 10,
    });

    expect(result.identity).toBe(1000);
  });

  it('13. should handle sequences with single nucleotide', () => {
    const result = bandedAlign('A', 'A', {
      matrix: 'DNA_SIMPLE',
      bandwidth: 1,
    });

    expect(result.identity).toBe(1);
    expect(result.score).toBe(5);
  });

  it('14. should handle band larger than sequences', () => {
    const result = bandedAlign('ACGT', 'ACGT', {
      matrix: 'DNA_SIMPLE',
      bandwidth: 100,
    });

    expect(result.identity).toBe(4);
  });


  it('15. should throw TypeError when seq1 is not a string', () => {
    expect(() => bandedAlign(123 as any, 'ACGT', { bandwidth: 2 })).toThrow(TypeError);
    expect(() => bandedAlign(123 as any, 'ACGT', { bandwidth: 2 })).toThrow('seq1 must be a string');
  });

  it('16. should throw TypeError when seq2 is not a string', () => {
    expect(() => bandedAlign('ACGT', 123 as any, { bandwidth: 2 })).toThrow(TypeError);
    expect(() => bandedAlign('ACGT', 123 as any, { bandwidth: 2 })).toThrow('seq2 must be a string');
  });

  it('17. should throw Error for empty seq1', () => {
    expect(() => bandedAlign('', 'ACGT', { bandwidth: 2 })).toThrow(Error);
    expect(() => bandedAlign('', 'ACGT', { bandwidth: 2 })).toThrow('sequences cannot be empty');
  });

  it('18. should throw Error for empty seq2', () => {
    expect(() => bandedAlign('ACGT', '', { bandwidth: 2 })).toThrow(Error);
    expect(() => bandedAlign('ACGT', '', { bandwidth: 2 })).toThrow('sequences cannot be empty');
  });

  it('20. should throw Error for invalid matrix name', () => {
    expect(() => bandedAlign('ACGT', 'ACGT', { matrix: 'INVALID', bandwidth: 2 })).toThrow(Error);
  });
});
