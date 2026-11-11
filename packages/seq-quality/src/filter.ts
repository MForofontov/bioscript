/**
 * FASTQ record filters.
 */

import type { FastqRecord } from '@bioscript/seq-stream';
import { QualityEncoding } from '@bioscript/seq-stream';
import { meanQuality } from './encode';

/**
 * Keep records with length in [minLen, maxLen] (maxLen optional).
 */
export function filterByLength(
  records: FastqRecord[],
  minLen: number,
  maxLen: number = Infinity
): FastqRecord[] {
  if (minLen < 0) throw new Error('minLen must be >= 0');
  return records.filter((r) => r.sequence.length >= minLen && r.sequence.length <= maxLen);
}

/**
 * Keep records with mean Phred quality >= minMean.
 */
export function filterByMeanQuality(
  records: FastqRecord[],
  minMean: number,
  encoding: QualityEncoding = QualityEncoding.Phred33
): FastqRecord[] {
  return records.filter((r) => meanQuality(r.quality, encoding) >= minMean);
}

/**
 * Keep records whose N (or n) fraction is <= maxNFraction (0–1).
 */
export function filterByNContent(
  records: FastqRecord[],
  maxNFraction: number
): FastqRecord[] {
  if (maxNFraction < 0 || maxNFraction > 1) {
    throw new Error('maxNFraction must be in [0, 1]');
  }
  return records.filter((r) => {
    if (r.sequence.length === 0) return maxNFraction >= 0;
    let n = 0;
    for (const b of r.sequence) {
      if (b === 'N' || b === 'n') n++;
    }
    return n / r.sequence.length <= maxNFraction;
  });
}
