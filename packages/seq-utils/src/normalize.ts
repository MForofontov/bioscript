/**
 * Sequence normalization utilities.
 * Provides standardized sequence preparation and conversion functions.
 *
 * @module normalize
 */

import { rnaToDna, dnaToRna } from './dna-rna';
export { rnaToDna, dnaToRna };
/**
 * Normalize a sequence for processing: trim whitespace and convert to uppercase.
 * This is the most common normalization pattern used across bioscript packages.
 *
 * @param sequence - DNA/RNA sequence to normalize
 * @returns Normalized sequence (trimmed and uppercased)
 *
 * @example
 * ```typescript
 * normalizeSequence('  atcg  '); // 'ATCG'
 * normalizeSequence('AtGc'); // 'ATGC'
 * normalizeSequence('ATCG'); // 'ATGC' (idempotent)
 * ```
 *
 * @performance O(n) time, O(n) space
 */
export function normalizeSequence(sequence: string): string {
  return sequence.trim().toUpperCase();
}

/**
 * Normalize sequence to DNA format: trim, uppercase, and convert U to T.
 * This is the standard normalization for DNA-based algorithms.
 *
 * @param sequence - DNA or RNA sequence
 * @returns Normalized DNA sequence
 *
 * @example
 * ```typescript
 * normalizeToDna('  augc  '); // 'ATGC'
 * normalizeToDna('AUGC'); // 'ATGC'
 * normalizeToDna('atgc'); // 'ATGC'
 * ```
 *
 * @performance O(n) time, O(n) space
 */
export function normalizeToDna(sequence: string): string {
  return normalizeSequence(sequence).replace(/U/g, 'T');
}

/**
 * Normalize sequence to RNA format: trim, uppercase, and convert T to U.
 * This is the standard normalization for RNA-based algorithms.
 *
 * @param sequence - DNA or RNA sequence
 * @returns Normalized RNA sequence
 *
 * @example
 * ```typescript
 * normalizeToRna('  atgc  '); // 'AUGC'
 * normalizeToRna('ATGC'); // 'AUGC'
 * normalizeToRna('augc'); // 'AUGC'
 * ```
 *
 * @performance O(n) time, O(n) space
 */
export function normalizeToRna(sequence: string): string {
  return normalizeSequence(sequence).replace(/T/g, 'U');
}

/**
 * Detect if a sequence is RNA based on presence of U characters.
 * Useful for automatic format detection.
 *
 * @param sequence - Sequence to check
 * @returns true if sequence contains U (RNA), false otherwise (DNA)
 *
 * @example
 * ```typescript
 * isRna('AUGC'); // true
 * isRna('ATGC'); // false
 * isRna('augc'); // true (case-insensitive)
 * ```
 */
export function isRna(sequence: string): boolean {
  return sequence.includes('U') || sequence.includes('u');
}

/**
 * Detect if a sequence is DNA based on presence of T characters.
 * Useful for automatic format detection.
 *
 * @param sequence - Sequence to check
 * @returns true if sequence contains T (DNA), false otherwise (RNA)
 *
 * @example
 * ```typescript
 * isDna('ATGC'); // true
 * isDna('AUGC'); // false
 * isDna('atgc'); // true (case-insensitive)
 * ```
 */
export function isDna(sequence: string): boolean {
  return sequence.includes('T') || sequence.includes('t');
}
