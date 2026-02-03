import { test, expect } from '@playwright/test';

test.describe('Browser Translation - Batch', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/test-page.html');
    await page.waitForFunction(() => window.bioseqTranslate !== undefined);
  });

  test('1. translateBrowserBatch should translate multiple sequences', async ({ page }) => {
    const result = await page.evaluate(() => {
      const sequences = ['ATGGCC', 'ATGTAA', 'ATGCCC'];
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.translateBrowserBatch(sequences, { table: 'standard' });
    });

    expect(result).toHaveLength(3);
    expect(result[0][0].sequence).toBe('MA');
    expect(result[1][0].sequence).toBe('M*');
    expect(result[2][0].sequence).toBe('MP');
  });

  test('2. translateBrowserBatch should handle all frames', async ({ page }) => {
    const result = await page.evaluate(() => {
      const sequences = ['ATGGCCAAA', 'ATGTTTCCC'];
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.translateBrowserBatch(sequences, {
        table: 'standard',
        allFrames: true,
      });
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveLength(3);
    expect(result[1]).toHaveLength(3);
  });

  test('3. translateBrowserBatch should handle empty array', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.translateBrowserBatch([]);
    });

    expect(result).toHaveLength(0);
  });

  test('4. translateBrowserBatch should handle large batch', async ({ page }) => {
    const result = await page.evaluate(() => {
      const sequences = Array(100).fill('ATGGCCAAA');
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.translateBrowserBatch(sequences, { table: 'standard' });
    });

    expect(result).toHaveLength(100);
    result.forEach((r: any) => {
      expect(r[0].sequence).toBe('MAK');
    });
  });
});
