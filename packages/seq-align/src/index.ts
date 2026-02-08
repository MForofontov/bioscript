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

// Scoring matrices
export {
  BLOSUM62,
  BLOSUM80,
  PAM250,
  DNA_SIMPLE,
  DNA_FULL,
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
