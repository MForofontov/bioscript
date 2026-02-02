/**
 * Multiple reading frame translation
 * Useful for: ORF finding, gene prediction, annotation
 */

import { getTable } from './tables';
import { buildLookup } from './lookup';
import { reverseComplement } from './utils';
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
  const results: string[] = [];

  for (let frame = 0; frame < 3; frame++) {
    const frameSeq: string[] = [];
    for (let i = frame; i + 3 <= normalized.length; i += 3) {
      const codon = normalized.slice(i, i + 3);
      const aa = lookup.get(codon) ?? 'X';

      if (aa === '*') {
        frameSeq.push(stopSymbol);
        if (breakOnStop) break;
      } else {
        frameSeq.push(aa);
      }
    }
    results.push(frameSeq.join(''));
  }

  return results;
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
  const forward = translateAllFrames(seq, options);
  const reverse = translateAllFrames(reverseComplement(seq), options);
  return [...forward, ...reverse];
}
