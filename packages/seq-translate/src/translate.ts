/**
 * Translation functions for nucleotide sequences.
 * Provides single sequence, multi-frame, and batch translation.
 *
 * @module translate
 */

import { getTable } from './tables';
import { buildLookup, translateWithLookup } from './lookup';
import { reverseComplement, normalizeSequence } from '@bioscript/seq-utils';

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
 * Translate a nucleotide sequence to amino acids.
 * Optimized with Map-based lookup for faster codon translation.
 *
 * @param seq - Nucleotide sequence (DNA or RNA).
 * @param options - Translation options.
 * @returns Translated protein sequence.
 *
 * @example
 * ```typescript
 * const protein = translateSequence('ATGGCCAAA', { table: 'standard' });
 * console.log(protein); // 'MAK'
 * ```
 *
 * @performance O(n) where n is sequence length. Processes ~1M codons/sec.
 */
export function translateSequence(seq: string, options: TranslationOptions = {}): string {
  const { table = 'standard', stopSymbol = '*', breakOnStop = true } = options;

  const codonTable = getTable(table);
  const lookup = buildLookup(codonTable);
  const normalized = normalizeSequence(seq);

  return translateWithLookup(normalized, lookup, stopSymbol, breakOnStop);
}

/**
 * Translate all three forward reading frames of a sequence.
 * Useful for ORF finding and gene prediction.
 *
 * @param seq - Nucleotide sequence.
 * @param options - Translation options.
 * @returns Array of three translations (frames 0, 1, 2).
 *
 * @example
 * ```typescript
 * const frames = translateAllFrames('ATGGCCAAATAA');
 * console.log(frames); // ['MAK*', 'WPN', 'GQI']
 * ```
 *
 * @performance O(n) where n is sequence length. 3x single translation cost.
 */
export function translateAllFrames(seq: string, options: TranslationOptions = {}): string[] {
  const { table = 'standard', stopSymbol = '*', breakOnStop = true } = options;

  const codonTable = getTable(table);
  const lookup = buildLookup(codonTable);
  const normalized = normalizeSequence(seq);

  return [0, 1, 2].map((frame) =>
    translateWithLookup(normalized, lookup, stopSymbol, breakOnStop, frame)
  );
}

/**
 * Translate all six reading frames (3 forward + 3 reverse complement).
 * Essential for comprehensive ORF detection and genome annotation.
 *
 * @param seq - Nucleotide sequence.
 * @param options - Translation options.
 * @returns Array of six translations [forward_0, forward_1, forward_2, reverse_0, reverse_1, reverse_2].
 *
 * @example
 * ```typescript
 * const allFrames = translateSixFrames('ATGGCCAAA');
 * // Returns 6 protein sequences from all reading frames
 * ```
 *
 * @performance O(n) where n is sequence length. 6x single translation cost + reverse complement.
 */
export function translateSixFrames(seq: string, options: TranslationOptions = {}): string[] {
  const { table = 'standard', stopSymbol = '*', breakOnStop = true } = options;

  // Build lookup once for all 6 frames (optimization)
  const codonTable = getTable(table);
  const lookup = buildLookup(codonTable);

  const normalized = normalizeSequence(seq);
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

/**
 * Batch translate multiple sequences efficiently.
 * Reuses lookup table for better performance when translating many sequences.
 *
 * @param sequences - Array of nucleotide sequences.
 * @param options - Translation options.
 * @returns Array of translated protein sequences.
 *
 * @example
 * ```typescript
 * const proteins = translateBatch(['ATGGCC', 'ATGTAA'], { table: 'standard' });
 * console.log(proteins); // ['MA', 'M*']
 * ```
 *
 * @example
 * ```typescript
 * // Process thousands of sequences efficiently
 * const genes = readGenes(); // Array of 10,000 sequences
 * const proteins = translateBatch(genes, { table: 'standard' });
 * ```
 *
 * @performance O(n*m) where n = number of sequences, m = avg sequence length.
 * Faster than individual translateSequence() calls due to shared lookup table.
 */
export function translateBatch(sequences: string[], options: TranslationOptions = {}): string[] {
  const { table = 'standard', stopSymbol = '*', breakOnStop = true } = options;

  const codonTable = getTable(table);
  const lookup = buildLookup(codonTable);

  return sequences.map((seq) => {
    const normalized = normalizeSequence(seq);
    return translateWithLookup(normalized, lookup, stopSymbol, breakOnStop);
  });
}
