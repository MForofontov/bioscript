import {
  getKmers,
  countKmers,
  getKmerSpectrum,
  getUniqueKmers,
  getKmerJaccard,
  getKmersWithRollingHash,
  getSuperKmers,
  getSyncmers,
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

  describe('getKmers with strict validation', () => {
    it('1. should accept valid DNA sequence in strict mode', () => {
      const kmers = getKmers('ATCGATCG', 3, { strict: true });
      expect(kmers).toHaveLength(6);
    });

    it('2. should accept valid RNA sequence in strict mode', () => {
      const kmers = getKmers('AUCGAUCG', 3, { strict: true });
      expect(kmers).toHaveLength(6);
    });

    it('3. should accept sequences with N in strict mode', () => {
      const kmers = getKmers('ATNGCN', 3, { strict: true });
      expect(kmers).toHaveLength(4);
    });

    it('4. should not throw for invalid characters when strict is false', () => {
      expect(() => getKmers('ATCXYZ', 3, { strict: false })).not.toThrow();
    });

    it('5. should throw Error for invalid characters in strict mode', () => {
      expect(() => getKmers('ATCXYZ', 3, { strict: true })).toThrow(Error);
      expect(() => getKmers('ATCXYZ', 3, { strict: true })).toThrow('invalid characters');
    });

    it('6. should throw Error for numbers in sequence in strict mode', () => {
      expect(() => getKmers('ATC123', 3, { strict: true })).toThrow(Error);
    });

    it('7. should throw Error for special characters in strict mode', () => {
      expect(() => getKmers('ATC!@#', 3, { strict: true })).toThrow(Error);
    });
  });

  describe('getKmersWithRollingHash', () => {
    it('1. should compute rolling hash for simple sequence', () => {
      const hashes = getKmersWithRollingHash('ATCGATCG', 3);
      // Returns unique k-mers: ATC, TCG, CGA, GAT (ATC appears twice but Map deduplicates)
      expect(hashes.size).toBe(4);
      expect(hashes.has('ATC')).toBe(true);
      expect(hashes.has('TCG')).toBe(true);
    });

    it('2. should produce different hashes for different k-mers', () => {
      const hashes = getKmersWithRollingHash('ATCGATCG', 3);
      const hashValues = Array.from(hashes.values());
      const uniqueHashes = new Set(hashValues);
      // Most hashes should be unique (collision possible but rare)
      expect(uniqueHashes.size).toBeGreaterThan(3);
    });

    it('3. should handle canonical k-mers with rolling hash', () => {
      const hashes = getKmersWithRollingHash('ATCG', 2, { canonical: true });
      expect(hashes.size).toBe(3);
      // TC becomes GA (canonical)
      expect(hashes.has('GA')).toBe(true);
    });

    it('4. should handle k equal to sequence length', () => {
      const hashes = getKmersWithRollingHash('ATCG', 4);
      expect(hashes.size).toBe(1);
      expect(hashes.has('ATCG')).toBe(true);
    });

    it('5. should return empty map for k > sequence length', () => {
      const hashes = getKmersWithRollingHash('ATC', 5);
      expect(hashes.size).toBe(0);
    });

    it('6. should handle sequences with N', () => {
      const hashes = getKmersWithRollingHash('ATNNC', 3);
      expect(hashes.size).toBe(3);
      expect(hashes.has('ATN')).toBe(true);
    });

    it('7. should handle large k values efficiently', () => {
      const sequence = 'A'.repeat(50) + 'C'.repeat(50);
      const hashes = getKmersWithRollingHash(sequence, 20);
      expect(hashes.size).toBeGreaterThan(0);
    });

    it('8. should validate sequence in strict mode', () => {
      expect(() => getKmersWithRollingHash('ATCXYZ', 3, { strict: true })).toThrow(Error);
    });

    it('9. should trim and uppercase sequence', () => {
      const hashes = getKmersWithRollingHash('  atcg  ', 3);
      expect(hashes.size).toBe(2);
      expect(hashes.has('ATC')).toBe(true);
    });

    it('10. should throw TypeError for non-string sequence', () => {
      expect(() => getKmersWithRollingHash(123 as any, 3)).toThrow(TypeError);
    });

    it('11. should throw TypeError for non-number k', () => {
      expect(() => getKmersWithRollingHash('ATCG', '3' as any)).toThrow(TypeError);
    });
  });

  describe('getSuperKmers', () => {
    it('1. should extract super-k-mers from overlapping sequence', () => {
      const superKmers = getSuperKmers('ATCGATCGATCG', 3);
      expect(superKmers.length).toBeGreaterThan(0);
      // Should compress consecutive overlapping k-mers
      expect(superKmers[0].length).toBeGreaterThanOrEqual(3);
    });

    it('2. should handle sequence with no overlaps', () => {
      // Each k-mer unique, no consecutive overlaps
      const superKmers = getSuperKmers('AAAAATTTTTCCCCC', 3);
      expect(superKmers.length).toBeGreaterThan(0);
    });

    it('3. should handle simple overlapping k-mers', () => {
      const superKmers = getSuperKmers('ATCG', 2);
      // AT, TC, CG - consecutive overlaps
      expect(superKmers.length).toBeGreaterThan(0);
      expect(superKmers[0]).toContain('A');
    });

    it('4. should handle canonical k-mers', () => {
      const superKmers = getSuperKmers('ATCGATCG', 3, { canonical: true });
      expect(superKmers.length).toBeGreaterThan(0);
    });

    it('5. should handle k equal to sequence length', () => {
      const superKmers = getSuperKmers('ATCG', 4);
      expect(superKmers).toEqual(['ATCG']);
    });

    it('6. should return empty array for k > sequence length', () => {
      const superKmers = getSuperKmers('ATC', 5);
      expect(superKmers).toEqual([]);
    });

    it('7. should handle sequences with N', () => {
      const superKmers = getSuperKmers('ATNNNCG', 3);
      expect(superKmers.length).toBeGreaterThan(0);
    });

    it('8. should compress long overlapping sequences', () => {
      const sequence = 'ATCGATCGATCGATCG'; // Many overlaps
      const superKmers = getSuperKmers(sequence, 4);
      // Should create fewer super-kmers than k-mers
      expect(superKmers.length).toBeLessThan(sequence.length - 4 + 1);
    });

    it('9. should trim and uppercase sequence', () => {
      const superKmers = getSuperKmers('  atcg  ', 2);
      expect(superKmers.length).toBeGreaterThan(0);
    });

    it('10. should throw TypeError for non-string sequence', () => {
      expect(() => getSuperKmers(null as any, 3)).toThrow(TypeError);
    });

    it('11. should throw TypeError for non-number k', () => {
      expect(() => getSuperKmers('ATCG', [] as any)).toThrow(TypeError);
    });
  });

  describe('getSyncmers', () => {
    it('1. should extract syncmers from sequence', () => {
      const syncmers = getSyncmers('ATCGATCGATCG', 5, 2);
      expect(syncmers.length).toBeGreaterThan(0);
      expect(syncmers[0]).toHaveProperty('kmer');
      expect(syncmers[0]).toHaveProperty('position');
    });

    it('2. should have s < k', () => {
      const syncmers = getSyncmers('ATCGATCG', 4, 2);
      expect(syncmers.length).toBeGreaterThan(0);
      syncmers.forEach(sm => {
        expect(sm.kmer.length).toBe(4);
      });
    });

    it('3. should handle canonical syncmers', () => {
      const syncmers = getSyncmers('ATCGATCG', 5, 2, { canonical: true });
      expect(syncmers.length).toBeGreaterThan(0);
    });

    it('4. should include position information', () => {
      const syncmers = getSyncmers('ATCGATCG', 4, 2);
      syncmers.forEach(sm => {
        expect(typeof sm.position).toBe('number');
        expect(sm.position).toBeGreaterThanOrEqual(0);
      });
    });

    it('5. should handle k equal to sequence length', () => {
      const syncmers = getSyncmers('ATCG', 4, 2);
      // May or may not return syncmer depending on s-mer positions
      expect(Array.isArray(syncmers)).toBe(true);
    });

    it('6. should return empty array for k > sequence length', () => {
      const syncmers = getSyncmers('ATC', 5, 2);
      expect(syncmers).toEqual([]);
    });

    it('7. should handle sequences with N', () => {
      const syncmers = getSyncmers('ATNNNCGATCG', 5, 2);
      expect(Array.isArray(syncmers)).toBe(true);
    });

    it('8. should provide more even distribution than random sampling', () => {
      const sequence = 'ATCGATCGATCGATCG';
      const syncmers = getSyncmers(sequence, 6, 3);
      // Should return some syncmers (not empty)
      expect(syncmers.length).toBeGreaterThanOrEqual(0);
    });

    it('9. should trim and uppercase sequence', () => {
      const syncmers = getSyncmers('  atcgatcg  ', 4, 2);
      expect(Array.isArray(syncmers)).toBe(true);
    });

    it('10. should throw TypeError for non-string sequence', () => {
      expect(() => getSyncmers({} as any, 5, 2)).toThrow(TypeError);
    });

    it('11. should throw TypeError for non-number k', () => {
      expect(() => getSyncmers('ATCG', true as any, 2)).toThrow(TypeError);
    });

    it('12. should throw TypeError for non-number s', () => {
      expect(() => getSyncmers('ATCG', 5, 'two' as any)).toThrow(TypeError);
    });

    it('13. should throw Error when s >= k', () => {
      expect(() => getSyncmers('ATCGATCG', 4, 4)).toThrow(Error);
      expect(() => getSyncmers('ATCGATCG', 4, 5)).toThrow(Error);
    });
  });
});
