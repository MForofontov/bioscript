/**
 * Unit tests for reverseComplement function
 */

import { reverseComplement } from '../reverse-complement';
import { complement } from '../complement';

/**
 * Unit tests for the reverseComplement function.
 */
describe('reverseComplement', () => {
  // Test case 1: DNA reverse complement (uppercase)
  it('1. should return DNA reverse complement (uppercase)', () => {
    expect(reverseComplement('ATGC')).toBe('GCAT');
  });

  // Test case 2: DNA reverse complement (lowercase)
  it('2. should return DNA reverse complement (lowercase)', () => {
    expect(reverseComplement('atgc')).toBe('gcat');
  });

  // Test case 3: DNA reverse complement (mixed case)
  it('3. should handle DNA mixed case', () => {
    expect(reverseComplement('AtGc')).toBe('gCaT');
  });

  // Test case 4: Handle palindromes
  it('4. should handle palindromes', () => {
    expect(reverseComplement('GCGC')).toBe('GCGC');
  });

  // Test case 5: Empty string
  it('5. should handle empty string', () => {
    expect(reverseComplement('')).toBe('');
  });

  // Test case 6: Single nucleotides
  it('6. should handle single nucleotides', () => {
    expect(reverseComplement('A')).toBe('T');
    expect(reverseComplement('T')).toBe('A');
    expect(reverseComplement('G')).toBe('C');
    expect(reverseComplement('C')).toBe('G');
  });

  // Test case 7: RNA reverse complement
  it('7. should return RNA reverse complement', () => {
    expect(reverseComplement('AUGC')).toBe('GCAU');
  });

  // Test case 8: RNA reverse complement (lowercase)
  it('8. should handle RNA lowercase', () => {
    expect(reverseComplement('augc')).toBe('gcau');
  });

  // Test case 9: Detect RNA and use U
  it('9. should detect RNA and use U', () => {
    const result = reverseComplement('AUGC');
    expect(result).not.toContain('T');
    expect(result).toContain('U');
  });

  // Test case 10: Long DNA sequences
  it('10. should handle long DNA sequences', () => {
    const seq = 'ATGC'.repeat(1000);
    const revComp = reverseComplement(seq);
    expect(revComp.length).toBe(seq.length);
    expect(revComp).toBe('GCAT'.repeat(1000));
  });

  // Test case 11: Very long sequences
  it('11. should handle very long sequences', () => {
    const seq = 'ATGC'.repeat(10000);
    const revComp = reverseComplement(seq);
    expect(revComp.length).toBe(40000);
  });

  // Test case 12: Self-inverse property
  it('12. should be self-inverse', () => {
    const seq = 'ATGCATGC';
    expect(reverseComplement(reverseComplement(seq))).toBe(seq);
  });

  // Test case 13: Equal to complement then reverse
  it('13. should equal complement then reverse', () => {
    const seq = 'ATGCATGC';
    const revComp = reverseComplement(seq);
    const compThenRev = complement(seq).split('').reverse().join('');
    expect(revComp).toBe(compThenRev);
  });

  // Test case 14: Handle ambiguous nucleotides
  it('14. should handle ambiguous nucleotides', () => {
    expect(reverseComplement('ATGCN')).toBe('NGCAT');
  });

  // Test case 15: Handle N characters
  it('15. should handle N characters', () => {
    expect(reverseComplement('NNNNN')).toBe('NNNNN');
  });

  // Test case 16: Preserve case in N
  it('16. should preserve case in N', () => {
    expect(reverseComplement('AtGcN')).toBe('NgCaT');
  });
});
