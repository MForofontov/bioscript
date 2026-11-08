/**
 * Browser-compatible sequence translation using Web Streams API
 * Optimized for large sequences with streaming support
 */

import { getTable } from './tables';
import {
  buildLookup as buildOptimizedLookup,
  translateWithLookup as translateFrame,
} from './lookup';
import { reverseComplement } from '@bioscript/seq-utils';

/**
 * Translation options for browser translation
 */
export interface BrowserTranslationOptions {
  /** Codon table name or NCBI number (default: 'standard') */
  table?: string;
  /** Symbol for stop codon (default: '*') */
  stopSymbol?: string;
  /** If true, translation stops at first stop codon (default: true) */
  breakOnStop?: boolean;
  /** If true, returns all 6 reading frames (3 forward + 3 reverse) (default: false) */
  allFrames?: boolean;
  /** If true, also translate reverse complement (default: false) */
  includeReverse?: boolean;
  /** Chunk size for processing large sequences (default: 10000) */
  chunkSize?: number;
}

/**
 * Result of translation operation
 */
export interface TranslationResult {
  /** Translated protein sequence */
  sequence: string;
  /** Reading frame (0-2 for forward, 3-5 for reverse) */
  frame: number;
  /** Whether this is from reverse complement */
  isReverse: boolean;
  /** Original sequence length */
  sourceLength: number;
}

/**
 * Translate a sequence in the browser
 * Handles large sequences efficiently
 *
 * @example
 * ```typescript
 * const result = translateBrowser('ATGGCCAAA', { table: 'standard' });
 * console.log(result[0].sequence); // 'MAK'
 * ```
 */
export function translateBrowser(
  sequence: string,
  options: BrowserTranslationOptions = {}
): TranslationResult[] {
  const {
    table = 'standard',
    stopSymbol = '*',
    breakOnStop = true,
    allFrames = false,
    includeReverse = false,
  } = options;

  const codonTable = getTable(table);
  const lookup = buildOptimizedLookup(codonTable);
  const results: TranslationResult[] = [];
  const seq = sequence.trim().toUpperCase();

  // Translate forward frames
  const framesToTranslate = allFrames ? [0, 1, 2] : [0];

  for (const frame of framesToTranslate) {
    const translated = translateFrame(seq, lookup, stopSymbol, breakOnStop, frame);
    results.push({
      sequence: translated,
      frame,
      isReverse: false,
      sourceLength: seq.length,
    });
  }

  // Translate reverse complement if requested
  if (includeReverse) {
    const revSeq = reverseComplement(seq);
    const reverseFrames = allFrames ? [0, 1, 2] : [0];

    for (const frame of reverseFrames) {
      const translated = translateFrame(revSeq, lookup, stopSymbol, breakOnStop, frame);
      results.push({
        sequence: translated,
        frame: frame + 3,
        isReverse: true,
        sourceLength: revSeq.length,
      });
    }
  }

  return results;
}

/**
 * Translate sequence from a File or Blob in chunks
 * Ideal for very large sequences (> 100MB)
 *
 * @example
 * ```typescript
 * const file = document.querySelector('input[type="file"]').files[0];
 *
 * for await (const chunk of translateBrowserStreaming(file, { table: 'standard' })) {
 *   console.log(`Translated chunk: ${chunk.sequence.slice(0, 50)}...`);
 * }
 * ```
 */
export async function* translateBrowserStreaming(
  file: File | Blob,
  options: BrowserTranslationOptions = {}
): AsyncGenerator<TranslationResult> {
  const { table = 'standard', stopSymbol = '*', breakOnStop = true, chunkSize = 10000 } = options;
  if (!Number.isSafeInteger(chunkSize) || chunkSize <= 0)
    throw new Error('chunkSize must be a positive integer');
  const lookup = buildOptimizedLookup(getTable(table));
  const targetSize = Math.max(3, Math.floor(chunkSize / 3) * 3);
  let stream = file.stream();
  if (typeof File !== 'undefined' && file instanceof File && file.name.endsWith('.gz'))
    stream = stream.pipeThrough(new DecompressionStream('gzip'));
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let completed = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += (done ? decoder.decode() : decoder.decode(value, { stream: true })).toUpperCase();
      completed = done;
      while (buffer.length >= targetSize || (done && buffer.length >= 3)) {
        const length = Math.min(targetSize, Math.floor(buffer.length / 3) * 3);
        let chunk = buffer.slice(0, length);
        buffer = buffer.slice(length);
        let stopped = false;
        if (breakOnStop) {
          for (let i = 0; i < chunk.length; i += 3) {
            if (lookup.get(chunk.slice(i, i + 3)) === '*') {
              chunk = chunk.slice(0, i + 3);
              stopped = true;
              break;
            }
          }
        }
        const translated = translateFrame(chunk, lookup, stopSymbol, breakOnStop);
        if (translated.length)
          yield { sequence: translated, frame: 0, isReverse: false, sourceLength: chunk.length };
        if (stopped) return;
      }
      if (done) break;
    }
  } finally {
    try {
      if (!completed) await reader.cancel();
    } finally {
      reader.releaseLock();
    }
  }
}

/**
 * Batch translate multiple sequences efficiently
 * Reuses lookup table for better performance
 *
 * @example
 * ```typescript
 * const sequences = ['ATGGCC', 'ATGTAA', 'ATGCCC'];
 * const results = translateBrowserBatch(sequences, { table: 'standard' });
 * results.forEach((r, i) => console.log(`Seq ${i}: ${r[0].sequence}`));
 * ```
 */
export function translateBrowserBatch(
  sequences: string[],
  options: BrowserTranslationOptions = {}
): TranslationResult[][] {
  const {
    table = 'standard',
    stopSymbol = '*',
    breakOnStop = true,
    allFrames = false,
    includeReverse = false,
  } = options;

  const codonTable = getTable(table);
  const lookup = buildOptimizedLookup(codonTable);

  return sequences.map((seq) => {
    const results: TranslationResult[] = [];
    const normalized = seq.trim().toUpperCase();

    const framesToTranslate = allFrames ? [0, 1, 2] : [0];

    for (const frame of framesToTranslate) {
      const translated = translateFrame(normalized, lookup, stopSymbol, breakOnStop, frame);
      results.push({
        sequence: translated,
        frame,
        isReverse: false,
        sourceLength: normalized.length,
      });
    }

    if (includeReverse) {
      const revSeq = reverseComplement(normalized);
      const reverseFrames = allFrames ? [0, 1, 2] : [0];

      for (const frame of reverseFrames) {
        const translated = translateFrame(revSeq, lookup, stopSymbol, breakOnStop, frame);
        results.push({
          sequence: translated,
          frame: frame + 3,
          isReverse: true,
          sourceLength: revSeq.length,
        });
      }
    }

    return results;
  });
}
