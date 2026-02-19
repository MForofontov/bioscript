/**
 * Minimizer extraction for efficient sequence sketching and comparison.
 * Minimizers reduce sequence size while preserving similarity information.
 *
 * @module minimizers
 */

import { reverseComplement } from './reverse-complement';
import { assertString, assertNumber, assertTwoSequences, assertPositiveInteger } from './validation';
import { normalizeSequence } from './normalize';

/**
 * Minimizer with position information.
 */
export interface Minimizer {
  /** The minimizer k-mer string */
  kmer: string;
  /** Position in the original sequence */
  position: number;
  /** Hash value (if using hash-based selection) */
  hash?: number;
}

/**
 * Extract minimizers from a sequence using lexicographic ordering.
 * Minimizers select the lexicographically smallest k-mer in each sliding window for efficient sketching.
 *
 * @param sequence - DNA/RNA sequence.
 * @param k - K-mer length (minimizer size).
 * @param w - Window size (number of k-mers per window).
 * @param options - Extraction options.
 * @param options.canonical - Use canonical k-mers.
 * @returns Array of minimizers with positions.
 *
 * @throws {TypeError} If sequence is not a string or k/w are not numbers.
 * @throws {Error} If k or w are invalid.
 *
 * @example
 * ```typescript
 * const minimizers = getMinimizers('ATCGATCGATCG', 3, 4);
 * minimizers.forEach(m => {
 *   console.log(`${m.kmer} at position ${m.position}`);
 * });
 * ```
 *
 * @note Minimizers are useful for: sequence alignment, read overlap detection, genome assembly.
 * @performance O(n * w) where n is sequence length, w is window size.
 */
export function getMinimizers(
  sequence: string,
  k: number,
  w: number,
  options: { canonical?: boolean } = {}
): Minimizer[] {
  assertString(sequence, 'sequence');
  assertNumber(k, 'k');
  assertNumber(w, 'w');
  assertPositiveInteger(k, 'k');
  assertPositiveInteger(w, 'w');

  const normalized = normalizeSequence(sequence);
  const { canonical = false } = options;

  if (k > normalized.length || w > normalized.length - k + 1) {
    return [];
  }

  const minimizers: Minimizer[] = [];
  const numWindows = normalized.length - k - w + 2;

  for (let windowStart = 0; windowStart < numWindows; windowStart++) {
    let minKmer = '';
    let minPos = -1;

    // Find minimum k-mer in window [windowStart, windowStart + w)
    for (let i = windowStart; i < windowStart + w && i + k <= normalized.length; i++) {
      let kmer = normalized.slice(i, i + k);

      if (canonical) {
        const revComp = reverseComplement(kmer);
        kmer = kmer < revComp ? kmer : revComp;
      }

      if (minKmer === '' || kmer < minKmer) {
        minKmer = kmer;
        minPos = i;
      }
    }

    // Add minimizer if it's different from previous or at different position
    if (
      minimizers.length === 0 ||
      minimizers[minimizers.length - 1].kmer !== minKmer ||
      minimizers[minimizers.length - 1].position !== minPos
    ) {
      minimizers.push({ kmer: minKmer, position: minPos });
    }
  }

  return minimizers;
}

/**
 * Extract minimizers using hash-based selection (faster for large k).
 *
 * @param sequence - DNA/RNA sequence.
 * @param k - K-mer length.
 * @param w - Window size.
 * @param options - Extraction options.
 * @param options.canonical - Use canonical k-mers.
 * @param options.hashFunction - Custom hash function (default: simple string hash).
 * @returns Array of minimizers with hash values.
 *
 * @example
 * ```typescript
 * const minimizers = getHashMinimizers('ATCGATCGATCG', 5, 10);
 * minimizers.forEach(m => {
 *   console.log(`${m.kmer} (hash: ${m.hash}) at ${m.position}`);
 * });
 * ```
 *
 * @performance O(n) amortized with efficient hash function.
 */
export function getHashMinimizers(
  sequence: string,
  k: number,
  w: number,
  options: { canonical?: boolean; hashFunction?: (kmer: string) => number } = {}
): Minimizer[] {
  assertString(sequence, 'sequence');
  assertNumber(k, 'k');
  assertNumber(w, 'w');

  const normalized = normalizeSequence(sequence);
  const { canonical = false, hashFunction = defaultHash } = options;

  if (k > normalized.length || w > normalized.length - k + 1) {
    return [];
  }

  const minimizers: Minimizer[] = [];
  const numWindows = normalized.length - k - w + 2;

  for (let windowStart = 0; windowStart < numWindows; windowStart++) {
    let minHash = Infinity;
    let minKmer = '';
    let minPos = -1;

    for (let i = windowStart; i < windowStart + w && i + k <= normalized.length; i++) {
      let kmer = normalized.slice(i, i + k);

      if (canonical) {
        const revComp = reverseComplement(kmer);
        kmer = kmer < revComp ? kmer : revComp;
      }

      const hash = hashFunction(kmer);
      if (hash < minHash) {
        minHash = hash;
        minKmer = kmer;
        minPos = i;
      }
    }

    if (
      minimizers.length === 0 ||
      minimizers[minimizers.length - 1].hash !== minHash ||
      minimizers[minimizers.length - 1].position !== minPos
    ) {
      minimizers.push({ kmer: minKmer, position: minPos, hash: minHash });
    }
  }

  return minimizers;
}

/**
 * Calculate minimizer density (minimizers per base).
 *
 * @param sequence - DNA/RNA sequence.
 * @param k - K-mer length.
 * @param w - Window size.
 * @param options - Extraction options.
 * @returns Density value (0-1).
 *
 * @example
 * ```typescript
 * const density = getMinimizerDensity('ATCGATCGATCG', 3, 4);
 * console.log(`${(density * 100).toFixed(1)}% of sequence covered`);
 * ```
 */
export function getMinimizerDensity(
  sequence: string,
  k: number,
  w: number,
  options: { canonical?: boolean } = {}
): number {
  const minimizers = getMinimizers(sequence, k, w, options);
  return minimizers.length / (sequence.trim().length - k + 1);
}

/**
 * Compare two sequences using minimizer Jaccard similarity.
 *
 * @param seq1 - First sequence.
 * @param seq2 - Second sequence.
 * @param k - K-mer length.
 * @param w - Window size.
 * @param options - Comparison options.
 * @returns Jaccard similarity (0-1).
 *
 * @example
 * ```typescript
 * const similarity = getMinimizerJaccard('ATCGATCG', 'ATCGGGCG', 3, 4);
 * console.log(`${(similarity * 100).toFixed(1)}% similar`);
 * ```
 *
 * @note Much faster than full k-mer Jaccard for large sequences.
 * @performance O(n + m) where n, m are sequence lengths.
 */
export function getMinimizerJaccard(
  seq1: string,
  seq2: string,
  k: number,
  w: number,
  options: { canonical?: boolean } = {}
): number {
  assertTwoSequences(seq1, seq2);

  const minimizers1 = new Set(getMinimizers(seq1, k, w, options).map((m) => m.kmer));
  const minimizers2 = new Set(getMinimizers(seq2, k, w, options).map((m) => m.kmer));

  const intersection = new Set([...minimizers1].filter((x) => minimizers2.has(x)));
  const union = new Set([...minimizers1, ...minimizers2]);

  if (union.size === 0) {
    return 0;
  }

  return intersection.size / union.size;
}

// Helper functions

function defaultHash(kmer: string): number {
  let hash = 0;
  for (let i = 0; i < kmer.length; i++) {
    hash = (hash << 5) - hash + kmer.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
