/**
 * Nucleotide complement operations
 */

/** DNA complement map (case-preserving), including IUPAC ambiguity codes. */
const DNA_COMPLEMENT: Record<string, string> = {
  A: 'T',
  T: 'A',
  G: 'C',
  C: 'G',
  U: 'A', // treat U as T's complement partner when mixed into DNA
  R: 'Y',
  Y: 'R',
  S: 'S',
  W: 'W',
  K: 'M',
  M: 'K',
  B: 'V',
  D: 'H',
  H: 'D',
  V: 'B',
  N: 'N',
  a: 't',
  t: 'a',
  g: 'c',
  c: 'g',
  u: 'a',
  r: 'y',
  y: 'r',
  s: 's',
  w: 'w',
  k: 'm',
  m: 'k',
  b: 'v',
  d: 'h',
  h: 'd',
  v: 'b',
  n: 'n',
};

/** RNA complement map (case-preserving), including IUPAC ambiguity codes. */
const RNA_COMPLEMENT: Record<string, string> = {
  A: 'U',
  U: 'A',
  G: 'C',
  C: 'G',
  T: 'A', // treat T as U's complement partner when mixed into RNA
  R: 'Y',
  Y: 'R',
  S: 'S',
  W: 'W',
  K: 'M',
  M: 'K',
  B: 'V',
  D: 'H',
  H: 'D',
  V: 'B',
  N: 'N',
  a: 'u',
  u: 'a',
  g: 'c',
  c: 'g',
  t: 'a',
  r: 'y',
  y: 'r',
  s: 's',
  w: 'w',
  k: 'm',
  m: 'k',
  b: 'v',
  d: 'h',
  h: 'd',
  v: 'b',
  n: 'n',
};

/**
 * Calculate the complement of a nucleotide sequence.
 *
 * Mode selection:
 * - Pure RNA (has U/u, no T/t) → RNA complements (A↔U)
 * - Otherwise → DNA complements (A↔T); U/u in mixed input maps as T would
 *
 * Preserves case, handles IUPAC ambiguity codes, and preserves unknown characters.
 *
 * @param sequence - DNA or RNA sequence
 * @returns Complement sequence
 */
export function complement(sequence: string): string {
  const hasU = /[Uu]/.test(sequence);
  const hasT = /[Tt]/.test(sequence);
  // Only treat as RNA when U is present without T (avoid breaking mixed T+U)
  const map = hasU && !hasT ? RNA_COMPLEMENT : DNA_COMPLEMENT;

  let out = '';
  for (const base of sequence) {
    out += map[base] ?? base;
  }
  return out;
}
