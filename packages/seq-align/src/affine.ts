import type { AlignmentOptions, AlignmentResult, LocalAlignmentOptions } from './types';
import { getMatrix, getScore } from './matrices';

type Mode = 'global' | 'local' | 'semi' | 'overlap';
interface Row {
  start: number;
  scores: Float64Array[];
  previous: Uint8Array[];
}
const END = 3;

export function validatePenalties(options: AlignmentOptions): void {
  for (const name of ['gapOpen', 'gapExtend'] as const) {
    const value = options[name];
    if (value !== undefined && (!Number.isFinite(value) || value > 0)) {
      throw new Error(`${name} must be ≤ 0 and finite, got ${value}`);
    }
  }
}

/** Three independent states are required both for affine scores and traceback. */
export function affineAlign(
  a: string,
  b: string,
  options: LocalAlignmentOptions,
  mode: Mode,
  bandwidth?: number
): AlignmentResult {
  if (typeof a !== 'string') throw new TypeError(`seq1 must be a string, got ${typeof a}`);
  if (typeof b !== 'string') throw new TypeError(`seq2 must be a string, got ${typeof b}`);
  validatePenalties(options);
  if (options.minScore !== undefined && !Number.isFinite(options.minScore))
    throw new Error('minScore must be finite');
  const normalizeCase =
    bandwidth !== undefined ||
    (mode !== 'global' && mode !== 'local') ||
    options.normalize !== false;
  const s1 = normalizeCase ? a.trim().toUpperCase() : a;
  const s2 = normalizeCase ? b.trim().toUpperCase() : b;
  if (!s1.length || !s2.length)
    throw new Error('sequences cannot be empty or contain only whitespace');
  const m = s1.length;
  const n = s2.length;
  if (bandwidth !== undefined && (!Number.isSafeInteger(bandwidth) || bandwidth < 0))
    throw new Error('bandwidth must be a non-negative integer');
  if (bandwidth !== undefined && Math.abs(m - n) > bandwidth)
    throw new Error(`Sequence length difference exceeds bandwidth (${bandwidth})`);
  const matrixOption = options.matrix ?? 'BLOSUM62';
  const matrix = typeof matrixOption === 'string' ? getMatrix(matrixOption) : matrixOption;
  const open = options.gapOpen ?? -10;
  const extend = options.gapExtend ?? -1;
  const band = bandwidth ?? Math.max(m, n);
  const rows: Row[] = Array.from({ length: m + 1 }, (_, i) => {
    const start = Math.max(0, i - band);
    const width = Math.min(n, i + band) - start + 1;
    return {
      start,
      scores: Array.from({ length: 3 }, () => new Float64Array(width).fill(-Infinity)),
      previous: Array.from({ length: 3 }, () => new Uint8Array(width).fill(END)),
    };
  });
  const score = (i: number, j: number, state: number): number => {
    if (i < 0 || j < rows[i].start) return -Infinity;
    return rows[i].scores[state][j - rows[i].start] ?? -Infinity;
  };
  const bestState = (i: number, j: number): number => {
    const a = score(i, j, 0);
    const b = score(i, j, 1);
    const c = score(i, j, 2);
    return a >= b && a >= c ? 0 : b >= c ? 1 : 2;
  };
  rows[0].scores[0][0] = 0;
  for (let i = 1; i <= Math.min(m, band); i++) {
    const row = rows[i];
    if (mode === 'semi' || mode === 'local') row.scores[0][0] = 0;
    else {
      row.scores[1][0] = open + (i - 1) * extend;
      row.previous[1][0] = i === 1 ? 0 : 1;
    }
  }
  for (let j = 1; j <= Math.min(n, band); j++) {
    if (mode !== 'global') rows[0].scores[0][j] = 0;
    else {
      rows[0].scores[2][j] = open + (j - 1) * extend;
      rows[0].previous[2][j] = j === 1 ? 0 : 2;
    }
  }
  let endI = mode === 'local' ? 0 : m;
  let endJ = mode === 'local' ? 0 : n;
  let maximum = mode === 'local' ? 0 : -Infinity;
  for (let i = 1; i <= m; i++) {
    const row = rows[i];
    const previousRow = rows[i - 1];
    const [match, vertical, horizontal] = row.scores;
    const [previousMatch, previousVertical, previousHorizontal] = previousRow.scores;
    for (let j = Math.max(1, row.start); j <= Math.min(n, i + band); j++) {
      const index = j - row.start;
      const diagonalIndex = j - 1 - previousRow.start;
      const upIndex = diagonalIndex + 1;
      const a = previousMatch[diagonalIndex] ?? -Infinity;
      const b = previousVertical[diagonalIndex] ?? -Infinity;
      const c = previousHorizontal[diagonalIndex] ?? -Infinity;
      const diagonalState = a >= b && a >= c ? 0 : b >= c ? 1 : 2;
      const diagonal = Math.max(a, b, c) + getScore(matrix, s1[i - 1], s2[j - 1]);
      match[index] = mode === 'local' ? Math.max(0, diagonal) : diagonal;
      row.previous[0][index] = mode === 'local' && diagonal <= 0 ? END : diagonalState;

      const upMatch = (previousMatch[upIndex] ?? -Infinity) + open;
      const upOther = (previousHorizontal[upIndex] ?? -Infinity) + open;
      const upExtend = (previousVertical[upIndex] ?? -Infinity) + extend;
      vertical[index] = Math.max(upMatch, upOther, upExtend);
      row.previous[1][index] =
        upExtend >= upMatch && upExtend >= upOther ? 1 : upMatch >= upOther ? 0 : 2;

      const leftMatch = (match[index - 1] ?? -Infinity) + open;
      const leftOther = (vertical[index - 1] ?? -Infinity) + open;
      const leftExtend = (horizontal[index - 1] ?? -Infinity) + extend;
      horizontal[index] = Math.max(leftMatch, leftOther, leftExtend);
      row.previous[2][index] =
        leftExtend >= leftMatch && leftExtend >= leftOther ? 2 : leftMatch >= leftOther ? 0 : 1;
      if (mode === 'local') {
        const value = Math.max(match[index], vertical[index], horizontal[index]);
        if (value > maximum) {
          maximum = value;
          endI = i;
          endJ = j;
        }
      }
    }
  }
  const consider = (i: number, j: number): void => {
    const value = score(i, j, bestState(i, j));
    if (value > maximum) {
      maximum = value;
      endI = i;
      endJ = j;
    }
  };
  if (mode === 'global') consider(m, n);
  if (mode === 'semi') for (let j = 0; j <= n; j++) consider(m, j);
  if (mode === 'semi' || mode === 'overlap') for (let i = 0; i <= m; i++) consider(i, n);
  if (maximum === -Infinity) throw new Error('Alignment could not reach the end within bandwidth');
  if (mode === 'local' && maximum < (options.minScore ?? 0)) {
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
  const aligned1: string[] = [];
  const aligned2: string[] = [];
  // Construct in reverse, including any free trailing overhangs.
  if (mode !== 'local') {
    for (let i = m; i > endI; i--) {
      aligned1.push(s1[i - 1]);
      aligned2.push('-');
    }
    for (let j = n; j > endJ; j--) {
      aligned1.push('-');
      aligned2.push(s2[j - 1]);
    }
  }
  let i = endI;
  let j = endJ;
  let state = bestState(i, j);
  while (i > 0 || j > 0) {
    const previous = rows[i].previous[state][j - rows[i].start];
    if (previous === END) break;
    if (state === 0) {
      aligned1.push(s1[--i]);
      aligned2.push(s2[--j]);
    } else if (state === 1) {
      aligned1.push(s1[--i]);
      aligned2.push('-');
    } else {
      aligned1.push('-');
      aligned2.push(s2[--j]);
    }
    state = previous;
  }
  const startI = i;
  const startJ = j;
  if (mode !== 'local') {
    while (i > 0) {
      aligned1.push(s1[--i]);
      aligned2.push('-');
    }
    while (j > 0) {
      aligned1.push('-');
      aligned2.push(s2[--j]);
    }
  }
  const alignedSeq1 = aligned1.reverse().join('');
  const alignedSeq2 = aligned2.reverse().join('');
  const identity = aligned1.reduce(
    (count, char, index) => count + (char !== '-' && char === aligned2[index] ? 1 : 0),
    0
  );
  const length = aligned1.length;
  // Retain historical score normalization in semi-global, overlap, and banded APIs.
  const normalizeScore =
    (mode === 'semi' || mode === 'overlap' || bandwidth !== undefined) &&
    (options.normalizeScore ?? options.normalize);
  return {
    alignedSeq1,
    alignedSeq2,
    score: normalizeScore && length ? maximum / length : maximum,
    startPos1: mode === 'local' ? startI : 0,
    startPos2: mode === 'local' ? startJ : 0,
    endPos1: mode === 'local' || mode === 'overlap' ? endI : m,
    endPos2: mode === 'local' ? endJ : n,
    identity,
    identityPercent: length ? (identity / length) * 100 : 0,
    alignmentLength: length,
  };
}
