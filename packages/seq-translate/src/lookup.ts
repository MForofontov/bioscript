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

/**
 * Internal translation helper using pre-built lookup table.
 * Used by all translation functions to avoid code duplication.
 *
 * @internal
 */
export function translateWithLookup(
  seq: string,
  lookup: Map<string, string>,
  stopSymbol: string = '*',
  breakOnStop: boolean = true,
  frameOffset: number = 0
): string {
  const result: string[] = [];

  for (let i = frameOffset; i + 3 <= seq.length; i += 3) {
    const codon = seq.slice(i, i + 3);
    const aa = lookup.get(codon) ?? 'X';

    if (aa === '*') {
      result.push(stopSymbol);
      if (breakOnStop) break;
    } else {
      result.push(aa);
    }
  }

  return result.join('');
}
