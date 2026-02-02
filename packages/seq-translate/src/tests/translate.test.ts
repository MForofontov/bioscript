/**
 * Unit tests for core translate function
 */

import { translateSequence } from '../translate';

describe('translateSequence', () => {
  // Test case 1: Simple DNA sequence
  it('1. should translate a simple DNA sequence', () => {
    const result = translateSequence('ATGGCC', { table: 'standard' });
    expect(result).toBe('MA');
  });

  // Test case 2: Simple RNA sequence
  it('2. should translate a simple RNA sequence', () => {
    const result = translateSequence('AUGGCC', { table: 'standard' });
    expect(result).toBe('MA');
  });

  // Test case 3: Empty sequence
  it('3. should handle empty sequence', () => {
    const result = translateSequence('', { table: 'standard' });
    expect(result).toBe('');
  });

  // Test case 4: Whitespace handling
  it('4. should handle whitespace', () => {
    const result = translateSequence('  ATGGCC  ', { table: 'standard' });
    expect(result).toBe('MA');
  });

  // Test case 5: Lowercase sequences
  it('5. should handle lowercase sequences', () => {
    const result = translateSequence('atggcc', { table: 'standard' });
    expect(result).toBe('MA');
  });

  // Test case 6: Mixed case
  it('6. should handle mixed case', () => {
    const result = translateSequence('AtGgCc', { table: 'standard' });
    expect(result).toBe('MA');
  });

  // Test case 7: Incomplete codons
  it('7. should ignore incomplete codons', () => {
    const result = translateSequence('ATGGC', { table: 'standard' });
    expect(result).toBe('M');
  });

  // Test case 8: With stop codon
  it('8. should translate with stop codon', () => {
    const result = translateSequence('ATGGCCTAA', { table: 'standard' });
    expect(result).toBe('MA*');
  });

  // Test case 9: Break on stop codon
  it('9. should break on stop codon when breakOnStop is true', () => {
    const result = translateSequence('ATGTAAGGGGCC', {
      table: 'standard',
      breakOnStop: true,
    });
    expect(result).toBe('M*');
  });

  // Test case 10: Continue past stop codon
  it('10. should continue past stop codon when breakOnStop is false', () => {
    const result = translateSequence('ATGTAAATGGCC', {
      table: 'standard',
      breakOnStop: false,
    });
    expect(result).toBe('M*MA');
  });

  // Test case 11: Custom stop symbol
  it('11. should use custom stop symbol', () => {
    const result = translateSequence('ATGGCCTAA', {
      table: 'standard',
      stopSymbol: 'X',
    });
    expect(result).toBe('MAX');
  });

  // Test case 12: Multiple stop codons
  it('12. should handle multiple stop codons', () => {
    const result = translateSequence('ATGTAATAGTGA', {
      table: 'standard',
      breakOnStop: false,
      stopSymbol: '*',
    });
    expect(result).toBe('M***');
  });

  // Test case 13: Standard table by default
  it('13. should use standard table by default', () => {
    const result = translateSequence('ATGATG');
    expect(result).toBe('MM');
  });

  // Test case 14: NCBI table number
  it('14. should work with NCBI table number', () => {
    const result = translateSequence('ATGATG', { table: '1' });
    expect(result).toBe('MM');
  });

  // Test case 15: Named table
  it('15. should work with named table', () => {
    const result = translateSequence('ATGATG', { table: 'standard' });
    expect(result).toBe('MM');
  });

  // Test case 16: Vertebrate mitochondrial table
  it('16. should handle vertebrate mitochondrial table', () => {
    const standard = translateSequence('ATGATA', { table: 'standard' });
    const mito = translateSequence('ATGATA', {
      table: 'vertebrate_mitochondrial',
    });
    expect(standard).toBe('MI');
    expect(mito).toBe('MM');
  });

  // Test case 17: Yeast mitochondrial table
  it('17. should handle yeast mitochondrial table', () => {
    const standard = translateSequence('ATGCTA', { table: 'standard' });
    const yeast = translateSequence('ATGCTA', { table: 'yeast_mitochondrial' });
    expect(standard).toBe('ML');
    expect(yeast).toBe('MT');
  });

  // Test case 18: Invalid codons with X
  it('18. should handle invalid codons with X', () => {
    const result = translateSequence('ATGNNN', { table: 'standard' });
    expect(result).toBe('MX');
  });

  // Test case 19: Codons with N
  it('19. should handle codons with N', () => {
    const result = translateSequence('ATGNNA', { table: 'standard' });
    expect(result).toBe('MX');
  });

  // Test case 20: Partial ambiguous codons
  it('20. should handle partial ambiguous codons', () => {
    const result = translateSequence('ATGNGT', { table: 'standard' });
    expect(result).toBe('MX');
  });

  // Test case 21: Long sequences
  it('21. should handle long sequences', () => {
    const seq = 'ATG' + 'GCC'.repeat(100) + 'TAA';
    const result = translateSequence(seq, { table: 'standard' });
    expect(result).toBe('M' + 'A'.repeat(100) + '*');
  });

  // Test case 22: Very long sequences
  it('22. should handle very long sequences', () => {
    const seq = 'ATG' + 'GCC'.repeat(10000);
    const result = translateSequence(seq, { table: 'standard' });
    expect(result.length).toBe(10001);
    expect(result[0]).toBe('M');
  });
});
