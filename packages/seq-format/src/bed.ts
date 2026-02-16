/**
 * BED format parser and writer.
 * Supports BED3, BED6, and BED12 formats.
 * @module bed
 */

import type { BEDRecord } from './types';

/**
 * Parse BED format line into structured record.
 * Automatically detects BED3, BED6, or BED12 format.
 *
 * @param line - Single BED format line.
 * @returns Parsed BED record.
 *
 * @throws {TypeError} If line is not a string.
 * @throws {Error} If line format is invalid.
 *
 * @example
 * ```typescript
 * // BED3
 * const bed3 = parseBEDLine('chr1\t1000\t2000');
 * console.log(bed3.chrom, bed3.chromStart, bed3.chromEnd);
 * ```
 *
 * @example
 * ```typescript
 * // BED6
 * const bed6 = parseBEDLine('chr1\t1000\t2000\tfeature1\t500\t+');
 * console.log(bed6.name, bed6.score, bed6.strand);
 * ```
 *
 * @example
 * ```typescript
 * // BED12
 * const bed12 = parseBEDLine('chr1\t1000\t5000\tgene1\t1000\t+\t1200\t4900\t0\t3\t300,400,200\t0,1500,3800');
 * console.log(bed12.blockCount, bed12.blockSizes);
 * ```
 *
 * @performance O(n) where n is line length. Typical: <0.1ms per line.
 */
export function parseBEDLine(line: string): BEDRecord {
  if (typeof line !== 'string') {
    throw new TypeError(`line must be a string, got ${typeof line}`);
  }

  const trimmed = line.trim();

  // Skip comments and empty lines
  if (
    !trimmed ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('track') ||
    trimmed.startsWith('browser')
  ) {
    throw new Error('Cannot parse comment, track, or browser line');
  }

  const fields = trimmed.split('\t');

  if (fields.length < 3) {
    throw new Error(`Invalid BED format: expected at least 3 fields, got ${fields.length}`);
  }

  const record: BEDRecord = {
    chrom: fields[0],
    chromStart: parseInt(fields[1]),
    chromEnd: parseInt(fields[2]),
  };

  // Validate coordinates
  if (isNaN(record.chromStart) || isNaN(record.chromEnd)) {
    throw new Error('Invalid BED coordinates: start and end must be integers');
  }

  if (record.chromStart < 0 || record.chromEnd < 0 || record.chromStart >= record.chromEnd) {
    throw new Error(`Invalid BED coordinates: start=${record.chromStart}, end=${record.chromEnd}`);
  }

  // BED6+ fields
  if (fields.length >= 4) {
    record.name = fields[3];
  }

  if (fields.length >= 5) {
    record.score = parseInt(fields[4]);
  }

  if (fields.length >= 6) {
    const strand = fields[5];
    if (!['+', '-', '.'].includes(strand)) {
      throw new Error(`Invalid strand: ${strand} (expected +, -, or .)`);
    }
    record.strand = strand as '+' | '-' | '.';
  }

  // BED12 fields
  if (fields.length >= 7) {
    record.thickStart = parseInt(fields[6]);
  }

  if (fields.length >= 8) {
    record.thickEnd = parseInt(fields[7]);
  }

  if (fields.length >= 9) {
    record.itemRgb = fields[8];
  }

  if (fields.length >= 10) {
    record.blockCount = parseInt(fields[9]);
  }

  if (fields.length >= 11) {
    record.blockSizes = fields[10]
      .split(',')
      .filter((s) => s)
      .map((s) => parseInt(s));
  }

  if (fields.length >= 12) {
    record.blockStarts = fields[11]
      .split(',')
      .filter((s) => s)
      .map((s) => parseInt(s));
  }

  return record;
}

/**
 * Format BED record as BED line.
 * Output format (BED3, BED6, BED12) determined by available fields.
 *
 * @param record - BED record to format.
 * @returns Formatted BED line.
 *
 * @throws {TypeError} If record is not an object.
 *
 * @example
 * ```typescript
 * const record: BEDRecord = {
 *   chrom: 'chr1',
 *   chromStart: 1000,
 *   chromEnd: 2000,
 *   name: 'feature1',
 *   score: 500,
 *   strand: '+'
 * };
 * const line = formatBEDLine(record);
 * // Output: chr1\t1000\t2000\tfeature1\t500\t+
 * ```
 *
 * @performance O(1) for BED3/BED6, O(n) for BED12 where n is block count. <0.1ms.
 */
export function formatBEDLine(record: BEDRecord): string {
  if (typeof record !== 'object' || record === null) {
    throw new TypeError(`record must be an object, got ${typeof record}`);
  }

  const fields: string[] = [record.chrom, record.chromStart.toString(), record.chromEnd.toString()];

  // Add optional fields if present
  if (record.name !== undefined) {
    fields.push(record.name);
  } else {
    return fields.join('\t');
  }

  if (record.score !== undefined) {
    fields.push(record.score.toString());
  } else {
    return fields.join('\t');
  }

  if (record.strand !== undefined) {
    fields.push(record.strand);
  } else {
    return fields.join('\t');
  }

  // BED12 fields
  if (record.thickStart !== undefined) {
    fields.push(record.thickStart.toString());
  } else {
    return fields.join('\t');
  }

  if (record.thickEnd !== undefined) {
    fields.push(record.thickEnd.toString());
  } else {
    return fields.join('\t');
  }

  if (record.itemRgb !== undefined) {
    fields.push(record.itemRgb);
  } else {
    return fields.join('\t');
  }

  if (record.blockCount !== undefined) {
    fields.push(record.blockCount.toString());
  } else {
    return fields.join('\t');
  }

  if (record.blockSizes !== undefined) {
    fields.push(record.blockSizes.join(','));
  } else {
    return fields.join('\t');
  }

  if (record.blockStarts !== undefined) {
    fields.push(record.blockStarts.join(','));
  }

  return fields.join('\t');
}

/**
 * Parse complete BED file into records.
 *
 * @param text - Complete BED file content.
 * @returns Array of parsed BED records.
 *
 * @throws {TypeError} If text is not a string.
 *
 * @example
 * ```typescript
 * const bedText = fs.readFileSync('regions.bed', 'utf-8');
 * const records = parseBED(bedText);
 * console.log(`Parsed ${records.length} regions`);
 * ```
 *
 * @performance O(n) where n is number of lines.
 * Typical: 10K lines in ~30ms, 100K lines in ~300ms.
 */
export function parseBED(text: string): BEDRecord[] {
  if (typeof text !== 'string') {
    throw new TypeError(`text must be a string, got ${typeof text}`);
  }

  const lines = text.split('\n');
  const records: BEDRecord[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments, track lines, browser lines, and empty lines
    if (
      !trimmed ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('track') ||
      trimmed.startsWith('browser')
    ) {
      continue;
    }

    try {
      const record = parseBEDLine(trimmed);
      records.push(record);
    } catch (_error) {
      // Skip malformed lines
      continue;
    }
  }

  return records;
}

/**
 * Format array of BED records as complete BED file.
 *
 * @param records - Array of BED records.
 * @param includeHeader - Include track header (default: false).
 * @param trackName - Track name for header (default: 'track').
 * @returns Formatted BED file content.
 *
 * @throws {TypeError} If records is not an array.
 *
 * @example
 * ```typescript
 * const bedText = formatBED(records, true, 'myRegions');
 * fs.writeFileSync('output.bed', bedText);
 * ```
 *
 * @performance O(n) where n is number of records.
 * Typical: 10K records in ~30ms.
 */
export function formatBED(
  records: BEDRecord[],
  includeHeader: boolean = false,
  trackName: string = 'track'
): string {
  if (!Array.isArray(records)) {
    throw new TypeError(`records must be an array, got ${typeof records}`);
  }

  let output = '';

  if (includeHeader) {
    output += `track name=${trackName} description="${trackName} regions"\n`;
  }

  for (const record of records) {
    output += formatBEDLine(record) + '\n';
  }

  return output;
}
