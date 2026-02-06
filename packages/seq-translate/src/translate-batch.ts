/**
 * Batch translation for multiple sequences
 * Optimized by reusing lookup table
 */

import { getTable } from './tables';
import { buildLookup, translateWithLookup } from './lookup';
import type { TranslationOptions } from './translate';

/**
 * Batch translate multiple sequences efficiently
 * Reuses lookup table for better performance
 *
 * @param sequences - Array of nucleotide sequences
 * @param options - Translation options
 * @returns Array of translated protein sequences
 *
 * @example
 * ```typescript
 * const proteins = translateBatch(['ATGGCC', 'ATGTAA'], { table: 'standard' });
 * console.log(proteins); // ['MA', 'M*']
 * ```
 */
export function translateBatch(sequences: string[], options: TranslationOptions = {}): string[] {
  const { table = 'standard', stopSymbol = '*', breakOnStop = true } = options;

  const codonTable = getTable(table);
  const lookup = buildLookup(codonTable);

  return sequences.map((seq) => {
    const normalized = seq.trim().toUpperCase();
    return translateWithLookup(normalized, lookup, stopSymbol, breakOnStop);
  });
}
