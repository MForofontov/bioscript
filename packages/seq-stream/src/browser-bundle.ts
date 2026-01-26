/**
 * Browser bundle entry point
 */

// Quality encoding enum (defined here to avoid Node.js imports)
export enum QualityEncoding {
  Phred33 = 'phred33',
  Phred64 = 'phred64',
}

// FASTA record type
export interface FastaRecord {
  id: string;
  sequence: string;
  description?: string;
}

// FASTQ record type
export interface FastqRecord {
  id: string;
  sequence: string;
  quality: string;
  description?: string;
}

// Browser statistics type
export interface BrowserStats {
  totalRecords: number;
  totalBases: number;
  gcContent: number;
  nContent: number;
  averageLength: number;
  minLength: number;
  maxLength: number;
  n50?: number;
  l50?: number;
  meanQuality?: number;
  lengthDistribution?: Record<string, number>;
}

// Only import browser-specific modules (no Node.js dependencies)
export { parseFastaBrowser, writeFastaBrowser, parseFastaText } from './browser-fasta';
export {
  parseFastqBrowser,
  writeFastqBrowser,
  parseFastqText,
  convertQualityBrowser,
} from './browser-fastq';
export {
  calculateStatsBrowser,
  calculateStatsSync,
  calculateN50Browser,
  calculateL50Browser,
} from './browser-stats';
