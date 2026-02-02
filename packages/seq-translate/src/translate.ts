/**
 * Core translation function
 * Single responsibility: translate one sequence
 */

import { getTable } from './tables';
import { buildLookup } from './lookup';

/**
 * Translation options
 */
export interface TranslationOptions {
  /** Codon table name or NCBI number (default: 'standard') */
  table?: string;
  /** Symbol for stop codon (default: '*') */
  stopSymbol?: string;
  /** If true, translation stops at first stop codon (default: true) */
  breakOnStop?: boolean;
}

/**
 * Translate a nucleotide sequence to amino acids
 * Optimized with Map-based lookup for faster codon translation
 *
 * @param seq - Nucleotide sequence (DNA or RNA)
 * @param options - Translation options
 * @returns Translated protein sequence
 *
 * @example
 * ```typescript
 * const protein = translateSequence('ATGGCCAAA', { table: 'standard' });
 * console.log(protein); // 'MAK'
 * ```
 */
export function translateSequence(seq: string, options: TranslationOptions = {}): string {
  const { table = 'standard', stopSymbol = '*', breakOnStop = true } = options;

  const codonTable = getTable(table);
  const lookup = buildLookup(codonTable);
  const normalized = seq.trim().toUpperCase();
  const result: string[] = [];

  for (let i = 0; i + 3 <= normalized.length; i += 3) {
    const codon = normalized.slice(i, i + 3);
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
