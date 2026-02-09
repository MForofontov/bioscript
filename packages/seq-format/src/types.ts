/**
 * Core types for biological file format handling.
 * @module types
 */

/**
 * GenBank feature qualifier (key-value pair).
 */
export interface GenBankQualifier {
  key: string;
  value: string;
}

/**
 * GenBank feature annotation.
 */
export interface GenBankFeature {
  type: string;
  location: string;
  qualifiers: GenBankQualifier[];
}

/**
 * GenBank format record.
 */
export interface GenBankRecord {
  locus: string;
  definition: string;
  accession: string;
  version: string;
  keywords: string;
  source: string;
  organism: string;
  references: string[];
  features: GenBankFeature[];
  sequence: string;
  raw?: string;
}

/**
 * EMBL format record.
 */
export interface EMBLRecord {
  id: string;
  accession: string;
  version: string;
  description: string;
  keywords: string;
  organism: string;
  references: string[];
  features: GenBankFeature[];
  sequence: string;
  raw?: string;
}

/**
 * GFF3/GTF file format version.
 */
export type GFFVersion = 'gff3' | 'gtf';

/**
 * GFF3/GTF record (single annotation line).
 */
export interface GFFRecord {
  seqid: string;
  source: string;
  type: string;
  start: number;
  end: number;
  score: number | null;
  strand: '+' | '-' | '.' | '?';
  phase: 0 | 1 | 2 | null;
  attributes: Record<string, string | string[]>;
}

/**
 * BED format record.
 * Supports BED3, BED6, BED12 formats.
 */
export interface BEDRecord {
  chrom: string;
  chromStart: number;
  chromEnd: number;
  name?: string;
  score?: number;
  strand?: '+' | '-' | '.';
  thickStart?: number;
  thickEnd?: number;
  itemRgb?: string;
  blockCount?: number;
  blockSizes?: number[];
  blockStarts?: number[];
}

/**
 * VCF record (variant call).
 */
export interface VCFRecord {
  chrom: string;
  pos: number;
  id: string;
  ref: string;
  alt: string[];
  qual: number | null;
  filter: string;
  info: Record<string, string | number | boolean>;
  format?: string[];
  samples?: Record<string, string>[];
}

/**
 * VCF header information.
 */
export interface VCFHeader {
  fileformat: string;
  contigs: Array<{ id: string; length?: number }>;
  info: Array<{ id: string; number: string; type: string; description: string }>;
  filter: Array<{ id: string; description: string }>;
  format: Array<{ id: string; number: string; type: string; description: string }>;
  samples: string[];
  other: string[];
}

/**
 * SAM alignment flag components.
 */
export interface SAMFlags {
  paired: boolean;
  properPair: boolean;
  unmapped: boolean;
  mateUnmapped: boolean;
  reverse: boolean;
  mateReverse: boolean;
  first: boolean;
  second: boolean;
  secondary: boolean;
  qcFail: boolean;
  duplicate: boolean;
  supplementary: boolean;
}

/**
 * SAM/BAM alignment record.
 */
export interface SAMRecord {
  qname: string;
  flag: number;
  flags?: SAMFlags;
  rname: string;
  pos: number;
  mapq: number;
  cigar: string;
  rnext: string;
  pnext: number;
  tlen: number;
  seq: string;
  qual: string;
  tags: Record<string, string | number>;
}

/**
 * SAM header information.
 */
export interface SAMHeader {
  version: string;
  sortOrder?: string;
  references: Array<{ name: string; length: number }>;
  readGroups: Array<Record<string, string>>;
  programs: Array<Record<string, string>>;
  comments: string[];
}

/**
 * FASTA record (for conversions).
 */
export interface FastaRecord {
  id: string;
  description: string;
  sequence: string;
}
