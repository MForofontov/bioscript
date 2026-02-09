/**
 * GFF3 and GTF format parser and writer.
 * @module gff
 */

import type { GFFRecord, GFFVersion } from './types';

/**
 * Parse GFF3 or GTF format line into structured record.
 *
 * @param line - Single GFF/GTF line.
 * @param version - Format version ('gff3' or 'gtf', default: 'gff3').
 * @returns Parsed GFF record.
 *
 * @throws {TypeError} If line is not a string.
 * @throws {Error} If line format is invalid.
 *
 * @example
 * ```typescript
 * const line = 'chr1\tHAVANA\tgene\t11869\t14409\t.\t+\t.\tID=gene1;Name=DDX11L1';
 * const record = parseGFFLine(line);
 * console.log(record.seqid, record.start, record.end);
 * ```
 *
 * @example
 * ```typescript
 * // GTF format
 * const gtfLine = 'chr1\tHAVANA\texon\t11869\t12227\t.\t+\t.\tgene_id "DDX11L1"; transcript_id "DDX11L1.1";';
 * const record = parseGFFLine(gtfLine, 'gtf');
 * console.log(record.attributes.gene_id);
 * ```
 *
 * @performance O(n) where n is line length. Typical: <0.1ms per line.
 */
export function parseGFFLine(line: string, version: GFFVersion = 'gff3'): GFFRecord {
  if (typeof line !== 'string') {
    throw new TypeError(`line must be a string, got ${typeof line}`);
  }

  const trimmed = line.trim();
  
  // Skip comments and empty lines
  if (!trimmed || trimmed.startsWith('#')) {
    throw new Error('Cannot parse comment or empty line');
  }

  const fields = trimmed.split('\t');
  
  if (fields.length !== 9) {
    throw new Error(`Invalid GFF format: expected 9 fields, got ${fields.length}`);
  }

  const [seqid, source, type, startStr, endStr, scoreStr, strand, phaseStr, attributesStr] = fields;

  // Parse numeric fields
  const start = parseInt(startStr);
  const end = parseInt(endStr);
  const score = scoreStr === '.' ? null : parseFloat(scoreStr);
  const phase = phaseStr === '.' ? null : (parseInt(phaseStr) as 0 | 1 | 2);

  // Validate strand
  if (!['+', '-', '.', '?'].includes(strand)) {
    throw new Error(`Invalid strand: ${strand} (expected +, -, ., or ?)`);
  }

  // Parse attributes
  const attributes: Record<string, string | string[]> = {};
  
  if (version === 'gff3') {
    // GFF3: key=value;key=value
    const pairs = attributesStr.split(';').filter(p => p.trim());
    for (const pair of pairs) {
      const [key, ...valueParts] = pair.split('=');
      const value = valueParts.join('=').trim();
      
      // Handle multiple values (comma-separated)
      if (value.includes(',')) {
        attributes[key.trim()] = value.split(',').map(v => decodeURIComponent(v.trim()));
      } else {
        attributes[key.trim()] = decodeURIComponent(value);
      }
    }
  } else {
    // GTF: key "value"; key "value";
    const matches = attributesStr.matchAll(/(\w+)\s+"([^"]+)"/g);
    for (const match of matches) {
      const [, key, value] = match;
      attributes[key] = value;
    }
  }

  return {
    seqid,
    source,
    type,
    start,
    end,
    score,
    strand: strand as '+' | '-' | '.' | '?',
    phase,
    attributes,
  };
}

/**
 * Format GFF record as GFF3 or GTF line.
 *
 * @param record - GFF record to format.
 * @param version - Output format version ('gff3' or 'gtf', default: 'gff3').
 * @returns Formatted GFF/GTF line.
 *
 * @throws {TypeError} If record is not an object.
 *
 * @example
 * ```typescript
 * const record: GFFRecord = {
 *   seqid: 'chr1',
 *   source: 'HAVANA',
 *   type: 'gene',
 *   start: 11869,
 *   end: 14409,
 *   score: null,
 *   strand: '+',
 *   phase: null,
 *   attributes: { ID: 'gene1', Name: 'DDX11L1' }
 * };
 * const line = formatGFFLine(record);
 * ```
 *
 * @performance O(n) where n is number of attributes. Typical: <0.1ms.
 */
export function formatGFFLine(record: GFFRecord, version: GFFVersion = 'gff3'): string {
  if (typeof record !== 'object' || record === null) {
    throw new TypeError(`record must be an object, got ${typeof record}`);
  }

  const score = record.score === null ? '.' : record.score.toString();
  const phase = record.phase === null ? '.' : record.phase.toString();

  // Format attributes
  let attributesStr = '';
  
  if (version === 'gff3') {
    // GFF3: key=value;key=value
    const pairs = Object.entries(record.attributes).map(([key, value]) => {
      if (Array.isArray(value)) {
        const encoded = value.map(v => encodeURIComponent(v)).join(',');
        return `${key}=${encoded}`;
      }
      return `${key}=${encodeURIComponent(value)}`;
    });
    attributesStr = pairs.join(';');
  } else {
    // GTF: key "value"; key "value";
    const pairs = Object.entries(record.attributes).map(([key, value]) => {
      const val = Array.isArray(value) ? value[0] : value;
      return `${key} "${val}"`;
    });
    attributesStr = pairs.join('; ') + ';';
  }

  return [
    record.seqid,
    record.source,
    record.type,
    record.start.toString(),
    record.end.toString(),
    score,
    record.strand,
    phase,
    attributesStr,
  ].join('\t');
}

/**
 * Parse complete GFF3/GTF file into records.
 *
 * @param text - Complete GFF/GTF file content.
 * @param version - Format version ('gff3' or 'gtf', default: 'gff3').
 * @returns Array of parsed GFF records.
 *
 * @throws {TypeError} If text is not a string.
 *
 * @example
 * ```typescript
 * const gffText = fs.readFileSync('annotations.gff3', 'utf-8');
 * const records = parseGFF(gffText);
 * console.log(`Parsed ${records.length} annotations`);
 * ```
 *
 * @performance O(n) where n is number of lines. 
 * Typical: 10K lines in ~50ms, 100K lines in ~500ms.
 */
export function parseGFF(text: string, version: GFFVersion = 'gff3'): GFFRecord[] {
  if (typeof text !== 'string') {
    throw new TypeError(`text must be a string, got ${typeof text}`);
  }

  const lines = text.split('\n');
  const records: GFFRecord[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    try {
      const record = parseGFFLine(trimmed, version);
      records.push(record);
    } catch (error) {
      // Skip malformed lines
      continue;
    }
  }

  return records;
}

/**
 * Format array of GFF records as complete GFF3/GTF file.
 *
 * @param records - Array of GFF records.
 * @param version - Output format version ('gff3' or 'gtf', default: 'gff3').
 * @param includeHeader - Include format header (default: true).
 * @returns Formatted GFF/GTF file content.
 *
 * @throws {TypeError} If records is not an array.
 *
 * @example
 * ```typescript
 * const gffText = formatGFF(records, 'gff3', true);
 * fs.writeFileSync('output.gff3', gffText);
 * ```
 *
 * @performance O(n) where n is number of records. 
 * Typical: 10K records in ~50ms.
 */
export function formatGFF(
  records: GFFRecord[],
  version: GFFVersion = 'gff3',
  includeHeader: boolean = true
): string {
  if (!Array.isArray(records)) {
    throw new TypeError(`records must be an array, got ${typeof records}`);
  }

  let output = '';

  if (includeHeader) {
    if (version === 'gff3') {
      output += '##gff-version 3\n';
    } else {
      output += '#gtf-version 2.2\n';
    }
  }

  for (const record of records) {
    output += formatGFFLine(record, version) + '\n';
  }

  return output;
}
