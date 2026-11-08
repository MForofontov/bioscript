import { Transform, type TransformCallback } from 'stream';
import { StringDecoder } from 'string_decoder';

/** Incremental UTF-8 line parser that pauses when its readable side is full. */
export abstract class LineParser extends Transform {
  private decoder = new StringDecoder('utf8');
  private text = '';
  private pending?: TransformCallback;
  private blocked = false;
  private draining = false;

  constructor() {
    super({ readableObjectMode: true });
  }

  protected abstract processLine(line: string): void;
  protected abstract finish(): void;

  protected emitRecord(record: unknown): void {
    this.blocked = !this.push(record);
  }

  _transform(chunk: Buffer, _encoding: string, callback: TransformCallback): void {
    this.text += this.decoder.write(chunk);
    this.pending = callback;
    this.drainLines();
  }

  _read(size: number): void {
    this.blocked = false;
    this.drainLines();
    super._read(size);
  }

  private drainLines(): void {
    if (this.draining || !this.pending) return;
    this.draining = true;
    let offset = 0;
    try {
      while (!this.blocked) {
        const end = this.text.indexOf('\n', offset);
        if (end < 0) break;
        this.processLine(this.text.slice(offset, end).replace(/\r$/, ''));
        offset = end + 1;
      }
      this.text = this.text.slice(offset);
      if (!this.blocked) {
        const callback = this.pending;
        this.pending = undefined;
        this.draining = false;
        callback();
        return;
      }
    } catch (error) {
      const callback = this.pending;
      this.pending = undefined;
      callback?.(error as Error);
    } finally {
      this.draining = false;
    }
  }

  _flush(callback: TransformCallback): void {
    try {
      this.text += this.decoder.end();
      if (this.text) this.processLine(this.text.replace(/\r$/, ''));
      this.finish();
      callback();
    } catch (error) {
      callback(error as Error);
    }
  }
}
