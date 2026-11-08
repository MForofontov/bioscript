import {
  needlemanWunsch,
  smithWaterman,
  semiGlobal,
  overlapAlign,
  bandedAlign,
  hirschberg,
} from '../index';
import type { AlignmentResult, ScoringMatrix } from '../types';

const matrix: ScoringMatrix = { A: { A: 3, C: -5 }, C: { A: -5, C: 3 } };
type Mode = 'global' | 'local' | 'semi' | 'overlap';

// Enumerate all alignment paths, independently of the production DP recurrence.
function oracle(
  a: string,
  b: string,
  mode: Mode,
  open: number,
  extend: number,
  bandwidth = Infinity
): number {
  let best = -Infinity;
  function visit(i: number, j: number, previous: string, score: number): void {
    if (Math.abs(i - j) > bandwidth) return;
    if (
      mode === 'local' ||
      (mode === 'global' && i === a.length && j === b.length) ||
      (mode === 'semi' && (i === a.length || j === b.length)) ||
      (mode === 'overlap' && j === b.length)
    )
      best = Math.max(best, score);
    if (i < a.length && j < b.length) visit(i + 1, j + 1, 'M', score + matrix[a[i]][b[j]]);
    if (i < a.length) visit(i + 1, j, 'E', score + (previous === 'E' ? extend : open));
    if (j < b.length) visit(i, j + 1, 'F', score + (previous === 'F' ? extend : open));
  }
  for (let i = 0; i <= a.length; i++) {
    for (let j = 0; j <= b.length; j++) {
      if (
        (mode === 'global' && i === 0 && j === 0) ||
        mode === 'local' ||
        (mode === 'semi' && (i === 0 || j === 0)) ||
        (mode === 'overlap' && i === 0)
      )
        visit(i, j, '', 0);
    }
  }
  return best;
}

function rescore(result: AlignmentResult, mode: Mode, open: number, extend: number): number {
  let score = 0;
  let previous = '';
  const a = result.alignedSeq1;
  const b = result.alignedSeq2;
  let first = 0;
  let last = a.length;
  if (mode === 'semi') {
    const leading = a[0] === '-' ? a : b;
    const trailing = a[last - 1] === '-' ? a : b;
    while (first < last && leading[first] === '-') first++;
    while (last > first && trailing[last - 1] === '-') last--;
  } else if (mode === 'overlap') {
    while (first < last && a[first] === '-') first++;
    while (last > first && b[last - 1] === '-') last--;
  }
  for (let i = first; i < last; i++) {
    const state = a[i] === '-' ? 'F' : b[i] === '-' ? 'E' : 'M';
    score += state === 'M' ? matrix[a[i]][b[i]] : state === previous ? extend : open;
    previous = state;
  }
  return score;
}

test.each([
  ['global', needlemanWunsch],
  ['local', smithWaterman],
  ['semi', semiGlobal],
  ['overlap', overlapAlign],
] as const)('%s scores and traceback match exhaustive affine paths', (mode, align) => {
  for (const a of ['A', 'ACAC', 'AACCA']) {
    for (const b of ['C', 'CACA', 'ACCAA']) {
      for (const [gapOpen, gapExtend] of [
        [-3, -1],
        [-1, -1],
      ]) {
        const result = align(a, b, { matrix, gapOpen, gapExtend, normalize: false });
        expect(result.score).toBe(oracle(a, b, mode, gapOpen, gapExtend));
        expect(rescore(result, mode, gapOpen, gapExtend)).toBe(result.score);
        expect(result.alignedSeq1.replace(/-/g, '')).toBe(
          mode === 'local' ? a.slice(result.startPos1, result.endPos1) : a
        );
        expect(result.alignedSeq2.replace(/-/g, '')).toBe(
          mode === 'local' ? b.slice(result.startPos2, result.endPos2) : b
        );
      }
    }
  }
});

test('wide band and Hirschberg match independent global scores', () => {
  for (const [a, b] of [
    ['AACCA', 'ACCAA'],
    ['ACAC', 'CACA'],
    ['A', 'C'],
  ]) {
    const options = { matrix, gapOpen: -1, gapExtend: -1 };
    const expected = oracle(a, b, 'global', -1, -1);
    for (const result of [
      hirschberg(a, b, options),
      bandedAlign(a, b, { ...options, bandwidth: 10 }),
    ]) {
      expect(result.score).toBe(expected);
      expect(rescore(result, 'global', -1, -1)).toBe(expected);
      expect(result.alignedSeq1.replace(/-/g, '')).toBe(a);
      expect(result.alignedSeq2.replace(/-/g, '')).toBe(b);
    }
  }
});

test.each([NaN, Infinity, -Infinity, 1])('alignment rejects invalid penalties %p', (value) => {
  for (const align of [
    needlemanWunsch,
    smithWaterman,
    semiGlobal,
    overlapAlign,
    bandedAlign,
    hirschberg,
  ]) {
    expect(() => align('AC', 'AC', { gapOpen: value })).toThrow();
    expect(() => align('AC', 'AC', { gapExtend: value })).toThrow();
  }
});

test.each([NaN, Infinity, -1, 1.5])('bandwidth rejects invalid values %p', (bandwidth) => {
  expect(() => bandedAlign('AC', 'AC', { bandwidth })).toThrow();
});

test('custom matrices reject nonfinite scores', () => {
  for (const align of [
    needlemanWunsch,
    smithWaterman,
    semiGlobal,
    overlapAlign,
    bandedAlign,
    hirschberg,
  ]) {
    expect(() => align('A', 'A', { matrix: { A: { A: NaN } } })).toThrow();
  }
});

test('global affine scoring keeps a gap state that was not the previous cell winner', () => {
  const result = needlemanWunsch('A', 'AAC', { matrix, gapOpen: -3, gapExtend: -1 });
  expect(result.score).toBe(-1);
  expect(rescore(result, 'global', -3, -1)).toBe(-1);
});

test('Hirschberg reverses each suffix only once', () => {
  expect(hirschberg('AAC', 'CA', { matrix, gapOpen: -3 }).score).toBe(-5);
});

test('short binary sequences match independent scores across penalty regimes and bands', () => {
  const sequences = ['A', 'C', 'AA', 'AC', 'CA', 'CC', 'AAC', 'CAC'];
  for (const a of sequences) {
    for (const b of sequences) {
      for (const [gapOpen, gapExtend] of [
        [0, 0],
        [-1, -3],
        [-3, -1],
      ]) {
        const options = { matrix, gapOpen, gapExtend, normalize: false };
        const result = needlemanWunsch(a, b, options);
        expect(result.score).toBe(oracle(a, b, 'global', gapOpen, gapExtend));
        expect(rescore(result, 'global', gapOpen, gapExtend)).toBe(result.score);
        for (const bandwidth of [Math.abs(a.length - b.length), Math.max(a.length, b.length)]) {
          const banded = bandedAlign(a, b, { ...options, bandwidth });
          expect(banded.score).toBe(oracle(a, b, 'global', gapOpen, gapExtend, bandwidth));
          expect(rescore(banded, 'global', gapOpen, gapExtend)).toBe(banded.score);
        }
        const linear = hirschberg(a, b, options);
        expect(linear.score).toBe(oracle(a, b, 'global', gapOpen, gapOpen));
        expect(rescore(linear, 'global', gapOpen, gapOpen)).toBe(linear.score);
      }
    }
  }
});

test.each([
  ['local', smithWaterman, 'AACCAACCCCCA', 'AACCCAAACA', 17],
  ['semi', semiGlobal, 'ACACACCCCCCC', 'AACCACCAAA', 10],
  ['semi', semiGlobal, 'CCCAAACCAACC', 'ACCACAACCC', 17],
  ['overlap', overlapAlign, 'CAACAAACCAAC', 'CACACACCCA', 14],
  ['global', bandedAlign, 'CAAAACACCCCC', 'CCCACCCCAA', 5],
] as const)('%s traceback follows the winning affine state', (mode, align, a, b, expected) => {
  const result = align(a, b, { matrix, gapOpen: -3, gapExtend: -1, normalize: false });
  expect(result.score).toBe(expected);
  expect(rescore(result, mode, -3, -1)).toBe(expected);
});
