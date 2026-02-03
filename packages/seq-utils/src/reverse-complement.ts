/**
 * Reverse complement operations
 */

import { complement } from './complement';

/**
 * Calculate the reverse complement of a nucleotide sequence.
 * Combines complement and reverse operations.
 *
 * For DNA: Reverse + A↔T, G↔C
 * For RNA: Reverse + A↔U, G↔C
 *
 * This is commonly used in bioinformatics to analyze the opposite strand
 * of double-stranded DNA/RNA.
 *
 * @param sequence - DNA or RNA sequence
 * @returns Reverse complement sequence
 *
 * @example
 * ```typescript
 * // DNA reverse complement
 * reverseComplement('ATGC'); // 'GCAT'
 * reverseComplement('atgc'); // 'gcat' (case preserved)
 *
 * // RNA reverse complement
 * reverseComplement('AUGC'); // 'GCAU'
 *
 * // Palindromic sequences
 * reverseComplement('GCGC'); // 'GCGC' (unchanged)
 * ```
 *
 * @performance O(n) time, O(n) space
 */
export function reverseComplement(sequence: string): string {
  return complement(sequence).split('').reverse().join('');
}
