import { affineAlign } from './affine';
import type { AlignmentResult, LocalAlignmentOptions } from './types';
/**
 * Smith-Waterman local sequence alignment algorithm.
 *
 * Performs optimal local alignment of two sequences using dynamic programming.
 * Finds the best matching subsequence regions, ignoring mismatched ends.
 *
 * Time complexity: O(m*n) where m and n are sequence lengths.
 * Space complexity: O(m*n) for the alignment matrix.
 *
 * @module smith-waterman
 */

/**
 * Performs local sequence alignment using the Smith-Waterman algorithm.
 *
 * This function finds the best matching region(s) between two sequences,
 * ignoring poorly matching ends. Use this when looking for conserved
 * domains, motifs, or similar regions within longer sequences.
 *
 * @param seq1 - First sequence to align (DNA, RNA, or protein).
 * @param seq2 - Second sequence to align (DNA, RNA, or protein).
 * @param options - Alignment configuration options.
 * @returns Alignment result with the best local alignment and statistics.
 *
 * @throws {TypeError} If sequences are not strings.
 * @throws {Error} If sequences are empty or contain only whitespace.
 * @throws {Error} If gap penalties are positive values.
 *
 * @example
 * ```typescript
 * // Find local alignment in protein sequences
 * const result = smithWaterman(
 *   'HEAGAWGHEEAGAWGHEE',
 *   'PAWHEAE',
 *   {
 *     matrix: 'BLOSUM62',
 *     gapOpen: -10,
 *     gapExtend: -1,
 *     minScore: 10,
 *   }
 * );
 *
 * console.log(result.alignedSeq1);  // Local alignment region
 * console.log(result.alignedSeq2);  // Corresponding region
 * console.log(result.startPos1);    // Start position in seq1
 * console.log(result.startPos2);    // Start position in seq2
 * ```
 *
 * @example
 * ```typescript
 * // Find conserved region in DNA sequences
 * const result = smithWaterman(
 *   'ACGTACGTTAGCTAGCT',
 *   'TAGCTA',
 *   {
 *     matrix: 'DNA_SIMPLE',
 *     gapOpen: -5,
 *     gapExtend: -2,
 *   }
 * );
 * ```
 *
 * @performance
 * **Complexity:**
 * - Time: O(m×n) where m, n are sequence lengths
 * - Space: O(m×n) for alignment matrix (~16 bytes per cell)
 *
 * @note For complete end-to-end alignment, use Needleman-Wunsch instead.
 * @note minScore parameter can dramatically reduce computation for large sequences.
 */
export function smithWaterman(
  seq1: string,
  seq2: string,
  options: LocalAlignmentOptions = {}
): AlignmentResult {
  return affineAlign(seq1, seq2, options, 'local');
}
