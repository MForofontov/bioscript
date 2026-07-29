/**
 * IUPAC ambiguity code helpers for motif → regex expansion.
 */

const IUPAC_DNA: Record<string, string> = {
  A: 'A',
  C: 'C',
  G: 'G',
  T: 'T',
  U: 'T',
  R: 'AG',
  Y: 'CT',
  S: 'GC',
  W: 'AT',
  K: 'GT',
  M: 'AC',
  B: 'CGT',
  D: 'AGT',
  H: 'ACT',
  V: 'ACG',
  N: 'ACGT',
};

/**
 * Validate that a motif contains only IUPAC nucleotide codes.
 */
export function isValidIupacMotif(motif: string): boolean {
  if (typeof motif !== 'string' || motif.length === 0) return false;
  return /^[ACGTURYSWKMBDHVN]+$/i.test(motif);
}

/**
 * Assert motif is a non-empty IUPAC string.
 */
export function assertIupacMotif(motif: string): void {
  if (typeof motif !== 'string') {
    throw new TypeError('motif must be a string');
  }
  if (!isValidIupacMotif(motif)) {
    throw new Error(`invalid IUPAC motif: ${motif}`);
  }
}

/**
 * Expand an IUPAC motif into a case-insensitive RegExp over DNA alphabet (U→T).
 */
export function iupacToRegex(motif: string, flags = 'gi'): RegExp {
  assertIupacMotif(motif);
  const parts: string[] = [];
  for (const ch of motif.toUpperCase()) {
    const bases = IUPAC_DNA[ch];
    if (!bases) {
      throw new Error(`unsupported IUPAC code: ${ch}`);
    }
    parts.push(bases.length === 1 ? bases : `[${bases}]`);
  }
  return new RegExp(parts.join(''), flags);
}

/**
 * Expand one IUPAC character to matching DNA bases.
 */
export function expandIupacBase(code: string): string {
  if (typeof code !== 'string' || code.length !== 1) {
    throw new TypeError('code must be a single character');
  }
  const bases = IUPAC_DNA[code.toUpperCase()];
  if (!bases) {
    throw new Error(`unsupported IUPAC code: ${code}`);
  }
  return bases;
}
