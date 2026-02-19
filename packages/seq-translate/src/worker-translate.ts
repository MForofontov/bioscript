/**
 * Node.js multiprocessing translation using worker threads
 * Distributes translation workload across CPU cores for parallel processing
 */

import { Worker } from 'worker_threads';
import { cpus } from 'os';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { normalizeSequence } from '@bioscript/seq-utils';

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

/**
 * Run a worker thread for translation
 */
function runWorker(
  workerPath: string,
  sequences: string[],
  options: WorkerTranslationOptions
): Promise<TranslationResult[][]> {
  return new Promise((resolveWorker, reject) => {
    const worker = new Worker(workerPath, {
      workerData: {
        sequences,
        table: options.table || 'standard',
        stopSymbol: options.stopSymbol || '*',
        breakOnStop: options.breakOnStop !== false,
        allFrames: options.allFrames || false,
        includeReverse: options.includeReverse || false,
      },
    });

    worker.on('message', (result: { results: TranslationResult[][]; error?: string }) => {
      if (result.error) {
        reject(new Error(result.error));
      } else {
        resolveWorker(result.results);
      }
    });

    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

/**
 * Translate multiple sequences in parallel using worker threads
 * Automatically distributes work across available CPU cores
 *
 * @example
 * ```typescript
 * const sequences = ['ATGGCC', 'ATGTAA', 'ATGCCC'];
 * const results = await translateWorker(sequences, {
 *   table: 'standard',
 *   allFrames: true
 * });
 *
 * results.forEach((seqResults, i) => {
 *   console.log(`Sequence ${i}:`);
 *   seqResults.forEach(r => console.log(`  Frame ${r.frame}: ${r.sequence}`));
 * });
 * ```
 */
export async function translateWorker(
  sequences: string[],
  options: WorkerTranslationOptions = {}
): Promise<TranslationResult[][]> {
  if (sequences.length === 0) {
    return [];
  }

  const numWorkers = options.numWorkers || cpus().length;
  // Try dist first (production), fall back to src (development/testing)
  let workerPath = resolve(__dirname, 'worker-script.js');

  // Check if we're in development/test mode (src directory)
  if (__dirname.includes('/src')) {
    const distPath = resolve(__dirname, '../dist/worker-script.js');
    if (existsSync(distPath)) {
      workerPath = distPath;
    }
  }

  // For small workloads, use single worker
  if (sequences.length <= numWorkers) {
    return runWorker(workerPath, sequences, options);
  }

  // Distribute sequences across workers
  const chunkSize = Math.ceil(sequences.length / numWorkers);
  const chunks: string[][] = [];

  for (let i = 0; i < sequences.length; i += chunkSize) {
    chunks.push(sequences.slice(i, i + chunkSize));
  }

  // Run workers in parallel
  const workerPromises = chunks.map((chunk) => runWorker(workerPath, chunk, options));

  const results = await Promise.all(workerPromises);

  // Flatten results back to original order
  return results.flat();
}

/**
 * Translate a single large sequence by splitting it into chunks
 * and processing chunks in parallel. Useful for very long sequences (> 1MB)
 *
 * @example
 * ```typescript
 * const longSeq = 'ATG' + 'GCC'.repeat(100000) + 'TAA';
 * const results = await translateWorkerChunked(longSeq, {
 *   table: 'standard',
 *   chunkSize: 30000
 * });
 *
 * // Combine chunks
 * const fullTranslation = results.map(r => r.sequence).join('');
 * ```
 */
export async function translateWorkerChunked(
  sequence: string,
  options: WorkerTranslationOptions & { chunkSize?: number } = {}
): Promise<TranslationResult[]> {
  const chunkSize = options.chunkSize || 30000; // 30kb chunks (10k codons)
  const seq = normalizeSequence(sequence);

  // Split sequence into overlapping chunks to maintain frame
  const chunks: string[] = [];
  for (let i = 0; i < seq.length; i += chunkSize) {
    chunks.push(seq.slice(i, Math.min(i + chunkSize + 2, seq.length)));
  }

  const results = await translateWorker(chunks, options);

  // Return first frame of each chunk
  return results.map((chunkResults) => chunkResults[0]);
}

/**
 * Translate sequences with automatic worker pool management
 * Keeps a pool of workers alive for multiple translation batches
 */
export class TranslationPool {
  private workers: Worker[] = [];
  private workerPath: string;
  private numWorkers: number;
  private taskQueue: Array<{
    sequences: string[];
    options: WorkerTranslationOptions;
    resolve: (value: TranslationResult[][]) => void;
    reject: (error: Error) => void;
  }> = [];
  private busyWorkers: Set<number> = new Set();

  constructor(numWorkers?: number) {
    this.numWorkers = numWorkers || cpus().length;
    let workerPath = resolve(__dirname, 'worker-script.js');

    // Check if we're in development/test mode (src directory)
    if (__dirname.includes('/src')) {
      const distPath = resolve(__dirname, '../dist/worker-script.js');
      if (existsSync(distPath)) {
        workerPath = distPath;
      }
    }

    this.workerPath = workerPath;
  }

  /**
   * Initialize the worker pool
   */
  initialize(): void {
    for (let i = 0; i < this.numWorkers; i++) {
      const worker = new Worker(this.workerPath);
      this.workers.push(worker);
    }
  }

  /**
   * Translate sequences using the worker pool
   */
  async translate(
    sequences: string[],
    options: WorkerTranslationOptions = {}
  ): Promise<TranslationResult[][]> {
    if (this.workers.length === 0) {
      this.initialize();
    }

    return new Promise((resolveTask, reject) => {
      this.taskQueue.push({ sequences, options, resolve: resolveTask, reject });
      void this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.taskQueue.length === 0) {
      return;
    }

    const availableWorkerIdx = this.workers.findIndex((_, idx) => !this.busyWorkers.has(idx));
    if (availableWorkerIdx === -1) {
      return;
    }

    const task = this.taskQueue.shift();
    if (!task) return;

    this.busyWorkers.add(availableWorkerIdx);

    try {
      const result = await runWorker(this.workerPath, task.sequences, task.options);
      task.resolve(result);
    } catch (error) {
      task.reject(error as Error);
    } finally {
      this.busyWorkers.delete(availableWorkerIdx);
      void this.processQueue();
    }
  }

  /**
   * Terminate all workers in the pool
   */
  async terminate(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.terminate()));
    this.workers = [];
    this.busyWorkers.clear();
    this.taskQueue = [];
  }
}
