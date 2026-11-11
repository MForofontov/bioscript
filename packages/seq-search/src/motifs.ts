/**
 * Motif helpers built on findPattern / IUPAC.
 */

import { assertString, normalizeSequence } from '@bioscript/seq-utils';
import { findPattern, type FindPatternOptions, type PatternHit } from './find';

export interface ConsensusOptions extends FindPatternOptions {
  /** Minimum fraction of sequences that must match a base (default: 1.0 exact) */
  threshold?: number;
}

/**
 * Find IUPAC motif occurrences.
 */
export function findMotif(
  sequence: string,
  motif: string,
  options: Omit<FindPatternOptions, 'iupac'> = {}
): PatternHit[] {
  return findPattern(sequence, motif, { ...options, iupac: true });
}

/**
 * Find exact literal substring matches.
 */
export function findExact(
  sequence: string,
  pattern: string,
  options: Omit<FindPatternOptions, 'iupac'> = {}
): PatternHit[] {
  return findPattern(sequence, pattern, { ...options, iupac: false });
}

/**
 * Build a simple consensus string from equal-length aligned sequences.
 * Uses IUPAC ambiguity when bases disagree (N if fully mixed).
 */
/**
 * Build consensus IUPAC motif from equal-length sequences.
 * Only A/C/G/T bases are counted; ambiguous bases (N, IUPAC codes) are ignored.
 */
export function findConsensus(sequences: string[], threshold = 0.5): string {
  if (!Array.isArray(sequences) || sequences.length === 0) {
    throw new Error('sequences must be a non-empty array');
  }
  const normalized = sequences.map((s) => {
    assertString(s, 'sequence');
    return normalizeSequence(s);
  });
  const len = normalized[0].length;
  if (normalized.some((s) => s.length !== len)) {
    throw new Error('all sequences must have equal length');
  }
  if (threshold <= 0 || threshold > 1) {
    throw new Error('threshold must be in (0, 1]');
  }

  const iupacFromSet = (bases: Set<string>): string => {
    const key = [...bases].sort().join('');
    const map: Record<string, string> = {
      A: 'A',
      C: 'C',
      G: 'G',
      T: 'T',
      AG: 'R',
      CT: 'Y',
      GC: 'S',
      AT: 'W',
      GT: 'K',
      AC: 'M',
      CGT: 'B',
      AGT: 'D',
      ACT: 'H',
      ACG: 'V',
      ACGT: 'N',
    };
    return map[key] ?? 'N';
  };

  let consensus = '';
  for (let i = 0; i < len; i++) {
    const counts: Record<string, number> = { A: 0, C: 0, G: 0, T: 0 };
    for (const seq of normalized) {
      const b = seq[i];
      if (b in counts) counts[b]++;
    }
    const total = normalized.length;
    const present = new Set<string>();
    for (const [base, count] of Object.entries(counts)) {
      if (count / total >= threshold) present.add(base);
    }
    if (present.size === 0) {
      // fallback: take max count bases
      const max = Math.max(...Object.values(counts));
      for (const [base, count] of Object.entries(counts)) {
        if (count === max && max > 0) present.add(base);
      }
    }
    consensus += present.size === 0 ? 'N' : iupacFromSet(present);
  }
  return consensus;
}
