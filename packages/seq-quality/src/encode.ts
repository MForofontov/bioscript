/**
 * Phred quality helpers.
 */

import {
  QualityEncoding,
  decodeQualityScores,
  type FastqRecord,
} from '@bioscript/seq-stream';
import { assertString } from '@bioscript/seq-utils';

export { QualityEncoding };

/**
 * Mean Phred quality of a quality string.
 */
export function meanQuality(
  quality: string,
  encoding: QualityEncoding = QualityEncoding.Phred33
): number {
  assertString(quality, 'quality');
  if (quality.length === 0) return 0;
  const scores = decodeQualityScores(quality, encoding);
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Minimum Phred quality in a quality string.
 */
export function minQuality(
  quality: string,
  encoding: QualityEncoding = QualityEncoding.Phred33
): number {
  assertString(quality, 'quality');
  if (quality.length === 0) return 0;
  return Math.min(...decodeQualityScores(quality, encoding));
}

/**
 * Heuristic encoding detection from ASCII range of quality characters.
 * Returns Phred33 for typical Illumina 1.8+ / Sanger; Phred64 if chars suggest older Illumina.
 */
export function detectQualityEncoding(quality: string): QualityEncoding {
  assertString(quality, 'quality');
  if (quality.length === 0) return QualityEncoding.Phred33;
  let min = 255;
  let max = 0;
  for (const ch of quality) {
    const code = ch.charCodeAt(0);
    min = Math.min(min, code);
    max = Math.max(max, code);
  }
  // Phred33 printable range roughly 33–73; Phred64 roughly 64–104
  if (min >= 64 && max > 73) {
    return QualityEncoding.Phred64;
  }
  return QualityEncoding.Phred33;
}

/**
 * Mean quality for a FASTQ record.
 */
export function recordMeanQuality(
  record: FastqRecord,
  encoding: QualityEncoding = QualityEncoding.Phred33
): number {
  return meanQuality(record.quality, encoding);
}
