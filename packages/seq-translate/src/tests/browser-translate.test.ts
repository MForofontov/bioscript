/**
 * Tests for browser-compatible translation
 * Uses jsdom environment for browser APIs
 * @jest-environment jsdom
 */

import { translateBrowser, translateBrowserBatch } from '../browser-translate';

describe('translateBrowser', () => {
  // Test case 1: Translate a simple sequence
  it('1. should translate a simple sequence', () => {
    const results = translateBrowser('ATGGCC', { table: 'standard' });

    expect(results).toHaveLength(1);
    expect(results[0].sequence).toBe('MA');
    expect(results[0].frame).toBe(0);
    expect(results[0].isReverse).toBe(false);
    expect(results[0].sourceLength).toBe(6);
  });

  // Test case 2: Handle allFrames option
  it('2. should handle allFrames option', () => {
    const results = translateBrowser('ATGGCCAAA', {
      table: 'standard',
      allFrames: true,
    });

    expect(results).toHaveLength(3);
    expect(results[0].frame).toBe(0);
    expect(results[1].frame).toBe(1);
    expect(results[2].frame).toBe(2);
  });

  // Test case 3: Handle includeReverse option
  it('3. should handle includeReverse option', () => {
    const results = translateBrowser('ATGGCCAAA', {
      table: 'standard',
      includeReverse: true,
    });

    expect(results).toHaveLength(2);
    expect(results[0].isReverse).toBe(false);
    expect(results[1].isReverse).toBe(true);
  });

  // Test case 4: Handle all 6 frames
  it('4. should handle all 6 frames', () => {
    const results = translateBrowser('ATGGCCAAA', {
      table: 'standard',
      allFrames: true,
      includeReverse: true,
    });

    expect(results).toHaveLength(6);
    expect(results[0].frame).toBe(0);
    expect(results[3].frame).toBe(3);
    expect(results[3].isReverse).toBe(true);
  });

  // Test case 5: Respect breakOnStop
  it('5. should respect breakOnStop', () => {
    const results = translateBrowser('ATGTAAGGGGCC', {
      table: 'standard',
      breakOnStop: true,
    });

    expect(results[0].sequence).toBe('M*');
  });

  // Test case 6: Handle custom stop symbol
  it('6. should handle custom stop symbol', () => {
    const results = translateBrowser('ATGGCCTAA', {
      table: 'standard',
      stopSymbol: 'X',
    });

    expect(results[0].sequence).toBe('MAX');
  });

  // Test case 7: Work with different genetic code tables
  it('7. should work with different genetic code tables', () => {
    const results = translateBrowser('ATGATA', {
      table: 'vertebrate_mitochondrial',
    });

    expect(results[0].sequence).toBe('MM');
  });

  // Test case 8: Handle incomplete codons by ignoring them
  it('8. should handle incomplete codons by ignoring them', () => {
    const results = translateBrowser('ATGGC', { table: 'standard' });
    expect(results[0].sequence).toBe('M');
  });

  // Test case 9: Handle empty sequence
  it('9. should handle empty sequence', () => {
    const results = translateBrowser('', { table: 'standard' });
    expect(results[0].sequence).toBe('');
  });

  // Test case 10: Handle whitespace
  it('10. should handle whitespace', () => {
    const results = translateBrowser('  ATGGCC  ', { table: 'standard' });
    expect(results[0].sequence).toBe('MA');
  });

  // Test case 11: Handle lowercase sequences
  it('11. should handle lowercase sequences', () => {
    const results = translateBrowser('atggcc', { table: 'standard' });
    expect(results[0].sequence).toBe('MA');
  });

  // Test case 12: Handle mixed case
  it('12. should handle mixed case', () => {
    const results = translateBrowser('AtGgCc', { table: 'standard' });
    expect(results[0].sequence).toBe('MA');
  });
});

describe('translateBrowserBatch', () => {
  // Test case 1: Translate multiple sequences efficiently
  it('1. should translate multiple sequences efficiently', () => {
    const sequences = ['ATGGCC', 'ATGTAA', 'ATGCCC'];
    const results = translateBrowserBatch(sequences, { table: 'standard' });

    expect(results).toHaveLength(3);
    expect(results[0][0].sequence).toBe('MA');
    expect(results[1][0].sequence).toBe('M*');
    expect(results[2][0].sequence).toBe('MP');
  });

  // Test case 2: Handle allFrames for batch
  it('2. should handle allFrames for batch', () => {
    const sequences = ['ATGGCCAAA', 'ATGTTTCCC'];
    const results = translateBrowserBatch(sequences, {
      table: 'standard',
      allFrames: true,
    });

    expect(results).toHaveLength(2);
    expect(results[0]).toHaveLength(3);
    expect(results[1]).toHaveLength(3);
  });

  // Test case 3: Handle empty array
  it('3. should handle empty array', () => {
    const results = translateBrowserBatch([]);
    expect(results).toHaveLength(0);
  });

  // Test case 4: Handle includeReverse
  it('4. should handle includeReverse', () => {
    const sequences = ['ATGGCC'];
    const results = translateBrowserBatch(sequences, {
      table: 'standard',
      includeReverse: true,
    });

    expect(results[0]).toHaveLength(2);
    expect(results[0][0].isReverse).toBe(false);
    expect(results[0][1].isReverse).toBe(true);
  });
});
