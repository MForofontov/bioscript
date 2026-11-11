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
import { getScore, getMatrix } from './matrices';
import { assertTwoSequences, assertNonEmptySequences, normalizeSequence } from '@bioscript/seq-utils';

/**
 * Perform space-efficient global alignment using Hirschberg's algorithm.
 *
 * Produces the same optimal score as Needleman-Wunsch under a linear gap model
 * (gap cost = gapOpen per gapped column). Affine gapExtend is ignored.
 *
 * @param seq1 - First sequence to align.
 * @param seq2 - Second sequence to align.
 * @param options - Alignment options (scoring matrix and gap penalties).
 * @returns Optimal global alignment with minimal memory usage.
 */
export function hirschberg(
  seq1: string,
  seq2: string,
  options: AlignmentOptions = {}
): AlignmentResult {
  assertTwoSequences(seq1, seq2);

  const s1 = normalizeSequence(seq1);
  const s2 = normalizeSequence(seq2);

  assertNonEmptySequences(s1, s2);

  // Match Needleman-Wunsch default gapOpen; linear gap model only.
  const { matrix = 'BLOSUM62', gapOpen = -10, normalize = false } = options;
  const gapPenalty = gapOpen;

  const scoringMatrix: ScoringMatrix =
    typeof matrix === 'string' ? getMatrix(matrix) : matrix;

  /**
   * Last row of Needleman-Wunsch scores (linear gaps) in O(n) space.
   * Callers reverse both strings for the backward pass; always iterate forward.
   */
  function nwScore(a: string, b: string): number[] {
    const m = a.length;
    const n = b.length;

    let prev = new Array(n + 1).fill(0);
    let curr = new Array(n + 1).fill(0);

    for (let j = 0; j <= n; j++) {
      prev[j] = j * gapPenalty;
    }

    for (let i = 1; i <= m; i++) {
      curr[0] = i * gapPenalty;
      for (let j = 1; j <= n; j++) {
        const matchScore = getScore(scoringMatrix, a[i - 1], b[j - 1]);
        curr[j] = Math.max(
          prev[j - 1] + matchScore,
          prev[j] + gapPenalty,
          curr[j - 1] + gapPenalty
        );
      }
      [prev, curr] = [curr, prev];
    }

    return prev;
  }

  function hirschbergRec(a: string, b: string): [string, string] {
    const m = a.length;
    const n = b.length;

    if (m === 0) {
      return ['-'.repeat(n), b];
    }

    if (n === 0) {
      return [a, '-'.repeat(m)];
    }

    if (m === 1 || n === 1) {
      return alignSmall(a, b);
    }

    const mid = Math.floor(m / 2);
    const aLeft = a.substring(0, mid);
    const aRight = a.substring(mid);

    const scoreL = nwScore(aLeft, b);

    // Backward scores: NW on reversed suffixes (forward DP only — do not also reverse-iterate)
    const aRightRev = aRight.split('').reverse().join('');
    const bRev = b.split('').reverse().join('');
    const scoreR = nwScore(aRightRev, bRev);

    let maxScore = -Infinity;
    let partition = 0;
    for (let j = 0; j <= n; j++) {
      const total = scoreL[j] + scoreR[n - j];
      if (total > maxScore) {
        maxScore = total;
        partition = j;
      }
    }

    const [left1, left2] = hirschbergRec(aLeft, b.substring(0, partition));
    const [right1, right2] = hirschbergRec(aRight, b.substring(partition));
    return [left1 + right1, left2 + right2];
  }

  /** Optimal alignment when one sequence has length 1 (or both short). */
  function alignSmall(a: string, b: string): [string, string] {
    if (a.length === 0) return ['-'.repeat(b.length), b];
    if (b.length === 0) return [a, '-'.repeat(a.length)];

    // Full NW for tiny cases (still O(m*n) with m or n == 1)
    const m = a.length;
    const n = b.length;
    const H: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    const ptr: Array<Array<'D' | 'U' | 'L' | 'N'>> = Array.from({ length: m + 1 }, () =>
      Array(n + 1).fill('N')
    );

    for (let i = 1; i <= m; i++) {
      H[i][0] = i * gapPenalty;
      ptr[i][0] = 'U';
    }
    for (let j = 1; j <= n; j++) {
      H[0][j] = j * gapPenalty;
      ptr[0][j] = 'L';
    }

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const diag = H[i - 1][j - 1] + getScore(scoringMatrix, a[i - 1], b[j - 1]);
        const up = H[i - 1][j] + gapPenalty;
        const left = H[i][j - 1] + gapPenalty;
        const best = Math.max(diag, up, left);
        H[i][j] = best;
        if (best === diag) ptr[i][j] = 'D';
        else if (best === up) ptr[i][j] = 'U';
        else ptr[i][j] = 'L';
      }
    }

    const out1: string[] = [];
    const out2: string[] = [];
    let i = m;
    let j = n;
    while (i > 0 || j > 0) {
      const p = ptr[i][j];
      if (p === 'D') {
        out1.push(a[i - 1]);
        out2.push(b[j - 1]);
        i--;
        j--;
      } else if (p === 'U') {
        out1.push(a[i - 1]);
        out2.push('-');
        i--;
      } else if (p === 'L') {
        out1.push('-');
        out2.push(b[j - 1]);
        j--;
      } else {
        break;
      }
    }

    return [out1.reverse().join(''), out2.reverse().join('')];
  }

  const [alignedSeq1, alignedSeq2] = hirschbergRec(s1, s2);

  let score = 0;
  let identity = 0;
  for (let i = 0; i < alignedSeq1.length; i++) {
    const c1 = alignedSeq1[i];
    const c2 = alignedSeq2[i];
    if (c1 === '-' || c2 === '-') {
      score += gapPenalty;
    } else {
      score += getScore(scoringMatrix, c1, c2);
      if (c1 === c2) identity++;
    }
  }

  const alignmentLength = alignedSeq1.length;
  const identityPercent = alignmentLength === 0 ? 0 : (identity / alignmentLength) * 100;
  const finalScore = normalize ? score / Math.max(alignedSeq1.length, alignedSeq2.length) : score;

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
