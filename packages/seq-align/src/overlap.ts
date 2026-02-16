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

import type { AlignmentResult, AlignmentOptions, AlignmentCell, ScoringMatrix } from './types';
import { Direction } from './types';
import { getScore } from './matrices';

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
  // Input validation
  if (typeof seq1 !== 'string') {
    throw new TypeError(`seq1 must be a string, got ${typeof seq1}`);
  }

  if (typeof seq2 !== 'string') {
    throw new TypeError(`seq2 must be a string, got ${typeof seq2}`);
  }

  const s1 = seq1.trim().toUpperCase();
  const s2 = seq2.trim().toUpperCase();

  if (s1.length === 0 || s2.length === 0) {
    throw new Error('sequences cannot be empty');
  }

  // Get options
  const { matrix = 'BLOSUM62', gapOpen = -10, gapExtend = -1, normalize = false } = options;

  // Get scoring matrix
  let scoringMatrix: ScoringMatrix;
  if (typeof matrix === 'string') {
    const { getMatrix } = require('./matrices');
    scoringMatrix = getMatrix(matrix);
  } else {
    scoringMatrix = matrix;
  }

  const m = s1.length;
  const n = s2.length;

  // Initialize DP matrices
  const H: AlignmentCell[][] = Array(m + 1)
    .fill(null)
    .map(() =>
      Array(n + 1)
        .fill(null)
        .map(() => ({ score: 0, direction: Direction.NONE }))
    );

  // Gap matrices for affine gap penalties
  const E: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(-Infinity));
  const F: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(-Infinity));

  // Initialize first row: free gaps at start of seq2 (prefix)
  for (let j = 0; j <= n; j++) {
    H[0][j].score = 0;
    H[0][j].direction = Direction.NONE;
  }

  // Initialize first column: penalize gaps at start of seq1
  for (let i = 1; i <= m; i++) {
    H[i][0].score = gapOpen + (i - 1) * gapExtend;
    H[i][0].direction = Direction.UP;
  }

  // Fill matrices
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const matchScore = getScore(scoringMatrix, s1[i - 1], s2[j - 1]);

      // E: gap in seq2 (vertical)
      E[i][j] = Math.max(
        H[i - 1][j].score + gapOpen, // Open new gap
        E[i - 1][j] + gapExtend // Extend existing gap
      );

      // F: gap in seq1 (horizontal)
      F[i][j] = Math.max(
        H[i][j - 1].score + gapOpen, // Open new gap
        F[i][j - 1] + gapExtend // Extend existing gap
      );

      // H: best alignment
      const scores = [
        H[i - 1][j - 1].score + matchScore, // Match/mismatch (diagonal)
        E[i][j], // Gap in seq2 (vertical)
        F[i][j], // Gap in seq1 (horizontal)
      ];

      H[i][j].score = Math.max(...scores);

      // Set direction
      if (H[i][j].score === scores[0]) {
        H[i][j].direction = Direction.DIAGONAL;
      } else if (H[i][j].score === scores[1]) {
        H[i][j].direction = Direction.UP;
      } else {
        H[i][j].direction = Direction.LEFT;
      }
    }
  }

  // Find best score in last row (free gaps at end of seq1)
  let maxScore = -Infinity;
  let maxI = m;

  for (let i = 0; i <= m; i++) {
    if (H[i][n].score > maxScore) {
      maxScore = H[i][n].score;
      maxI = i;
    }
  }

  // Traceback from (maxI, n)
  const aligned1: string[] = [];
  const aligned2: string[] = [];
  let i = maxI;
  let j = n;

  // Add trailing part of seq1 if any (free gaps at end)
  while (i < m) {
    aligned1.push(s1[i]);
    aligned2.push('-');
    i++;
  }

  // Reset to maxI for main traceback
  i = maxI;

  while (i > 0 || j > 0) {
    const current = H[i][j];

    if (current.direction === Direction.DIAGONAL && i > 0 && j > 0) {
      aligned1.unshift(s1[i - 1]);
      aligned2.unshift(s2[j - 1]);
      i--;
      j--;
    } else if (current.direction === Direction.UP && i > 0) {
      aligned1.unshift(s1[i - 1]);
      aligned2.unshift('-');
      i--;
    } else if (current.direction === Direction.LEFT && j > 0) {
      aligned1.unshift('-');
      aligned2.unshift(s2[j - 1]);
      j--;
    } else {
      // Reached a boundary
      break;
    }
  }

  // Add any remaining prefix of seq2 (free gaps at start of seq2)
  while (j > 0) {
    aligned1.unshift('-');
    aligned2.unshift(s2[j - 1]);
    j--;
  }

  const alignedSeq1 = aligned1.join('');
  const alignedSeq2 = aligned2.join('');

  // Calculate statistics
  let identity = 0;

  for (let k = 0; k < alignedSeq1.length; k++) {
    const c1 = alignedSeq1[k];
    const c2 = alignedSeq2[k];

    if (c1 === c2 && c1 !== '-') {
      identity++;
    }
  }

  const alignmentLength = alignedSeq1.length;
  const identityPercent = (identity / alignmentLength) * 100;

  let finalScore = maxScore;
  if (normalize) {
    const maxLength = Math.max(alignedSeq1.length, alignedSeq2.length);
    finalScore = maxScore / maxLength;
  }

  return {
    alignedSeq1,
    alignedSeq2,
    score: finalScore,
    startPos1: 0,
    startPos2: Math.max(0, j),
    endPos1: maxI,
    endPos2: n,
    identity,
    identityPercent,
    alignmentLength,
  };
}
