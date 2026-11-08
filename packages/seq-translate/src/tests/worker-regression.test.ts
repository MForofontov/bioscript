import { TranslationPool, translateWorker, translateWorkerChunked } from '../worker-translate';
import { translateSequence, translateSixFrames } from '../translate';
import { translateBrowserBatch } from '../browser-translate';
import { Worker } from 'worker_threads';

test.each([0, -1, 1.5, NaN, Infinity])('rejects unsafe worker/chunk counts %p', async (value) => {
  expect(() => new TranslationPool(value)).toThrow();
  await expect(translateWorker(['ATG'], { numWorkers: value })).rejects.toThrow();
  await expect(translateWorkerChunked('ATG', { chunkSize: value })).rejects.toThrow();
});

test.each([1, 2, 4, 7, 30])(
  'chunk size %p preserves codons and stop semantics',
  async (chunkSize) => {
    for (const breakOnStop of [true, false]) {
      const sequence = 'ATGGCCTAAGGGATGCCCTGAAC';
      const result = await translateWorkerChunked(sequence, {
        chunkSize,
        breakOnStop,
        numWorkers: 2,
      });
      expect(result.map((r) => r.sequence).join('')).toBe(
        translateSequence(sequence, { breakOnStop })
      );
    }
  }
);

test('pool reuses workers, recovers from task errors, and terminates queued work', async () => {
  const pool = new TranslationPool(1);
  const identities = new Set<number>();
  // eslint-disable-next-line @typescript-eslint/unbound-method -- Invoked below with an explicit Worker receiver.
  const original = Worker.prototype.postMessage;
  const messages = jest.spyOn(Worker.prototype, 'postMessage').mockImplementation(function (
    this: Worker,
    value: unknown
  ) {
    identities.add(this.threadId);
    original.call(this, value);
  });
  try {
    await expect(pool.translate([null as unknown as string])).rejects.toThrow();
    expect((await pool.translate(['ATG']))[0][0].sequence).toBe('M');
    expect(identities.size).toBe(1);
    const tasks = Array.from({ length: 6 }, () => pool.translate(['ATG'.repeat(10000)]));
    const settled = Promise.allSettled(tasks);
    await pool.terminate();
    expect((await settled).every((r) => r.status === 'rejected')).toBe(true);
  } finally {
    await pool.terminate();
    messages.mockRestore();
  }
});

test('a crashed worker rejects its task and queued tasks can use a replacement', async () => {
  const pool = new TranslationPool(1);
  const messages = jest.spyOn(Worker.prototype, 'postMessage').mockImplementationOnce(function (
    this: Worker
  ) {
    void this.terminate();
  });
  try {
    const results = await Promise.allSettled([pool.translate(['ATG']), pool.translate(['ATG'])]);
    expect(results[0].status).toBe('rejected');
    expect(results[1].status).toBe('fulfilled');
  } finally {
    await pool.terminate();
    messages.mockRestore();
  }
});

test('persistent workers, browser batches, and synchronous six-frame translation agree', async () => {
  const sequences = [' atggcctaagggatgccc ', 'AUGUGAUAAACN', '', 'AC'];
  const pool = new TranslationPool(2);
  try {
    for (const table of ['standard', '2']) {
      for (const stopSymbol of ['', 'STOP']) {
        for (const breakOnStop of [true, false]) {
          const options = { table, stopSymbol, breakOnStop, allFrames: true, includeReverse: true };
          const results = await pool.translate(sequences, options);
          expect(results).toEqual(translateBrowserBatch(sequences, options));
          expect(results.map((frames) => frames.map((frame) => frame.sequence))).toEqual(
            sequences.map((sequence) => translateSixFrames(sequence, options))
          );
        }
      }
    }
  } finally {
    await pool.terminate();
  }
});
