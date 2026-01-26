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
  const textDecoder = new TextDecoder('utf-8');
  let buffer = '';
  let currentRecord: Partial<FastaRecord> | null = null;

  // Handle gzip if file name ends with .gz
  let stream: ReadableStream<Uint8Array>;

  if (file instanceof File && file.name.endsWith('.gz')) {
    stream = file.stream().pipeThrough(new DecompressionStream('gzip'));
  } else {
    stream = file.stream();
  }

  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += textDecoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('>')) {
          // Emit previous record
          if (currentRecord && currentRecord.id) {
            yield currentRecord as FastaRecord;
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
    }

    // Process final buffer
    if (buffer) {
      const trimmed = buffer.trim();
      if (currentRecord && trimmed && !trimmed.startsWith('>')) {
        currentRecord.sequence = (currentRecord.sequence || '') + trimmed;
      }
    }

    // Emit last record
    if (currentRecord && currentRecord.id) {
      yield currentRecord as FastaRecord;
    }
  } finally {
    reader.releaseLock();
  }
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
