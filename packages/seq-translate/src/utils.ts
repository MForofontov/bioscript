/**
 * Sequence utility functions
 * DNA/RNA conversion and complement operations
 */

/**
 * Convert DNA sequence to RNA (T → U)
 */
export function dnaToRna(seq: string): string {
  return seq.replace(/T/g, 'U').replace(/t/g, 'u');
}

/**
 * Convert RNA sequence to DNA (U → T)
 */
export function rnaToDna(seq: string): string {
  return seq.replace(/U/g, 'T').replace(/u/g, 't');
}

/**
 * Get complement of a nucleotide sequence
 */
export function complement(seq: string): string {
  // Detect if input is RNA or DNA
  const isRNA = seq.includes('U') || seq.includes('u');

  return seq
    .split('')
    .map((b) => {
      if (isRNA) {
        // For RNA: A<->U, G<->C
        if (b === 'A') return 'U';
        if (b === 'U') return 'A';
        if (b === 'a') return 'u';
        if (b === 'u') return 'a';
        if (b === 'G') return 'C';
        if (b === 'C') return 'G';
        if (b === 'g') return 'c';
        if (b === 'c') return 'g';
        if (b === 'N' || b === 'n') return b;
        return b;
      } else {
        // For DNA: A<->T, G<->C
        if (b === 'A') return 'T';
        if (b === 'T') return 'A';
        if (b === 'a') return 't';
        if (b === 't') return 'a';
        if (b === 'G') return 'C';
        if (b === 'C') return 'G';
        if (b === 'g') return 'c';
        if (b === 'c') return 'g';
        if (b === 'N' || b === 'n') return b;
        return b;
      }
    })
    .join('');
}

/**
 * Get reverse complement of a nucleotide sequence
 */
export function reverseComplement(seq: string): string {
  return complement(seq).split('').reverse().join('');
}
