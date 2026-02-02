/**
 * Tests for worker-based parallel translation
 */

import {
  translateWorker,
  translateWorkerChunked,
  TranslationPool,
} from '../worker-translate';

describe('translateWorker', () => {
  // Test case 1: Translate multiple sequences in parallel
  it('1. should translate multiple sequences in parallel', async () => {
    const sequences = ['ATGGCC', 'ATGTAA', 'ATGCCC'];
    const results = await translateWorker(sequences, { table: 'standard' });
    
    expect(results).toHaveLength(3);
    expect(results[0][0].sequence).toBe('MA');
    expect(results[1][0].sequence).toBe('M*');
    expect(results[2][0].sequence).toBe('MP');
  });

  // Test case 2: Handle allFrames option
  it('2. should handle allFrames option', async () => {
    const sequences = ['ATGGCCAAA'];
    const results = await translateWorker(sequences, {
      table: 'standard',
      allFrames: true,
    });
    
    expect(results[0]).toHaveLength(3);
    expect(results[0][0].frame).toBe(0);
    expect(results[0][1].frame).toBe(1);
    expect(results[0][2].frame).toBe(2);
  });

  // Test case 3: Handle includeReverse option
  it('3. should handle includeReverse option', async () => {
    const sequences = ['ATGGCCAAA'];
    const results = await translateWorker(sequences, {
      table: 'standard',
      includeReverse: true,
    });
    
    expect(results[0]).toHaveLength(2);
    expect(results[0][0].isReverse).toBe(false);
    expect(results[0][1].isReverse).toBe(true);
  });

  // Test case 4: Handle all 6 frames
  it('4. should handle all 6 frames', async () => {
    const sequences = ['ATGGCCAAA'];
    const results = await translateWorker(sequences, {
      table: 'standard',
      allFrames: true,
      includeReverse: true,
    });
    
    expect(results[0]).toHaveLength(6);
    expect(results[0][0].frame).toBe(0);
    expect(results[0][3].frame).toBe(3);
    expect(results[0][3].isReverse).toBe(true);
  });

  // Test case 5: Handle empty sequences array
  it('5. should handle empty sequences array', async () => {
    const results = await translateWorker([]);
    expect(results).toHaveLength(0);
  });

  // Test case 6: Work with different genetic code tables
  it('6. should work with different genetic code tables', async () => {
    const sequences = ['ATGATA'];
    const results = await translateWorker(sequences, {
      table: 'vertebrate_mitochondrial',
    });
    
    expect(results[0][0].sequence).toBe('MM');
  });
});

describe('translateWorkerChunked', () => {
  // Test case 1: Translate a long sequence in chunks
  it('1. should translate a long sequence in chunks', async () => {
    const longSeq = 'ATG' + 'GCC'.repeat(100) + 'TAA';
    const results = await translateWorkerChunked(longSeq, {
      table: 'standard',
      chunkSize: 30,
    });
    
    expect(results.length).toBeGreaterThan(1);
    results.forEach(result => {
      expect(result.sequence).toBeTruthy();
    });
  });

  // Test case 2: Handle short sequences
  it('2. should handle short sequences', async () => {
    const shortSeq = 'ATGGCC';
    const results = await translateWorkerChunked(shortSeq, {
      table: 'standard',
      chunkSize: 1000,
    });
    
    expect(results).toHaveLength(1);
    expect(results[0].sequence).toBe('MA');
  });
});

describe('TranslationPool', () => {
  // Test case 1: Initialize and terminate pool
  it('1. should initialize and terminate pool', async () => {
    const pool = new TranslationPool(2);
    await pool.initialize();
    await pool.terminate();
    
    expect(pool).toBeDefined();
  });

  // Test case 2: Translate sequences using pool
  it('2. should translate sequences using pool', async () => {
    const pool = new TranslationPool(2);
    
    const sequences1 = ['ATGGCC', 'ATGTAA'];
    const sequences2 = ['ATGCCC', 'ATGAAA'];
    
    const results1 = await pool.translate(sequences1, { table: 'standard' });
    const results2 = await pool.translate(sequences2, { table: 'standard' });
    
    expect(results1).toHaveLength(2);
    expect(results2).toHaveLength(2);
    expect(results1[0][0].sequence).toBe('MA');
    expect(results2[0][0].sequence).toBe('MP');
    
    await pool.terminate();
  });

  // Test case 3: Handle multiple batches
  it('3. should handle multiple batches', async () => {
    const pool = new TranslationPool(2);
    
    const batches = [
      ['ATGGCC'],
      ['ATGTAA'],
      ['ATGCCC'],
      ['ATGAAA'],
    ];
    
    const results = await Promise.all(
      batches.map(batch => pool.translate(batch, { table: 'standard' }))
    );
    
    expect(results).toHaveLength(4);
    results.forEach(result => {
      expect(result[0][0].sequence).toBeTruthy();
    });
    
    await pool.terminate();
  });
});
