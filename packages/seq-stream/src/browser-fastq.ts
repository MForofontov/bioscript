/**
 * Browser-compatible FASTQ parser using Web Streams API
 * Handles File/Blob objects with automatic gzip decompression
 */

import type { FastqRecord, QualityEncoding } from './fastq';

type FastqParseState = {
  lineNumber: number;
  currentRecord: Partial<FastqRecord>;
};

function processFastqLine(
  line: string,
  state: FastqParseState,
  onRecord: (record: FastqRecord) => void
): void {
  const trimmed = line.trim();

  if (!trimmed) {
    const position = state.lineNumber % 4;
    if (position !== 0 || state.currentRecord.id) {
      throw new Error(`Unexpected blank line in FASTQ record at line ${state.lineNumber}`);
    }
    return;
  }

  const position = state.lineNumber % 4;

  switch (position) {
    case 0: {
      if (!trimmed.startsWith('@')) {
        throw new Error(
          `Expected '@' at line ${state.lineNumber}, got: ${trimmed.substring(0, 20)}`
        );
      }
      const header = trimmed.substring(1);
      const spaceIndex = header.indexOf(' ');

      if (spaceIndex === -1) {
        state.currentRecord = { id: header, description: '' };
      } else {
        state.currentRecord = {
          id: header.substring(0, spaceIndex),
          description: header.substring(spaceIndex + 1),
        };
      }
      break;
    }

    case 1:
      state.currentRecord.sequence = trimmed;
      break;

    case 2:
      if (!trimmed.startsWith('+')) {
        throw new Error(
          `Expected '+' at line ${state.lineNumber}, got: ${trimmed.substring(0, 20)}`
        );
      }
      break;

    case 3:
      state.currentRecord.quality = trimmed;

      if (
        state.currentRecord.sequence &&
        state.currentRecord.sequence.length !== state.currentRecord.quality.length
      ) {
        throw new Error(
          `Sequence/quality length mismatch for ${state.currentRecord.id}: ` +
            `${state.currentRecord.sequence.length} vs ${state.currentRecord.quality.length}`
        );
      }

      onRecord(state.currentRecord as FastqRecord);
      state.currentRecord = {};
      break;
  }

  state.lineNumber++;
}

function assertFastqComplete(state: FastqParseState): void {
  const position = state.lineNumber % 4;
  if (position !== 0 || state.currentRecord.id) {
    throw new Error(
      `Incomplete FASTQ record at end of input (stopped after line ${state.lineNumber}, expected 4 lines per record)`
    );
  }
}

/**
 * Parse FASTQ from a File or Blob object in the browser
 * Uses Web Streams API for memory-efficient processing
 */
export async function* parseFastqBrowser(file: File | Blob): AsyncGenerator<FastqRecord> {
  const textDecoder = new TextDecoder('utf-8');
  let buffer = '';
  const state: FastqParseState = { lineNumber: 0, currentRecord: {} };
  const pending: FastqRecord[] = [];

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
        processFastqLine(line, state, (record) => pending.push(record));
      }

      while (pending.length > 0) {
        yield pending.shift()!;
      }
    }

    if (buffer) {
      processFastqLine(buffer, state, (record) => pending.push(record));
      buffer = '';
    }

    assertFastqComplete(state);

    while (pending.length > 0) {
      yield pending.shift()!;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Write FASTQ records to a downloadable Blob
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
 */
export function parseFastqText(text: string): FastqRecord[] {
  const records: FastqRecord[] = [];
  const state: FastqParseState = { lineNumber: 0, currentRecord: {} };
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isLastLine = i === lines.length - 1;

    if (isLastLine && line === '' && state.lineNumber % 4 === 0 && !state.currentRecord.id) {
      continue;
    }

    processFastqLine(line, state, (record) => records.push(record));
  }

  assertFastqComplete(state);
  return records;
}

/**
 * Convert quality scores in browser (synchronous)
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
