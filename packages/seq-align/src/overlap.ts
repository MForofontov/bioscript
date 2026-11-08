import { affineAlign } from './affine';
import type { AlignmentResult, AlignmentOptions } from './types';
/**
 * Overlap alignment for sequence assembly.
 *
 * Overlap alignment finds the best overlap between the end of one sequence
 * and the beginning of another. Unlike semi-global alignment (which allows
 * free gaps at both ends of both sequences), overlap alignment only allows:
 * - Free gaps at the end of seq1
 * - Free gaps at the beginning of seq2
 *
 * This is ideal for assembling reads, contigs, or finding suffix-prefix overlaps.
 *
 * @module overlap
 */

/**
 * Perform overlap alignment on two sequences.
 *
 * Overlap alignment finds the best overlap between sequences, where:
 * - The end (suffix) of seq1 overlaps with the beginning (prefix) of seq2
 * - No penalty for gaps at: end of seq1, beginning of seq2
 * - Penalties apply for: beginning of seq1, end of seq2
 *
 * **Use cases:**
 * - DNA sequencing read assembly
 * - Contig assembly in genome projects
 * - Finding suffix-prefix overlaps in string matching
 * - Merging overlapping fragments
 *
 * **Comparison to other alignments:**
 * - Global (Needleman-Wunsch): Penalizes all gaps
 * - Local (Smith-Waterman): Finds best local match anywhere
 * - Semi-global: Free end gaps on both sequences
 * - Overlap: Free end gaps asymmetrically (suffix of seq1, prefix of seq2)
 *
 * @param seq1 - First sequence (the one whose suffix will overlap).
 * @param seq2 - Second sequence (the one whose prefix will overlap).
 * @param options - Alignment options (scoring matrix and gap penalties).
 * @returns Alignment result showing the overlap region.
 *
 * @throws {TypeError} If sequences are not strings.
 * @throws {Error} If sequences contain invalid characters.
 *
 * @example
 * ```typescript
 * // Assembling DNA reads
 * const read1 = 'ACGTACGTACGT';
 * const read2 = 'ACGTACGTGGGG';  // Overlaps with end of read1
 *
 * const result = overlapAlign(read1, read2, { matrix: 'DNA_SIMPLE' });
 * console.log(result.alignedSeq1); // 'ACGTACGTACGT'
 * console.log(result.alignedSeq2); // '----ACGTACGT' (dashes show free start)
 * console.log(result.score); // High score for overlap region
 * ```
 *
 * @example
 * ```typescript
 * // Merging protein fragments
 * const frag1 = 'HEAGAWGHEE';
 * const frag2 = 'GHEEHEAAE';  // 'GHEE' overlaps with end of frag1
 *
 * const result = overlapAlign(frag1, frag2, {
 *   matrix: 'BLOSUM62',
 *   gapOpen: -10,
 *   gapExtend: -1,
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Finding best overlap for assembly
 * const contigs = ['ACGTACGT', 'CGTACGTGG', 'ACGTGGAA'];
 * const overlaps = [];
 *
 * for (let i = 0; i < contigs.length; i++) {
 *   for (let j = 0; j < contigs.length; j++) {
 *     if (i !== j) {
 *       const result = overlapAlign(contigs[i], contigs[j], {
 *         matrix: 'DNA_SIMPLE',
 *       });
 *       overlaps.push({ i, j, score: result.score, result });
 *     }
 *   }
 * }
 *
 * // Sort by score to find best overlaps
 * overlaps.sort((a, b) => b.score - a.score);
 * ```
 *
 * @performance O(m×n) time and space complexity where m, n are sequence lengths.
 * Uses affine gap penalties.
 */
export function overlapAlign(
  seq1: string,
  seq2: string,
  options: AlignmentOptions = {}
): AlignmentResult {
  return affineAlign(seq1, seq2, options, 'overlap');
}
