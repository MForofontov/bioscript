/**
 * Unit tests for frame translation functions
 */

import { translateAllFrames, translateSixFrames } from '../translate-frames';

/**
 * Unit tests for the translateAllFrames function.
 */
describe('translateAllFrames', () => {
  // Test case 1: Translate all three reading frames
  it('1. should translate all three reading frames', () => {
    const frames = translateAllFrames('ATGGCCAAA');
    expect(frames).toHaveLength(3);
    expect(frames[0]).toBe('MAK');
    expect(frames[1]).toBe('WP');
    expect(frames[2]).toBe('GQ');
  });

  // Test case 2: Handle different length frames
  it('2. should handle different length frames', () => {
    const frames = translateAllFrames('ATGGCCAAAGGG');
    expect(frames).toHaveLength(3);
    expect(frames[0]).toBe('MAKG');
    expect(frames[1]).toBe('WPK');
    expect(frames[2]).toBe('GQR');
  });

  // Test case 3: Handle sequences not divisible by 3
  it('3. should handle sequences not divisible by 3', () => {
    const frames = translateAllFrames('ATGGCCAAAG');
    expect(frames).toHaveLength(3);
    expect(frames[0]).toBe('MAK');
    expect(frames[1]).toBe('WPK');
    expect(frames[2]).toBe('GQ');
  });

  // Test case 4: Handle breakOnStop in all frames
  it('4. should handle breakOnStop in all frames', () => {
    const frames = translateAllFrames('ATGTAAGGGGCC', {
      breakOnStop: true,
    });
    expect(frames[0]).toBe('M*');
    expect(frames[1]).toContain('C');
    expect(frames[2]).toContain('G');
  });

  // Test case 5: Continue past stops when breakOnStop is false
  it('5. should continue past stops when breakOnStop is false', () => {
    const frames = translateAllFrames('ATGTAAGGGGCC', {
      breakOnStop: false,
    });
    expect(frames[0]).toBe('M*GA');
  });

  // Test case 6: Use custom stop symbol
  it('6. should use custom stop symbol', () => {
    const frames = translateAllFrames('ATGTAAGGGGCC', {
      stopSymbol: 'X',
      breakOnStop: true,
    });
    expect(frames[0]).toBe('MX');
  });

  // Test case 7: Work with different genetic code tables
  it('7. should work with different genetic code tables', () => {
    const standard = translateAllFrames('ATGATA', { table: 'standard' });
    const mito = translateAllFrames('ATGATA', {
      table: 'vertebrate_mitochondrial',
    });
    expect(standard[0]).toBe('MI');
    expect(mito[0]).toBe('MM');
  });

  // Test case 8: Work with NCBI table numbers
  it('8. should work with NCBI table numbers', () => {
    const table1 = translateAllFrames('ATGATG', { table: '1' });
    const table2 = translateAllFrames('ATGATG', { table: '2' });
    expect(table1[0]).toBe('MM');
    expect(table2[0]).toBe('MM');
  });

  // Test case 9: Handle empty sequence
  it('9. should handle empty sequence', () => {
    const frames = translateAllFrames('');
    expect(frames).toHaveLength(3);
    frames.forEach(frame => expect(frame).toBe(''));
  });

  // Test case 10: Handle very short sequences
  it('10. should handle very short sequences', () => {
    const frames = translateAllFrames('ATG');
    expect(frames).toHaveLength(3);
    expect(frames[0]).toBe('M');
    expect(frames[1]).toBe('');
    expect(frames[2]).toBe('');
  });

  // Test case 11: Handle sequences with only 2 codons
  it('11. should handle sequences with only 2 codons', () => {
    const frames = translateAllFrames('ATGGCC');
    expect(frames).toHaveLength(3);
    expect(frames[0]).toBe('MA');
    expect(frames[1]).toBe('W');
    expect(frames[2]).toBe('G');
  });
});

/**
 * Unit tests for the translateSixFrames function.
 */
describe('translateSixFrames', () => {
  // Test case 1: Translate all six reading frames
  it('1. should translate all six reading frames', () => {
    const frames = translateSixFrames('ATGGCCAAA');
    expect(frames).toHaveLength(6);
    expect(frames[0]).toBe('MAK');
    expect(frames[1]).toBe('WP');
    expect(frames[2]).toBe('GQ');
    expect(frames[3]).toBeTruthy();
    expect(frames[4]).toBeTruthy();
    expect(frames[5]).toBeTruthy();
  });

  // Test case 2: Include reverse complement frames
  it('2. should include reverse complement frames', () => {
    const frames = translateSixFrames('ATGGCCAAA');
    expect(frames.length).toBe(6);
    expect(frames[0]).toBe('MAK');
    expect(frames[3]).not.toBe(frames[0]);
  });

  // Test case 3: Respect breakOnStop in all frames
  it('3. should respect breakOnStop in all frames', () => {
    const frames = translateSixFrames('ATGTAAGGGGCC', {
      breakOnStop: true,
    });
    expect(frames).toHaveLength(6);
    expect(frames[0]).toBe('M*');
  });

  // Test case 4: Use custom stop symbol
  it('4. should use custom stop symbol', () => {
    const frames = translateSixFrames('ATGTAA', {
      stopSymbol: 'X',
    });
    expect(frames[0]).toBe('MX');
  });

  // Test case 5: Work with different genetic code tables
  it('5. should work with different genetic code tables', () => {
    const standard = translateSixFrames('ATGATA', { table: 'standard' });
    const mito = translateSixFrames('ATGATA', {
      table: 'vertebrate_mitochondrial',
    });
    expect(standard).toHaveLength(6);
    expect(mito).toHaveLength(6);
    expect(standard[0]).toBe('MI');
    expect(mito[0]).toBe('MM');
  });

  // Test case 6: Handle palindromic sequences
  it('6. should handle palindromic sequences', () => {
    const frames = translateSixFrames('ATGGCGCTAA');
    expect(frames).toHaveLength(6);
  });

  // Test case 7: Handle empty sequence
  it('7. should handle empty sequence', () => {
    const frames = translateSixFrames('');
    expect(frames).toHaveLength(6);
    frames.forEach(frame => expect(frame).toBe(''));
  });

  // Test case 8: Handle very short sequences
  it('8. should handle very short sequences', () => {
    const frames = translateSixFrames('ATG');
    expect(frames).toHaveLength(6);
    expect(frames[0]).toBe('M');
  });
});
