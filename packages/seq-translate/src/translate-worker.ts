/**
 * Worker thread for parallel sequence translation
 * Used internally by worker-translate.ts
 */

import { parentPort, workerData } from 'worker_threads';
import { CodonTable, getTable } from './tables';

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
 * Build optimized lookup table
 */
function buildOptimizedLookup(table: CodonTable): Map<string, string> {
  const lookup = new Map<string, string>();
  
  for (const [codon, aa] of Object.entries(table)) {
    const normalized = codon.toUpperCase();
    lookup.set(normalized, aa);
    const dnaCodon = normalized.replace(/U/g, 'T');
    lookup.set(dnaCodon, aa);
  }
  
  return lookup;
}

/**
 * Translate a single frame
 */
function translateFrame(
  seq: string,
  lookup: Map<string, string>,
  stopSymbol: string,
  breakOnStop: boolean,
  frameOffset: number = 0
): string {
  const start = frameOffset;
  const result: string[] = [];
  
  for (let i = start; i + 3 <= seq.length; i += 3) {
    const codon = seq.slice(i, i + 3).toUpperCase();
    const aa = lookup.get(codon) ?? 'X';
    
    if (aa === '*') {
      result.push(stopSymbol);
      if (breakOnStop) break;
    } else {
      result.push(aa);
    }
  }
  
  return result.join('');
}

/**
 * Get reverse complement
 */
function reverseComplement(seq: string): string {
  const complement: Record<string, string> = {
    'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G',
    'a': 't', 't': 'a', 'g': 'c', 'c': 'g',
    'U': 'A', 'u': 'a',
    'N': 'N', 'n': 'n'
  };
  
  return seq
    .split('')
    .reverse()
    .map(b => complement[b] ?? b)
    .join('');
}

/**
 * Process translation task in worker
 */
function processTask(task: WorkerTask): TranslationResult[][] {
  const { sequences, table, stopSymbol, breakOnStop, allFrames, includeReverse } = task;
  
  const codonTable = getTable(table);
  const lookup = buildOptimizedLookup(codonTable);
  
  return sequences.map(sequence => {
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

// Worker main execution
if (parentPort && workerData) {
  try {
    const results = processTask(workerData);
    const response: WorkerResult = { results };
    parentPort.postMessage(response);
  } catch (error) {
    const response: WorkerResult = {
      results: [],
      error: error instanceof Error ? error.message : String(error),
    };
    parentPort.postMessage(response);
  }
}
