import type { TransformCallback } from 'stream';
import { Transform } from 'stream';
import { createReadStream, createWriteStream } from 'fs';
import { createGunzip, createGzip } from 'zlib';

/**
 * Quality encoding schemes for FASTQ files
 */
export enum QualityEncoding {
  Phred33 = 33, // Sanger, Illumina 1.8+
  Phred64 = 64, // Illumina 1.3-1.7
}

/**
 * Interface representing a parsed FASTQ sequence
 */
export interface FastqRecord {
  id: string;
  description?: string;
  sequence: string;
  quality: string;
}

/**
 * Stream transformer that parses FASTQ format into FastqRecord objects
 */
export class FastqParser extends Transform {
  private buffer: string = '';
  private lineNumber: number = 0;
  private currentRecord: Partial<FastqRecord> = {};

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

    callback();
  }

  private processLine(line: string): void {
    const trimmed = line.trim();
    const position = this.lineNumber % 4;

    switch (position) {
      case 0: {
        // ID line
        if (!trimmed.startsWith('@')) {
          throw new Error(
            `Expected '@' at line ${this.lineNumber}, got: ${trimmed.substring(0, 10)}`
          );
        }
        const header = trimmed.substring(1);
        const spaceIndex = header.indexOf(' ');

        if (spaceIndex === -1) {
          this.currentRecord = { id: header };
        } else {
          this.currentRecord = {
            id: header.substring(0, spaceIndex),
            description: header.substring(spaceIndex + 1),
          };
        }
        break;
      }

      case 1: // Sequence line
        this.currentRecord.sequence = trimmed;
        break;

      case 2: // '+' separator line
        if (!trimmed.startsWith('+')) {
          throw new Error(
            `Expected '+' at line ${this.lineNumber}, got: ${trimmed.substring(0, 10)}`
          );
        }
        break;

      case 3: // Quality line
        this.currentRecord.quality = trimmed;

        // Validate sequence and quality lengths match
        if (
          this.currentRecord.sequence &&
          this.currentRecord.sequence.length !== this.currentRecord.quality.length
        ) {
          throw new Error(
            `Sequence and quality length mismatch for ${this.currentRecord.id}: ` +
              `${this.currentRecord.sequence.length} vs ${this.currentRecord.quality.length}`
          );
        }

        this.push(this.currentRecord as FastqRecord);
        this.currentRecord = {};
        break;
    }

    this.lineNumber++;
  }
}

/**
 * Stream transformer that writes FastqRecord objects to FASTQ format
 */
export class FastqWriter extends Transform {
  constructor() {
    super({ objectMode: true, writableObjectMode: true, readableObjectMode: false });
  }

  _transform(record: FastqRecord, encoding: string, callback: TransformCallback): void {
    try {
      let output = '@';
      output += record.id;

      if (record.description) {
        output += ' ' + record.description;
      }

      output += '\n';
      output += record.sequence + '\n';
      output += '+\n';
      output += record.quality + '\n';

      this.push(output);
      callback();
    } catch (error) {
      callback(error as Error);
    }
  }
}

/**
 * Convert quality scores from one encoding to another
 */
export function convertQualityScores(
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

/**
 * Get quality score values from encoded string
 */
export function decodeQualityScores(quality: string, encoding: QualityEncoding): number[] {
  return quality.split('').map((char) => char.charCodeAt(0) - encoding);
}

/**
 * Encode quality score values to string
 */
export function encodeQualityScores(scores: number[], encoding: QualityEncoding): string {
  return scores.map((score) => String.fromCharCode(score + encoding)).join('');
}

/**
 * Stream transformer that converts quality encoding
 */
export class QualityConverter extends Transform {
  private fromEncoding: QualityEncoding;
  private toEncoding: QualityEncoding;

  constructor(fromEncoding: QualityEncoding, toEncoding: QualityEncoding) {
    super({ objectMode: true });
    this.fromEncoding = fromEncoding;
    this.toEncoding = toEncoding;
  }

  _transform(record: FastqRecord, encoding: string, callback: TransformCallback): void {
    try {
      const converted: FastqRecord = {
        ...record,
        quality: convertQualityScores(record.quality, this.fromEncoding, this.toEncoding),
      };
      this.push(converted);
      callback();
    } catch (error) {
      callback(error as Error);
    }
  }
}

/**
 * Create a streaming FASTQ parser from a file path
 * Automatically handles .gz files
 */
export function createFastqParser(filePath: string): NodeJS.ReadableStream {
  const fileStream = createReadStream(filePath);
  const parser = new FastqParser();

  if (filePath.endsWith('.gz')) {
    return fileStream.pipe(createGunzip()).pipe(parser);
  }

  return fileStream.pipe(parser);
}

/**
 * Create a streaming FASTQ writer to a file path
 * Automatically handles .gz files
 */
export function createFastqWriter(filePath: string): NodeJS.WritableStream {
  const writer = new FastqWriter();
  const fileStream = createWriteStream(filePath);

  if (filePath.endsWith('.gz')) {
    writer.pipe(createGzip()).pipe(fileStream);
  } else {
    writer.pipe(fileStream);
  }

  return writer;
}
