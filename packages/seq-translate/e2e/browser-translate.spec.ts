import { test, expect } from '@playwright/test';

test.describe('Browser Translation - Basic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/test-page.html');
    await page.waitForFunction(() => window.bioseqTranslate !== undefined);
  });

  test('translateBrowser should translate simple sequence', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.translateBrowser('ATGGCCAAA', { table: 'standard' });
    });

    expect(result).toHaveLength(1);
    expect(result[0].sequence).toBe('MAK');
    expect(result[0].frame).toBe(0);
    expect(result[0].isReverse).toBe(false);
  });

  test('translateBrowser should handle all frames', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.translateBrowser('ATGGCCAAA', {
        table: 'standard',
        allFrames: true,
      });
    });

    expect(result).toHaveLength(3);
    expect(result[0].frame).toBe(0);
    expect(result[1].frame).toBe(1);
    expect(result[2].frame).toBe(2);
  });

  test('translateBrowser should handle reverse complement', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.translateBrowser('ATGGCCAAA', {
        table: 'standard',
        includeReverse: true,
      });
    });

    expect(result).toHaveLength(2);
    expect(result[0].isReverse).toBe(false);
    expect(result[1].isReverse).toBe(true);
  });

  test('translateBrowser should handle all 6 frames', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.translateBrowser('ATGGCCAAA', {
        table: 'standard',
        allFrames: true,
        includeReverse: true,
      });
    });

    expect(result).toHaveLength(6);
    expect(result[0].frame).toBe(0);
    expect(result[3].frame).toBe(3);
    expect(result[3].isReverse).toBe(true);
  });

  test('translateBrowser should respect breakOnStop', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.translateBrowser('ATGTAAGGGGCC', {
        table: 'standard',
        breakOnStop: true,
      });
    });

    expect(result[0].sequence).toBe('M*');
  });

  test('translateBrowser should use custom stop symbol', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.translateBrowser('ATGGCCTAA', {
        table: 'standard',
        stopSymbol: 'X',
      });
    });

    expect(result[0].sequence).toBe('MAX');
  });
});
