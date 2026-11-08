import { browserLines } from './browser-lines';
/**
 * Browser-compatible FASTA parser using Web Streams API
 * Handles File/Blob objects with automatic gzip decompression
 */

import type { FastaRecord } from './fasta';

/**
 * Parse FASTA from a File or Blob object in the browser
 * Uses Web Streams API for memory-efficient processing
 *
 * @param file - File or Blob object to parse
 * @returns AsyncGenerator yielding FastaRecord objects
 *
 * @example
 * ```typescript
 * const fileInput = document.querySelector('input[type="file"]');
 * const file = fileInput.files[0];
 *
 * for await (const record of parseFastaBrowser(file)) {
 *   console.log(record.id, record.sequence.length);
 * }
 * ```
 */
export async function* parseFastaBrowser(file: File | Blob): AsyncGenerator<FastaRecord> {
  let currentRecord: FastaRecord | undefined;
  for await (const line of browserLines(file)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('>')) {
      if (currentRecord?.id) yield currentRecord;
      const header = trimmed.slice(1);
      const space = header.indexOf(' ');
      currentRecord = {
        id: space < 0 ? header : header.slice(0, space),
        description: space < 0 ? '' : header.slice(space + 1),
        sequence: '',
      };
    } else if (currentRecord) {
      currentRecord.sequence += trimmed;
    }
  }
  if (currentRecord?.id) yield currentRecord;
}

/**
 * Write FASTA records to a downloadable Blob
 *
 * @param records - Array of FastaRecord objects
 * @param lineWidth - Number of bases per line (default: 80)
 * @returns Blob containing FASTA formatted text
 *
 * @example
 * ```typescript
 * const records = [{ id: 'seq1', sequence: 'ACGT' }];
 * const blob = writeFastaBrowser(records);
 * // Use blob for download or upload
 * ```
 */
export function writeFastaBrowser(records: FastaRecord[], lineWidth: number = 80): Blob {
  if (!Number.isInteger(lineWidth) || lineWidth <= 0)
    throw new Error('lineWidth must be a positive integer');
  const lines: string[] = [];

  for (const record of records) {
    lines.push('>' + record.id + (record.description ? ' ' + record.description : ''));

    // Split sequence into lines of specified width
    for (let i = 0; i < record.sequence.length; i += lineWidth) {
      lines.push(record.sequence.substring(i, i + lineWidth));
    }
  }

  return new Blob([lines.join('\n') + '\n'], { type: 'text/plain' });
}

/**
 * Parse FASTA from a text string
 * Useful for processing text content directly
 *
 * @param text - FASTA formatted text
 * @returns Array of FastaRecord objects
 */
export function parseFastaText(text: string): FastaRecord[] {
  const records: FastaRecord[] = [];
  let currentRecord: Partial<FastaRecord> | null = null;

  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('>')) {
      // Save previous record
      if (currentRecord && currentRecord.id) {
        records.push(currentRecord as FastaRecord);
      }

      // Parse new header
      const header = trimmed.substring(1);
      const spaceIndex = header.indexOf(' ');

      if (spaceIndex === -1) {
        currentRecord = { id: header, description: '', sequence: '' };
      } else {
        currentRecord = {
          id: header.substring(0, spaceIndex),
          description: header.substring(spaceIndex + 1),
          sequence: '',
        };
      }
    } else if (currentRecord) {
      currentRecord.sequence = (currentRecord.sequence || '') + trimmed;
    }
  }

  // Save last record
  if (currentRecord && currentRecord.id) {
    records.push(currentRecord as FastaRecord);
  }

  return records;
}
