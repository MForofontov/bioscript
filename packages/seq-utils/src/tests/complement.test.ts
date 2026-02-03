/**
 * Unit tests for complement function
 */

import { complement } from '../complement';

/**
 * Unit tests for the complement function.
 */
describe('complement', () => {
  // Test case 1: DNA complement (uppercase)
  it('1. should return DNA complement (uppercase)', () => {
    expect(complement('ATGC')).toBe('TACG');
  });

  // Test case 2: DNA complement (lowercase)
  it('2. should return DNA complement (lowercase)', () => {
    expect(complement('atgc')).toBe('tacg');
  });

  // Test case 3: DNA complement (mixed case)
  it('3. should handle DNA mixed case', () => {
    expect(complement('AtGc')).toBe('TaCg');
  });

  // Test case 4: Handle N characters in DNA
  it('4. should handle N characters in DNA', () => {
    expect(complement('ATGCN')).toBe('TACGN');
  });

  // Test case 5: Empty string
  it('5. should handle empty string', () => {
    expect(complement('')).toBe('');
  });

  // Test case 6: Long DNA sequences
  it('6. should handle long DNA sequences', () => {
    const seq = 'ATGC'.repeat(1000);
    const comp = complement(seq);
    expect(comp).toBe('TACG'.repeat(1000));
  });

  // Test case 7: RNA complement (uppercase)
  it('7. should return RNA complement (uppercase)', () => {
    expect(complement('AUGC')).toBe('UACG');
  });

  // Test case 8: RNA complement (lowercase)
  it('8. should return RNA complement (lowercase)', () => {
    expect(complement('augc')).toBe('uacg');
  });

  // Test case 9: RNA complement (mixed case)
  it('9. should handle RNA mixed case', () => {
    expect(complement('AuGc')).toBe('UaCg');
  });

  // Test case 10: Detect RNA and use U instead of T
  it('10. should detect RNA and use U instead of T', () => {
    const result = complement('AUGC');
    expect(result).not.toContain('T');
    expect(result).toContain('U');
  });

  // Test case 11: Self-inverse for DNA
  it('11. should be self-inverse for DNA', () => {
    const seq = 'ATGC';
    expect(complement(complement(seq))).toBe(seq);
  });

  // Test case 12: Self-inverse for RNA
  it('12. should be self-inverse for RNA', () => {
    const seq = 'AUGC';
    expect(complement(complement(seq))).toBe(seq);
  });

  // Test case 13: Handle unknown characters in DNA (preserved)
  it('13. should preserve unknown characters in DNA', () => {
    expect(complement('ATGCXYZ')).toBe('TACGXYZ');
  });

  // Test case 14: Handle unknown characters in RNA (preserved)
  it('14. should preserve unknown characters in RNA', () => {
    expect(complement('AUGCXYZ')).toBe('UACGXYZ');
  });

  // Test case 15: Handle lowercase unknown characters in DNA
  it('15. should preserve lowercase unknown characters in DNA', () => {
    expect(complement('atgcxyz')).toBe('tacgxyz');
  });

  // Test case 16: Handle lowercase unknown characters in RNA
  it('16. should preserve lowercase unknown characters in RNA', () => {
    expect(complement('augcxyz')).toBe('uacgxyz');
  });
});
