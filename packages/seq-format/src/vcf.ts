import { assertString } from '@bioscript/seq-utils';
import { integer, numeric } from './validation';
/**
 * VCF (Variant Call Format) parser.
 * @module vcf
 */

import type { VCFRecord, VCFHeader } from './types';

/**
 * Parse VCF header section.
 *
 * @param text - VCF file content including header.
 * @returns Parsed VCF header.
 *
 * @throws {TypeError} If text is not a string.
 * @throws {Error} If VCF format is invalid.
 *
 * @example
 * ```typescript
 * const vcfText = fs.readFileSync('variants.vcf', 'utf-8');
 * const header = parseVCFHeader(vcfText);
 * console.log(header.fileformat, header.samples);
 * ```
 *
 * @performance O(h) where h is header lines. Typical: <1ms for standard headers.
 */
export function parseVCFHeader(text: string): VCFHeader {
  if (typeof text !== 'string') {
    throw new TypeError(`text must be a string, got ${typeof text}`);
  }

  const lines = text.split('\n');
  const header: VCFHeader = {
    fileformat: '',
    contigs: [],
    info: [],
    filter: [],
    format: [],
    samples: [],
    other: [],
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');
    if (!line.startsWith('#')) {
      break; // End of header
    }

    if (line.startsWith('##fileformat=')) {
      header.fileformat = line.substring(13).trim();
      continue;
    }

    const metadata = /^##(contig|INFO|FILTER|FORMAT)=<(.*)>$/.exec(line);
    if (metadata) {
      const attributes: Record<string, string> = {};
      const pairs = metadata[2].match(/(?:[^,"]|"(?:\\.|[^"\\])*")+/g) ?? [];
      for (const pair of pairs) {
        const separator = pair.indexOf('=');
        if (separator < 0) continue;
        const key = pair.slice(0, separator).trim();
        let value = pair.slice(separator + 1).trim();
        if (value.startsWith('"') && value.endsWith('"'))
          value = value.slice(1, -1).replace(/\\(["\\])/g, '$1');
        attributes[key] = value;
      }
      if (attributes.ID) {
        if (metadata[1] === 'contig')
          header.contigs.push({
            id: attributes.ID,
            length:
              attributes.length === undefined
                ? undefined
                : integer(attributes.length, 'VCF contig length', 1),
          });
        else if (metadata[1] === 'FILTER')
          header.filter.push({ id: attributes.ID, description: attributes.Description ?? '' });
        else {
          const field = {
            id: attributes.ID,
            number: attributes.Number,
            type: attributes.Type,
            description: attributes.Description ?? '',
          };
          if (metadata[1] === 'INFO') header.info.push(field);
          else header.format.push(field);
        }
      }
      continue;
    }

    if (line.startsWith('#CHROM')) {
      // Column header line
      const fields = line.substring(1).split('\t');
      if (fields.length > 9) {
        header.samples = fields.slice(9);
      }
      continue;
    }

    // Other header lines
    if (line.startsWith('##')) {
      header.other.push(line);
    }
  }

  if (!header.fileformat) {
    throw new Error('Invalid VCF: missing ##fileformat header');
  }

  return header;
}

/**
 * Parse VCF record line.
 *
 * @param line - Single VCF data line.
 * @param samples - Array of sample names from header.
 * @returns Parsed VCF record.
 *
 * @throws {TypeError} If line is not a string.
 * @throws {Error} If line format is invalid.
 *
 * @example
 * ```typescript
 * const line = '20\t14370\trs6054257\tG\tA\t29\tPASS\tNS=3;DP=14;AF=0.5\tGT:GQ:DP\t0|0:48:1\t1|0:48:8';
 * const record = parseVCFLine(line, ['NA00001', 'NA00002']);
 * console.log(record.chrom, record.pos, record.ref, record.alt);
 * ```
 *
 * @performance O(n) where n is line length. Typical: <0.2ms per line.
 */
export function parseVCFLine(line: string, _samples: string[] = []): VCFRecord {
  if (typeof line !== 'string') {
    throw new TypeError(`line must be a string, got ${typeof line}`);
  }

  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith('#')) {
    throw new Error('Cannot parse comment or empty line');
  }

  const fields = trimmed.split('\t');

  if (fields.length < 8) {
    throw new Error(`Invalid VCF format: expected at least 8 fields, got ${fields.length}`);
  }

  const [chrom, posStr, id, ref, altStr, qualStr, filter, infoStr] = fields;

  const pos = integer(posStr, 'VCF position', 1);
  const qual = qualStr === '.' ? null : numeric(qualStr, 'VCF quality');
  const alt = altStr.split(',');

  // Parse INFO field
  const info: Record<string, string | number | boolean | number[]> = {};
  if (infoStr !== '.') {
    const infoPairs = infoStr.split(';');
    for (const pair of infoPairs) {
      if (pair.includes('=')) {
        const separator = pair.indexOf('=');
        const key = pair.slice(0, separator);
        const value = pair.slice(separator + 1);
        // Try to parse as number
        const parts = value.split(',');
        const numbers = parts.map(Number);
        const numericParts =
          parts.every((part) => /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(part)) &&
          numbers.every(Number.isFinite);
        info[key] = numericParts ? (parts.length > 1 ? numbers : numbers[0]) : value;
      } else {
        // Flag (boolean)
        info[pair] = true;
      }
    }
  }

  const record: VCFRecord = {
    chrom,
    pos,
    id,
    ref,
    alt,
    qual,
    filter,
    info,
  };

  // Parse FORMAT and sample columns
  if (fields.length > 8) {
    const formatStr = fields[8];
    record.format = formatStr.split(':');
    record.samples = [];

    for (let i = 9; i < fields.length; i++) {
      const sampleData = fields[i];
      const values = sampleData.split(':');
      const sampleObj: Record<string, string> = {};

      record.format.forEach((key, idx) => {
        sampleObj[key] = values[idx] || '.';
      });

      record.samples.push(sampleObj);
    }
  }

  return record;
}

/**
 * Parse complete VCF file into header and records.
 *
 * @param text - Complete VCF file content.
 * @returns Object containing header and records.
 *
 * @throws {TypeError} If text is not a string.
 *
 * @example
 * ```typescript
 * const vcfText = fs.readFileSync('variants.vcf', 'utf-8');
 * const { header, records } = parseVCF(vcfText);
 * console.log(`Parsed ${records.length} variants`);
 * ```
 *
 * @performance O(n) where n is number of lines.
 * Typical: 10K variants in ~100ms, 100K variants in ~1s.
 */
export function parseVCF(
  text: string,
  options: { strict?: boolean } = {}
): { header: VCFHeader; records: VCFRecord[] } {
  assertString(text, 'text');
  const { strict = false } = options;

  const header = parseVCFHeader(text);
  const lines = text.split('\n');
  const records: VCFRecord[] = [];

  let dataStartIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#CHROM')) {
      dataStartIndex = i + 1;
      break;
    }
  }

  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    if (strict) {
      records.push(parseVCFLine(line, header.samples));
      continue;
    }

    try {
      const record = parseVCFLine(line, header.samples);
      records.push(record);
    } catch {
      continue;
    }
  }

  return { header, records };
}

/**
 * Format VCF record as VCF line.
 *
 * @param record - VCF record to format.
 * @returns Formatted VCF line.
 *
 * @throws {TypeError} If record is not an object.
 *
 * @example
 * ```typescript
 * const line = formatVCFLine(record);
 * console.log(line);
 * ```
 *
 * @performance O(n) where n is number of samples. Typical: <0.2ms.
 */
export function formatVCFLine(record: VCFRecord): string {
  if (typeof record !== 'object' || record === null) {
    throw new TypeError(`record must be an object, got ${typeof record}`);
  }

  const qual = record.qual === null ? '.' : record.qual.toString();
  const alt = record.alt.join(',');

  // Format INFO field
  const infoPairs = Object.entries(record.info).map(([key, value]) => {
    if (value === true) {
      return key;
    }
    if (Array.isArray(value)) return `${key}=${value.join(',')}`;
    return `${key}=${value}`;
  });
  const infoStr = infoPairs.length > 0 ? infoPairs.join(';') : '.';

  const fields = [
    record.chrom,
    record.pos.toString(),
    record.id,
    record.ref,
    alt,
    qual,
    record.filter,
    infoStr,
  ];

  // Add FORMAT and sample columns
  if (record.format && record.samples) {
    fields.push(record.format.join(':'));

    for (const sample of record.samples) {
      const values = record.format.map((key) => sample[key] || '.');
      fields.push(values.join(':'));
    }
  }

  return fields.join('\t');
}

/**
 * Format VCF header and records as complete VCF file.
 *
 * @param header - VCF header.
 * @param records - Array of VCF records.
 * @returns Formatted VCF file content.
 *
 * @throws {TypeError} If header or records is invalid.
 *
 * @example
 * ```typescript
 * const vcfText = formatVCF(header, records);
 * fs.writeFileSync('output.vcf', vcfText);
 * ```
 *
 * @performance O(n) where n is number of records.
 * Typical: 10K records in ~100ms.
 */
export function formatVCF(header: VCFHeader, records: VCFRecord[]): string {
  if (typeof header !== 'object' || header === null) {
    throw new TypeError(`header must be an object, got ${typeof header}`);
  }

  if (!Array.isArray(records)) {
    throw new TypeError(`records must be an array, got ${typeof records}`);
  }

  let output = '';
  const escapeDescription = (value: string): string =>
    value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  // Write fileformat
  output += `##fileformat=${header.fileformat}\n`;

  // Write other header lines
  for (const line of header.other) {
    output += line + '\n';
  }

  // Write contigs
  for (const contig of header.contigs) {
    if (contig.length) {
      output += `##contig=<ID=${contig.id},length=${contig.length}>\n`;
    } else {
      output += `##contig=<ID=${contig.id}>\n`;
    }
  }

  // Write INFO
  for (const info of header.info) {
    output += `##INFO=<ID=${info.id},Number=${info.number},Type=${info.type},Description="${escapeDescription(info.description)}">\n`;
  }

  // Write FILTER
  for (const filter of header.filter) {
    output += `##FILTER=<ID=${filter.id},Description="${escapeDescription(filter.description)}">\n`;
  }

  // Write FORMAT
  for (const format of header.format) {
    output += `##FORMAT=<ID=${format.id},Number=${format.number},Type=${format.type},Description="${escapeDescription(format.description)}">\n`;
  }

  // Write column header
  output += '#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO';
  if (header.samples.length > 0) {
    output += '\tFORMAT\t' + header.samples.join('\t');
  }
  output += '\n';

  // Write records
  for (const record of records) {
    output += formatVCFLine(record) + '\n';
  }

  return output;
}
