import { browserLines } from './browser-lines';
/**
 * Browser-compatible FASTQ parser using Web Streams API
 * Handles File/Blob objects with automatic gzip decompression
 */

import type { FastqRecord, QualityEncoding } from './fastq';

/**
 * Parse FASTQ from a File or Blob object in the browser
 * Uses Web Streams API for memory-efficient processing
 *
 * @param file - File or Blob object to parse
 * @returns AsyncGenerator yielding FastqRecord objects
 *
 * @example
 * ```typescript
 * const fileInput = document.querySelector('input[type="file"]');
 * const file = fileInput.files[0];
 *
 * for await (const record of parseFastqBrowser(file)) {
 *   console.log(record.id, record.sequence.length, record.quality);
 * }
 * ```
 */
export async function* parseFastqBrowser(file: File | Blob): AsyncGenerator<FastqRecord> {
  let lineNumber = 0;
  let currentRecord: Partial<FastqRecord> = {};
  for await (const line of browserLines(file)) {
    const trimmed = line.trim();
    const position = lineNumber % 4;

    switch (position) {
      case 0: {
        // ID line
        if (!trimmed.startsWith('@')) {
          throw new Error(`Expected '@' at line ${lineNumber}, got: ${trimmed.substring(0, 20)}`);
        }
        const header = trimmed.substring(1);
        const spaceIndex = header.indexOf(' ');

        if (spaceIndex === -1) {
          currentRecord = { id: header, description: '' };
        } else {
          currentRecord = {
            id: header.substring(0, spaceIndex),
            description: header.substring(spaceIndex + 1),
          };
        }
        break;
      }

      case 1: // Sequence
        currentRecord.sequence = trimmed;
        break;

      case 2: // '+'
        if (!trimmed.startsWith('+')) {
          throw new Error(`Expected '+' at line ${lineNumber}, got: ${trimmed.substring(0, 20)}`);
        }
        break;

      case 3: // Quality
        currentRecord.quality = trimmed;

        if (
          currentRecord.sequence !== undefined &&
          currentRecord.sequence.length !== currentRecord.quality.length
        ) {
          throw new Error(
            `Sequence/quality length mismatch for ${currentRecord.id}: ` +
              `${currentRecord.sequence.length} vs ${currentRecord.quality.length}`
          );
        }

        yield currentRecord as FastqRecord;
        currentRecord = {};
        break;
    }

    lineNumber++;
  }
  if (lineNumber % 4 !== 0) throw new Error('Incomplete FASTQ record at end of input');
}

/**
 * Write FASTQ records to a downloadable Blob
 *
 * @param records - Array of FastqRecord objects
 * @returns Blob containing FASTQ formatted text
 *
 * @example
 * ```typescript
 * const records = [{ id: 'read1', sequence: 'ACGT', quality: 'IIII' }];
 * const blob = writeFastqBrowser(records);
 * ```
 */
export function writeFastqBrowser(records: FastqRecord[]): Blob {
  const lines: string[] = [];

  for (const record of records) {
    lines.push('@' + record.id + (record.description ? ' ' + record.description : ''));
    lines.push(record.sequence);
    lines.push('+');
    lines.push(record.quality);
  }

  return new Blob([lines.join('\n') + '\n'], { type: 'text/plain' });
}

/**
 * Parse FASTQ from a text string
 * Useful for processing text content directly
 *
 * @param text - FASTQ formatted text
 * @returns Array of FastqRecord objects
 */
export function parseFastqText(text: string): FastqRecord[] {
  const records: FastqRecord[] = [];
  const lines = text.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  let lineNumber = 0;
  let currentRecord: Partial<FastqRecord> = {};

  for (const line of lines) {
    const trimmed = line.trim();

    const position = lineNumber % 4;

    switch (position) {
      case 0: {
        // ID line
        if (!trimmed.startsWith('@')) {
          throw new Error(`Expected '@' at line ${lineNumber}`);
        }
        const header = trimmed.substring(1);
        const spaceIndex = header.indexOf(' ');

        if (spaceIndex === -1) {
          currentRecord = { id: header, description: '' };
        } else {
          currentRecord = {
            id: header.substring(0, spaceIndex),
            description: header.substring(spaceIndex + 1),
          };
        }
        break;
      }

      case 1: // Sequence
        currentRecord.sequence = trimmed;
        break;

      case 2: // '+'
        if (!trimmed.startsWith('+')) {
          throw new Error(`Expected '+' at line ${lineNumber}`);
        }
        break;

      case 3: // Quality
        currentRecord.quality = trimmed;

        if (
          currentRecord.sequence !== undefined &&
          currentRecord.sequence.length !== currentRecord.quality.length
        ) {
          throw new Error(`Sequence/quality length mismatch for ${currentRecord.id}`);
        }

        records.push(currentRecord as FastqRecord);
        currentRecord = {};
        break;
    }

    lineNumber++;
  }

  if (lineNumber % 4 !== 0) throw new Error('Incomplete FASTQ record at end of input');
  return records;
}

/**
 * Convert quality scores in browser (synchronous)
 *
 * @param quality - Quality string to convert
 * @param fromEncoding - Source encoding
 * @param toEncoding - Target encoding
 * @returns Converted quality string
 */
export function convertQualityBrowser(
  quality: string,
  fromEncoding: QualityEncoding,
  toEncoding: QualityEncoding
): string {
  if (fromEncoding === toEncoding) {
    return quality;
  }

  const offset = toEncoding - fromEncoding;
  return quality
    .split('')
    .map((char) => String.fromCharCode(char.charCodeAt(0) + offset))
    .join('');
}
