/**
 * @bioscript/seq-quality
 * FASTQ quality control: filtering, trimming, adapters, reports.
 */

export {
  meanQuality,
  minQuality,
  detectQualityEncoding,
  recordMeanQuality,
  QualityEncoding,
} from './encode';

export { filterByLength, filterByMeanQuality, filterByNContent } from './filter';

export { trimFixed, hardClip, trimEndsByQuality } from './trim';

export { ILLUMINA_ADAPTERS, trimAdapter, trimAdapters } from './adapters';

export { qualityReport, type QualityReport } from './report';
