import {
  getMinimizers,
  getHashMinimizers,
  getMinimizerDensity,
  getMinimizerJaccard,
} from '../minimizers';

describe('minimizers', () => {
  describe('getMinimizers', () => {
    it('1. should extract minimizers from sequence', () => {
      const minimizers = getMinimizers('ATCGATCGATCG', 3, 4);
      expect(minimizers.length).toBeGreaterThan(0);
      expect(minimizers[0]).toHaveProperty('kmer');
      expect(minimizers[0]).toHaveProperty('position');
    });

    it('2. should return minimizers with correct positions', () => {
      const minimizers = getMinimizers('ATCGATCGATCG', 3, 4);
      minimizers.forEach((m) => {
        expect(m.position).toBeGreaterThanOrEqual(0);
        expect(m.position).toBeLessThan(10); // 12 - 3 + 1
      });
    });

    it('3. should avoid duplicate consecutive minimizers', () => {
      const minimizers = getMinimizers('AAAAAAAAAA', 2, 3);
      expect(minimizers.length).toBeGreaterThan(0);
      expect(minimizers.every(m => m.kmer === 'AA')).toBe(true);
    });

    it('4. should handle canonical k-mers', () => {
      const minimizers = getMinimizers('ATCGATCG', 3, 4, { canonical: true });
      minimizers.forEach((m) => {
        expect(typeof m.kmer).toBe('string');
        expect(m.kmer.length).toBe(3);
      });
    });

    it('5. should return empty array for k > sequence length', () => {
      const minimizers = getMinimizers('ATCG', 5, 3);
      expect(minimizers).toEqual([]);
    });

    it('6. should return empty array for w > number of k-mers', () => {
      const minimizers = getMinimizers('ATCG', 2, 10);
      expect(minimizers).toEqual([]);
    });

    it('7. should throw TypeError for non-string sequence', () => {
      expect(() => getMinimizers(null as any, 3, 4)).toThrow(TypeError);
      expect(() => getMinimizers(null as any, 3, 4)).toThrow('sequence must be a string');
    });

    it('8. should throw TypeError for non-number k', () => {
      expect(() => getMinimizers('ATCG', '3' as any, 4)).toThrow(TypeError);
      expect(() => getMinimizers('ATCG', '3' as any, 4)).toThrow('k must be a number');
    });

    it('9. should throw TypeError for non-number w', () => {
      expect(() => getMinimizers('ATCG', 3, [] as any)).toThrow(TypeError);
      expect(() => getMinimizers('ATCG', 3, [] as any)).toThrow('w must be a number');
    });

    it('10. should throw Error for k < 1', () => {
      expect(() => getMinimizers('ATCG', 0, 3)).toThrow(Error);
      expect(() => getMinimizers('ATCG', 0, 3)).toThrow('k must be a positive integer');
    });

    it('11. should throw Error for w < 1', () => {
      expect(() => getMinimizers('ATCG', 2, 0)).toThrow(Error);
      expect(() => getMinimizers('ATCG', 2, 0)).toThrow('w must be a positive integer');
    });

    it('12. should throw Error for non-integer k', () => {
      expect(() => getMinimizers('ATCG', 2.5, 3)).toThrow(Error);
    });

    it('13. should throw Error for non-integer w', () => {
      expect(() => getMinimizers('ATCG', 2, 3.5)).toThrow(Error);
    });
  });

  describe('getHashMinimizers', () => {
    it('1. should extract minimizers using hash function', () => {
      const minimizers = getHashMinimizers('ATCGATCGATCG', 3, 4);
      expect(minimizers.length).toBeGreaterThan(0);
      expect(minimizers[0]).toHaveProperty('kmer');
      expect(minimizers[0]).toHaveProperty('position');
      expect(minimizers[0]).toHaveProperty('hash');
    });

    it('2. should have numeric hash values', () => {
      const minimizers = getHashMinimizers('ATCGATCGATCG', 3, 4);
      minimizers.forEach((m) => {
        expect(typeof m.hash).toBe('number');
        expect(m.hash).toBeGreaterThanOrEqual(0);
      });
    });

    it('3. should use custom hash function', () => {
      const customHash = (kmer: string) => kmer.length * 100;
      const minimizers = getHashMinimizers('ATCGATCG', 3, 4, { hashFunction: customHash });
      minimizers.forEach((m) => {
        expect(m.hash).toBe(300); // All 3-mers have same hash
      });
    });

    it('4. should work with canonical k-mers', () => {
      const minimizers = getHashMinimizers('ATCGATCG', 3, 4, { canonical: true });
      expect(minimizers.length).toBeGreaterThan(0);
    });

    it('5. should return empty array for k > sequence length', () => {
      const minimizers = getHashMinimizers('ATCG', 5, 3);
      expect(minimizers).toEqual([]);
    });

    it('6. should throw TypeError for non-string sequence', () => {
      expect(() => getHashMinimizers({} as any, 3, 4)).toThrow(TypeError);
    });

    it('7. should throw TypeError for non-number k', () => {
      expect(() => getHashMinimizers('ATCG', undefined as any, 4)).toThrow(TypeError);
    });

    it('8. should throw TypeError for non-number w', () => {
      expect(() => getHashMinimizers('ATCG', 3, null as any)).toThrow(TypeError);
    });
  });

  describe('getMinimizerDensity', () => {
    it('1. should calculate minimizer density', () => {
      const density = getMinimizerDensity('ATCGATCGATCG', 3, 4);
      expect(density).toBeGreaterThan(0);
      expect(density).toBeLessThanOrEqual(1);
    });

    it('2. should return 0 for empty sequence', () => {
      const density = getMinimizerDensity('', 2, 3);
      expect(Math.abs(density)).toBe(0); // Handle -0 vs 0
    });

    it('3. should vary with window size', () => {
      const density1 = getMinimizerDensity('ATCGATCGATCG', 3, 3);
      const density2 = getMinimizerDensity('ATCGATCGATCG', 3, 5);
      expect(density1).not.toBe(density2);
    });

    it('4. should work with canonical k-mers', () => {
      const density = getMinimizerDensity('ATCGATCG', 3, 4, { canonical: true });
      expect(density).toBeGreaterThan(0);
    });

    it('5. should be between 0 and 1 for valid sequences', () => {
      const sequences = ['ATCGATCG', 'AAAAAA', 'ATATATATATAT'];
      sequences.forEach((seq) => {
        const density = getMinimizerDensity(seq, 2, 3);
        expect(density).toBeGreaterThanOrEqual(0);
        expect(density).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('getMinimizerJaccard', () => {
    it('1. should calculate Jaccard similarity', () => {
      const similarity = getMinimizerJaccard('ATCGATCG', 'ATCGATCG', 3, 4);
      expect(similarity).toBe(1.0);
    });

    it('2. should return 0 for completely different sequences', () => {
      const similarity = getMinimizerJaccard('AAAAAAA', 'TTTTTTT', 2, 3);
      expect(similarity).toBe(0.0);
    });

    it('3. should calculate partial similarity', () => {
      const similarity = getMinimizerJaccard('ATCGATCG', 'ATCGGGCG', 3, 4);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it('4. should work with canonical k-mers', () => {
      const similarity = getMinimizerJaccard('ATCG', 'CGAT', 2, 2, { canonical: true });
      expect(similarity).toBeGreaterThan(0);
    });

    it('5. should handle sequences with different lengths', () => {
      const similarity = getMinimizerJaccard('ATCGATCGATCG', 'ATCG', 2, 3);
      expect(similarity).toBeGreaterThan(0);
    });

    it('6. should return 0 for empty sequences', () => {
      const similarity = getMinimizerJaccard('', '', 2, 3);
      expect(similarity).toBe(0);
    });

    it('7. should be symmetric', () => {
      const sim1 = getMinimizerJaccard('ATCGATCG', 'GCTAGCTA', 3, 4);
      const sim2 = getMinimizerJaccard('GCTAGCTA', 'ATCGATCG', 3, 4);
      expect(sim1).toBe(sim2);
    });

    it('8. should throw TypeError for non-string seq1', () => {
      expect(() => getMinimizerJaccard(123 as any, 'ATCG', 2, 3)).toThrow(TypeError);
      expect(() => getMinimizerJaccard(123 as any, 'ATCG', 2, 3)).toThrow('seq1 must be a string');
    });

    it('9. should throw TypeError for non-string seq2', () => {
      expect(() => getMinimizerJaccard('ATCG', true as any, 2, 3)).toThrow(TypeError);
      expect(() => getMinimizerJaccard('ATCG', true as any, 2, 3)).toThrow('seq2 must be a string');
    });
  });
});
