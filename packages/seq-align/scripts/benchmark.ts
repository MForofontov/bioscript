/**
 * Benchmark script for seq-align algorithms.
 * Tests speed and memory usage with average protein sequences.
 */

import {
  needlemanWunsch,
  smithWaterman,
  semiGlobal,
  bandedAlign,
  overlapAlign,
  hirschberg,
  BandedAlignmentOptions,
} from '../src/index';
import type { AlignmentOptions } from '../src/types';

interface BenchmarkResult {
  algorithm: string;
  seqLength: number;
  time: number; // milliseconds
  memoryBefore: number; // MB
  memoryAfter: number; // MB
  memoryDelta: number; // MB
  score: number;
  identity: number;
  identityPercent: number;
}

/**
 * Generate random protein sequence.
 */
function generateProteinSequence(length: number): string {
  const aminoAcids = 'ACDEFGHIKLMNPQRSTVWY';
  let sequence = '';
  for (let i = 0; i < length; i++) {
    sequence += aminoAcids[Math.floor(Math.random() * aminoAcids.length)];
  }
  return sequence;
}

/**
 * Generate similar sequence with controlled mutations.
 */
function generateSimilarSequence(
  original: string,
  identityPercent: number
): string {
  const aminoAcids = 'ACDEFGHIKLMNPQRSTVWY';
  const mutationRate = 1 - identityPercent / 100;
  let sequence = '';

  for (let i = 0; i < original.length; i++) {
    if (Math.random() < mutationRate) {
      // Mutate
      sequence += aminoAcids[Math.floor(Math.random() * aminoAcids.length)];
    } else {
      // Keep original
      sequence += original[i];
    }
  }

  return sequence;
}

/**
 * Get memory usage in MB.
 */
function getMemoryUsage(): number {
  const usage = process.memoryUsage();
  return usage.heapUsed / 1024 / 1024;
}

/**
 * Benchmark a single algorithm.
 */
function benchmarkAlgorithm(
  name: string,
  alignFunc: (seq1: string, seq2: string, options?: any) => any,
  seq1: string,
  seq2: string,
  options: any = {}
): BenchmarkResult {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  const memoryBefore = getMemoryUsage();
  const startTime = performance.now();

  const result = alignFunc(seq1, seq2, options);

  const endTime = performance.now();
  const memoryAfter = getMemoryUsage();

  return {
    algorithm: name,
    seqLength: seq1.length,
    time: endTime - startTime,
    memoryBefore,
    memoryAfter,
    memoryDelta: memoryAfter - memoryBefore,
    score: result.score,
    identity: result.identity,
    identityPercent: result.identityPercent,
  };
}

/**
 * Run comprehensive benchmarks.
 */
function runBenchmarks() {
  console.log('🧬 Bioscript Sequence Alignment Benchmarks\n');
  console.log('Testing with protein sequences at various lengths\n');

  // Test configurations
  const sequenceLengths = [100, 500, 1000, 2000];
  const identityLevel = 75; // 75% identity (typical for homologs)

  const allResults: BenchmarkResult[] = [];

  for (const length of sequenceLengths) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Sequence Length: ${length} amino acids (~${identityLevel}% identity)`);
    console.log('='.repeat(60));

    // Generate test sequences
    const seq1 = generateProteinSequence(length);
    const seq2 = generateSimilarSequence(seq1, identityLevel);

    const options = {
      matrix: 'BLOSUM62',
      gapOpen: -10,
      gapExtend: -1,
    };

    // Benchmark each algorithm
    const algorithms: Array<{
      name: string;
      func: (seq1: string, seq2: string, options?: any) => any;
      options: AlignmentOptions | BandedAlignmentOptions;
    }> = [
      {
        name: 'Needleman-Wunsch (Global)',
        func: needlemanWunsch,
        options,
      },
      {
        name: 'Smith-Waterman (Local)',
        func: smithWaterman,
        options,
      },
      {
        name: 'Semi-Global',
        func: semiGlobal,
        options,
      },
      {
        name: 'Hirschberg (Space-Efficient)',
        func: hirschberg,
        options: { ...options, gapOpen: -1 }, // Linear gap for Hirschberg
      },
    ];

    // Add banded only for highly similar sequences
    if (identityLevel >= 70) {
      algorithms.push({
        name: 'Banded (bandwidth=20)',
        func: bandedAlign,
        options: { ...options, bandwidth: 20 } as BandedAlignmentOptions,
      });
    }

    console.log('\n');

    for (const algo of algorithms) {
      try {
        const result = benchmarkAlgorithm(
          algo.name,
          algo.func,
          seq1,
          seq2,
          algo.options
        );

        allResults.push(result);

        console.log(`${algo.name}:`);
        console.log(`  Time:     ${result.time.toFixed(2)} ms`);
        console.log(`  Memory:   ${result.memoryDelta.toFixed(2)} MB`);
        console.log(`  Identity: ${result.identity} (${result.identityPercent.toFixed(1)}%)`);
        console.log(`  Score:    ${result.score.toFixed(1)}`);
        console.log('');
      } catch (error: any) {
        console.log(`${algo.name}: ❌ ${error.message}\n`);
      }
    }
  }

  // Summary table
  console.log('\n' + '='.repeat(60));
  console.log('PERFORMANCE SUMMARY');
  console.log('='.repeat(60));
  console.log(
    '\nAlgorithm                        | Length | Time (ms) | Memory (MB)'
  );
  console.log('-'.repeat(70));

  for (const result of allResults) {
    const algoName = result.algorithm.padEnd(30);
    const length = result.seqLength.toString().padStart(6);
    const time = result.time.toFixed(2).padStart(9);
    const memory = result.memoryDelta.toFixed(2).padStart(11);

    console.log(`${algoName} | ${length} | ${time} | ${memory}`);
  }

  // Complexity analysis
  console.log('\n' + '='.repeat(60));
  console.log('COMPLEXITY ANALYSIS');
  console.log('='.repeat(60));

  const complexityInfo = [
    {
      algo: 'Needleman-Wunsch',
      time: 'O(m×n)',
      space: 'O(m×n)',
      use: 'Global alignment',
    },
    {
      algo: 'Smith-Waterman',
      time: 'O(m×n)',
      space: 'O(m×n)',
      use: 'Local alignment',
    },
    {
      algo: 'Semi-Global',
      time: 'O(m×n)',
      space: 'O(m×n)',
      use: 'End-gap-free',
    },
    {
      algo: 'Banded',
      time: 'O(k×n)',
      space: 'O(k×n)',
      use: 'Fast, >90% ID',
    },
    {
      algo: 'Hirschberg',
      time: 'O(m×n)',
      space: 'O(min(m,n))',
      use: 'Memory-limited',
    },
  ];

  console.log(
    '\nAlgorithm          | Time      | Space         | Best For'
  );
  console.log('-'.repeat(65));

  for (const info of complexityInfo) {
    const algo = info.algo.padEnd(17);
    const time = info.time.padEnd(9);
    const space = info.space.padEnd(13);
    console.log(`${algo} | ${time} | ${space} | ${info.use}`);
  }

  console.log('\nNote: k = bandwidth, m = seq1 length, n = seq2 length\n');
}

// Run benchmarks
runBenchmarks();
