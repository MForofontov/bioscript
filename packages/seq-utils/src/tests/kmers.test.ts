import {
  getKmers,
  countKmers,
  getKmerSpectrum,
  getUniqueKmers,
  getKmerJaccard,
} from '../kmers';

describe('kmers', () => {
  describe('getKmers', () => {
    it('1. should extract k-mers from simple sequence', () => {
      const kmers = getKmers('ATCG', 2);
      expect(kmers).toEqual(['AT', 'TC', 'CG']);
    });

    it('2. should handle k equal to sequence length', () => {
      const kmers = getKmers('ATCG', 4);
      expect(kmers).toEqual(['ATCG']);
    });

    it('3. should return empty array for k > sequence length', () => {
      const kmers = getKmers('ATCG', 5);
      expect(kmers).toEqual([]);
    });

    it('4. should extract canonical k-mers', () => {
      const kmers = getKmers('ATCG', 2, { canonical: true });
      expect(kmers).toEqual(['AT', 'GA', 'CG']); // TC -> GA (canonical)
    });

    it('5. should handle sequences with N', () => {
      const kmers = getKmers('ATNNCG', 3);
      expect(kmers).toEqual(['ATN', 'TNN', 'NNC', 'NCG']);
    });

    it('6. should trim and uppercase sequence', () => {
      const kmers = getKmers('  atcg  ', 2);
      expect(kmers).toEqual(['AT', 'TC', 'CG']);
    });

    it('7. should throw TypeError for non-string sequence', () => {
      expect(() => getKmers(123 as any, 2)).toThrow(TypeError);
      expect(() => getKmers(123 as any, 2)).toThrow('sequence must be a string');
    });

    it('8. should throw TypeError for non-number k', () => {
      expect(() => getKmers('ATCG', '2' as any)).toThrow(TypeError);
      expect(() => getKmers('ATCG', '2' as any)).toThrow('k must be a number');
    });

    it('9. should throw Error for k < 1', () => {
      expect(() => getKmers('ATCG', 0)).toThrow(Error);
      expect(() => getKmers('ATCG', 0)).toThrow('k must be a positive integer');
    });

    it('10. should throw Error for non-integer k', () => {
      expect(() => getKmers('ATCG', 2.5)).toThrow(Error);
      expect(() => getKmers('ATCG', 2.5)).toThrow('k must be a positive integer');
    });
  });

  describe('countKmers', () => {
    it('1. should count k-mer occurrences', () => {
      const counts = countKmers('ATCGATCG', 3);
      expect(counts.get('ATC')).toBe(2);
      expect(counts.get('TCG')).toBe(2);
      expect(counts.get('CGA')).toBe(1);
      expect(counts.get('GAT')).toBe(1);
    });

    it('2. should handle canonical k-mers', () => {
      const counts = countKmers('ATCG', 2, { canonical: true });
      expect(counts.get('AT')).toBe(1);
      expect(counts.get('GA')).toBe(1); // TC canonical is GA
      expect(counts.get('CG')).toBe(1);
    });

    it('3. should count repeated k-mers', () => {
      const counts = countKmers('AAAAAA', 2);
      expect(counts.get('AA')).toBe(5);
      expect(counts.size).toBe(1);
    });

    it('4. should return empty Map for empty sequence', () => {
      const counts = countKmers('', 2);
      expect(counts.size).toBe(0);
    });

    it('5. should handle k equal to sequence length', () => {
      const counts = countKmers('ATCG', 4);
      expect(counts.get('ATCG')).toBe(1);
      expect(counts.size).toBe(1);
    });

    it('6. should throw TypeError for non-string sequence', () => {
      expect(() => countKmers([] as any, 2)).toThrow(TypeError);
    });

    it('7. should throw TypeError for non-number k', () => {
      expect(() => countKmers('ATCG', null as any)).toThrow(TypeError);
    });
  });

  describe('getKmerSpectrum', () => {
    it('1. should calculate k-mer frequency spectrum', () => {
      const spectrum = getKmerSpectrum('ATCGATCG', 3);
      expect(spectrum.get(1)).toBe(2); // CGA, GAT appear once
      expect(spectrum.get(2)).toBe(2); // ATC, TCG appear twice
    });

    it('2. should handle all unique k-mers', () => {
      const spectrum = getKmerSpectrum('ATCG', 2);
      expect(spectrum.get(1)).toBe(3);
      expect(spectrum.size).toBe(1);
    });

    it('3. should handle repeated k-mers', () => {
      const spectrum = getKmerSpectrum('AAAAAA', 2);
      expect(spectrum.get(5)).toBe(1);
      expect(spectrum.size).toBe(1);
    });

    it('4. should return empty Map for empty sequence', () => {
      const spectrum = getKmerSpectrum('', 3);
      expect(spectrum.size).toBe(0);
    });

    it('5. should work with canonical k-mers', () => {
      const spectrum = getKmerSpectrum('ATCGATCG', 3, { canonical: true });
      // Just check that spectrum is calculated
      expect(spectrum.size).toBeGreaterThan(0);
    });

    it('6. should throw TypeError for non-string sequence', () => {
      expect(() => getKmerSpectrum(undefined as any, 3)).toThrow(TypeError);
    });

    it('7. should throw TypeError for non-number k', () => {
      expect(() => getKmerSpectrum('ATCG', {} as any)).toThrow(TypeError);
    });
  });

  describe('getUniqueKmers', () => {
    it('1. should find k-mers appearing exactly once', () => {
      const unique = getUniqueKmers('ATCGATCG', 3);
      expect(unique).toContain('CGA');
      expect(unique).toContain('GAT');
      expect(unique.size).toBe(2);
    });

    it('2. should return all k-mers when all are unique', () => {
      const unique = getUniqueKmers('ATCG', 2);
      expect(unique.size).toBe(3);
    });

    it('3. should return empty Set when no k-mers are unique', () => {
      const unique = getUniqueKmers('AAAAAA', 2);
      expect(unique.size).toBe(0);
    });

    it('4. should work with canonical k-mers', () => {
      const unique = getUniqueKmers('ATCGATCG', 3, { canonical: true });
      // Check that it returns a Set
      expect(unique instanceof Set).toBe(true);
    });

    it('5. should return empty Set for empty sequence', () => {
      const unique = getUniqueKmers('', 3);
      expect(unique.size).toBe(0);
    });

    it('6. should throw TypeError for non-string sequence', () => {
      expect(() => getUniqueKmers(42 as any, 3)).toThrow(TypeError);
    });

    it('7. should throw TypeError for non-number k', () => {
      expect(() => getUniqueKmers('ATCG', [] as any)).toThrow(TypeError);
    });
  });

  describe('getKmerJaccard', () => {
    it('1. should calculate Jaccard similarity', () => {
      const similarity = getKmerJaccard('ATCGATCG', 'ATCGATCG', 3);
      expect(similarity).toBe(1.0);
    });

    it('2. should return 0 for completely different sequences', () => {
      const similarity = getKmerJaccard('AAAA', 'TTTT', 2);
      expect(similarity).toBe(0.0);
    });

    it('3. should calculate partial similarity', () => {
      const similarity = getKmerJaccard('ATCG', 'ATGG', 2);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it('4. should work with canonical k-mers', () => {
      const similarity = getKmerJaccard('ATCG', 'CGAT', 4, { canonical: true });
      expect(similarity).toBe(1.0);
    });

    it('5. should handle sequences with different lengths', () => {
      const similarity = getKmerJaccard('ATCGATCG', 'ATC', 2);
      expect(similarity).toBeGreaterThan(0);
    });

    it('6. should return 0 for empty sequences', () => {
      const similarity = getKmerJaccard('', '', 2);
      expect(similarity).toBe(0);
    });

    it('7. should throw TypeError for non-string seq1', () => {
      expect(() => getKmerJaccard(true as any, 'ATCG', 2)).toThrow(TypeError);
      expect(() => getKmerJaccard(true as any, 'ATCG', 2)).toThrow('seq1 must be a string');
    });

    it('8. should throw TypeError for non-string seq2', () => {
      expect(() => getKmerJaccard('ATCG', false as any, 2)).toThrow(TypeError);
      expect(() => getKmerJaccard('ATCG', false as any, 2)).toThrow('seq2 must be a string');
    });

    it('9. should throw TypeError for non-number k', () => {
      expect(() => getKmerJaccard('ATCG', 'ATCG', 'two' as any)).toThrow(TypeError);
    });
  });
});
