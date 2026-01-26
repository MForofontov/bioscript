import { Transform, type TransformCallback } from 'stream';
import type { FastaRecord } from './fasta';
import { QualityEncoding, decodeQualityScores, type FastqRecord } from './fastq';

/**
 * Statistics for a collection of sequences
 */
export interface SequenceStats {
  totalSequences: number;
  totalBases: number;
  lengthDistribution: Map<number, number>;
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
  meanQuality?: number;
  minQuality?: number;
  maxQuality?: number;
  q20Percent?: number;
  q30Percent?: number;
}

/**
 * Stream transformer that calculates statistics for FASTA/FASTQ records
 */
export class StatsCalculator extends Transform {
  private totalSequences: number = 0;
  private totalBases: number = 0;
  private gcCount: number = 0;
  private atCount: number = 0;
  private nCount: number = 0;
  private ambiguousCount: number = 0;
  private lengthDistribution: Map<number, number> = new Map();
  private sumOfSquares: number = 0;
  private totalQualitySum: number = 0;
  private totalQualityBases: number = 0;
  private minQuality: number = Infinity;
  private maxQuality: number = 0;
  private q20Count: number = 0;
  private q30Count: number = 0;
  private qualityEncoding: QualityEncoding;

  constructor(qualityEncoding: QualityEncoding = QualityEncoding.Phred33) {
    super({ objectMode: true });
    this.qualityEncoding = qualityEncoding;
  }

  _transform(
    record: FastaRecord | FastqRecord,
    encoding: string,
    callback: TransformCallback
  ): void {
    try {
      const sequence = record.sequence.toUpperCase();
      const length = sequence.length;

      // Update counters
      this.totalSequences++;
      this.totalBases += length;
      this.sumOfSquares += length * length;

      // Update length distribution
      this.lengthDistribution.set(length, (this.lengthDistribution.get(length) || 0) + 1);

      // Count GC, AT, N, and ambiguous bases
      for (let i = 0; i < length; i++) {
        const base = sequence[i];
        if (base === 'G' || base === 'C') {
          this.gcCount++;
        } else if (base === 'A' || base === 'T' || base === 'U') {
          this.atCount++;
        } else if (base === 'N') {
          this.nCount++;
        } else if ('RYKMSWBDHV'.includes(base)) {
          // IUPAC ambiguous bases
          this.ambiguousCount++;
        }
      }

      // Calculate quality scores if FASTQ
      if ('quality' in record && record.quality) {
        const qualities = decodeQualityScores(record.quality, this.qualityEncoding);
        for (const q of qualities) {
          this.totalQualitySum += q;
          this.totalQualityBases++;
          this.minQuality = Math.min(this.minQuality, q);
          this.maxQuality = Math.max(this.maxQuality, q);
          if (q >= 20) this.q20Count++;
          if (q >= 30) this.q30Count++;
        }
      }

      // Pass through the record
      this.push(record);
      callback();
    } catch (error) {
      callback(error as Error);
    }
  }

  _flush(callback: TransformCallback): void {
    callback();
  }

  /**
   * Get computed statistics
   */
  getStats(): SequenceStats {
    // Calculate median from lengthDistribution map instead of storing all lengths
    let minLength = 0;
    let maxLength = 0;
    let medianLength = 0;

    if (this.lengthDistribution.size > 0) {
      // Get sorted unique lengths
      const sortedLengths = Array.from(this.lengthDistribution.keys()).sort((a, b) => a - b);
      minLength = sortedLengths[0];
      maxLength = sortedLengths[sortedLengths.length - 1];

      // Calculate median by expanding the distribution
      const halfPoint = Math.floor(this.totalSequences / 2);
      let count = 0;

      for (const length of sortedLengths) {
        count += this.lengthDistribution.get(length)!;
        if (count >= halfPoint) {
          medianLength = length;
          break;
        }
      }
    }

    // Calculate standard deviation using Welford's method
    const meanLength = this.totalSequences > 0 ? this.totalBases / this.totalSequences : 0;
    const variance =
      this.totalSequences > 0
        ? this.sumOfSquares / this.totalSequences - meanLength * meanLength
        : 0;
    const stdDevLength = Math.sqrt(Math.max(0, variance));

    // Calculate N50 and L50 from length distribution
    const allLengths: number[] = Array.from(this.lengthDistribution.entries()).flatMap(
      ([length, count]: [number, number]): number[] => Array(count).fill(length) as number[]
    );
    const n50 = calculateN50(allLengths);
    const l50 = calculateL50(allLengths);

    const stats: SequenceStats = {
      totalSequences: this.totalSequences,
      totalBases: this.totalBases,
      lengthDistribution: this.lengthDistribution,
      gcContent: this.totalBases > 0 ? (this.gcCount / this.totalBases) * 100 : 0,
      atContent: this.totalBases > 0 ? (this.atCount / this.totalBases) * 100 : 0,
      nContent: this.totalBases > 0 ? (this.nCount / this.totalBases) * 100 : 0,
      ambiguousBasesCount: this.ambiguousCount,
      minLength,
      maxLength,
      meanLength,
      medianLength,
      stdDevLength,
      n50,
      l50,
    };

    if (this.totalQualityBases > 0) {
      stats.meanQuality = this.totalQualitySum / this.totalQualityBases;
      stats.minQuality = this.minQuality === Infinity ? 0 : this.minQuality;
      stats.maxQuality = this.maxQuality;
      stats.q20Percent = (this.q20Count / this.totalQualityBases) * 100;
      stats.q30Percent = (this.q30Count / this.totalQualityBases) * 100;
    }

    return stats;
  }
}

/**
 * Calculate N50 metric from length distribution
 */
export function calculateN50(lengths: number[]): number {
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
 * Calculate L50 metric from length distribution
 */
export function calculateL50(lengths: number[]): number {
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

/**
 * Stream transformer that filters sequences by length
 */
export class LengthFilter extends Transform {
  private minLength: number;
  private maxLength: number;

  constructor(minLength: number = 0, maxLength: number = Infinity) {
    super({ objectMode: true });
    this.minLength = minLength;
    this.maxLength = maxLength;
  }

  _transform(
    record: FastaRecord | FastqRecord,
    encoding: string,
    callback: TransformCallback
  ): void {
    const length = record.sequence.length;

    if (length >= this.minLength && length <= this.maxLength) {
      this.push(record);
    }

    callback();
  }
}

/**
 * Stream transformer that filters sequences by quality score
 */
export class QualityFilter extends Transform {
  private minMeanQuality: number;
  private qualityEncoding: QualityEncoding;

  constructor(minMeanQuality: number, qualityEncoding: QualityEncoding = QualityEncoding.Phred33) {
    super({ objectMode: true });
    this.minMeanQuality = minMeanQuality;
    this.qualityEncoding = qualityEncoding;
  }

  _transform(
    record: FastaRecord | FastqRecord,
    encoding: string,
    callback: TransformCallback
  ): void {
    if ('quality' in record && record.quality) {
      const qualities = decodeQualityScores(record.quality, this.qualityEncoding);
      const meanQuality = qualities.reduce((sum, q) => sum + q, 0) / qualities.length;

      if (meanQuality >= this.minMeanQuality) {
        this.push(record);
      }
    } else {
      // Pass through non-FASTQ records
      this.push(record);
    }

    callback();
  }
}
