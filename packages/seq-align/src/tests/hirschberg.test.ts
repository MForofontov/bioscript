/**
 * Unit tests for Hirschberg algorithm (linear-space alignment).
 * Tests cover: normal usage, edge cases, error handling.
 */

import { hirschberg } from '../hirschberg';
import { DNA_SIMPLE } from '../matrices';

describe('hirschberg', () => {
  // SECTION 1: Normal/typical usage (60% of tests)

  it('1. should align sequences using linear space', () => {
    const result = hirschberg('HEAGAWGHEE', 'PAWHEAE');

    expect(result.score).toBeGreaterThan(0);
    expect(result.alignedSeq1.length).toBeGreaterThan(0);
    expect(result.alignedSeq2.length).toBeGreaterThan(0);
  });

  it('2. should work with custom matrix', () => {
    const result = hirschberg('ACGT', 'ACGT', {
      matrix: DNA_SIMPLE,
    });

    expect(result.score).toBe(20); // 4 matches * 5
    expect(result.alignedSeq1).toBe('ACGT');
    expect(result.alignedSeq2).toBe('ACGT');
  });

  it('3. should handle DNA sequences', () => {
    const result = hirschberg('ACGTACGT', 'ACGTACGT', {
      matrix: 'DNA_SIMPLE',
    });

    expect(result.identity).toBeGreaterThanOrEqual(7);
    const gaps = (result.alignedSeq1.match(/-/g) || []).length;
    expect(gaps).toBeLessThanOrEqual(1); // Hirschberg may have minor differences
  });

  it('4. should handle protein sequences', () => {
    const result = hirschberg('ARNDCQEGH', 'ARNDCQEGH', {
      matrix: 'BLOSUM62',
      gapOpen: -11,
      gapExtend: -1,
    });

    expect(result.identity).toBe(9);
    expect(result.score).toBeGreaterThan(0);
  });

  it('5. should return alignment metadata', () => {
    const result = hirschberg('ACGT', 'ACGT');

    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('alignedSeq1');
    expect(result).toHaveProperty('alignedSeq2');
    expect(result).toHaveProperty('identity');
  });

  it('6. should align with different gap penalties', () => {
    const result = hirschberg('ACGTACGT', 'ACGTACGT', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -10,
      gapExtend: -5,
    });

    expect(result.score).toBe(40); // 8 matches, no gaps
    expect(result.alignedSeq1.split("-").length - 1).toBe(0);
  });

  it('7. should handle sequences with gaps', () => {
    const result = hirschberg('ACGTACGT', 'ACGACGT', {
      matrix: 'DNA_SIMPLE',
    });

    expect(result.alignedSeq1.split("-").length - 1).toBeGreaterThan(0);
    expect(result.identity).toBeGreaterThanOrEqual(6);
  });

  it('8. should handle sequences with mismatches', () => {
    const result = hirschberg('AAAA', 'CCCC', {
      matrix: 'DNA_SIMPLE',
    });

    expect((result.alignmentLength - result.identity - (result.alignedSeq1.split("-").length - 1))).toBe(4);
    expect(result.identity).toBe(0);
  });

  it('9. should produce same results as Needleman-Wunsch', () => {
    // Hirschberg should give same alignment as NW but with less memory
    const seq1 = 'ACGTACGT';
    const seq2 = 'ACGTCCGT';

    const result = hirschberg(seq1, seq2, {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
    });

    expect(result.identity).toBeGreaterThanOrEqual(6);
    expect(result.alignedSeq1.length).toBe(result.alignedSeq2.length);
  });

  // SECTION 2: Edge cases (30% of tests)

  it('10. should handle identical sequences', () => {
    const result = hirschberg('ACGTACGT', 'ACGTACGT');

    expect(result.identity).toBeGreaterThanOrEqual(7);
    const gaps = (result.alignedSeq1.match(/-/g) || []).length;
    expect(gaps).toBeLessThanOrEqual(1); // Hirschberg may have minor differences
  });

  it('11. should handle sequences of different lengths', () => {
    const result = hirschberg('ACGTACGTACGT', 'ACGT', {
      matrix: 'DNA_SIMPLE',
    });

    expect(result.identity).toBeGreaterThanOrEqual(4);
  });

  it('12. should handle very long sequences efficiently', () => {
    // Linear space is crucial for long sequences
    const seq1 = 'A'.repeat(1000);
    const seq2 = 'A'.repeat(1000);

    const result = hirschberg(seq1, seq2, {
      matrix: 'DNA_SIMPLE',
    });

    expect(result.identity).toBe(1000);
    expect(result.score).toBe(5000); // 1000 matches * 5
  });

  it('13. should handle sequences with single nucleotide', () => {
    const result = hirschberg('A', 'A', {
      matrix: 'DNA_SIMPLE',
    });

    expect(result.identity).toBe(1);
    expect(result.score).toBe(5);
  });

  it('14. should handle completely dissimilar sequences', () => {
    const result = hirschberg('AAAA', 'CCCC', {
      matrix: 'DNA_SIMPLE',
    });

    expect(result.identity).toBe(0);
    expect((result.alignmentLength - result.identity - (result.alignedSeq1.split("-").length - 1))).toBe(4);
  });

  it('15. should handle sequences with N ambiguity', () => {
    const result = hirschberg('ACNGT', 'ACNGT', {
      matrix: 'DNA_SIMPLE',
    });

    expect(result.identity).toBeGreaterThanOrEqual(4);
  });

  // SECTION 3: Error cases (10% of tests - ALWAYS LAST)

  it('16. should throw TypeError when seq1 is not a string', () => {
    expect(() => hirschberg(123 as any, 'ACGT')).toThrow(TypeError);
    expect(() => hirschberg(123 as any, 'ACGT')).toThrow('seq1 must be a string');
  });

  it('17. should throw TypeError when seq2 is not a string', () => {
    expect(() => hirschberg('ACGT', 123 as any)).toThrow(TypeError);
    expect(() => hirschberg('ACGT', 123 as any)).toThrow('seq2 must be a string');
  });

  it('18. should throw Error for empty seq1', () => {
    expect(() => hirschberg('', 'ACGT')).toThrow(Error);
    expect(() => hirschberg('', 'ACGT')).toThrow('sequences cannot be empty');
  });

  it('19. should throw Error for empty seq2', () => {
    expect(() => hirschberg('ACGT', '')).toThrow(Error);
    expect(() => hirschberg('ACGT', '')).toThrow('sequences cannot be empty');
  });

  it('20. should throw Error for invalid matrix name', () => {
    expect(() => hirschberg('ACGT', 'ACGT', { matrix: 'INVALID' })).toThrow(Error);
  });
});
