/**
 * Unit tests for batch translation
 */

import { translateBatch } from '../translate-batch';

describe('translateBatch', () => {
  // Test case 1: Translate multiple sequences efficiently
  it('1. should translate multiple sequences efficiently', () => {
    const sequences = ['ATGGCC', 'ATGTAA', 'ATGCCC'];
    const results = translateBatch(sequences, { table: 'standard' });
    expect(results).toHaveLength(3);
    expect(results[0]).toBe('MA');
    expect(results[1]).toBe('M*');
    expect(results[2]).toBe('MP');
  });

  // Test case 2: Handle empty array
  it('2. should handle empty array', () => {
    const results = translateBatch([]);
    expect(results).toHaveLength(0);
  });

  // Test case 3: Handle single sequence
  it('3. should handle single sequence', () => {
    const results = translateBatch(['ATGGCC']);
    expect(results).toHaveLength(1);
    expect(results[0]).toBe('MA');
  });

  // Test case 4: Handle DNA and RNA sequences
  it('4. should handle DNA and RNA sequences', () => {
    const sequences = ['ATGGCC', 'AUGGCC'];
    const results = translateBatch(sequences, { table: 'standard' });
    expect(results[0]).toBe('MA');
    expect(results[1]).toBe('MA');
  });

  // Test case 5: Handle different lengths
  it('5. should handle different lengths', () => {
    const sequences = ['ATG', 'ATGGCC', 'ATGGCCAAA', 'ATGGCCAAAGGG'];
    const results = translateBatch(sequences);
    expect(results[0]).toBe('M');
    expect(results[1]).toBe('MA');
    expect(results[2]).toBe('MAK');
    expect(results[3]).toBe('MAKG');
  });

  // Test case 6: Handle mixed case
  it('6. should handle mixed case', () => {
    const sequences = ['ATGGCC', 'atggcc', 'AtGgCc'];
    const results = translateBatch(sequences);
    expect(results[0]).toBe('MA');
    expect(results[1]).toBe('MA');
    expect(results[2]).toBe('MA');
  });

  // Test case 7: Respect breakOnStop for all sequences
  it('7. should respect breakOnStop for all sequences', () => {
    const sequences = ['ATGTAAGGGGCC', 'ATGGGGTAA', 'ATGCCC'];
    const results = translateBatch(sequences, { breakOnStop: true });
    expect(results[0]).toBe('M*');
    expect(results[1]).toBe('MG*');
    expect(results[2]).toBe('MP');
  });

  // Test case 8: Continue past stops when breakOnStop is false
  it('8. should continue past stops when breakOnStop is false', () => {
    const sequences = ['ATGTAAATGGCC', 'ATGTAGGGGCCC'];
    const results = translateBatch(sequences, { breakOnStop: false });
    expect(results[0]).toBe('M*MA');
    expect(results[1]).toBe('M*GP');
  });

  // Test case 9: Use custom stop symbol
  it('9. should use custom stop symbol', () => {
    const sequences = ['ATGTAA', 'ATGTAG', 'ATGTGA'];
    const results = translateBatch(sequences, { stopSymbol: 'X' });
    expect(results[0]).toBe('MX');
    expect(results[1]).toBe('MX');
    expect(results[2]).toBe('MX');
  });

  // Test case 10: Use specified table for all sequences
  it('10. should use specified table for all sequences', () => {
    const sequences = ['ATGATA', 'ATGATA'];
    const standard = translateBatch(sequences, { table: 'standard' });
    const mito = translateBatch(sequences, { table: 'vertebrate_mitochondrial' });
    
    expect(standard[0]).toBe('MI');
    expect(standard[1]).toBe('MI');
    expect(mito[0]).toBe('MM');
    expect(mito[1]).toBe('MM');
  });

  // Test case 11: Work with NCBI table numbers
  it('11. should work with NCBI table numbers', () => {
    const sequences = ['ATGCTA', 'ATGCTA'];
    const table1 = translateBatch(sequences, { table: '1' });
    const table3 = translateBatch(sequences, { table: '3' });
    
    expect(table1[0]).toBe('ML');
    expect(table3[0]).toBe('MT');
  });

  // Test case 12: Handle large batches efficiently
  it('12. should handle large batches efficiently', () => {
    const sequences = Array(1000).fill('ATGGCCAAA');
    const results = translateBatch(sequences, { table: 'standard' });
    expect(results).toHaveLength(1000);
    results.forEach(result => {
      expect(result).toBe('MAK');
    });
  });

  // Test case 13: Handle varying sequence lengths in large batch
  it('13. should handle varying sequence lengths in large batch', () => {
    const sequences = Array(100).fill(null).map((_, i) => 
      'ATG' + 'GCC'.repeat(i + 1)
    );
    const results = translateBatch(sequences);
    expect(results).toHaveLength(100);
    expect(results[0]).toBe('MA');
    expect(results[99]).toBe('M' + 'A'.repeat(100));
  });

  // Test case 14: Handle empty sequences in batch
  it('14. should handle empty sequences in batch', () => {
    const sequences = ['ATGGCC', '', 'ATGAAA'];
    const results = translateBatch(sequences);
    expect(results[0]).toBe('MA');
    expect(results[1]).toBe('');
    expect(results[2]).toBe('MK');
  });

  // Test case 15: Handle whitespace in sequences
  it('15. should handle whitespace in sequences', () => {
    const sequences = ['  ATGGCC  ', ' ATGAAA '];
    const results = translateBatch(sequences);
    expect(results[0]).toBe('MA');
    expect(results[1]).toBe('MK');
  });

  // Test case 16: Handle incomplete codons
  it('16. should handle incomplete codons', () => {
    const sequences = ['ATGGC', 'ATGGCCA'];
    const results = translateBatch(sequences);
    expect(results[0]).toBe('M');
    expect(results[1]).toBe('MA');
  });

  // Test case 17: Handle sequences with invalid codons
  it('17. should handle sequences with invalid codons', () => {
    const sequences = ['ATGNNN', 'ATGXXX'];
    const results = translateBatch(sequences);
    expect(results[0]).toBe('MX');
    expect(results[1]).toBe('MX');
  });

  // Test case 18: Reuse lookup table for efficiency
  it('18. should reuse lookup table for efficiency', () => {
    const sequences = Array(100).fill('ATGGCCAAA');
    const start = Date.now();
    translateBatch(sequences, { table: 'standard' });
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(50);
  });
});
