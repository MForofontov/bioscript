import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e/test-page.html');
});

test('streaming translation preserves the final buffer, codons, and custom stops', async ({
  page,
}) => {
  const results = await page.evaluate(async () => {
    const api = (window as unknown as { bioseqTranslate: typeof import('../src/browser-index') })
      .bioseqTranslate;
    const results = [];
    for (const chunkSize of [1, 2, 4, 7, 10000]) {
      for (const breakOnStop of [true, false]) {
        for (const stopSymbol of ['', 'M', '*']) {
          const sequence = 'ATGGCCTAAGGGATGCCCTGAAC';
          let actual = '';
          for await (const part of api.translateBrowserStreaming(new Blob([sequence]), {
            chunkSize,
            breakOnStop,
            stopSymbol,
          }))
            actual += part.sequence;
          results.push({
            actual,
            expected: api.translateSequence(sequence, { breakOnStop, stopSymbol }),
          });
        }
      }
    }
    return results;
  });
  for (const result of results) expect(result.actual).toBe(result.expected);
});
