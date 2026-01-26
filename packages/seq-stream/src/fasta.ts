import { Transform, type TransformCallback } from 'stream';
import { createReadStream, createWriteStream } from 'fs';
import { createGunzip, createGzip } from 'zlib';

/**
 * Interface representing a parsed FASTA sequence
 */
export interface FastaRecord {
  id: string;
  description?: string;
  sequence: string;
}

/**
 * Stream transformer that parses FASTA format into FastaRecord objects
 */
export class FastaParser extends Transform {
  private buffer: string = '';
  private currentRecord: Partial<FastaRecord> | null = null;

  constructor() {
    super({ objectMode: true });
  }

  _transform(chunk: Buffer, encoding: string, callback: TransformCallback): void {
    this.buffer += chunk.toString();
    const lines = this.buffer.split('\n');

    // Keep the last incomplete line in the buffer
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      this.processLine(line);
    }

    callback();
  }

  _flush(callback: TransformCallback): void {
    // Process any remaining data
    if (this.buffer) {
      this.processLine(this.buffer);
    }

    // Emit the last record if it exists
    if (this.currentRecord && this.currentRecord.id) {
      this.push(this.currentRecord as FastaRecord);
    }

    callback();
  }

  private processLine(line: string): void {
    const trimmed = line.trim();

    if (!trimmed) return;

    if (trimmed.startsWith('>')) {
      // New sequence - emit previous record if it exists
      if (this.currentRecord && this.currentRecord.id) {
        this.push(this.currentRecord as FastaRecord);
      }

      // Parse header
      const header = trimmed.substring(1);
      const spaceIndex = header.indexOf(' ');

      if (spaceIndex === -1) {
        this.currentRecord = { id: header, sequence: '' };
      } else {
        this.currentRecord = {
          id: header.substring(0, spaceIndex),
          description: header.substring(spaceIndex + 1),
          sequence: '',
        };
      }
    } else if (this.currentRecord) {
      // Append sequence data
      this.currentRecord.sequence = (this.currentRecord.sequence || '') + trimmed;
    }
  }
}

/**
 * Stream transformer that writes FastaRecord objects to FASTA format
 */
export class FastaWriter extends Transform {
  private lineWidth: number;

  constructor(lineWidth: number = 80) {
    super({ objectMode: true, writableObjectMode: true, readableObjectMode: false });
    this.lineWidth = lineWidth;
  }

  _transform(record: FastaRecord, encoding: string, callback: TransformCallback): void {
    try {
      let output = '>';
      output += record.id;

      if (record.description) {
        output += ' ' + record.description;
      }

      output += '\n';

      // Split sequence into lines of specified width
      const sequence = record.sequence;
      for (let i = 0; i < sequence.length; i += this.lineWidth) {
        output += sequence.substring(i, i + this.lineWidth) + '\n';
      }

      this.push(output);
      callback();
    } catch (error) {
      callback(error as Error);
    }
  }
}

/**
 * Create a streaming FASTA parser from a file path
 * Automatically handles .gz files
 */
export function createFastaParser(filePath: string): NodeJS.ReadableStream {
  const fileStream = createReadStream(filePath);
  const parser = new FastaParser();

  if (filePath.endsWith('.gz')) {
    return fileStream.pipe(createGunzip()).pipe(parser);
  }

  return fileStream.pipe(parser);
}

/**
 * Create a streaming FASTA writer to a file path
 * Automatically handles .gz files
 */
export function createFastaWriter(filePath: string, lineWidth: number = 80): NodeJS.WritableStream {
  const writer = new FastaWriter(lineWidth);
  const fileStream = createWriteStream(filePath);

  if (filePath.endsWith('.gz')) {
    writer.pipe(createGzip()).pipe(fileStream);
  } else {
    writer.pipe(fileStream);
  }

  return writer;
}
