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

import type { AlignmentResult, AlignmentOptions, ScoringMatrix } from './types';
import { getMatrix, getScore } from './matrices';
import {
  createGotohMatrices,
  fillGotohCell,
  gotohTraceback,
  initGotohGlobalBorders,
} from './gotoh';
import { assertTwoSequences, assertNonEmptySequences, normalizeSequence } from '@bioscript/seq-utils';

/**
 * Performs global sequence alignment using the Needleman-Wunsch algorithm.
 */
export function needlemanWunsch(
  seq1: string,
  seq2: string,
  options: AlignmentOptions = {}
): AlignmentResult {
  assertTwoSequences(seq1, seq2);

  const { matrix = 'BLOSUM62', gapOpen = -10, gapExtend = -1, normalize = true } = options;

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

  initGotohGlobalBorders(H, E, F, m, n, gapOpen, gapExtend);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const matchScore = getScore(scoringMatrix, s1[i - 1], s2[j - 1]);
      fillGotohCell(H, E, F, i, j, gapOpen, gapExtend, matchScore);
    }
  }

  const { aligned1, aligned2 } = gotohTraceback(
    H,
    E,
    F,
    s1,
    s2,
    m,
    n,
    scoringMatrix,
    gapOpen,
    gapExtend
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
    score: H[m][n],
    startPos1: 0,
    startPos2: 0,
    endPos1: m,
    endPos2: n,
    identity,
    identityPercent,
    alignmentLength,
  };
}
