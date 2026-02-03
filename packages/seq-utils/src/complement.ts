/**
 * Nucleotide complement operations
 */

/**
 * Calculate the complement of a nucleotide sequence.
 * Automatically detects DNA or RNA based on presence of U/u characters.
 *
 * For DNA: A↔T, G↔C
 * For RNA: A↔U, G↔C
 *
 * Preserves case, handles ambiguous bases (N), and preserves unknown characters.
 *
 * @param sequence - DNA or RNA sequence
 * @returns Complement sequence
 *
 * @example
 * ```typescript
 * // DNA complement
 * complement('ATGC'); // 'TACG'
 * complement('atgc'); // 'tacg' (case preserved)
 *
 * // RNA complement (auto-detected from U)
 * complement('AUGC'); // 'UACG'
 * complement('augc'); // 'uacg'
 *
 * // Handles ambiguous bases
 * complement('ATGCN'); // 'TACGN'
 *
 * // Preserves unknown characters
 * complement('ATGCXYZ'); // 'TACGXYZ'
 * ```
 *
 * @performance O(n) time, O(n) space
 */
export function complement(sequence: string): string {
  // Detect if input is RNA or DNA
  const isRNA = sequence.includes('U') || sequence.includes('u');

  return sequence
    .split('')
    .map((base) => {
      if (isRNA) {
        // RNA complement: A↔U, G↔C
        if (base === 'A') return 'U';
        if (base === 'U') return 'A';
        if (base === 'a') return 'u';
        if (base === 'u') return 'a';
        if (base === 'G') return 'C';
        if (base === 'C') return 'G';
        if (base === 'g') return 'c';
        if (base === 'c') return 'g';
        if (base === 'N' || base === 'n') return base;
        return base; // Preserve unknown characters
      } else {
        // DNA complement: A↔T, G↔C
        if (base === 'A') return 'T';
        if (base === 'T') return 'A';
        if (base === 'a') return 't';
        if (base === 't') return 'a';
        if (base === 'G') return 'C';
        if (base === 'C') return 'G';
        if (base === 'g') return 'c';
        if (base === 'c') return 'g';
        if (base === 'N' || base === 'n') return base;
        return base; // Preserve unknown characters
      }
    })
    .join('');
}
