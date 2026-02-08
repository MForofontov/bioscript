/**
 * Scoring matrices for sequence alignment.
 * 
 * This module provides standard scoring matrices used in bioinformatics:
 * - BLOSUM (BLOcks SUbstitution Matrix) series for protein alignment
 * - PAM (Point Accepted Mutation) series for protein alignment
 * - Simple DNA/RNA matrices for nucleotide alignment
 * 
 * @module matrices
 */

import type { ScoringMatrix } from './types';

/**
 * BLOSUM62 (BLOcks SUbstitution Matrix 62).
 * Most commonly used substitution matrix for protein sequence alignment.
 * Based on alignments of sequences with ≥62% identity.
 * 
 * @see {@link https://www.ncbi.nlm.nih.gov/IEB/ToolBox/C_DOC/lxr/source/data/BLOSUM62}
 */
export const BLOSUM62: ScoringMatrix = {
  A: { A: 4, R: -1, N: -2, D: -2, C: 0, Q: -1, E: -1, G: 0, H: -2, I: -1, L: -1, K: -1, M: -1, F: -2, P: -1, S: 1, T: 0, W: -3, Y: -2, V: 0 },
  R: { A: -1, R: 5, N: 0, D: -2, C: -3, Q: 1, E: 0, G: -2, H: 0, I: -3, L: -2, K: 2, M: -1, F: -3, P: -2, S: -1, T: -1, W: -3, Y: -2, V: -3 },
  N: { A: -2, R: 0, N: 6, D: 1, C: -3, Q: 0, E: 0, G: 0, H: 1, I: -3, L: -3, K: 0, M: -2, F: -3, P: -2, S: 1, T: 0, W: -4, Y: -2, V: -3 },
  D: { A: -2, R: -2, N: 1, D: 6, C: -3, Q: 0, E: 2, G: -1, H: -1, I: -3, L: -4, K: -1, M: -3, F: -3, P: -1, S: 0, T: -1, W: -4, Y: -3, V: -3 },
  C: { A: 0, R: -3, N: -3, D: -3, C: 9, Q: -3, E: -4, G: -3, H: -3, I: -1, L: -1, K: -3, M: -1, F: -2, P: -3, S: -1, T: -1, W: -2, Y: -2, V: -1 },
  Q: { A: -1, R: 1, N: 0, D: 0, C: -3, Q: 5, E: 2, G: -2, H: 0, I: -3, L: -2, K: 1, M: 0, F: -3, P: -1, S: 0, T: -1, W: -2, Y: -1, V: -2 },
  E: { A: -1, R: 0, N: 0, D: 2, C: -4, Q: 2, E: 5, G: -2, H: 0, I: -3, L: -3, K: 1, M: -2, F: -3, P: -1, S: 0, T: -1, W: -3, Y: -2, V: -2 },
  G: { A: 0, R: -2, N: 0, D: -1, C: -3, Q: -2, E: -2, G: 6, H: -2, I: -4, L: -4, K: -2, M: -3, F: -3, P: -2, S: 0, T: -2, W: -2, Y: -3, V: -3 },
  H: { A: -2, R: 0, N: 1, D: -1, C: -3, Q: 0, E: 0, G: -2, H: 8, I: -3, L: -3, K: -1, M: -2, F: -1, P: -2, S: -1, T: -2, W: -2, Y: 2, V: -3 },
  I: { A: -1, R: -3, N: -3, D: -3, C: -1, Q: -3, E: -3, G: -4, H: -3, I: 4, L: 2, K: -3, M: 1, F: 0, P: -3, S: -2, T: -1, W: -3, Y: -1, V: 3 },
  L: { A: -1, R: -2, N: -3, D: -4, C: -1, Q: -2, E: -3, G: -4, H: -3, I: 2, L: 4, K: -2, M: 2, F: 0, P: -3, S: -2, T: -1, W: -2, Y: -1, V: 1 },
  K: { A: -1, R: 2, N: 0, D: -1, C: -3, Q: 1, E: 1, G: -2, H: -1, I: -3, L: -2, K: 5, M: -1, F: -3, P: -1, S: 0, T: -1, W: -3, Y: -2, V: -2 },
  M: { A: -1, R: -1, N: -2, D: -3, C: -1, Q: 0, E: -2, G: -3, H: -2, I: 1, L: 2, K: -1, M: 5, F: 0, P: -2, S: -1, T: -1, W: -1, Y: -1, V: 1 },
  F: { A: -2, R: -3, N: -3, D: -3, C: -2, Q: -3, E: -3, G: -3, H: -1, I: 0, L: 0, K: -3, M: 0, F: 6, P: -4, S: -2, T: -2, W: 1, Y: 3, V: -1 },
  P: { A: -1, R: -2, N: -2, D: -1, C: -3, Q: -1, E: -1, G: -2, H: -2, I: -3, L: -3, K: -1, M: -2, F: -4, P: 7, S: -1, T: -1, W: -4, Y: -3, V: -2 },
  S: { A: 1, R: -1, N: 1, D: 0, C: -1, Q: 0, E: 0, G: 0, H: -1, I: -2, L: -2, K: 0, M: -1, F: -2, P: -1, S: 4, T: 1, W: -3, Y: -2, V: -2 },
  T: { A: 0, R: -1, N: 0, D: -1, C: -1, Q: -1, E: -1, G: -2, H: -2, I: -1, L: -1, K: -1, M: -1, F: -2, P: -1, S: 1, T: 5, W: -2, Y: -2, V: 0 },
  W: { A: -3, R: -3, N: -4, D: -4, C: -2, Q: -2, E: -3, G: -2, H: -2, I: -3, L: -2, K: -3, M: -1, F: 1, P: -4, S: -3, T: -2, W: 11, Y: 2, V: -3 },
  Y: { A: -2, R: -2, N: -2, D: -3, C: -2, Q: -1, E: -2, G: -3, H: 2, I: -1, L: -1, K: -2, M: -1, F: 3, P: -3, S: -2, T: -2, W: 2, Y: 7, V: -1 },
  V: { A: 0, R: -3, N: -3, D: -3, C: -1, Q: -2, E: -2, G: -3, H: -3, I: 3, L: 1, K: -2, M: 1, F: -1, P: -2, S: -2, T: 0, W: -3, Y: -1, V: 4 },
};

/**
 * BLOSUM80 scoring matrix.
 * More stringent than BLOSUM62, for more similar sequences (≥80% identity).
 * Use for aligning closely related proteins.
 */
export const BLOSUM80: ScoringMatrix = {
  A: { A: 7, R: -3, N: -3, D: -3, C: -1, Q: -2, E: -2, G: 0, H: -3, I: -3, L: -3, K: -1, M: -2, F: -4, P: -1, S: 2, T: 0, W: -5, Y: -4, V: -1 },
  R: { A: -3, R: 9, N: -1, D: -3, C: -6, Q: 1, E: -1, G: -4, H: 0, I: -5, L: -4, K: 3, M: -3, F: -5, P: -3, S: -2, T: -2, W: -5, Y: -4, V: -4 },
  N: { A: -3, R: -1, N: 9, D: 2, C: -5, Q: 0, E: -1, G: -1, H: 1, I: -6, L: -6, K: 0, M: -4, F: -6, P: -4, S: 1, T: 0, W: -6, Y: -4, V: -5 },
  D: { A: -3, R: -3, N: 2, D: 10, C: -7, Q: -1, E: 2, G: -3, H: -2, I: -7, L: -7, K: -2, M: -6, F: -6, P: -3, S: -1, T: -2, W: -8, Y: -6, V: -6 },
  C: { A: -1, R: -6, N: -5, D: -7, C: 13, Q: -5, E: -7, G: -6, H: -7, I: -2, L: -3, K: -6, M: -3, F: -4, P: -6, S: -2, T: -2, W: -5, Y: -5, V: -2 },
  Q: { A: -2, R: 1, N: 0, D: -1, C: -5, Q: 9, E: 3, G: -4, H: 1, I: -5, L: -4, K: 2, M: -1, F: -6, P: -3, S: -1, T: -1, W: -4, Y: -3, V: -4 },
  E: { A: -2, R: -1, N: -1, D: 2, C: -7, Q: 3, E: 8, G: -4, H: 0, I: -6, L: -6, K: 1, M: -4, F: -6, P: -2, S: -1, T: -2, W: -6, Y: -5, V: -4 },
  G: { A: 0, R: -4, N: -1, D: -3, C: -6, Q: -4, E: -4, G: 9, H: -4, I: -7, L: -7, K: -3, M: -5, F: -6, P: -4, S: -1, T: -3, W: -6, Y: -6, V: -6 },
  H: { A: -3, R: 0, N: 1, D: -2, C: -7, Q: 1, E: 0, G: -4, H: 12, I: -6, L: -5, K: -1, M: -4, F: -2, P: -4, S: -2, T: -3, W: -4, Y: 3, V: -6 },
  I: { A: -3, R: -5, N: -6, D: -7, C: -2, Q: -5, E: -6, G: -7, H: -6, I: 7, L: 2, K: -5, M: 2, F: -2, P: -5, S: -4, T: -2, W: -5, Y: -3, V: 4 },
  L: { A: -3, R: -4, N: -6, D: -7, C: -3, Q: -4, E: -6, G: -7, H: -5, I: 2, L: 6, K: -4, M: 3, F: 0, P: -5, S: -5, T: -3, W: -4, Y: -3, V: 1 },
  K: { A: -1, R: 3, N: 0, D: -2, C: -6, Q: 2, E: 1, G: -3, H: -1, I: -5, L: -4, K: 8, M: -3, F: -5, P: -2, S: -1, T: -1, W: -6, Y: -4, V: -4 },
  M: { A: -2, R: -3, N: -4, D: -6, C: -3, Q: -1, E: -4, G: -5, H: -4, I: 2, L: 3, K: -3, M: 10, F: 0, P: -4, S: -3, T: -2, W: -3, Y: -3, V: 1 },
  F: { A: -4, R: -5, N: -6, D: -6, C: -4, Q: -6, E: -6, G: -6, H: -2, I: -2, L: 0, K: -5, M: 0, F: 10, P: -6, S: -4, T: -4, W: 0, Y: 4, V: -3 },
  P: { A: -1, R: -3, N: -4, D: -3, C: -6, Q: -3, E: -2, G: -4, H: -4, I: -5, L: -5, K: -2, M: -4, F: -6, P: 12, S: -2, T: -3, W: -7, Y: -6, V: -4 },
  S: { A: 2, R: -2, N: 1, D: -1, C: -2, Q: -1, E: -1, G: -1, H: -2, I: -4, L: -5, K: -1, M: -3, F: -4, P: -2, S: 7, T: 2, W: -6, Y: -3, V: -3 },
  T: { A: 0, R: -2, N: 0, D: -2, C: -2, Q: -1, E: -2, G: -3, H: -3, I: -2, L: -3, K: -1, M: -2, F: -4, P: -3, S: 2, T: 8, W: -5, Y: -3, V: 0 },
  W: { A: -5, R: -5, N: -6, D: -8, C: -5, Q: -4, E: -6, G: -6, H: -4, I: -5, L: -4, K: -6, M: -3, F: 0, P: -7, S: -6, T: -5, W: 16, Y: 3, V: -5 },
  Y: { A: -4, R: -4, N: -4, D: -6, C: -5, Q: -3, E: -5, G: -6, H: 3, I: -3, L: -3, K: -4, M: -3, F: 4, P: -6, S: -3, T: -3, W: 3, Y: 11, V: -3 },
  V: { A: -1, R: -4, N: -5, D: -6, C: -2, Q: -4, E: -4, G: -6, H: -6, I: 4, L: 1, K: -4, M: 1, F: -3, P: -4, S: -3, T: 0, W: -5, Y: -3, V: 7 },
};

/**
 * PAM250 (Point Accepted Mutation 250).
 * For distantly related proteins (25% sequence identity expected).
 * Higher PAM numbers = more evolutionary distance allowed.
 * 
 * @see {@link https://www.ncbi.nlm.nih.gov/Class/FieldGuide/BLOSUM62.txt}
 */
export const PAM250: ScoringMatrix = {
  A: { A: 2, R: -2, N: 0, D: 0, C: -2, Q: 0, E: 0, G: 1, H: -1, I: -1, L: -2, K: -1, M: -1, F: -3, P: 1, S: 1, T: 1, W: -6, Y: -3, V: 0 },
  R: { A: -2, R: 6, N: 0, D: -1, C: -4, Q: 1, E: -1, G: -3, H: 2, I: -2, L: -3, K: 3, M: 0, F: -4, P: 0, S: 0, T: -1, W: 2, Y: -4, V: -2 },
  N: { A: 0, R: 0, N: 2, D: 2, C: -4, Q: 1, E: 1, G: 0, H: 2, I: -2, L: -3, K: 1, M: -2, F: -3, P: 0, S: 1, T: 0, W: -4, Y: -2, V: -2 },
  D: { A: 0, R: -1, N: 2, D: 4, C: -5, Q: 2, E: 3, G: 1, H: 1, I: -2, L: -4, K: 0, M: -3, F: -6, P: -1, S: 0, T: 0, W: -7, Y: -4, V: -2 },
  C: { A: -2, R: -4, N: -4, D: -5, C: 12, Q: -5, E: -5, G: -3, H: -3, I: -2, L: -6, K: -5, M: -5, F: -4, P: -3, S: 0, T: -2, W: -8, Y: 0, V: -2 },
  Q: { A: 0, R: 1, N: 1, D: 2, C: -5, Q: 4, E: 2, G: -1, H: 3, I: -2, L: -2, K: 1, M: -1, F: -5, P: 0, S: -1, T: -1, W: -5, Y: -4, V: -2 },
  E: { A: 0, R: -1, N: 1, D: 3, C: -5, Q: 2, E: 4, G: 0, H: 1, I: -2, L: -3, K: 0, M: -2, F: -5, P: -1, S: 0, T: 0, W: -7, Y: -4, V: -2 },
  G: { A: 1, R: -3, N: 0, D: 1, C: -3, Q: -1, E: 0, G: 5, H: -2, I: -3, L: -4, K: -2, M: -3, F: -5, P: 0, S: 1, T: 0, W: -7, Y: -5, V: -1 },
  H: { A: -1, R: 2, N: 2, D: 1, C: -3, Q: 3, E: 1, G: -2, H: 6, I: -2, L: -2, K: 0, M: -2, F: -2, P: 0, S: -1, T: -1, W: -3, Y: 0, V: -2 },
  I: { A: -1, R: -2, N: -2, D: -2, C: -2, Q: -2, E: -2, G: -3, H: -2, I: 5, L: 2, K: -2, M: 2, F: 1, P: -2, S: -1, T: 0, W: -5, Y: -1, V: 4 },
  L: { A: -2, R: -3, N: -3, D: -4, C: -6, Q: -2, E: -3, G: -4, H: -2, I: 2, L: 6, K: -3, M: 4, F: 2, P: -3, S: -3, T: -2, W: -2, Y: -1, V: 2 },
  K: { A: -1, R: 3, N: 1, D: 0, C: -5, Q: 1, E: 0, G: -2, H: 0, I: -2, L: -3, K: 5, M: 0, F: -5, P: -1, S: 0, T: 0, W: -3, Y: -4, V: -2 },
  M: { A: -1, R: 0, N: -2, D: -3, C: -5, Q: -1, E: -2, G: -3, H: -2, I: 2, L: 4, K: 0, M: 6, F: 0, P: -2, S: -2, T: -1, W: -4, Y: -2, V: 2 },
  F: { A: -3, R: -4, N: -3, D: -6, C: -4, Q: -5, E: -5, G: -5, H: -2, I: 1, L: 2, K: -5, M: 0, F: 9, P: -5, S: -3, T: -3, W: 0, Y: 7, V: -1 },
  P: { A: 1, R: 0, N: 0, D: -1, C: -3, Q: 0, E: -1, G: 0, H: 0, I: -2, L: -3, K: -1, M: -2, F: -5, P: 6, S: 1, T: 0, W: -6, Y: -5, V: -1 },
  S: { A: 1, R: 0, N: 1, D: 0, C: 0, Q: -1, E: 0, G: 1, H: -1, I: -1, L: -3, K: 0, M: -2, F: -3, P: 1, S: 2, T: 1, W: -2, Y: -3, V: -1 },
  T: { A: 1, R: -1, N: 0, D: 0, C: -2, Q: -1, E: 0, G: 0, H: -1, I: 0, L: -2, K: 0, M: -1, F: -3, P: 0, S: 1, T: 3, W: -5, Y: -3, V: 0 },
  W: { A: -6, R: 2, N: -4, D: -7, C: -8, Q: -5, E: -7, G: -7, H: -3, I: -5, L: -2, K: -3, M: -4, F: 0, P: -6, S: -2, T: -5, W: 17, Y: 0, V: -6 },
  Y: { A: -3, R: -4, N: -2, D: -4, C: 0, Q: -4, E: -4, G: -5, H: 0, I: -1, L: -1, K: -4, M: -2, F: 7, P: -5, S: -3, T: -3, W: 0, Y: 10, V: -2 },
  V: { A: 0, R: -2, N: -2, D: -2, C: -2, Q: -2, E: -2, G: -1, H: -2, I: 4, L: 2, K: -2, M: 2, F: -1, P: -1, S: -1, T: 0, W: -6, Y: -2, V: 4 },
};

/**
 * Simple DNA scoring matrix.
 * Match: +5, Mismatch: -4
 * Works for both DNA and RNA (T/U are treated equivalently).
 */
export const DNA_SIMPLE: ScoringMatrix = {
  A: { A: 5, C: -4, G: -4, T: -4, U: -4, N: -4 },
  C: { A: -4, C: 5, G: -4, T: -4, U: -4, N: -4 },
  G: { A: -4, C: -4, G: 5, T: -4, U: -4, N: -4 },
  T: { A: -4, C: -4, G: -4, T: 5, U: 5, N: -4 },
  U: { A: -4, C: -4, G: -4, T: 5, U: 5, N: -4 },
  N: { A: -4, C: -4, G: -4, T: -4, U: -4, N: -4 },
};

/**
 * Transition/transversion DNA scoring matrix.
 * Match: +5, Transition (A↔G, C↔T): -1, Transversion: -4
 */
export const DNA_FULL: ScoringMatrix = {
  A: { A: 5, C: -4, G: -1, T: -4, U: -4, N: -4 },
  C: { A: -4, C: 5, G: -4, T: -1, U: -1, N: -4 },
  G: { A: -1, C: -4, G: 5, T: -4, U: -4, N: -4 },
  T: { A: -4, C: -1, G: -4, T: 5, U: 5, N: -4 },
  U: { A: -4, C: -1, G: -4, T: 5, U: 5, N: -4 },
  N: { A: -4, C: -4, G: -4, T: -4, U: -4, N: -4 },
};

/**
 * Registry of all available scoring matrices.
 */
export const MATRICES: Record<string, ScoringMatrix> = {
  BLOSUM62,
  BLOSUM80,
  PAM250,
  DNA_SIMPLE,
  DNA_FULL,
};

/**
 * Get a scoring matrix by name.
 * 
 * @param name - Name of the scoring matrix (case-insensitive).
 * @returns The requested scoring matrix.
 * 
 * @throws {Error} If the matrix name is not recognized.
 * 
 * @example
 * ```typescript
 * const blosum62 = getMatrix('BLOSUM62');
 * const pam250 = getMatrix('pam250'); // Case-insensitive
 * ```
 */
export function getMatrix(name: string): ScoringMatrix {
  const normalized = name.toUpperCase();
  const matrix = MATRICES[normalized];

  if (!matrix) {
    throw new Error(
      `Unknown scoring matrix: ${name}. ` +
        `Available matrices: ${Object.keys(MATRICES).join(', ')}`
    );
  }

  return matrix;
}

/**
 * Get the score for aligning two characters using a scoring matrix.
 * 
 * @param matrix - The scoring matrix to use.
 * @param char1 - First character (will be normalized to uppercase).
 * @param char2 - Second character (will be normalized to uppercase).
 * @returns The alignment score, or 0 if either character is not in the matrix.
 * 
 * @example
 * ```typescript
 * const score = getScore(BLOSUM62, 'A', 'A'); // 4
 * const score2 = getScore(BLOSUM62, 'A', 'R'); // -1
 * ```
 */
export function getScore(
  matrix: ScoringMatrix,
  char1: string,
  char2: string
): number {
  const c1 = char1.toUpperCase();
  const c2 = char2.toUpperCase();

  if (!matrix[c1] || !matrix[c1][c2]) {
    return 0;
  }

  return matrix[c1][c2];
}
