/**
 * Build optimized lookup table for codon translation
 */

import type { CodonTable } from './tables';

/**
 * Build optimized lookup table using Map for O(1) access
 * Supports both RNA (U) and DNA (T) codons
 */
export function buildLookup(table: CodonTable): Map<string, string> {
  const lookup = new Map<string, string>();

  for (const [codon, aa] of Object.entries(table)) {
    const normalized = codon.toUpperCase();
    lookup.set(normalized, aa);
    // Also add DNA equivalent (T instead of U)
    const dnaCodon = normalized.replace(/U/g, 'T');
    lookup.set(dnaCodon, aa);
  }

  return lookup;
}
