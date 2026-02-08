/**
 * Unit tests for overlap alignment.
 * Tests cover: normal usage, edge cases, error handling.
 */

import { overlapAlign } from '../overlap';
import { DNA_SIMPLE } from '../matrices';

describe('overlapAlign', () => {
  // SECTION 1: Normal/typical usage (60% of tests)

  it('1. should find suffix-prefix overlap', () => {
    const result = overlapAlign('ACGTACGT', 'ACGTTTTT', {
      matrix: 'DNA_SIMPLE',
    });

    expect(result.score).toBeGreaterThan(0);
    expect(result.identity).toBeGreaterThanOrEqual(4);
  });

  it('2. should align overlapping sequences', () => {
    const result = overlapAlign('HEAGAWGHEE', 'AWGHEEPAW', {
      matrix: 'BLOSUM62',
    });

    expect(result.score).toBeGreaterThan(0);
    expect(result.alignedSeq1.length).toBeGreaterThan(0);
  });

  it('3. should work with custom matrix', () => {
    const result = overlapAlign('ACGTACGT', 'ACGT', {
      matrix: DNA_SIMPLE,
    });

    expect(result.identity).toBeGreaterThanOrEqual(4);
  });

  it('4. should handle protein sequences', () => {
    const result = overlapAlign('ARNDCQEGH', 'CQEGHILKM', {
      matrix: 'BLOSUM62',
      gapOpen: -11,
      gapExtend: -1,
    });

    expect(result.score).toBeGreaterThan(0);
    expect(result.identity).toBeGreaterThan(0);
  });

  it('5. should return alignment metadata', () => {
    const result = overlapAlign('ACGT', 'TGCA');

    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('alignedSeq1');
    expect(result).toHaveProperty('alignedSeq2');
    expect(result).toHaveProperty('identity');
  });

  it('6. should align with different gap penalties', () => {
    const result = overlapAlign('ACGTACGT', 'ACGTACGT', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -10,
      gapExtend: -5,
    });

    expect(result.score).toBe(40); // 8 matches, no gaps
    expect(result.alignedSeq1.split("-").length - 1).toBe(0);
  });

  it('7. should handle sequences with mismatches', () => {
    const result = overlapAlign('AAAA', 'CCCC', {
      matrix: 'DNA_SIMPLE',
    });

    expect((result.alignmentLength - result.identity - (result.alignedSeq1.split("-").length - 1))).toBeGreaterThan(0);
  });

  it('8. should find best overlap region', () => {
    const result = overlapAlign('ACGTACGTACGT', 'ACGTTTTT', {
      matrix: 'DNA_SIMPLE',
    });

    expect(result.identity).toBeGreaterThanOrEqual(4);
  });

  // SECTION 2: Edge cases (30% of tests)

  it('10. should handle identical sequences', () => {
    const result = overlapAlign('ACGTACGT', 'ACGTACGT');

    expect(result.identity).toBe(8);
    expect(result.alignedSeq1.split("-").length - 1).toBe(0);
    expect((result.alignmentLength - result.identity - (result.alignedSeq1.split("-").length - 1))).toBe(0);
  });

  it('11. should handle one sequence fully contained in another', () => {
    const result = overlapAlign('ACGTACGTACGT', 'ACGT', {
      matrix: 'DNA_SIMPLE',
    });

    expect(result.identity).toBeGreaterThanOrEqual(4);
  });

  it('12. should handle sequences with no overlap', () => {
    const result = overlapAlign('AAAA', 'CCCC', {
      matrix: 'DNA_SIMPLE',
    });

    expect(result.score).toBeLessThan(20); // Not all matches
  });

  it('13. should handle very long sequences', () => {
    const seq1 = 'A'.repeat(500) + 'C'.repeat(500);
    const seq2 = 'C'.repeat(500) + 'G'.repeat(500);

    const result = overlapAlign(seq1, seq2, {
      matrix: 'DNA_SIMPLE',
    });

    expect(result.identity).toBeGreaterThan(0);
  });

  it('14. should handle sequences with N ambiguity', () => {
    const result = overlapAlign('ACNGT', 'NGTAC', {
      matrix: 'DNA_SIMPLE',
    });

    expect(result.alignedSeq1.length).toBeGreaterThan(0);
  });

  it('15. should handle short overlaps', () => {
    const result = overlapAlign('AC', 'CG', {
      matrix: 'DNA_SIMPLE',
    });

    expect(result.score).toBeGreaterThanOrEqual(-10);
  });

  // SECTION 3: Error cases (10% of tests - ALWAYS LAST)

  it('16. should throw TypeError when seq1 is not a string', () => {
    expect(() => overlapAlign(123 as any, 'ACGT')).toThrow(TypeError);
    expect(() => overlapAlign(123 as any, 'ACGT')).toThrow('seq1 must be a string');
  });

  it('17. should throw TypeError when seq2 is not a string', () => {
    expect(() => overlapAlign('ACGT', 123 as any)).toThrow(TypeError);
    expect(() => overlapAlign('ACGT', 123 as any)).toThrow('seq2 must be a string');
  });

  it('18. should throw Error for empty seq1', () => {
    expect(() => overlapAlign('', 'ACGT')).toThrow(Error);
    expect(() => overlapAlign('', 'ACGT')).toThrow('sequences cannot be empty');
  });

  it('19. should throw Error for empty seq2', () => {
    expect(() => overlapAlign('ACGT', '')).toThrow(Error);
    expect(() => overlapAlign('ACGT', '')).toThrow('sequences cannot be empty');
  });

  it('20. should throw Error for invalid matrix name', () => {
    expect(() => overlapAlign('ACGT', 'ACGT', { matrix: 'INVALID' })).toThrow(Error);
  });
});
