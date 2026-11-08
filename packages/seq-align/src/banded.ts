import { affineAlign } from './affine';
import type { AlignmentResult, AlignmentOptions } from './types';
/**
 * Banded alignment for closely related sequences.
 *
 * Banded alignment restricts the dynamic programming matrix to a diagonal band,
 * significantly reducing time and space complexity when sequences are expected
 * to be highly similar (>90% identity).
 *
 * Instead of O(m×n), complexity is O(k×min(m,n)) where k is the bandwidth.
 * Typical k values: 10-100 for sequences with expected small indels.
 *
 * @module banded
 */

/**
 * Options for banded alignment.
 */
export interface BandedAlignmentOptions extends AlignmentOptions {
  /**
   * Half-width of the diagonal band (default: 10).
   * The algorithm will explore cells within ±k positions of the main diagonal.
   *
   * - k=5: Very restrictive, for nearly identical sequences
   * - k=10: Default, good for >95% identity
   * - k=50: More permissive, for ~90% identity
   * - k=100: Relaxed, approaching full matrix
   */
  bandwidth?: number;
}

/**
 * Perform banded alignment on two closely related sequences.
 *
 * Banded alignment is an optimization of Needleman-Wunsch that restricts
 * the dynamic programming computation to a diagonal band of width 2k+1.
 * This dramatically reduces both time and memory when sequences are expected
 * to be highly similar.
 *
 * **When to use:**
 * - Sequences are >90% identical
 * - Small indels expected (< bandwidth)
 * - Need to align many similar sequences quickly
 * - Memory is limited
 *
 * **When NOT to use:**
 * - Sequences have large indels
 * - Sequences are distantly related
 * - Need to find optimal alignment regardless of divergence
 *
 * @param seq1 - First sequence to align.
 * @param seq2 - Second sequence to align.
 * @param options - Alignment options including bandwidth.
 * @returns The optimal alignment restricted to paths within the requested band.
 *
 * @throws {TypeError} If sequences are not strings.
 * @throws {Error} If sequences contain invalid characters.
 * @throws {Error} If the sequence length difference exceeds the bandwidth.
 *
 * @example
 * ```typescript
 * // Aligning nearly identical sequences
 * const seq1 = 'ACGTACGTACGTACGT';
 * const seq2 = 'ACGTACGTCGTACGT';  // 1 deletion
 *
 * const result = bandedAlign(seq1, seq2, {
 *   matrix: 'DNA_SIMPLE',
 *   bandwidth: 10,  // Allow ±10 positions from diagonal
 * });
 *
 * console.log(result.alignedSeq1); // 'ACGTACGT-CGTACGT'
 * console.log(result.alignedSeq2); // 'ACGTACGTCGTACGT'
 * ```
 *
 * @example
 * ```typescript
 * // Protein alignment with small bandwidth
 * const result = bandedAlign('HEAGAWGHEE', 'HEAGAWGHEE', {
 *   matrix: 'BLOSUM62',
 *   bandwidth: 5,  // Very restrictive
 *   gapOpen: -10,
 *   gapExtend: -1,
 * });
 * ```
 *
 * @performance
 * **Complexity:**
 * - Time: O(k×min(m,n)) where k=bandwidth
 * - Space: O(k×min(m,n))
 *
 * @note Cannot certify whether the unrestricted optimum lies inside the band.
 * Use a full algorithm when that guarantee is required.
 */
export function bandedAlign(
  seq1: string,
  seq2: string,
  options: BandedAlignmentOptions = {}
): AlignmentResult {
  return affineAlign(seq1, seq2, options, 'global', options.bandwidth ?? 10);
}
