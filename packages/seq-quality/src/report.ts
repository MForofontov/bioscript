/**
 * FastQC-lite quality report for a set of FASTQ records.
 */

import {
  QualityEncoding,
  decodeQualityScores,
  type FastqRecord,
} from '@bioscript/seq-stream';

export interface QualityReport {
  readCount: number;
  totalBases: number;
  meanLength: number;
  minLength: number;
  maxLength: number;
  meanGcPercent: number;
  meanNPercent: number;
  meanQuality: number;
  /** Mean Phred per cycle (1-based position index 0 → cycle 1) */
  perPositionMeanQuality: number[];
  lengthHistogram: Record<number, number>;
}

/**
 * Aggregate QC metrics for an array of FASTQ records.
 */
export function qualityReport(
  records: FastqRecord[],
  encoding: QualityEncoding = QualityEncoding.Phred33
): QualityReport {
  if (!Array.isArray(records)) {
    throw new TypeError('records must be an array');
  }

  const lengthHistogram: Record<number, number> = {};
  let totalBases = 0;
  let totalGc = 0;
  let totalN = 0;
  let totalQualitySum = 0;
  let minLength = Infinity;
  let maxLength = 0;
  const posSums: number[] = [];
  const posCounts: number[] = [];

  for (const record of records) {
    const len = record.sequence.length;
    lengthHistogram[len] = (lengthHistogram[len] ?? 0) + 1;
    minLength = Math.min(minLength, len);
    maxLength = Math.max(maxLength, len);
    totalBases += len;

    const scores = decodeQualityScores(record.quality, encoding);
    for (const q of scores) {
      totalQualitySum += q;
    }

    for (let i = 0; i < len; i++) {
      const b = record.sequence[i].toUpperCase();
      if (b === 'G' || b === 'C') totalGc++;
      if (b === 'N') totalN++;
    }

    for (let i = 0; i < scores.length; i++) {
      posSums[i] = (posSums[i] ?? 0) + scores[i];
      posCounts[i] = (posCounts[i] ?? 0) + 1;
    }
  }

  const readCount = records.length;
  const perPositionMeanQuality = posSums.map((sum, i) => sum / (posCounts[i] || 1));

  return {
    readCount,
    totalBases,
    meanLength: readCount === 0 ? 0 : totalBases / readCount,
    minLength: readCount === 0 ? 0 : minLength,
    maxLength: readCount === 0 ? 0 : maxLength,
    meanGcPercent: totalBases === 0 ? 0 : (totalGc / totalBases) * 100,
    meanNPercent: totalBases === 0 ? 0 : (totalN / totalBases) * 100,
    meanQuality: totalBases === 0 ? 0 : totalQualitySum / totalBases,
    perPositionMeanQuality,
    lengthHistogram,
  };
}
