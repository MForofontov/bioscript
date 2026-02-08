/**
 * Smith-Waterman local sequence alignment algorithm.
 * 
 * Performs optimal local alignment of two sequences using dynamic programming.
 * Finds the best matching subsequence regions, ignoring mismatched ends.
 * 
 * Time complexity: O(m*n) where m and n are sequence lengths.
 * Space complexity: O(m*n) for the alignment matrix.
 * 
 * @module smith-waterman
 * @see {@link https://en.wikipedia.org/wiki/Smith%E2%80%93Waterman_algorithm}
 */

import type {
  AlignmentResult,
  LocalAlignmentOptions,
  ScoringMatrix,
} from './types';
import { Direction } from './types';
import { getMatrix, getScore } from './matrices';

/**
 * Performs local sequence alignment using the Smith-Waterman algorithm.
 * 
 * This function finds the best matching region(s) between two sequences,
 * ignoring poorly matching ends. Use this when looking for conserved
 * domains, motifs, or similar regions within longer sequences.
 * 
 * @param seq1 - First sequence to align (DNA, RNA, or protein).
 * @param seq2 - Second sequence to align (DNA, RNA, or protein).
 * @param options - Alignment configuration options.
 * @returns Alignment result with the best local alignment and statistics.
 * 
 * @throws {TypeError} If sequences are not strings.
 * @throws {Error} If sequences are empty or contain only whitespace.
 * @throws {Error} If gap penalties are positive values.
 * 
 * @example
 * ```typescript
 * // Find local alignment in protein sequences
 * const result = smithWaterman(
 *   'HEAGAWGHEEAGAWGHEE',
 *   'PAWHEAE',
 *   {
 *     matrix: 'BLOSUM62',
 *     gapOpen: -10,
 *     gapExtend: -1,
 *     minScore: 10,
 *   }
 * );
 * 
 * console.log(result.alignedSeq1);  // Local alignment region
 * console.log(result.alignedSeq2);  // Corresponding region
 * console.log(result.startPos1);    // Start position in seq1
 * console.log(result.startPos2);    // Start position in seq2
 * ```
 * 
 * @example
 * ```typescript
 * // Find conserved region in DNA sequences
 * const result = smithWaterman(
 *   'ACGTACGTTAGCTAGCT',
 *   'TAGCTA',
 *   {
 *     matrix: 'DNA_SIMPLE',
 *     gapOpen: -5,
 *     gapExtend: -2,
 *   }
 * );
 * ```
 * 
 * @performance
 * - Time: O(m*n) where m, n are sequence lengths
 * - Space: O(m*n) for alignment matrix
 * - Typical: ~100k cell updates/sec
 * - Memory: ~16 bytes per cell
 * 
 * @note For complete end-to-end alignment, use Needleman-Wunsch instead.
 */
export function smithWaterman(
  seq1: string,
  seq2: string,
  options: LocalAlignmentOptions = {}
): AlignmentResult {
  // Input validation
  if (typeof seq1 !== 'string') {
    throw new TypeError(`seq1 must be a string, got ${typeof seq1}`);
  }

  if (typeof seq2 !== 'string') {
    throw new TypeError(`seq2 must be a string, got ${typeof seq2}`);
  }

  // Extract and validate options
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

  // Normalize sequences
  const s1 = normalize ? seq1.trim().toUpperCase() : seq1;
  const s2 = normalize ? seq2.trim().toUpperCase() : seq2;

  if (s1.length === 0) {
    throw new Error('seq1 is empty or contains only whitespace');
  }

  if (s2.length === 0) {
    throw new Error('seq2 is empty or contains only whitespace');
  }

  // Get scoring matrix
  const scoringMatrix: ScoringMatrix =
    typeof matrix === 'string' ? getMatrix(matrix) : matrix;

  // Initialize alignment matrices
  const m = s1.length;
  const n = s2.length;

  // Score matrix
  const scoreMatrix: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  // Direction matrix for traceback
  const directionMatrix: Direction[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(Direction.NONE)
  );

  // Track maximum score and its position
  let maxScore = 0;
  let maxI = 0;
  let maxJ = 0;

  // Fill the matrices using dynamic programming
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const char1 = s1[i - 1];
      const char2 = s2[j - 1];
      const matchScore = getScore(scoringMatrix, char1, char2);

      // Calculate scores for each possible move
      const diagonal = scoreMatrix[i - 1][j - 1] + matchScore;

      // Gap in seq2 (moving up)
      const gapCost2 =
        directionMatrix[i - 1][j] === Direction.UP ? gapExtend : gapOpen;
      const up = scoreMatrix[i - 1][j] + gapCost2;

      // Gap in seq1 (moving left)
      const gapCost1 =
        directionMatrix[i][j - 1] === Direction.LEFT ? gapExtend : gapOpen;
      const left = scoreMatrix[i][j - 1] + gapCost1;

      // Choose the best score (or 0 for local alignment)
      let bestScore = 0;
      let bestDirection = Direction.NONE;

      if (diagonal > bestScore) {
        bestScore = diagonal;
        bestDirection = Direction.DIAGONAL;
      }

      if (up > bestScore) {
        bestScore = up;
        bestDirection = Direction.UP;
      }

      if (left > bestScore) {
        bestScore = left;
        bestDirection = Direction.LEFT;
      }

      scoreMatrix[i][j] = bestScore;
      directionMatrix[i][j] = bestDirection;

      // Track maximum score
      if (bestScore > maxScore) {
        maxScore = bestScore;
        maxI = i;
        maxJ = j;
      }
    }
  }

  // Check if alignment score meets minimum threshold
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

  // Traceback from maximum score position
  const aligned1: string[] = [];
  const aligned2: string[] = [];

  let i = maxI;
  let j = maxJ;

  while (i > 0 && j > 0 && scoreMatrix[i][j] > 0) {
    const direction = directionMatrix[i][j];

    if (direction === Direction.DIAGONAL) {
      aligned1.unshift(s1[i - 1]);
      aligned2.unshift(s2[j - 1]);
      i--;
      j--;
    } else if (direction === Direction.UP) {
      aligned1.unshift(s1[i - 1]);
      aligned2.unshift('-');
      i--;
    } else if (direction === Direction.LEFT) {
      aligned1.unshift('-');
      aligned2.unshift(s2[j - 1]);
      j--;
    } else {
      break;
    }
  }

  const alignedSeq1 = aligned1.join('');
  const alignedSeq2 = aligned2.join('');

  // Calculate statistics
  let identity = 0;
  for (let k = 0; k < aligned1.length; k++) {
    if (aligned1[k] === aligned2[k] && aligned1[k] !== '-') {
      identity++;
    }
  }

  const alignmentLength = aligned1.length;
  const identityPercent =
    alignmentLength > 0 ? (identity / alignmentLength) * 100 : 0;

  return {
    alignedSeq1,
    alignedSeq2,
    score: maxScore,
    startPos1: i,
    startPos2: j,
    endPos1: maxI,
    endPos2: maxJ,
    identity,
    identityPercent,
    alignmentLength,
  };
}
