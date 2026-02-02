/**
 * Unit tests for utility functions
 */

import { dnaToRna, rnaToDna, complement, reverseComplement } from '../utils';

/**
 * Unit tests for the dnaToRna function.
 */
describe('dnaToRna', () => {
  // Test case 1: Convert DNA to RNA (uppercase)
  it('1. should convert DNA to RNA (uppercase)', () => {
    expect(dnaToRna('ATGC')).toBe('AUGC');
  });

  // Test case 2: Convert DNA to RNA (lowercase)
  it('2. should convert DNA to RNA (lowercase)', () => {
    expect(dnaToRna('atgc')).toBe('augc');
  });

  // Test case 3: Handle mixed case
  it('3. should handle mixed case', () => {
    expect(dnaToRna('AtGc')).toBe('AuGc');
  });

  // Test case 4: Handle empty string
  it('4. should handle empty string', () => {
    expect(dnaToRna('')).toBe('');
  });

  // Test case 5: Handle long sequences
  it('5. should handle long sequences', () => {
    const dna = 'ATGC'.repeat(1000);
    const rna = dnaToRna(dna);
    expect(rna).toBe('AUGC'.repeat(1000));
  });

  // Test case 6: Preserve non-ATGC characters
  it('6. should preserve non-ATGC characters', () => {
    expect(dnaToRna('ATGCN')).toBe('AUGCN');
  });
});

/**
 * Unit tests for the rnaToDna function.
 */
describe('rnaToDna', () => {
  // Test case 1: Convert RNA to DNA (uppercase)
  it('1. should convert RNA to DNA (uppercase)', () => {
    expect(rnaToDna('AUGC')).toBe('ATGC');
  });

  // Test case 2: Convert RNA to DNA (lowercase)
  it('2. should convert RNA to DNA (lowercase)', () => {
    expect(rnaToDna('augc')).toBe('atgc');
  });

  // Test case 3: Handle mixed case
  it('3. should handle mixed case', () => {
    expect(rnaToDna('AuGc')).toBe('AtGc');
  });

  // Test case 4: Handle empty string
  it('4. should handle empty string', () => {
    expect(rnaToDna('')).toBe('');
  });

  // Test case 5: Handle long sequences
  it('5. should handle long sequences', () => {
    const rna = 'AUGC'.repeat(1000);
    const dna = rnaToDna(rna);
    expect(dna).toBe('ATGC'.repeat(1000));
  });

  // Test case 6: Inverse of dnaToRna
  it('6. should be inverse of dnaToRna', () => {
    const dna = 'ATGCATGC';
    expect(rnaToDna(dnaToRna(dna))).toBe(dna);
  });
});

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
});

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
