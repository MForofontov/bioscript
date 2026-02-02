import { test, expect } from '@playwright/test';

test.describe('Browser - Utility Functions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/test-page.html');
    await page.waitForFunction(() => window.bioseqTranslate !== undefined);
  });

  test('dnaToRna should convert DNA to RNA', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.dnaToRna('ATGC');
    });

    expect(result).toBe('AUGC');
  });

  test('rnaToDna should convert RNA to DNA', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.rnaToDna('AUGC');
    });

    expect(result).toBe('ATGC');
  });

  test('complement should return complement sequence for DNA', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.complement('ATGC');
    });

    expect(result).toBe('TACG');
  });

  test('complement should return complement sequence for RNA', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.complement('AUGC');
    });

    expect(result).toBe('UACG');
  });

  test('reverseComplement should return reverse complement', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.reverseComplement('ATGC');
    });

    expect(result).toBe('GCAT');
  });

  test('reverseComplement should handle lowercase', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.reverseComplement('atgc');
    });

    expect(result).toBe('gcat');
  });
});
