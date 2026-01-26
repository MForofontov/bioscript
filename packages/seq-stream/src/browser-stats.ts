/**
 * Browser-compatible statistics calculator for sequences
 * Memory-efficient processing of sequence data
 */

import type { FastaRecord } from './fasta.js';
import type { FastqRecord } from './fastq.js';

// Define QualityEncoding locally to avoid importing Node.js dependencies
enum QualityEncoding {
  Phred33 = 33,
  Phred64 = 64,
}

/**
 * Decode quality scores from encoded string (standalone version to avoid Node.js imports)
 */
function decodeQualityScores(quality: string, encoding: QualityEncoding): number[] {
  return quality.split('').map((char) => char.charCodeAt(0) - encoding);
}

/**
 * Browser-compatible sequence statistics
 */
export interface BrowserStats {
  totalSequences: number;
  totalBases: number;
  gcContent: number;
  atContent: number;
  nContent: number;
  ambiguousBasesCount: number;
  minLength: number;
  maxLength: number;
  meanLength: number;
  medianLength: number;
  stdDevLength: number;
  n50: number;
  l50: number;
  lengthDistribution: Map<number, number>;
  meanQuality?: number;
  minQuality?: number;
  maxQuality?: number;
  q20Percent?: number;
  q30Percent?: number;
}

/**
 * Calculate comprehensive statistics from an async generator of records
 *
 * @param records - AsyncGenerator of FastaRecord or FastqRecord
 * @param qualityEncoding - Quality encoding for FASTQ (default: Phred33)
 * @returns Promise resolving to BrowserStats
 *
 * @example
 * ```typescript
 * const parser = parseFastqBrowser(file);
 * const stats = await calculateStatsBrowser(parser);
 * console.log(`GC: ${stats.gcContent.toFixed(2)}%`);
 * ```
 */
export async function calculateStatsBrowser(
  records: AsyncGenerator<FastaRecord | FastqRecord>,
  qualityEncoding: QualityEncoding = QualityEncoding.Phred33
): Promise<BrowserStats> {
  let totalSequences = 0;
  let totalBases = 0;
  let gcCount = 0;
  let atCount = 0;
  let nCount = 0;
  let ambiguousCount = 0;
  let minLength = Infinity;
  let maxLength = 0;
  let sumOfSquares = 0;
  let totalQualitySum = 0;
  let totalQualityBases = 0;
  let minQuality = Infinity;
  let maxQuality = 0;
  let q20Count = 0;
  let q30Count = 0;
  const lengthDistribution = new Map<number, number>();

  for await (const record of records) {
    const sequence = record.sequence.toUpperCase();
    const length = sequence.length;

    totalSequences++;
    totalBases += length;
    sumOfSquares += length * length;
    minLength = Math.min(minLength, length);
    maxLength = Math.max(maxLength, length);

    // Update length distribution
    lengthDistribution.set(length, (lengthDistribution.get(length) || 0) + 1);

    // Count GC, AT, N, and ambiguous
    for (let i = 0; i < length; i++) {
      const base = sequence[i];
      if (base === 'G' || base === 'C') {
        gcCount++;
      } else if (base === 'A' || base === 'T' || base === 'U') {
        atCount++;
      } else if (base === 'N') {
        nCount++;
      } else if ('RYKMSWBDHV'.includes(base)) {
        ambiguousCount++;
      }
    }

    // Quality scores for FASTQ
    if ('quality' in record && record.quality) {
      const qualities = decodeQualityScores(record.quality, qualityEncoding);
      for (const q of qualities) {
        totalQualitySum += q;
        totalQualityBases++;
        minQuality = Math.min(minQuality, q);
        maxQuality = Math.max(maxQuality, q);
        if (q >= 20) q20Count++;
        if (q >= 30) q30Count++;
      }
    }
  }

  // Calculate median from lengthDistribution map
  let medianLength = 0;
  if (lengthDistribution.size > 0) {
    const sortedLengths = Array.from(lengthDistribution.keys()).sort((a, b) => a - b);
    const halfPoint = Math.floor(totalSequences / 2);
    let count = 0;

    for (const length of sortedLengths) {
      count += lengthDistribution.get(length)!;
      if (count >= halfPoint) {
        medianLength = length;
        break;
      }
    }
  }

  // Calculate standard deviation
  const meanLength = totalSequences > 0 ? totalBases / totalSequences : 0;
  const variance = totalSequences > 0
    ? (sumOfSquares / totalSequences) - (meanLength * meanLength)
    : 0;
  const stdDevLength = Math.sqrt(Math.max(0, variance));

  // Calculate N50 and L50
  const allLengths = Array.from(lengthDistribution.entries()).flatMap(
    ([length, count]) => Array(count).fill(length)
  );
  const n50 = calculateN50Browser(allLengths);
  const l50 = calculateL50Browser(allLengths);

  const stats: BrowserStats = {
    totalSequences,
    totalBases,
    gcContent: totalBases > 0 ? (gcCount / totalBases) * 100 : 0,
    atContent: totalBases > 0 ? (atCount / totalBases) * 100 : 0,
    nContent: totalBases > 0 ? (nCount / totalBases) * 100 : 0,
    ambiguousBasesCount: ambiguousCount,
    minLength: minLength === Infinity ? 0 : minLength,
    maxLength,
    meanLength,
    medianLength,
    stdDevLength,
    n50,
    l50,
    lengthDistribution,
  };

  if (totalQualityBases > 0) {
    stats.meanQuality = totalQualitySum / totalQualityBases;
    stats.minQuality = minQuality === Infinity ? 0 : minQuality;
    stats.maxQuality = maxQuality;
    stats.q20Percent = (q20Count / totalQualityBases) * 100;
    stats.q30Percent = (q30Count / totalQualityBases) * 100;
  }

  return stats;
}

/**
 * Calculate statistics from an array of records (synchronous)
 *
 * @param records - Array of FastaRecord or FastqRecord
 * @param qualityEncoding - Quality encoding for FASTQ (default: Phred33)
 * @returns BrowserStats
 */
export function calculateStatsSync(
  records: (FastaRecord | FastqRecord)[],
  qualityEncoding: QualityEncoding = QualityEncoding.Phred33
): BrowserStats {
  let totalSequences = 0;
  let totalBases = 0;
  let gcCount = 0;
  let atCount = 0;
  let nCount = 0;
  let ambiguousCount = 0;
  let minLength = Infinity;
  let maxLength = 0;
  let sumOfSquares = 0;
  let totalQualitySum = 0;
  let totalQualityBases = 0;
  let minQuality = Infinity;
  let maxQuality = 0;
  let q20Count = 0;
  let q30Count = 0;
  const lengthDistribution = new Map<number, number>();

  for (const record of records) {
    const sequence = record.sequence.toUpperCase();
    const length = sequence.length;

    totalSequences++;
    totalBases += length;
    sumOfSquares += length * length;
    minLength = Math.min(minLength, length);
    maxLength = Math.max(maxLength, length);

    lengthDistribution.set(length, (lengthDistribution.get(length) || 0) + 1);

    for (let i = 0; i < length; i++) {
      const base = sequence[i];
      if (base === 'G' || base === 'C') {
        gcCount++;
      } else if (base === 'A' || base === 'T' || base === 'U') {
        atCount++;
      } else if (base === 'N') {
        nCount++;
      } else if ('RYKMSWBDHV'.includes(base)) {
        ambiguousCount++;
      }
    }

    if ('quality' in record && record.quality) {
      const qualities = decodeQualityScores(record.quality, qualityEncoding);
      for (const q of qualities) {
        totalQualitySum += q;
        totalQualityBases++;
        minQuality = Math.min(minQuality, q);
        maxQuality = Math.max(maxQuality, q);
        if (q >= 20) q20Count++;
        if (q >= 30) q30Count++;
      }
    }
  }

  // Calculate median from lengthDistribution map
  let medianLength = 0;
  if (lengthDistribution.size > 0) {
    const sortedLengths = Array.from(lengthDistribution.keys()).sort((a, b) => a - b);
    const halfPoint = Math.floor(totalSequences / 2);
    let count = 0;

    for (const length of sortedLengths) {
      count += lengthDistribution.get(length)!;
      if (count >= halfPoint) {
        medianLength = length;
        break;
      }
    }
  }

  // Calculate standard deviation
  const meanLength = totalSequences > 0 ? totalBases / totalSequences : 0;
  const variance = totalSequences > 0
    ? (sumOfSquares / totalSequences) - (meanLength * meanLength)
    : 0;
  const stdDevLength = Math.sqrt(Math.max(0, variance));

  // Calculate N50 and L50
  const allLengths = Array.from(lengthDistribution.entries()).flatMap(
    ([length, count]) => Array(count).fill(length)
  );
  const n50 = calculateN50Browser(allLengths);
  const l50 = calculateL50Browser(allLengths);

  const stats: BrowserStats = {
    totalSequences,
    totalBases,
    gcContent: totalBases > 0 ? (gcCount / totalBases) * 100 : 0,
    atContent: totalBases > 0 ? (atCount / totalBases) * 100 : 0,
    nContent: totalBases > 0 ? (nCount / totalBases) * 100 : 0,
    ambiguousBasesCount: ambiguousCount,
    minLength: minLength === Infinity ? 0 : minLength,
    maxLength,
    meanLength,
    medianLength,
    stdDevLength,
    n50,
    l50,
    lengthDistribution,
  };

  if (totalQualityBases > 0) {
    stats.meanQuality = totalQualitySum / totalQualityBases;
    stats.minQuality = minQuality === Infinity ? 0 : minQuality;
    stats.maxQuality = maxQuality;
    stats.q20Percent = (q20Count / totalQualityBases) * 100;
    stats.q30Percent = (q30Count / totalQualityBases) * 100;
  }

  return stats;
}

/**
 * Calculate N50 metric from lengths
 *
 * @param lengths - Array of sequence lengths
 * @returns N50 value
 */
export function calculateN50Browser(lengths: number[]): number {
  if (lengths.length === 0) return 0;

  const sorted = [...lengths].sort((a, b) => b - a);
  const totalLength = sorted.reduce((sum, len) => sum + len, 0);
  const halfTotal = totalLength / 2;

  let sum = 0;
  for (const length of sorted) {
    sum += length;
    if (sum >= halfTotal) {
      return length;
    }
  }

  return sorted[sorted.length - 1];
}

/**
 * Calculate L50 metric from lengths
 *
 * @param lengths - Array of sequence lengths
 * @returns L50 value (number of sequences)
 */
export function calculateL50Browser(lengths: number[]): number {
  if (lengths.length === 0) return 0;

  const sorted = [...lengths].sort((a, b) => b - a);
  const totalLength = sorted.reduce((sum, len) => sum + len, 0);
  const halfTotal = totalLength / 2;

  let sum = 0;
  for (let i = 0; i < sorted.length; i++) {
    sum += sorted[i];
    if (sum >= halfTotal) {
      return i + 1;
    }
  }

  return sorted.length;
}
