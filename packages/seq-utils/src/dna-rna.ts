/**
 * DNA and RNA sequence conversion utilities
 */

/**
 * Convert DNA sequence to RNA by replacing thymine (T) with uracil (U).
 * Preserves case and non-nucleotide characters.
 *
 * @param sequence - DNA sequence to convert
 * @returns RNA sequence with T replaced by U
 *
 * @example
 * ```typescript
 * dnaToRna('ATGC'); // 'AUGC'
 * dnaToRna('atgc'); // 'augc' (case preserved)
 * dnaToRna('ATGCN'); // 'AUGCN' (N preserved)
 * ```
 *
 * @performance O(n) time, O(n) space
 */
export function dnaToRna(sequence: string): string {
  return sequence.replace(/T/g, 'U').replace(/t/g, 'u');
}

/**
 * Convert RNA sequence to DNA by replacing uracil (U) with thymine (T).
 * Preserves case and non-nucleotide characters.
 *
 * @param sequence - RNA sequence to convert
 * @returns DNA sequence with U replaced by T
 *
 * @example
 * ```typescript
 * rnaToDna('AUGC'); // 'ATGC'
 * rnaToDna('augc'); // 'atgc' (case preserved)
 * rnaToDna('AUGCN'); // 'ATGCN' (N preserved)
 * ```
 *
 * @performance O(n) time, O(n) space
 */
export function rnaToDna(sequence: string): string {
  return sequence.replace(/U/g, 'T').replace(/u/g, 't');
}
