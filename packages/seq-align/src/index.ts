/**
 * @bioscript/seq-align
 *
 * Pairwise sequence alignment algorithms for bioinformatics.
 * Supports global (Needleman-Wunsch) and local (Smith-Waterman) alignment.
 *
 * @example
 * ```typescript
 * import { needlemanWunsch, smithWaterman } from '@bioscript/seq-align';
 *
 * // Global alignment
 * const global = needlemanWunsch('HEAGAWGHEE', 'PAWHEAE');
 * console.log(global.alignedSeq1, global.alignedSeq2);
 *
 * // Local alignment
 * const local = smithWaterman('HEAGAWGHEEHEAGAWGHEE', 'PAWHEAE');
 * console.log(local.alignedSeq1, local.alignedSeq2);
 * ```
 *
 * @packageDocumentation
 */

// Core algorithms
export { needlemanWunsch } from './needleman-wunsch';
export { smithWaterman } from './smith-waterman';
export { semiGlobal } from './semi-global';
export { bandedAlign } from './banded';
export { overlapAlign } from './overlap';
export { hirschberg } from './hirschberg';

// Export types from banded for convenience
export type { BandedAlignmentOptions } from './banded';

// Scoring matrices
export {
  // BLOSUM series
  BLOSUM45,
  BLOSUM50,
  BLOSUM62,
  BLOSUM80,
  BLOSUM90,
  // PAM series
  PAM30,
  PAM70,
  PAM120,
  PAM250,
  // DNA/RNA matrices
  DNA_SIMPLE,
  DNA_FULL,
  // Registry and utilities
  MATRICES,
  getMatrix,
  getScore,
} from './matrices';

// Types
export type {
  AlignmentResult,
  AlignmentOptions,
  LocalAlignmentOptions,
  ScoringMatrix,
} from './types';

export { Direction } from './types';
