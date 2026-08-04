/**
 * Smith-Waterman local sequence alignment algorithm.
 *
 * Performs optimal local alignment of two sequences using dynamic programming.
 * Finds the best matching subsequence regions, ignoring mismatched ends.
 *
 * @module smith-waterman
 */

import type { AlignmentResult, LocalAlignmentOptions, ScoringMatrix } from './types';
import { getMatrix, getScore } from './matrices';
import { createGotohMatrices, gotohTraceback } from './gotoh';
import { assertTwoSequences, assertNonEmptySequences, normalizeSequence } from '@bioscript/seq-utils';

/**
 * Performs local sequence alignment using the Smith-Waterman algorithm.
 */
export function smithWaterman(
  seq1: string,
  seq2: string,
  options: LocalAlignmentOptions = {}
): AlignmentResult {
  assertTwoSequences(seq1, seq2);

  const {
    matrix = 'BLOSUM62',
    gapOpen = -10,
    gapExtend = -1,
    normalize = true,
    minScore = 0,
  } = options;

  if (gapOpen > 0) {
    throw new Error(`gapOpen must be ≤ 0, got ${gapOpen}`);
  }

  if (gapExtend > 0) {
    throw new Error(`gapExtend must be ≤ 0, got ${gapExtend}`);
  }

  const s1 = normalize ? normalizeSequence(seq1) : seq1;
  const s2 = normalize ? normalizeSequence(seq2) : seq2;

  assertNonEmptySequences(s1, s2);

  const scoringMatrix: ScoringMatrix = typeof matrix === 'string' ? getMatrix(matrix) : matrix;

  const m = s1.length;
  const n = s2.length;
  const { H, E, F } = createGotohMatrices(m, n);

  let maxScore = 0;
  let maxI = 0;
  let maxJ = 0;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const matchScore = getScore(scoringMatrix, s1[i - 1], s2[j - 1]);

      E[i][j] = Math.max(H[i - 1][j] + gapOpen, E[i - 1][j] + gapExtend);
      F[i][j] = Math.max(H[i][j - 1] + gapOpen, F[i][j - 1] + gapExtend);

      H[i][j] = Math.max(0, H[i - 1][j - 1] + matchScore, E[i][j], F[i][j]);

      if (H[i][j] > maxScore) {
        maxScore = H[i][j];
        maxI = i;
        maxJ = j;
      }
    }
  }

  if (maxScore < minScore) {
    return {
      alignedSeq1: '',
      alignedSeq2: '',
      score: 0,
      startPos1: 0,
      startPos2: 0,
      endPos1: 0,
      endPos2: 0,
      identity: 0,
      identityPercent: 0,
      alignmentLength: 0,
    };
  }

  const { aligned1, aligned2, startI, startJ } = gotohTraceback(
    H,
    E,
    F,
    s1,
    s2,
    maxI,
    maxJ,
    scoringMatrix,
    gapOpen,
    gapExtend,
    { stopWhenZero: true }
  );

  const alignedSeq1 = aligned1.join('');
  const alignedSeq2 = aligned2.join('');

  let identity = 0;
  for (let k = 0; k < aligned1.length; k++) {
    if (aligned1[k] === aligned2[k] && aligned1[k] !== '-') {
      identity++;
    }
  }

  const alignmentLength = aligned1.length;
  const identityPercent = alignmentLength > 0 ? (identity / alignmentLength) * 100 : 0;

  return {
    alignedSeq1,
    alignedSeq2,
    score: maxScore,
    startPos1: startI,
    startPos2: startJ,
    endPos1: maxI,
    endPos2: maxJ,
    identity,
    identityPercent,
    alignmentLength,
  };
}
