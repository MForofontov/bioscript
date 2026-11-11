/**
 * Shared Gotoh affine-gap dynamic programming utilities.
 * @module gotoh
 */

import type { ScoringMatrix } from './types';
import { getScore } from './matrices';

/** Gotoh DP matrices (H = best score, E = gap in seq2, F = gap in seq1). */
export interface GotohMatrices {
  H: number[][];
  E: number[][];
  F: number[][];
}

/** Traceback state for affine-gap alignment. */
export enum TraceState {
  H = 0,
  E = 1,
  F = 2,
}

/**
 * Allocate Gotoh DP matrices for sequences of lengths m and n.
 */
export function createGotohMatrices(m: number, n: number): GotohMatrices {
  return {
    H: Array.from({ length: m + 1 }, () => Array(n + 1).fill(0)),
    E: Array.from({ length: m + 1 }, () => Array(n + 1).fill(-Infinity)),
    F: Array.from({ length: m + 1 }, () => Array(n + 1).fill(-Infinity)),
  };
}

/**
 * Fill one Gotoh DP cell (i, j) for interior positions.
 */
export function fillGotohCell(
  H: number[][],
  E: number[][],
  F: number[][],
  i: number,
  j: number,
  gapOpen: number,
  gapExtend: number,
  matchScore: number
): void {
  E[i][j] = Math.max(H[i - 1][j] + gapOpen, E[i - 1][j] + gapExtend);
  F[i][j] = Math.max(H[i][j - 1] + gapOpen, F[i][j - 1] + gapExtend);

  const scores = [H[i - 1][j - 1] + matchScore, E[i][j], F[i][j]];
  H[i][j] = Math.max(...scores);
}

/**
 * Initialize first row/column of Gotoh matrices for global alignment.
 */
export function initGotohGlobalBorders(
  H: number[][],
  E: number[][],
  F: number[][],
  m: number,
  n: number,
  gapOpen: number,
  gapExtend: number
): void {
  H[0][0] = 0;

  for (let i = 1; i <= m; i++) {
    E[i][0] = Math.max(H[i - 1][0] + gapOpen, E[i - 1][0] + gapExtend);
    H[i][0] = E[i][0];
  }

  for (let j = 1; j <= n; j++) {
    F[0][j] = Math.max(H[0][j - 1] + gapOpen, F[0][j - 1] + gapExtend);
    H[0][j] = F[0][j];
  }
}

/**
 * Traceback through Gotoh matrices using H/E/F state machine.
 */
export function gotohTraceback(
  H: number[][],
  E: number[][],
  F: number[][],
  s1: string,
  s2: string,
  endI: number,
  endJ: number,
  scoringMatrix: ScoringMatrix,
  gapOpen: number,
  gapExtend: number,
  options: {
    stopWhenZero?: boolean;
    stopI?: number;
    stopJ?: number;
  } = {}
): { aligned1: string[]; aligned2: string[]; startI: number; startJ: number } {
  const aligned1: string[] = [];
  const aligned2: string[] = [];
  let i = endI;
  let j = endJ;

  let state = TraceState.H;
  if (i > 0 && j > 0 && H[i][j] === E[i][j] && H[i][j] > H[i - 1][j - 1] + getScore(scoringMatrix, s1[i - 1], s2[j - 1])) {
    state = TraceState.E;
  } else if (i > 0 && j > 0 && H[i][j] === F[i][j] && H[i][j] > H[i - 1][j - 1] + getScore(scoringMatrix, s1[i - 1], s2[j - 1])) {
    state = TraceState.F;
  } else if (i > 0 && j === 0 && H[i][j] === E[i][j]) {
    state = TraceState.E;
  } else if (j > 0 && i === 0 && H[i][j] === F[i][j]) {
    state = TraceState.F;
  }

  while (i > (options.stopI ?? 0) || j > (options.stopJ ?? 0)) {
    if (options.stopWhenZero && H[i][j] === 0) {
      break;
    }

    if (state === TraceState.E) {
      if (i <= 0) break;
      aligned1.unshift(s1[i - 1]);
      aligned2.unshift('-');
      if (i > 0 && E[i][j] === E[i - 1][j] + gapExtend) {
        i--;
        state = TraceState.E;
      } else {
        i--;
        state = TraceState.H;
      }
      continue;
    }

    if (state === TraceState.F) {
      if (j <= 0) break;
      aligned1.unshift('-');
      aligned2.unshift(s2[j - 1]);
      if (j > 0 && F[i][j] === F[i][j - 1] + gapExtend) {
        j--;
        state = TraceState.F;
      } else {
        j--;
        state = TraceState.H;
      }
      continue;
    }

    // TraceState.H
    if (
      i > 0 &&
      j > 0 &&
      H[i][j] === H[i - 1][j - 1] + getScore(scoringMatrix, s1[i - 1], s2[j - 1])
    ) {
      aligned1.unshift(s1[i - 1]);
      aligned2.unshift(s2[j - 1]);
      i--;
      j--;
    } else if (i > 0 && H[i][j] === E[i][j]) {
      state = TraceState.E;
    } else if (j > 0 && H[i][j] === F[i][j]) {
      state = TraceState.F;
    } else {
      break;
    }
  }

  return { aligned1, aligned2, startI: i, startJ: j };
}

/**
 * Score an alignment string pair using affine gap penalties.
 */
export function scoreAlignmentPair(
  aligned1: string,
  aligned2: string,
  scoringMatrix: ScoringMatrix,
  gapOpen: number,
  gapExtend: number
): number {
  let score = 0;
  let i = 0;

  while (i < aligned1.length) {
    const c1 = aligned1[i];
    const c2 = aligned2[i];

    if (c1 !== '-' && c2 !== '-') {
      score += getScore(scoringMatrix, c1, c2);
      i++;
      continue;
    }

    if (c1 === '-') {
      let gapLen = 0;
      while (i < aligned1.length && aligned1[i] === '-') {
        gapLen++;
        i++;
      }
      score += gapOpen + (gapLen - 1) * gapExtend;
    } else {
      let gapLen = 0;
      while (i < aligned2.length && aligned2[i] === '-') {
        gapLen++;
        i++;
      }
      score += gapOpen + (gapLen - 1) * gapExtend;
    }
  }

  return score;
}
