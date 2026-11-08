import { affineAlign } from './affine';
import type { AlignmentResult, AlignmentOptions } from './types';
/**
 * Needleman-Wunsch global sequence alignment algorithm.
 *
 * Performs optimal global alignment of two sequences using dynamic programming.
 * Guarantees finding the best alignment that spans the entire length of both sequences.
 *
 * Time complexity: O(m*n) where m and n are sequence lengths.
 * Space complexity: O(m*n) for the alignment matrix.
 *
 * @module needleman-wunsch
 */

/**
 * Performs global sequence alignment using the Needleman-Wunsch algorithm.
 *
 * This function finds the optimal alignment that spans the entire length
 * of both sequences. Use this when you want to align complete sequences
 * end-to-end, such as comparing two homologous proteins or genes.
 *
 * @param seq1 - First sequence to align (DNA, RNA, or protein).
 * @param seq2 - Second sequence to align (DNA, RNA, or protein).
 * @param options - Alignment configuration options.
 * @returns Alignment result with aligned sequences and statistics.
 *
 * @throws {TypeError} If sequences are not strings.
 * @throws {Error} If sequences are empty or contain only whitespace.
 * @throws {Error} If gap penalties are positive values.
 *
 * @example
 * ```typescript
 * // Align two protein sequences
 * const result = needlemanWunsch('HEAGAWGHEE', 'PAWHEAE', {
 *   matrix: 'BLOSUM62',
 *   gapOpen: -10,
 *   gapExtend: -1,
 * });
 *
 * console.log(result.alignedSeq1);  // 'HEAGAWGHEE'
 * console.log(result.alignedSeq2);  // '--PAW-HEAE'
 * console.log(result.score);        // Alignment score
 * console.log(result.identityPercent); // % identity
 * ```
 *
 * @example
 * ```typescript
 * // Align DNA sequences
 * const result = needlemanWunsch('ACGTACGT', 'ACGTAGCT', {
 *   matrix: 'DNA_SIMPLE',
 *   gapOpen: -5,
 *   gapExtend: -2,
 * });
 * ```
 *
 * @performance
 * **Complexity:**
 * - Time: O(m×n) where m, n are sequence lengths
 * - Space: O(m×n) for alignment matrix (~16 bytes per cell)
 *
 * @note For finding local regions of similarity, use Smith-Waterman instead.
 * @note For memory-constrained alignment of long sequences, use Hirschberg algorithm.
 */
export function needlemanWunsch(
  seq1: string,
  seq2: string,
  options: AlignmentOptions = {}
): AlignmentResult {
  return affineAlign(seq1, seq2, options, 'global');
}
