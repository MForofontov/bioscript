/**
 * Overlap alignment for sequence assembly.
 *
 * Finds the best suffix–prefix overlap: the end of seq1 with the start of seq2.
 * Free (unpenalized) end gaps:
 * - Unmatched prefix of seq1 (before the overlap)
 * - Unmatched suffix of seq2 (after the overlap)
 *
 * @module overlap
 */

import type { AlignmentResult, AlignmentOptions, AlignmentCell, ScoringMatrix } from './types';
import { Direction } from './types';
import { getScore, getMatrix } from './matrices';
import { assertTwoSequences, assertNonEmptySequences, normalizeSequence } from '@bioscript/seq-utils';

/**
 * Perform overlap alignment on two sequences (suffix of seq1 ↔ prefix of seq2).
 */
export function overlapAlign(
  seq1: string,
  seq2: string,
  options: AlignmentOptions = {}
): AlignmentResult {
  assertTwoSequences(seq1, seq2);

  const s1 = normalizeSequence(seq1);
  const s2 = normalizeSequence(seq2);

  assertNonEmptySequences(s1, s2);

  const { matrix = 'BLOSUM62', gapOpen = -10, gapExtend = -1, normalize = false } = options;
  const scoringMatrix: ScoringMatrix =
    typeof matrix === 'string' ? getMatrix(matrix) : matrix;

  const m = s1.length;
  const n = s2.length;

  const H: AlignmentCell[][] = Array(m + 1)
    .fill(null)
    .map(() =>
      Array(n + 1)
        .fill(null)
        .map(() => ({ score: 0, direction: Direction.NONE }))
    );

  const E: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(-Infinity));
  const F: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(-Infinity));

  // Free unmatched prefix of seq1 (column 0)
  for (let i = 0; i <= m; i++) {
    H[i][0].score = 0;
    H[i][0].direction = Direction.NONE;
  }

  // Penalize unmatched prefix of seq2 (row 0)
  for (let j = 1; j <= n; j++) {
    H[0][j].score = gapOpen + (j - 1) * gapExtend;
    H[0][j].direction = Direction.LEFT;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const matchScore = getScore(scoringMatrix, s1[i - 1], s2[j - 1]);

      E[i][j] = Math.max(H[i - 1][j].score + gapOpen, E[i - 1][j] + gapExtend);
      F[i][j] = Math.max(H[i][j - 1].score + gapOpen, F[i][j - 1] + gapExtend);

      const scores = [
        H[i - 1][j - 1].score + matchScore,
        E[i][j],
        F[i][j],
      ];

      H[i][j].score = Math.max(...scores);
      if (H[i][j].score === scores[0]) H[i][j].direction = Direction.DIAGONAL;
      else if (H[i][j].score === scores[1]) H[i][j].direction = Direction.UP;
      else H[i][j].direction = Direction.LEFT;
    }
  }

  // Free unmatched suffix of seq2: best score on last row
  let maxScore = -Infinity;
  let maxJ = 0;
  for (let j = 0; j <= n; j++) {
    if (H[m][j].score > maxScore) {
      maxScore = H[m][j].score;
      maxJ = j;
    }
  }

  const aligned1: string[] = [];
  const aligned2: string[] = [];
  let i = m;
  let j = maxJ;

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
      break;
    }
  }

  // Free unmatched prefix of seq1
  while (i > 0) {
    aligned1.unshift(s1[i - 1]);
    aligned2.unshift('-');
    i--;
  }

  // Free unmatched suffix of seq2
  for (let k = maxJ; k < n; k++) {
    aligned1.push('-');
    aligned2.push(s2[k]);
  }

  const alignedSeq1 = aligned1.join('');
  const alignedSeq2 = aligned2.join('');

  let identity = 0;
  for (let k = 0; k < alignedSeq1.length; k++) {
    if (alignedSeq1[k] === alignedSeq2[k] && alignedSeq1[k] !== '-') identity++;
  }

  const alignmentLength = alignedSeq1.length;
  const identityPercent = alignmentLength === 0 ? 0 : (identity / alignmentLength) * 100;
  const finalScore = normalize ? maxScore / Math.max(m, n) : maxScore;

  return {
    alignedSeq1,
    alignedSeq2,
    score: finalScore,
    startPos1: 0,
    startPos2: 0,
    endPos1: m,
    endPos2: maxJ,
    identity,
    identityPercent,
    alignmentLength,
  };
}
