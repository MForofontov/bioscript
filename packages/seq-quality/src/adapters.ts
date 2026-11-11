/**
 * Adapter trimming helpers.
 */

import type { FastqRecord } from '@bioscript/seq-stream';
import { assertString, normalizeSequence } from '@bioscript/seq-utils';

/** Common Illumina adapter sequences (partial) */
export const ILLUMINA_ADAPTERS = {
  TruSeqUniversal: 'AGATCGGAAGAGCACACGTCTGAACTCCAGTCA',
  TruSeqIndexed: 'AGATCGGAAGAGCGTCGTGTAGGGAAAGAGTGT',
  NexteraTransposase: 'CTGTCTCTTATACACATCT',
} as const;

function hamming(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  let d = 0;
  for (let i = 0; i < n; i++) {
    if (a[i] !== b[i]) d++;
  }
  return d + Math.abs(a.length - b.length);
}

/**
 * Find earliest adapter match (exact or within maxMismatch) and trim from there.
 */
export function trimAdapter(
  record: FastqRecord,
  adapter: string,
  options: { maxMismatch?: number; minOverlap?: number } = {}
): FastqRecord {
  assertString(adapter, 'adapter');
  const { maxMismatch = 0, minOverlap = 5 } = options;
  const seq = record.sequence.toUpperCase();
  const ad = normalizeSequence(adapter);

  let cut = seq.length;
  for (let i = 0; i <= seq.length - minOverlap; i++) {
    const window = seq.slice(i, i + ad.length);
    const target = ad.slice(0, window.length);
    if (window.length < minOverlap) continue;
    if (hamming(window, target) <= maxMismatch) {
      cut = i;
      break;
    }
  }

  return {
    ...record,
    sequence: record.sequence.slice(0, cut),
    quality: record.quality.slice(0, cut),
  };
}

/**
 * Trim using the first matching adapter from a list.
 */
export function trimAdapters(
  record: FastqRecord,
  adapters: string[] = Object.values(ILLUMINA_ADAPTERS),
  options: { maxMismatch?: number; minOverlap?: number } = {}
): FastqRecord {
  let best = record;
  for (const adapter of adapters) {
    const trimmed = trimAdapter(record, adapter, options);
    if (trimmed.sequence.length < best.sequence.length) {
      best = trimmed;
    }
  }
  return best;
}
