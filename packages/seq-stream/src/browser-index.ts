/**
 * Browser entry point - exports all browser-compatible functions
 * Use this for bundling browser applications
 */

// FASTA functions
export { parseFastaBrowser, writeFastaBrowser, parseFastaText } from './browser-fasta.js';

// FASTQ functions
export {
  parseFastqBrowser,
  writeFastqBrowser,
  parseFastqText,
  convertQualityBrowser,
} from './browser-fastq.js';

// Statistics functions
export {
  calculateStatsBrowser,
  calculateStatsSync,
  calculateN50Browser,
  calculateL50Browser,
  type BrowserStats,
} from './browser-stats.js';

// Re-export types from main modules
export type { FastaRecord } from './fasta.js';
export type { FastqRecord } from './fastq.js';
export { QualityEncoding } from './fastq.js';
