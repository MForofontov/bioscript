/**
 * Unit tests for DNA/RNA conversion functions
 */

import { dnaToRna, rnaToDna } from '../dna-rna';

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
