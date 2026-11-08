/**
 * Minimizer extraction for efficient sequence sketching and comparison.
 * Minimizers reduce sequence size while preserving similarity information.
 *
 * @module minimizers
 */

import { reverseComplement } from './reverse-complement';

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
 * @performance O(n * k) including k-mer construction; amortized O(n) window selection.
 */
export function getMinimizers(
  sequence: string,
  k: number,
  w: number,
  options: { canonical?: boolean } = {}
): Minimizer[] {
  if (typeof sequence !== 'string') {
    throw new TypeError(`sequence must be a string, got ${typeof sequence}`);
  }
  if (typeof k !== 'number') {
    throw new TypeError(`k must be a number, got ${typeof k}`);
  }
  if (typeof w !== 'number') {
    throw new TypeError(`w must be a number, got ${typeof w}`);
  }
  if (k < 1 || !Number.isInteger(k)) {
    throw new Error(`k must be a positive integer, got ${k}`);
  }
  if (w < 1 || !Number.isInteger(w)) {
    throw new Error(`w must be a positive integer, got ${w}`);
  }

  const normalized = sequence.trim().toUpperCase();
  const { canonical = false } = options;

  if (k > normalized.length || w > normalized.length - k + 1) {
    return [];
  }

  return selectMinimizers(normalized, k, w, canonical);
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
 * @performance O(n * k) with the default hash; amortized O(n) window selection.
 */
export function getHashMinimizers(
  sequence: string,
  k: number,
  w: number,
  options: { canonical?: boolean; hashFunction?: (kmer: string) => number } = {}
): Minimizer[] {
  if (typeof sequence !== 'string') {
    throw new TypeError(`sequence must be a string, got ${typeof sequence}`);
  }
  if (typeof k !== 'number') {
    throw new TypeError(`k must be a number, got ${typeof k}`);
  }
  if (typeof w !== 'number') {
    throw new TypeError(`w must be a number, got ${typeof w}`);
  }

  if (k < 1 || !Number.isInteger(k)) throw new Error('k must be a positive integer');
  if (w < 1 || !Number.isInteger(w)) throw new Error('w must be a positive integer');

  const normalized = sequence.trim().toUpperCase();
  const { canonical = false, hashFunction = defaultHash } = options;

  if (k > normalized.length || w > normalized.length - k + 1) {
    return [];
  }

  return selectMinimizers(normalized, k, w, canonical, hashFunction);
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
  const count = sequence.trim().length - k + 1;
  return count > 0 ? minimizers.length / count : 0;
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
  if (typeof seq1 !== 'string') {
    throw new TypeError(`seq1 must be a string, got ${typeof seq1}`);
  }
  if (typeof seq2 !== 'string') {
    throw new TypeError(`seq2 must be a string, got ${typeof seq2}`);
  }

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

/** Monotonic deque; strict comparisons preserve the first position on ties. */
function selectMinimizers(
  sequence: string,
  k: number,
  w: number,
  canonical: boolean,
  hashFunction?: (kmer: string) => number
): Minimizer[] {
  let queue: Minimizer[] = [];
  let head = 0;
  const result: Minimizer[] = [];
  for (let position = 0; position + k <= sequence.length; position++) {
    let kmer = sequence.slice(position, position + k);
    if (canonical) {
      const reverse = reverseComplement(kmer);
      if (reverse < kmer) kmer = reverse;
    }
    const candidate: Minimizer = hashFunction
      ? { kmer, position, hash: hashFunction(kmer) }
      : { kmer, position };
    while (head < queue.length && queue[head].position <= position - w) head++;
    // The previous implementation never selected NaN or positive Infinity.
    if (!hashFunction || candidate.hash! < Infinity) {
      while (
        queue.length > head &&
        (hashFunction
          ? queue[queue.length - 1].hash! > candidate.hash!
          : queue[queue.length - 1].kmer > kmer)
      )
        queue.pop();
      queue.push(candidate);
    }
    if (position >= w - 1) {
      const best = queue[head] ?? { kmer: '', position: -1, hash: Infinity };
      if (result.length === 0 || result[result.length - 1].position !== best.position)
        result.push(best);
    }
    if (head > 1024 && head * 2 > queue.length) {
      queue = queue.slice(head);
      head = 0;
    }
  }
  return result;
}
