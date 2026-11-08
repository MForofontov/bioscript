const { performance } = require('perf_hooks');
const { cpus } = require('os');
const { Readable } = require('stream');
const { getMinimizers, getHashMinimizers } = require('../packages/seq-utils/dist');
const { bandedAlign, needlemanWunsch, hirschberg } = require('../packages/seq-align/dist');
const { FastaParser } = require('../packages/seq-stream/dist');
const { translateWorker, TranslationPool } = require('../packages/seq-translate/dist');
let seed = 42;
function dna(length) {
  return Array.from({ length }, () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return 'ACGT'[seed >>> 30];
  }).join('');
}
async function measure(name, input, fn) {
  await fn();
  const samples = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    await fn();
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  return {
    name,
    input,
    medianMs: Number(samples[2].toFixed(3)),
    peakRssBytes: process.resourceUsage().maxRSS * 1024,
  };
}
async function main() {
  const sequence = dna(100000);
  const aligned = sequence.slice(0, 600);
  const records = Array.from({ length: 10000 }, (_, i) => `>r${i}\n${sequence.slice(0, 100)}\n`);
  const batch = Array.from({ length: 20 }, () => sequence.slice(0, 3000));
  const results = [];
  results.push(
    await measure('lexicographic minimizers', { bases: sequence.length, k: 15, w: 100 }, () =>
      getMinimizers(sequence, 15, 100)
    )
  );
  results.push(
    await measure('hash minimizers', { bases: sequence.length, k: 15, w: 100 }, () =>
      getHashMinimizers(sequence, 15, 100)
    )
  );
  results.push(
    await measure('global alignment', { bases: 600 }, () => needlemanWunsch(aligned, aligned))
  );
  results.push(
    await measure('banded alignment', { bases: 600, bandwidth: 10 }, () =>
      bandedAlign(aligned, aligned)
    )
  );
  results.push(
    await measure('Hirschberg alignment', { bases: 600, gapOpen: -1 }, () =>
      hirschberg(aligned, aligned, { gapOpen: -1 })
    )
  );
  results.push(
    await measure('FASTA streaming', { records: 10000, basesPerRecord: 100 }, async () => {
      const parser = Readable.from(records).pipe(new FastaParser());
      for await (const record of parser) void record;
    })
  );
  results.push(
    await measure('worker startup and batch', { sequences: 20, bases: 3000, workers: 2 }, () =>
      translateWorker(batch, { numWorkers: 2 })
    )
  );
  const pool = new TranslationPool(2);
  try {
    results.push(
      await measure('pool repeated batch', { sequences: 20, bases: 3000, workers: 2 }, () =>
        pool.translate(batch)
      )
    );
  } finally {
    await pool.terminate();
  }
  console.log(
    JSON.stringify(
      {
        node: process.version,
        platform: process.platform,
        cpu: cpus()[0].model,
        seed: 42,
        warmups: 1,
        repetitions: 5,
        memoryNote: 'Process high-water RSS; cumulative, not isolated per operation.',
        results,
      },
      null,
      2
    )
  );
}
const watchdog = setTimeout(() => {
  console.error('Benchmark did not complete; check for stalled streams or workers.');
  process.exit(1);
}, 60000);
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => clearTimeout(watchdog));
