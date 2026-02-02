/**
 * Browser-compatible sequence translation using Web Streams API
 * Optimized for large sequences with streaming support
 */

import { getTable, type CodonTable } from './tables';

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
 * Build optimized lookup table for fast codon translation
 * Supports both RNA (U) and DNA (T) codons
 */
function buildOptimizedLookup(table: CodonTable): Map<string, string> {
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
 * Translate a single reading frame efficiently
 */
function translateFrame(
  seq: string,
  lookup: Map<string, string>,
  stopSymbol: string,
  breakOnStop: boolean,
  frameOffset: number = 0
): string {
  const start = frameOffset;
  const result: string[] = [];

  for (let i = start; i + 3 <= seq.length; i += 3) {
    const codon = seq.slice(i, i + 3).toUpperCase();
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

/**
 * Get reverse complement of a sequence
 */
function reverseComplement(seq: string): string {
  const complement: Record<string, string> = {
    A: 'T',
    T: 'A',
    G: 'C',
    C: 'G',
    a: 't',
    t: 'a',
    g: 'c',
    c: 'g',
    U: 'A',
    u: 'a',
    N: 'N',
    n: 'n',
  };

  return seq
    .split('')
    .reverse()
    .map((b) => complement[b] ?? b)
    .join('');
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

  const codonTable = getTable(table);
  const lookup = buildOptimizedLookup(codonTable);
  const textDecoder = new TextDecoder('utf-8');

  // Handle gzip decompression if needed
  let stream: ReadableStream<Uint8Array>;
  if (file instanceof File && file.name.endsWith('.gz')) {
    stream = file.stream().pipeThrough(new DecompressionStream('gzip'));
  } else {
    stream = file.stream();
  }

  const reader = stream.getReader();
  let buffer = '';
  let remainder = '';
  let stopped = false;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Process final buffer
        if (remainder.length >= 3 && !stopped) {
          const translated = translateFrame(remainder, lookup, stopSymbol, breakOnStop);
          if (translated.length > 0) {
            yield {
              sequence: translated,
              frame: 0,
              isReverse: false,
              sourceLength: remainder.length,
            };
          }
        }
        break;
      }

      buffer += textDecoder.decode(value, { stream: true });

      // Process in chunks
      while (buffer.length >= chunkSize && !stopped) {
        const chunk = remainder + buffer.slice(0, chunkSize);

        // Keep codons aligned - process only complete triplets
        const processLength = Math.floor(chunk.length / 3) * 3;
        const toTranslate = chunk.slice(0, processLength);
        remainder = chunk.slice(processLength);

        const translated = translateFrame(toTranslate, lookup, stopSymbol, breakOnStop);

        if (translated.length > 0) {
          yield {
            sequence: translated,
            frame: 0,
            isReverse: false,
            sourceLength: toTranslate.length,
          };

          if (breakOnStop && translated.includes(stopSymbol)) {
            stopped = true;
            break;
          }
        }

        buffer = buffer.slice(chunkSize);
      }
    }
  } finally {
    reader.releaseLock();
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
