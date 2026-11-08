import { LineParser } from './line-parser';
import { Transform, pipeline, type TransformCallback } from 'stream';
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
export class FastaParser extends LineParser {
  private currentRecord: Partial<FastaRecord> | null = null;

  protected finish(): void {
    if (this.currentRecord && this.currentRecord.id) {
      this.emitRecord(this.currentRecord);
    }
  }

  protected processLine(line: string): void {
    const trimmed = line.trim();

    if (!trimmed) return;

    if (trimmed.startsWith('>')) {
      // New sequence - emit previous record if it exists
      if (this.currentRecord && this.currentRecord.id) {
        this.emitRecord(this.currentRecord as FastaRecord);
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
    super({
      objectMode: true,
      writableObjectMode: true,
      readableObjectMode: false,
      autoDestroy: false,
    });
    if (!Number.isInteger(lineWidth) || lineWidth <= 0)
      throw new Error('lineWidth must be a positive integer');
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

  const onComplete = (): void => {};
  if (filePath.endsWith('.gz')) {
    pipeline(fileStream, createGunzip(), parser, onComplete);
  } else {
    pipeline(fileStream, parser, onComplete);
  }
  return parser;
}

/**
 * Create a streaming FASTA writer to a file path
 * Automatically handles .gz files
 */
export function createFastaWriter(filePath: string, lineWidth: number = 80): NodeJS.WritableStream {
  const writer = new FastaWriter(lineWidth);
  const fileStream = createWriteStream(filePath);

  const onComplete = (error: NodeJS.ErrnoException | null): void => {
    writer.destroy(error ?? undefined);
  };
  if (filePath.endsWith('.gz')) {
    pipeline(writer, createGzip(), fileStream, onComplete);
  } else {
    pipeline(writer, fileStream, onComplete);
  }

  return writer;
}
