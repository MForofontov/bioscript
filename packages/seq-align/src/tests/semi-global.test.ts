/**
 * Unit tests for semi-global alignment.
 * Tests cover: normal usage, edge cases, error handling.
 */

import { semiGlobal } from '../semi-global';
import { DNA_SIMPLE } from '../matrices';

describe('semiGlobal', () => {
  // SECTION 1: Normal/typical usage (60% of tests)

  it('1. should align sequences with free end gaps', () => {
    const result = semiGlobal('HEAGAWGHEE', 'PAWHEAE');

    expect(result.score).toBeGreaterThan(0);
    expect(result.identity).toBeGreaterThanOrEqual(4);
    expect(result.alignedSeq1.length).toBeGreaterThan(0);
  });

  it('2. should handle suffix-prefix overlap', () => {
    const result = semiGlobal('ACGTACGT', 'ACGTTTTT', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
    });

    expect(result.score).toBeGreaterThan(0);
    expect(result.alignedSeq1).toContain('ACGT');
    expect(result.alignedSeq2).toContain('ACGT');
  });

  it('3. should align with custom matrix', () => {
    const result = semiGlobal('ACGT', 'ACGT', {
      matrix: DNA_SIMPLE,
    });

    expect(result.score).toBe(20); // 4 matches * 5
    expect(result.alignedSeq1).toBe('ACGT');
    expect(result.alignedSeq2).toBe('ACGT');
  });

  it('4. should handle sequences with internal gaps', () => {
    const result = semiGlobal('ACGTACGT', 'ACGACG', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
    });

    expect(result.alignedSeq1.length).toBeGreaterThanOrEqual(6);
    expect(result.alignedSeq2.length).toBeGreaterThanOrEqual(6);
    expect(result.identity).toBeGreaterThan(0);
  });

  it('5. should return alignment metadata', () => {
    const result = semiGlobal('ACGT', 'ACGT');

    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('alignedSeq1');
    expect(result).toHaveProperty('alignedSeq2');
    expect(result).toHaveProperty('identity');
  });

  it('6. should handle protein sequences', () => {
    const result = semiGlobal('ARNDCQEGH', 'ARNDCQEGH', {
      matrix: 'BLOSUM62',
      gapOpen: -11,
      gapExtend: -1,
    });

    expect(result.score).toBeGreaterThan(0);
    expect(result.identity).toBe(9);
  });

  it('7. should align with different gap penalties', () => {
    const result = semiGlobal('ACGTACGT', 'ACGTACGT', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -10,
      gapExtend: -5,
    });

    expect(result.score).toBe(40); // 8 matches, no gaps
    expect(result.alignedSeq1.split("-").length - 1).toBe(0);
  });

  it('8. should handle sequences with mismatches', () => {
    const result = semiGlobal('AAAA', 'CCCC', {
      matrix: 'DNA_SIMPLE',
    });

    expect((result.alignmentLength - result.identity - (result.alignedSeq1.split("-").length - 1))).toBe(4);
    expect(result.identity).toBe(0);
  });

  it('10. should handle identical sequences', () => {
    const result = semiGlobal('ACGTACGT', 'ACGTACGT');

    expect(result.identity).toBe(8);
    expect(result.alignedSeq1.split("-").length - 1).toBe(0);
    expect((result.alignmentLength - result.identity - (result.alignedSeq1.split("-").length - 1))).toBe(0);
  });

  it('11. should handle one sequence is prefix of another', () => {
    const result = semiGlobal('ACGT', 'ACGTACGT', {
      matrix: 'DNA_SIMPLE',
    });

    expect(result.alignedSeq1).toContain('ACGT');
    expect(result.identity).toBeGreaterThanOrEqual(4);
  });

  it('12. should handle one sequence is suffix of another', () => {
    const result = semiGlobal('ACGTACGT', 'ACGT', {
      matrix: 'DNA_SIMPLE',
    });

    expect(result.alignedSeq2).toContain('ACGT');
    expect(result.identity).toBeGreaterThanOrEqual(4);
  });

  it('13. should handle very long sequences', () => {
    const seq1 = 'A'.repeat(1000);
    const seq2 = 'A'.repeat(1000);

    const result = semiGlobal(seq1, seq2, {
      matrix: 'DNA_SIMPLE',
    });

    expect(result.identity).toBe(1000);
  });

  it('14. should handle sequences with N ambiguity', () => {
    const result = semiGlobal('ACNGT', 'ACNGT', {
      matrix: 'DNA_SIMPLE',
    });

    expect(result.identity).toBe(5);
  });

  it('15. should throw TypeError when seq1 is not a string', () => {
    expect(() => semiGlobal(123 as any, 'ACGT')).toThrow(TypeError);
    expect(() => semiGlobal(123 as any, 'ACGT')).toThrow('seq1 must be a string');
  });

  it('16. should throw TypeError when seq2 is not a string', () => {
    expect(() => semiGlobal('ACGT', 123 as any)).toThrow(TypeError);
    expect(() => semiGlobal('ACGT', 123 as any)).toThrow('seq2 must be a string');
  });

  it('17. should throw Error for empty seq1', () => {
    expect(() => semiGlobal('', 'ACGT')).toThrow(Error);
    expect(() => semiGlobal('', 'ACGT')).toThrow('sequences cannot be empty');
  });

  it('18. should throw Error for empty seq2', () => {
    expect(() => semiGlobal('ACGT', '')).toThrow(Error);
    expect(() => semiGlobal('ACGT', '')).toThrow('sequences cannot be empty');
  });

  it('19. should throw Error for invalid matrix name', () => {
    expect(() => semiGlobal('ACGT', 'ACGT', { matrix: 'INVALID' })).toThrow(Error);
  });
});
