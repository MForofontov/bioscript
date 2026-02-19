/**
 * K-mer counting and spectrum analysis utilities.
 * Provides efficient k-mer extraction, counting, and frequency analysis.
 *
 * @module kmers
 */

import { reverseComplement } from './reverse-complement';
import { assertString, assertNumber, assertTwoSequences, assertPositiveInteger, validateSequence } from './validation';
import { normalizeSequence } from './normalize';

/**
 * Extract all k-mers from a sequence.
 *
 * @param sequence - DNA/RNA sequence.
 * @param k - K-mer length.
 * @param options - Extraction options.
 * @param options.canonical - Use canonical k-mers (lexicographically smaller of kmer and reverse complement).
 * @param options.strict - Validate sequence contains only valid nucleotides (default: false).
 * @returns Array of k-mers.
 *
 * @throws {TypeError} If sequence is not a string or k is not a number.
 * @throws {Error} If k is invalid or (in strict mode) sequence contains invalid characters.
 *
 * @example
 * ```typescript
 * const kmers = getKmers('ATCGATCG', 3);
 * console.log(kmers); // ['ATC', 'TCG', 'CGA', 'GAT', 'ATC', 'TCG']
 * ```
 *
 * @example
 * ```typescript
 * // Canonical k-mers (useful for reducing redundancy)
 * const canonical = getKmers('ATCG', 2, { canonical: true });
 * console.log(canonical); // ['AT', 'CG', 'CG'] (CG vs GC -> CG)
 * ```
 *
 * @example
 * ```typescript
 * // Strict validation
 * const kmers = getKmers('ATCG', 2, { strict: true }); // OK
 * getKmers('ATCXYZ', 2, { strict: true }); // Throws Error
 * ```
 *
 * @performance O(n) where n is sequence length.
 */
export function getKmers(
  sequence: string,
  k: number,
  options: { canonical?: boolean; strict?: boolean } = {}
): string[] {
  assertString(sequence, 'sequence');
  assertNumber(k, 'k');
  assertPositiveInteger(k, 'k');

  const normalized = normalizeSequence(sequence);
  const { canonical = false, strict = false } = options;

  if (strict) {
    validateSequence(normalized, true);
  }

  if (k > normalized.length) {
    return [];
  }

  const kmers: string[] = [];

  for (let i = 0; i <= normalized.length - k; i++) {
    let kmer = normalized.slice(i, i + k);

    if (canonical) {
      const revComp = reverseComplement(kmer);
      kmer = kmer < revComp ? kmer : revComp;
    }

    kmers.push(kmer);
  }

  return kmers;
}

/**
 * Count k-mer occurrences in a sequence.
 *
 * @param sequence - DNA/RNA sequence.
 * @param k - K-mer length.
 * @param options - Counting options.
 * @param options.canonical - Count canonical k-mers.
 * @returns Map of k-mer to count.
 *
 * @throws {TypeError} If sequence is not a string or k is not a number.
 * @throws {Error} If k is invalid.
 *
 * @example
 * ```typescript
 * const counts = countKmers('ATCGATCG', 3);
 * console.log(counts.get('ATC')); // 2
 * console.log(counts.get('TCG')); // 2
 * console.log(counts.get('CGA')); // 1
 * ```
 *
 * @example
 * ```typescript
 * // Canonical counting (treats kmer and reverse complement as same)
 * const canonical = countKmers('ATCGAT', 2, { canonical: true });
 * // AT and TA both counted as AT
 * ```
 *
 * @performance O(n) where n is sequence length. Uses Map for O(1) lookups.
 */
export function countKmers(
  sequence: string,
  k: number,
  options: { canonical?: boolean } = {}
): Map<string, number> {
  assertString(sequence, 'sequence');
  assertNumber(k, 'k');
  assertPositiveInteger(k, 'k');

  const counts = new Map<string, number>();
  const kmers = getKmers(sequence, k, options);

  for (const kmer of kmers) {
    counts.set(kmer, (counts.get(kmer) || 0) + 1);
  }

  return counts;
}

/**
 * Get k-mer frequency spectrum (histogram of k-mer counts).
 *
 * @param sequence - DNA/RNA sequence.
 * @param k - K-mer length.
 * @param options - Spectrum options.
 * @param options.canonical - Use canonical k-mers.
 * @returns Map of frequency to count (how many k-mers appear X times).
 *
 * @throws {TypeError} If sequence is not a string or k is not a number.
 * @throws {Error} If k is invalid.
 *
 * @example
 * ```typescript
 * const spectrum = getKmerSpectrum('ATCGATCGATCG', 3);
 * console.log(spectrum.get(1)); // Number of k-mers appearing once
 * console.log(spectrum.get(2)); // Number of k-mers appearing twice
 * console.log(spectrum.get(3)); // Number of k-mers appearing three times
 * ```
 *
 * @note Useful for genome size estimation, error correction, and sequencing quality assessment.
 * @performance O(n) where n is sequence length.
 */
export function getKmerSpectrum(
  sequence: string,
  k: number,
  options: { canonical?: boolean } = {}
): Map<number, number> {
  assertString(sequence, 'sequence');
  assertNumber(k, 'k');
  assertPositiveInteger(k, 'k');

  const kmerCounts = countKmers(sequence, k, options);
  const spectrum = new Map<number, number>();

  for (const count of kmerCounts.values()) {
    spectrum.set(count, (spectrum.get(count) || 0) + 1);
  }

  return spectrum;
}

/**
 * Find unique k-mers (appearing exactly once).
 *
 * @param sequence - DNA/RNA sequence.
 * @param k - K-mer length.
 * @param options - Filtering options.
 * @param options.canonical - Use canonical k-mers.
 * @returns Set of unique k-mers.
 *
 * @example
 * ```typescript
 * const unique = getUniqueKmers('ATCGATCGGG', 3);
 * console.log(unique); // Set of k-mers appearing exactly once
 * ```
 *
 * @note Useful for identifying sequencing errors and low-coverage regions.
 */
export function getUniqueKmers(
  sequence: string,
  k: number,
  options: { canonical?: boolean } = {}
): Set<string> {
  const counts = countKmers(sequence, k, options);
  const unique = new Set<string>();

  for (const [kmer, count] of counts.entries()) {
    if (count === 1) {
      unique.add(kmer);
    }
  }

  return unique;
}

/**
 * Calculate Jaccard similarity between two sequences based on k-mers.
 *
 * @param seq1 - First sequence.
 * @param seq2 - Second sequence.
 * @param k - K-mer length.
 * @param options - Comparison options.
 * @param options.canonical - Use canonical k-mers.
 * @returns Jaccard similarity (0-1).
 *
 * @example
 * ```typescript
 * const similarity = getKmerJaccard('ATCGATCG', 'ATCGGGCG', 3);
 * console.log(similarity); // 0.5 (50% shared k-mers)
 * ```
 *
 * @note Jaccard = |intersection| / |union|
 * @performance O(n + m) where n, m are sequence lengths.
 */
export function getKmerJaccard(
  seq1: string,
  seq2: string,
  k: number,
  options: { canonical?: boolean } = {}
): number {
  assertTwoSequences(seq1, seq2);

  const kmers1 = new Set(getKmers(seq1, k, options));
  const kmers2 = new Set(getKmers(seq2, k, options));

  const intersection = new Set([...kmers1].filter((x) => kmers2.has(x)));
  const union = new Set([...kmers1, ...kmers2]);

  if (union.size === 0) {
    return 0;
  }

  return intersection.size / union.size;
}

/**
 * Extract k-mers using rolling hash (efficient for large k).
 * Uses Rabin-Karp style polynomial rolling hash for O(1) k-mer hashing.
 *
 * @param sequence - DNA/RNA sequence.
 * @param k - K-mer length.
 * @param options - Extraction options.
 * @param options.canonical - Use canonical k-mers.
 * @param options.strict - Validate sequence.
 * @returns Map of k-mer to hash value.
 *
 * @example
 * ```typescript
 * const hashed = getKmersWithRollingHash('ATCGATCG', 5);
 * hashed.forEach((hash, kmer) => {
 *   console.log(`${kmer}: ${hash}`);
 * });
 * ```
 *
 * @note Rolling hash is O(1) per k-mer after initial O(k) computation.
 * @performance O(n) where n is sequence length, faster than string comparison for large k.
 */
export function getKmersWithRollingHash(
  sequence: string,
  k: number,
  options: { canonical?: boolean; strict?: boolean } = {}
): Map<string, number> {
  assertString(sequence, 'sequence');
  assertNumber(k, 'k');
  assertPositiveInteger(k, 'k');

  const normalized = normalizeSequence(sequence);
  const { canonical = false, strict = false } = options;

  if (strict) {
    validateSequence(normalized, true);
  }

  if (k > normalized.length) {
    return new Map();
  }

  const kmerHashes = new Map<string, number>();
  const base = 4; // 4 nucleotides
  const mod = 2147483647; // Large prime

  // Map nucleotides to numbers
  const baseMap: Record<string, number> = { A: 0, C: 1, G: 2, T: 3, U: 3, N: 0 };

  // Compute initial hash for first k-mer
  let hash = 0;
  let power = 1;
  for (let i = 0; i < k; i++) {
    hash = (hash * base + (baseMap[normalized[i]] || 0)) % mod;
    if (i < k - 1) {
      power = (power * base) % mod;
    }
  }

  let kmer = normalized.slice(0, k);
  if (canonical) {
    const revComp = reverseComplement(kmer);
    kmer = kmer < revComp ? kmer : revComp;
  }
  kmerHashes.set(kmer, hash);

  // Rolling hash for remaining k-mers
  for (let i = k; i < normalized.length; i++) {
    // Remove leftmost base, add rightmost base
    const oldBase = baseMap[normalized[i - k]] || 0;
    const newBase = baseMap[normalized[i]] || 0;

    hash = (hash - ((oldBase * power) % mod) + mod) % mod;
    hash = (hash * base + newBase) % mod;

    kmer = normalized.slice(i - k + 1, i + 1);
    if (canonical) {
      const revComp = reverseComplement(kmer);
      kmer = kmer < revComp ? kmer : revComp;
    }
    kmerHashes.set(kmer, hash);
  }

  return kmerHashes;
}

/**
 * Extract super-k-mers (maximal sequences of overlapping k-mers).
 * Super-k-mers compress storage by grouping consecutive overlapping k-mers into larger sequences.
 *
 * @param sequence - DNA/RNA sequence.
 * @param k - K-mer length.
 * @param options - Extraction options.
 * @param options.canonical - Use canonical k-mers.
 * @returns Array of super-k-mer strings.
 *
 * @example
 * ```typescript
 * const superKmers = getSuperKmers('ATCGATCGATCG', 3);
 * // Returns longer sequences where k-mers overlap consecutively
 * ```
 *
 * @note Super-k-mers reduce storage by grouping consecutive identical k-mers.
 * @performance O(n) where n is sequence length.
 */
export function getSuperKmers(
  sequence: string,
  k: number,
  options: { canonical?: boolean } = {}
): string[] {
  assertString(sequence, 'sequence');
  assertNumber(k, 'k');
  assertPositiveInteger(k, 'k');

  const normalized = normalizeSequence(sequence);
  if (k > normalized.length) {
    return [];
  }

  const { canonical = false } = options;
  const superKmers: string[] = [];
  let currentSuper = normalized.slice(0, k);
  let prevKmer = currentSuper;

  if (canonical) {
    const revComp = reverseComplement(prevKmer);
    prevKmer = prevKmer < revComp ? prevKmer : revComp;
  }

  for (let i = 1; i <= normalized.length - k; i++) {
    let kmer = normalized.slice(i, i + k);
    if (canonical) {
      const revComp = reverseComplement(kmer);
      kmer = kmer < revComp ? kmer : revComp;
    }

    // Check if this k-mer overlaps with previous
    const prevSuffix = prevKmer.slice(1);
    const currentPrefix = kmer.slice(0, k - 1);

    if (prevSuffix === currentPrefix) {
      currentSuper += kmer[k - 1];
    } else {
      superKmers.push(currentSuper);
      currentSuper = normalized.slice(i, i + k);
    }

    prevKmer = kmer;
  }

  superKmers.push(currentSuper);
  return superKmers;
}

/**
 * Extract syncmers (synchronized k-mers using s-mers).
 * Syncmers provide more evenly distributed sampling than minimizers by using s-mer position criterion.
 *
 * @param sequence - DNA/RNA sequence.
 * @param k - K-mer length.
 * @param s - S-mer length (s < k).
 * @param options - Extraction options.
 * @returns Array of syncmer objects with k-mer and position.
 *
 * @example
 * ```typescript
 * const syncmers = getSyncmers('ATCGATCGATCG', 5, 2);
 * syncmers.forEach(sm => {
 *   console.log(`${sm.kmer} at position ${sm.position}`);
 * });
 * ```
 *
 * @note Syncmers are a more evenly distributed alternative to minimizers.
 * @performance O(n * (k - s)) where n is sequence length.
 */
export function getSyncmers(
  sequence: string,
  k: number,
  s: number,
  options: { canonical?: boolean } = {}
): Array<{ kmer: string; position: number }> {
  assertString(sequence, 'sequence');
  assertNumber(k, 'k');
  assertNumber(s, 's');
  assertPositiveInteger(k, 'k');
  if (s < 1 || s >= k || !Number.isInteger(s)) {
    throw new Error(`s must be a positive integer less than k, got ${s}`);
  }

  const normalized = normalizeSequence(sequence);
  if (k > normalized.length) {
    return [];
  }

  const { canonical = false } = options;
  const syncmers: Array<{ kmer: string; position: number }> = [];

  for (let i = 0; i <= normalized.length - k; i++) {
    let kmer = normalized.slice(i, i + k);
    if (canonical) {
      const revComp = reverseComplement(kmer);
      kmer = kmer < revComp ? kmer : revComp;
    }

    // Extract all s-mers from this k-mer
    const smers: string[] = [];
    for (let j = 0; j <= k - s; j++) {
      smers.push(kmer.slice(j, j + s));
    }

    // Find minimum s-mer
    const minSmer = smers.reduce((min, curr) => (curr < min ? curr : min));

    // Check if minimum s-mer is at first or last position (syncmer condition)
    if (smers[0] === minSmer || smers[smers.length - 1] === minSmer) {
      syncmers.push({ kmer, position: i });
    }
  }

  return syncmers;
}
