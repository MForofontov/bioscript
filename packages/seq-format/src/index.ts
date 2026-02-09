/**
 * @bioscript/seq-format
 * Bioinformatics file format converters and parsers.
 * @module seq-format
 */

// Type exports
export type {
  GenBankRecord,
  GenBankFeature,
  GenBankQualifier,
  EMBLRecord,
  GFFRecord,
  GFFVersion,
  BEDRecord,
  VCFRecord,
  VCFHeader,
  SAMRecord,
  SAMHeader,
  SAMFlags,
  FastaRecord,
} from './types';

// GenBank format
export {
  parseGenBank,
  genBankToFasta,
  fastaToGenBank,
} from './genbank';

// EMBL format
export {
  parseEMBL,
  emblToFasta,
} from './embl';

// GFF/GTF format
export {
  parseGFFLine,
  formatGFFLine,
  parseGFF,
  formatGFF,
} from './gff';

// BED format
export {
  parseBEDLine,
  formatBEDLine,
  parseBED,
  formatBED,
} from './bed';

// VCF format
export {
  parseVCFHeader,
  parseVCFLine,
  parseVCF,
  formatVCFLine,
  formatVCF,
} from './vcf';

// SAM format
export {
  decodeSAMFlags,
  encodeSAMFlags,
  parseSAMHeader,
  parseSAMLine,
  parseSAM,
  formatSAMLine,
  formatSAM,
} from './sam';
