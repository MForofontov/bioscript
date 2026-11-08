import { test, expect } from '@playwright/test';

test.describe('Browser Translation - Genetic Tables', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/test-page.html');
    await page.waitForFunction(() => window.bioseqTranslate !== undefined);
  });

  test('1. should support NCBI table numbers', async ({ page }) => {
    const result = await page.evaluate(() => {
      const seq = 'ATGATG';
      const table1 = window.bioseqTranslate.translateBrowser(seq, { table: '1' });
      const tableStd = window.bioseqTranslate.translateBrowser(seq, { table: 'standard' });
      return {
        table1: table1[0].sequence,
        tableStd: tableStd[0].sequence,
      };
    });

    expect(result.table1).toBe(result.tableStd);
  });

  test('2. should handle vertebrate mitochondrial table', async ({ page }) => {
    const result = await page.evaluate(() => {
      const seq = 'ATGATA'; // ATA codes for M in mitochondrial
      const standard = window.bioseqTranslate.translateBrowser(seq, { table: 'standard' });
      const mito = window.bioseqTranslate.translateBrowser(seq, {
        table: 'vertebrate_mitochondrial',
      });
      return {
        standard: standard[0].sequence,
        mito: mito[0].sequence,
      };
    });

    expect(result.standard).toBe('MI');
    expect(result.mito).toBe('MM');
  });

  test('3. should handle yeast mitochondrial table', async ({ page }) => {
    const result = await page.evaluate(() => {
      const seq = 'ATGCTA'; // CTA codes for T in yeast mito
      const standard = window.bioseqTranslate.translateBrowser(seq, { table: 'standard' });
      const yeast = window.bioseqTranslate.translateBrowser(seq, { table: 'yeast_mitochondrial' });
      return {
        standard: standard[0].sequence,
        yeast: yeast[0].sequence,
      };
    });

    expect(result.standard).toBe('ML');
    expect(result.yeast).toBe('MT');
  });

  test('4. should list all available tables', async ({ page }) => {
    const tables = await page.evaluate(() => {
      return Object.keys(window.bioseqTranslate.tables);
    });

    expect(tables.length).toBeGreaterThan(30);
    expect(tables).toContain('standard');
    expect(tables).toContain('1');
    expect(tables).toContain('vertebrate_mitochondrial');
  });
});
