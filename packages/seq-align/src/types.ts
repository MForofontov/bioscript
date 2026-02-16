/**
 * Represents a scoring matrix for sequence alignment.
 * Maps pairs of amino acids or nucleotides to their alignment scores.
 */
export type ScoringMatrix = Record<string, Record<string, number>>;

/**
 * Result of a sequence alignment operation.
 * Contains the aligned sequences and alignment metadata.
 */
export interface AlignmentResult {
  /**
   * First aligned sequence with gaps represented as '-'.
   */
  alignedSeq1: string;

  /**
   * Second aligned sequence with gaps represented as '-'.
   */
  alignedSeq2: string;

  /**
   * Alignment score calculated using the scoring matrix and gap penalties.
   */
  score: number;

  /**
   * Starting position in sequence 1 (0-indexed).
   * For local alignment (Smith-Waterman), this indicates where the alignment begins.
   * For global alignment (Needleman-Wunsch), this is always 0.
   */
  startPos1: number;

  /**
   * Starting position in sequence 2 (0-indexed).
   * For local alignment (Smith-Waterman), this indicates where the alignment begins.
   * For global alignment (Needleman-Wunsch), this is always 0.
   */
  startPos2: number;

  /**
   * Ending position in sequence 1 (0-indexed, exclusive).
   * For local alignment, this indicates where the alignment ends.
   * For global alignment, this is the length of sequence 1.
   */
  endPos1: number;

  /**
   * Ending position in sequence 2 (0-indexed, exclusive).
   * For local alignment, this indicates where the alignment ends.
   * For global alignment, this is the length of sequence 2.
   */
  endPos2: number;

  /**
   * Number of identical characters in the alignment.
   */
  identity: number;

  /**
   * Percentage of identical characters (0-100).
   */
  identityPercent: number;

  /**
   * Length of the alignment (including gaps).
   */
  alignmentLength: number;
}

/**
 * Options for configuring sequence alignment.
 */
export interface AlignmentOptions {
  /**
   * Scoring matrix to use for alignment.
   * Can be a predefined matrix name ('BLOSUM62', 'PAM250', etc.)
   * or a custom scoring matrix.
   */
  matrix?: string | ScoringMatrix;

  /**
   * Penalty for opening a gap (must be negative or zero).
   * @default -10
   */
  gapOpen?: number;

  /**
   * Penalty for extending a gap (must be negative or zero).
   * @default -1
   */
  gapExtend?: number;

  /**
   * Whether to normalize sequence case before alignment.
   * If true, converts sequences to uppercase.
   * @default true
   */
  normalize?: boolean;
}

/**
 * Options specific to local alignment (Smith-Waterman).
 */
export interface LocalAlignmentOptions extends AlignmentOptions {
  /**
   * Minimum score threshold for reporting alignments.
   * Alignments with scores below this threshold will not be returned.
   * @default 0
   */
  minScore?: number;
}

/**
 * Direction in the alignment matrix for traceback.
 * @internal
 */
export enum Direction {
  NONE = 0,
  DIAGONAL = 1,
  UP = 2,
  LEFT = 3,
}

/**
 * Cell in the alignment matrix.
 * @internal
 */
export interface AlignmentCell {
  score: number;
  direction: Direction;
}
