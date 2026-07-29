/**
 * Quality and fixed trimming for FASTQ records.
 */

import {
  QualityEncoding,
  decodeQualityScores,
  type FastqRecord,
} from '@bioscript/seq-stream';

function sliceRecord(record: FastqRecord, start: number, end: number): FastqRecord {
  return {
    ...record,
    sequence: record.sequence.slice(start, end),
    quality: record.quality.slice(start, end),
  };
}

/**
 * Trim a fixed number of bases from each end.
 */
export function trimFixed(
  record: FastqRecord,
  trimLeft: number,
  trimRight: number = 0
): FastqRecord {
  if (trimLeft < 0 || trimRight < 0) throw new Error('trim amounts must be >= 0');
  const end = Math.max(trimLeft, record.sequence.length - trimRight);
  if (end <= trimLeft) {
    return { ...record, sequence: '', quality: '' };
  }
  return sliceRecord(record, trimLeft, end);
}

/**
 * Hard-clip to [start, end) coordinates (0-based).
 */
export function hardClip(record: FastqRecord, start: number, end: number): FastqRecord {
  if (start < 0 || end < start) throw new Error('invalid clip range');
  return sliceRecord(record, start, Math.min(end, record.sequence.length));
}

/**
 * Sliding-window quality trim from both ends (FastQC/cutadapt-style).
 * Windows with mean quality < minQuality are trimmed until a passing window is found.
 */
export function trimEndsByQuality(
  record: FastqRecord,
  options: {
    minQuality?: number;
    windowSize?: number;
    encoding?: QualityEncoding;
  } = {}
): FastqRecord {
  const {
    minQuality = 20,
    windowSize = 4,
    encoding = QualityEncoding.Phred33,
  } = options;

  if (windowSize < 1) throw new Error('windowSize must be >= 1');
  const scores = decodeQualityScores(record.quality, encoding);
  const n = scores.length;
  if (n === 0) return { ...record, sequence: '', quality: '' };

  const windowMean = (from: number) => {
    const to = Math.min(n, from + windowSize);
    let sum = 0;
    for (let i = from; i < to; i++) sum += scores[i];
    return sum / (to - from);
  };

  let left = 0;
  while (left + windowSize <= n && windowMean(left) < minQuality) {
    left++;
  }

  let right = n;
  while (right - windowSize >= left && windowMean(right - windowSize) < minQuality) {
    right--;
  }

  // also drop single trailing low-quality bases
  while (right > left && scores[right - 1] < minQuality) {
    right--;
  }
  while (left < right && scores[left] < minQuality) {
    left++;
  }

  return sliceRecord(record, left, right);
}
