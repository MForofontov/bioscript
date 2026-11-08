import { affineAlign } from './affine';
import type { AlignmentResult, AlignmentOptions } from './types';
/**
 * Semi-global alignment (end-gap-free alignment).
 *
 * Semi-global alignment does not penalize gaps at the start or end of either sequence.
 * This is useful for:
 * - Aligning primer/probe sequences to longer DNA targets
 * - Finding subsequence matches
 * - Aligning sequences where one may be incomplete at ends
 *
 * The algorithm is a variant of Needleman-Wunsch where:
 * - First row and column are initialized to 0 (no penalty for leading gaps)
 * - Traceback can start from best score in last row/column (no penalty for trailing gaps)
 *
 * @module semi-global
 */

/**
 * Perform semi-global alignment on two sequences.
 *
 * Semi-global alignment (also called end-gap-free alignment) does not penalize
 * gaps at the beginning or end of either sequence. This makes it ideal for:
 * - Primer/probe design: Finding where a short sequence aligns to a longer target
 * - Subsequence matching: Finding the best placement of one sequence within another
 * - Fragment assembly: Aligning incomplete sequences
 *
 * The algorithm uses dynamic programming similar to Needleman-Wunsch but with
 * different initialization (no gap penalties at ends) and traceback (starts from
 * best score in last row/column).
 *
 * @param seq1 - First sequence to align.
 * @param seq2 - Second sequence to align.
 * @param options - Alignment options (scoring matrix and gap penalties).
 * @returns Alignment result with aligned sequences, score, and statistics.
 *
 * @throws {TypeError} If sequences are not strings.
 * @throws {Error} If sequences contain invalid characters.
 *
 * @example
 * ```typescript
 * // Aligning a primer to a longer target
 * const result = semiGlobal('ATCG', 'GGGATCGAAA', { matrix: 'DNA_SIMPLE' });
 * console.log(result.alignedSeq1); // 'ATCG'
 * console.log(result.alignedSeq2); // 'ATCG' (extracted from target)
 * console.log(result.score); // High score, no penalty for flanking gaps
 * ```
 *
 * @example
 * ```typescript
 * // Finding protein domain in longer sequence
 * const result = semiGlobal('HEAGHEE', 'PAWHEAGHEEGHEAE', {
 *   matrix: 'BLOSUM62',
 *   gapOpen: -10,
 *   gapExtend: -1,
 * });
 * ```
 *
 * @performance
 * **Complexity:**
 * - Time: O(m×n) where m, n are sequence lengths
 * - Space: O(m×n) for alignment matrix
 *
 * @note Uses affine gap penalties for biological realism.
 * @note No penalty for gaps at sequence ends makes this ideal for subsequence matching.
 */
export function semiGlobal(
  seq1: string,
  seq2: string,
  options: AlignmentOptions = {}
): AlignmentResult {
  return affineAlign(seq1, seq2, options, 'semi');
}
