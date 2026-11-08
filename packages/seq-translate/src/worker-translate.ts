/**
 * Node.js multiprocessing translation using worker threads
 * Distributes translation workload across CPU cores for parallel processing
 */

import { Worker } from 'worker_threads';
import { cpus } from 'os';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { getTable } from './tables';
import { buildLookup } from './lookup';

/**
 * Translation options for worker-based translation
 */
export interface WorkerTranslationOptions {
  /** Codon table name or NCBI number (default: 'standard') */
  table?: string;
  /** Symbol for stop codon (default: '*') */
  stopSymbol?: string;
  /** If true, translation stops at first stop codon (default: true) */
  breakOnStop?: boolean;
  /** If true, returns all 6 reading frames (3 forward + 3 reverse) (default: false) */
  allFrames?: boolean;
  /** If true, also translate reverse complement (default: false) */
  includeReverse?: boolean;
  /** Number of worker threads to use (default: CPU count) */
  numWorkers?: number;
}

/**
 * Result of translation operation
 */
export interface TranslationResult {
  /** Translated protein sequence */
  sequence: string;
  /** Reading frame (0-2 for forward, 3-5 for reverse) */
  frame: number;
  /** Whether this is from reverse complement */
  isReverse: boolean;
  /** Original sequence length */
  sourceLength: number;
}

/** Resolve built worker assets without relying on platform-specific path separators. */
function workerFile(): string {
  const adjacent = resolve(__dirname, 'worker-script.js');
  const built = resolve(__dirname, '../dist/worker-script.js');
  if (existsSync(adjacent)) return adjacent;
  if (existsSync(built)) return built;
  throw new Error('Translation worker is missing; build @bioscript/seq-translate first');
}

function positiveInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new Error(`${name} must be a positive integer`);
  return value;
}

function taskData(sequences: string[], options: WorkerTranslationOptions) {
  return {
    sequences,
    table: options.table ?? 'standard',
    stopSymbol: options.stopSymbol ?? '*',
    breakOnStop: options.breakOnStop !== false,
    allFrames: options.allFrames ?? false,
    includeReverse: options.includeReverse ?? false,
  };
}

/** Translate batches in parallel, preserving their original order. */
export async function translateWorker(
  sequences: string[],
  options: WorkerTranslationOptions = {}
): Promise<TranslationResult[][]> {
  const numWorkers = positiveInteger(options.numWorkers ?? cpus().length, 'numWorkers');
  if (sequences.length === 0) return [];
  // Small batches do not benefit from starting one thread for every short sequence.
  const count = sequences.length <= numWorkers ? 1 : numWorkers;
  const pool = new TranslationPool(count);
  try {
    const chunkSize = Math.ceil(sequences.length / count);
    const chunks: string[][] = [];
    for (let i = 0; i < sequences.length; i += chunkSize)
      chunks.push(sequences.slice(i, i + chunkSize));
    return (await Promise.all(chunks.map((chunk) => pool.translate(chunk, options)))).flat();
  } finally {
    await pool.terminate();
  }
}

/** Translate frame zero in codon-aligned chunks. Concatenation equals whole-sequence translation. */
export async function translateWorkerChunked(
  sequence: string,
  options: WorkerTranslationOptions & { chunkSize?: number } = {}
): Promise<TranslationResult[]> {
  const requested = positiveInteger(options.chunkSize ?? 30000, 'chunkSize');
  positiveInteger(options.numWorkers ?? cpus().length, 'numWorkers');
  const chunkSize = Math.max(3, Math.floor(requested / 3) * 3);
  let seq = sequence.trim().toUpperCase();
  if (options.breakOnStop !== false) {
    const lookup = buildLookup(getTable(options.table ?? 'standard'));
    for (let i = 0; i + 3 <= seq.length; i += 3) {
      if (lookup.get(seq.slice(i, i + 3)) === '*') {
        seq = seq.slice(0, i + 3);
        break;
      }
    }
  }
  const chunks: string[] = [];
  for (let i = 0; i < seq.length; i += chunkSize) chunks.push(seq.slice(i, i + chunkSize));
  return (
    await translateWorker(chunks, { ...options, allFrames: false, includeReverse: false })
  ).map((results) => results[0]);
}

interface PoolTask {
  sequences: string[];
  options: WorkerTranslationOptions;
  resolve: (value: TranslationResult[][]) => void;
  reject: (error: Error) => void;
}

/** Persistent workers process one task each; queued and active tasks always settle on shutdown. */
export class TranslationPool {
  private workers = new Set<Worker>();
  private active = new Map<Worker, PoolTask>();
  private taskQueue: PoolTask[] = [];
  private numWorkers: number;
  private terminated = false;
  private termination?: Promise<void>;

  constructor(numWorkers?: number) {
    this.numWorkers = positiveInteger(numWorkers ?? cpus().length, 'numWorkers');
  }

  initialize(): void {
    if (this.terminated) throw new Error('Translation pool has been terminated');
    if (this.workers.size) return;
    try {
      for (let i = 0; i < this.numWorkers; i++) this.addWorker();
    } catch (error) {
      void this.terminate();
      throw error;
    }
  }

  private addWorker(): void {
    const worker = new Worker(workerFile());
    this.workers.add(worker);
    worker.on('message', (response: { results: TranslationResult[][]; error?: string }) => {
      const task = this.active.get(worker);
      if (!task) return;
      this.active.delete(worker);
      if (response.error) task.reject(new Error(response.error));
      else task.resolve(response.results);
      this.processQueue();
    });
    worker.on('error', (error) => this.workerFailed(worker, error));
    worker.on('exit', (code) =>
      this.workerFailed(
        worker,
        new Error(`Translation worker exited before completing its task (code ${code})`)
      )
    );
  }

  private workerFailed(worker: Worker, error: Error): void {
    if (!this.workers.delete(worker)) return;
    this.active.get(worker)?.reject(error);
    this.active.delete(worker);
    if (!this.terminated && this.taskQueue.length) {
      try {
        this.addWorker();
        this.processQueue();
      } catch (failure) {
        for (const task of this.taskQueue.splice(0)) task.reject(failure as Error);
      }
    }
  }

  async translate(
    sequences: string[],
    options: WorkerTranslationOptions = {}
  ): Promise<TranslationResult[][]> {
    if (this.terminated) throw new Error('Translation pool has been terminated');
    if (options.numWorkers !== undefined) positiveInteger(options.numWorkers, 'numWorkers');
    if (!sequences.length) return [];
    this.initialize();
    return new Promise((resolveTask, reject) => {
      this.taskQueue.push({ sequences, options, resolve: resolveTask, reject });
      this.processQueue();
    });
  }

  private processQueue(): void {
    for (const worker of this.workers) {
      while (!this.active.has(worker) && this.taskQueue.length) {
        const task = this.taskQueue.shift()!;
        this.active.set(worker, task);
        try {
          worker.postMessage(taskData(task.sequences, task.options));
        } catch (error) {
          this.active.delete(worker);
          task.reject(error as Error);
        }
      }
    }
  }

  async terminate(): Promise<void> {
    if (this.termination) return this.termination;
    this.terminated = true;
    const error = new Error('Translation pool terminated');
    for (const task of this.taskQueue.splice(0)) task.reject(error);
    for (const task of this.active.values()) task.reject(error);
    this.active.clear();
    const workers = [...this.workers];
    this.workers.clear();
    this.termination = Promise.all(workers.map((worker) => worker.terminate())).then(
      () => undefined
    );
    return this.termination;
  }
}
