/**
 * Hirschberg's algorithm for space-efficient sequence alignment.
 *
 * Hirschberg's algorithm computes optimal global alignment using only O(min(m,n))
 * space instead of O(m×n), while maintaining O(m×n) time complexity. This is
 * crucial for aligning very long sequences where memory is limited.
 *
 * The algorithm uses a divide-and-conquer approach:
 * 1. Divide: Find the midpoint using forward and backward DP
 * 2. Conquer: Recursively align left and right halves
 * 3. Combine: Concatenate the results
 *
 * @module hirschberg
 */

import type { AlignmentResult, AlignmentOptions, ScoringMatrix } from './types';
import { getScore } from './matrices';
import { assertTwoSequences, assertNonEmptySequences, normalizeSequence } from '@bioscript/seq-utils';

/**
 * Perform space-efficient global alignment using Hirschberg's algorithm.
 *
 * Hirschberg's algorithm produces the same optimal global alignment as
 * Needleman-Wunsch but uses only O(min(m,n)) space. This makes it possible
 * to align sequences that are too large for standard algorithms.
 *
 * **Key advantages:**
 * - Memory: O(min(m,n)) instead of O(m×n)
 * - Time: O(m×n) same as Needleman-Wunsch
 * - Optimality: Guaranteed to find optimal alignment
 *
 * **Trade-offs:**
 * - Slightly slower than Needleman-Wunsch (2x in practice)
 * - More complex implementation
 * - Recursive approach (deep call stack for very long sequences)
 *
 * **When to use:**
 * - Sequences are very long (>100kb)
 * - Memory is limited
 * - Need optimal global alignment (not local)
 * - Willing to trade some speed for memory
 *
 * @param seq1 - First sequence to align.
 * @param seq2 - Second sequence to align.
 * @param options - Alignment options (scoring matrix and gap penalties).
 * @returns Optimal global alignment with minimal memory usage.
 *
 * @throws {TypeError} If sequences are not strings.
 * @throws {Error} If sequences contain invalid characters.
 *
 * @example
 * ```typescript
 * // Aligning long DNA sequences
 * const longSeq1 = 'ACGT'.repeat(50000); // 200kb sequence
 * const longSeq2 = 'ACGT'.repeat(50000);
 *
 * // Hirschberg uses ~400kb memory instead of 40GB!
 * const result = hirschberg(longSeq1, longSeq2, {
 *   matrix: 'DNA_SIMPLE',
 *   gapOpen: -5,
 *   gapExtend: -1,
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Protein alignment with limited memory
 * const result = hirschberg('HEAGAWGHEE', 'PAWHEAE', {
 *   matrix: 'BLOSUM62',
 *   gapOpen: -10,
 *   gapExtend: -1,
 * });
 *
 * // Result is identical to Needleman-Wunsch
 * console.log(result.alignedSeq1);
 * console.log(result.alignedSeq2);
 * ```
 *
 * @performance
 * - Time: O(m×n)
 * - Space: O(min(m,n))
 * - Practical speed: ~2x slower than Needleman-Wunsch
 * - Memory savings: Up to 1000x for long sequences
 *
 * @note Does not support affine gap penalties in the current implementation.
 * Uses simple linear gap penalty model for space efficiency.
 */
export function hirschberg(
  seq1: string,
  seq2: string,
  options: AlignmentOptions = {}
): AlignmentResult {
  // Input validation
  assertTwoSequences(seq1, seq2);

  const s1 = normalizeSequence(seq1);
  const s2 = normalizeSequence(seq2);

  assertNonEmptySequences(s1, s2);

  // Get options (using simple gap penalty for space efficiency)
  const { matrix = 'BLOSUM62', gapOpen = -1, normalize = false } = options;
  const gapPenalty = gapOpen;

  // Get scoring matrix
  let scoringMatrix: ScoringMatrix;
  if (typeof matrix === 'string') {
    const { getMatrix } = require('./matrices');
    scoringMatrix = getMatrix(matrix);
  } else {
    scoringMatrix = matrix;
  }

  /**
   * Compute last row of Needleman-Wunsch scores using O(n) space.
   */
  function nwScore(seq1: string, seq2: string, reverse: boolean = false): number[] {
    const m = seq1.length;
    const n = seq2.length;

    let prev = new Array(n + 1).fill(0);
    let curr = new Array(n + 1).fill(0);

    // Initialize first row
    for (let j = 0; j <= n; j++) {
      prev[j] = j * gapPenalty;
    }

    // Fill matrix row by row
    const iStart = reverse ? m - 1 : 0;
    const iEnd = reverse ? -1 : m;
    const iStep = reverse ? -1 : 1;

    let i = iStart;
    let rowNum = 1;

    while (reverse ? i > iEnd : i < iEnd) {
      curr[0] = rowNum * gapPenalty;

      for (let j = 1; j <= n; j++) {
        // seq2 is already reversed when reverse=true, so just use j-1
        const jIdx = j - 1;
        const matchScore = getScore(scoringMatrix, seq1[i], seq2[jIdx]);

        const scores = [
          prev[j - 1] + matchScore, // Match/mismatch
          prev[j] + gapPenalty, // Gap in seq2
          curr[j - 1] + gapPenalty, // Gap in seq1
        ];

        curr[j] = Math.max(...scores);
      }

      [prev, curr] = [curr, prev];
      i += iStep;
      rowNum++;
    }

    return prev;
  }

  /**
   * Recursive Hirschberg alignment.
   */
  function hirschbergRec(seq1: string, seq2: string): [string, string] {
    const m = seq1.length;
    const n = seq2.length;

    // Base cases
    if (m === 0) {
      return ['-'.repeat(n), seq2];
    }

    if (n === 0) {
      return [seq1, '-'.repeat(m)];
    }

    if (m === 1) {
      // Align single character of seq1 to seq2
      let bestJ = 0;
      let bestScore = gapPenalty + n * gapPenalty;

      for (let j = 0; j < n; j++) {
        const score =
          j * gapPenalty + getScore(scoringMatrix, seq1[0], seq2[j]) + (n - j - 1) * gapPenalty;

        if (score > bestScore) {
          bestScore = score;
          bestJ = j;
        }
      }

      const aligned1 = '-'.repeat(bestJ) + seq1[0] + '-'.repeat(n - bestJ - 1);
      const aligned2 = seq2;

      return [aligned1, aligned2];
    }

    // Divide: find midpoint
    const mid = Math.floor(m / 2);

    const seq1Left = seq1.substring(0, mid);
    const seq1Right = seq1.substring(mid);

    // Forward scores from top-left
    const scoreL = nwScore(seq1Left, seq2, false);

    // Backward scores from bottom-right (reverse both sequences)
    const seq1RightRev = seq1Right.split('').reverse().join('');
    const seq2Rev = seq2.split('').reverse().join('');
    const scoreR = nwScore(seq1RightRev, seq2Rev, true);

    // Find partition point that maximizes total score
    let maxScore = -Infinity;
    let partition = 0;

    for (let j = 0; j <= n; j++) {
      const totalScore = scoreL[j] + scoreR[n - j];
      if (totalScore > maxScore) {
        maxScore = totalScore;
        partition = j;
      }
    }

    // Conquer: recursively align left and right halves
    const seq2Left = seq2.substring(0, partition);
    const seq2Right = seq2.substring(partition);

    const [left1, left2] = hirschbergRec(seq1Left, seq2Left);
    const [right1, right2] = hirschbergRec(seq1Right, seq2Right);

    // Combine
    return [left1 + right1, left2 + right2];
  }

  // Perform alignment
  const [alignedSeq1, alignedSeq2] = hirschbergRec(s1, s2);

  // Calculate score
  let score = 0;
  for (let i = 0; i < alignedSeq1.length; i++) {
    const c1 = alignedSeq1[i];
    const c2 = alignedSeq2[i];

    if (c1 === '-' || c2 === '-') {
      score += gapPenalty;
    } else {
      score += getScore(scoringMatrix, c1, c2);
    }
  }

  // Calculate statistics
  let identity = 0;

  for (let i = 0; i < alignedSeq1.length; i++) {
    const c1 = alignedSeq1[i];
    const c2 = alignedSeq2[i];

    if (c1 === c2 && c1 !== '-') {
      identity++;
    }
  }

  const alignmentLength = alignedSeq1.length;
  const identityPercent = (identity / alignmentLength) * 100;

  let finalScore = score;
  if (normalize) {
    const maxLength = Math.max(alignedSeq1.length, alignedSeq2.length);
    finalScore = score / maxLength;
  }

  return {
    alignedSeq1,
    alignedSeq2,
    score: finalScore,
    startPos1: 0,
    startPos2: 0,
    endPos1: s1.length,
    endPos2: s2.length,
    identity,
    identityPercent,
    alignmentLength,
  };
}
