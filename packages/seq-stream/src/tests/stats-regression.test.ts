import { finished } from 'stream/promises';
import { StatsCalculator, calculateN50L50FromHistogram } from '../stats';
import { calculateStatsBrowser, calculateStatsSync } from '../browser-stats';
import { summarizeLengths } from '../length-summary';

describe('length statistics across runtimes', () => {
  test('summarizes billions of repeated lengths without expanding them', () => {
    expect(calculateN50L50FromHistogram(new Map([[10, 4_000_000_000]]))).toEqual({
      n50: 10,
      l50: 2_000_000_000,
    });
    expect(summarizeLengths(new Map([[10, 4_000_000_000]]))).toEqual({
      minLength: 10,
      maxLength: 10,
      medianLength: 10,
      n50: 10,
      l50: 2_000_000_000,
    });
  });

  test.each([
    { lengths: [], median: 0, n50: 0, l50: 0 },
    { lengths: [7], median: 7, n50: 7, l50: 1 },
    { lengths: [2, 8, 14], median: 8, n50: 14, l50: 1 },
    { lengths: [2, 8], median: 5, n50: 8, l50: 1 },
    { lengths: [2, 2, 8, 8], median: 5, n50: 8, l50: 2 },
    { lengths: [0, 0], median: 0, n50: 0, l50: 1 },
    { lengths: [5, 5, 5, 5, 5], median: 5, n50: 5, l50: 3 },
    { lengths: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2], median: 1, n50: 1, l50: 5 },
  ])('summarizes $lengths', async ({ lengths, median, n50, l50 }) => {
    const records = lengths.map((length, i) => ({ id: String(i), sequence: 'A'.repeat(length) }));
    const calculator = new StatsCalculator();
    calculator.resume();
    const completion = finished(calculator);
    for (const record of records) calculator.write(record);
    calculator.end();
    await completion;
    async function* source() {
      yield* await Promise.resolve(records);
    }
    const expected = { medianLength: median, n50, l50 };
    expect(calculator.getStats()).toMatchObject(expected);
    expect(calculateStatsSync(records)).toMatchObject(expected);
    expect(await calculateStatsBrowser(source())).toMatchObject(expected);
  });
});
