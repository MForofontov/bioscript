import { test, expect } from '@playwright/test';

test.describe('Browser - Utility Functions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/test-page.html');
    await page.waitForFunction(() => window.bioseqTranslate !== undefined);
  });

  test('1. dnaToRna should convert DNA to RNA', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.dnaToRna('ATGC');
    });

    expect(result).toBe('AUGC');
  });

  test('2. rnaToDna should convert RNA to DNA', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.rnaToDna('AUGC');
    });

    expect(result).toBe('ATGC');
  });

  test('3. complement should return complement sequence for DNA', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.complement('ATGC');
    });

    expect(result).toBe('TACG');
  });

  test('4. complement should return complement sequence for RNA', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.complement('AUGC');
    });

    expect(result).toBe('UACG');
  });

  test('5. reverseComplement should return reverse complement', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.reverseComplement('ATGC');
    });

    expect(result).toBe('GCAT');
  });

  test('6. reverseComplement should handle lowercase', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.reverseComplement('atgc');
    });

    expect(result).toBe('gcat');
  });
});
