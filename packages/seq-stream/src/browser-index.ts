/**
 * Browser entry point - exports all browser-compatible functions
 * Use this for bundling browser applications
 */

// FASTA functions
export { parseFastaBrowser, writeFastaBrowser, parseFastaText } from './browser-fasta';

// FASTQ functions
export {
  parseFastqBrowser,
  writeFastqBrowser,
  parseFastqText,
  convertQualityBrowser,
} from './browser-fastq';

// Statistics functions
export {
  calculateStatsBrowser,
  calculateStatsSync,
  calculateN50Browser,
  calculateL50Browser,
  type BrowserStats,
} from './browser-stats';

// Re-export types from main modules
export type { FastaRecord } from './fasta';
export type { FastqRecord } from './fastq';
export { QualityEncoding } from './fastq';
