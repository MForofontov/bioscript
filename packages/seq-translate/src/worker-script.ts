/**
 * Worker thread script for parallel sequence translation.
 * Used internally by worker-translate.ts - runs inside worker threads.
 *
 * @module worker-script
 */

import { parentPort, workerData } from 'worker_threads';
import { getTable } from './tables';
import { buildLookup, translateWithLookup as translateFrame } from './lookup';
import { reverseComplement } from '@bioscript/seq-utils';

interface WorkerTask {
  sequences: string[];
  table: string;
  stopSymbol: string;
  breakOnStop: boolean;
  allFrames: boolean;
  includeReverse: boolean;
}

interface WorkerResult {
  results: TranslationResult[][];
  error?: string;
}

interface TranslationResult {
  sequence: string;
  frame: number;
  isReverse: boolean;
  sourceLength: number;
}

/**
 * Process translation task in worker
 */
function processTask(task: WorkerTask): TranslationResult[][] {
  const { sequences, table, stopSymbol, breakOnStop, allFrames, includeReverse } = task;

  const codonTable = getTable(table);
  const lookup = buildLookup(codonTable);

  return sequences.map((sequence) => {
    const results: TranslationResult[] = [];
    const seq = sequence.trim().toUpperCase();

    const framesToTranslate = allFrames ? [0, 1, 2] : [0];

    for (const frame of framesToTranslate) {
      const translated = translateFrame(seq, lookup, stopSymbol, breakOnStop, frame);
      results.push({
        sequence: translated,
        frame,
        isReverse: false,
        sourceLength: seq.length,
      });
    }

    if (includeReverse) {
      const revSeq = reverseComplement(seq);
      const reverseFrames = allFrames ? [0, 1, 2] : [0];

      for (const frame of reverseFrames) {
        const translated = translateFrame(revSeq, lookup, stopSymbol, breakOnStop, frame);
        results.push({
          sequence: translated,
          frame: frame + 3,
          isReverse: true,
          sourceLength: revSeq.length,
        });
      }
    }

    return results;
  });
}

// One-shot workerData remains supported; pools use the message protocol.
if (parentPort) {
  const port = parentPort;
  const respond = (task: WorkerTask): void => {
    try {
      port.postMessage({ results: processTask(task) } satisfies WorkerResult);
    } catch (error) {
      port.postMessage({
        results: [],
        error: error instanceof Error ? error.message : String(error),
      } satisfies WorkerResult);
    }
  };
  if (workerData) respond(workerData as WorkerTask);
  else port.on('message', respond);
}
