/**
 * Multiple reading frame translation
 * Useful for: ORF finding, gene prediction, annotation
 */

import { getTable } from './tables';
import { buildLookup, translateWithLookup } from './lookup';
import { reverseComplement } from '@bioscript/seq-utils';
import type { TranslationOptions } from './translate';

/**
 * Translate all three forward reading frames of a sequence
 *
 * @param seq - Nucleotide sequence
 * @param options - Translation options
 * @returns Array of three translations (frames 0, 1, 2)
 *
 * @example
 * ```typescript
 * const frames = translateAllFrames('ATGGCCAAATAA');
 * console.log(frames); // ['MAK*', 'WPN', 'GQI']
 * ```
 */
export function translateAllFrames(seq: string, options: TranslationOptions = {}): string[] {
  const { table = 'standard', stopSymbol = '*', breakOnStop = true } = options;

  const codonTable = getTable(table);
  const lookup = buildLookup(codonTable);
  const normalized = seq.trim().toUpperCase();

  return [0, 1, 2].map(frame =>
    translateWithLookup(normalized, lookup, stopSymbol, breakOnStop, frame)
  );
}

/**
 * Translate all six reading frames (3 forward + 3 reverse complement)
 * Essential for: comprehensive ORF detection, genome annotation
 *
 * @param seq - Nucleotide sequence
 * @param options - Translation options
 * @returns Array of six translations
 *
 * @example
 * ```typescript
 * const allFrames = translateSixFrames('ATGGCCAAA');
 * // Returns [forward_0, forward_1, forward_2, reverse_0, reverse_1, reverse_2]
 * ```
 */
export function translateSixFrames(seq: string, options: TranslationOptions = {}): string[] {
  const { table = 'standard', stopSymbol = '*', breakOnStop = true } = options;

  // Build lookup once for all 6 frames (optimization)
  const codonTable = getTable(table);
  const lookup = buildLookup(codonTable);

  const normalized = seq.trim().toUpperCase();
  const revComp = reverseComplement(normalized);

  const results: string[] = [];

  // Forward frames (0, 1, 2)
  for (let frame = 0; frame < 3; frame++) {
    results.push(translateWithLookup(normalized, lookup, stopSymbol, breakOnStop, frame));
  }

  // Reverse frames (3, 4, 5)
  for (let frame = 0; frame < 3; frame++) {
    results.push(translateWithLookup(revComp, lookup, stopSymbol, breakOnStop, frame));
  }

  return results;
}
