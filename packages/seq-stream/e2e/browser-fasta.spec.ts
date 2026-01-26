import { test, expect } from '@playwright/test';

test.describe('Browser FASTA Parser', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/test-page.html');
    await page.waitForFunction(() => window.bioseqStream !== undefined);
  });

  test('parseFastaBrowser should parse FASTA from Blob', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const fastaContent = '>seq1\nACGTACGT\n>seq2\nTGCATGCA\n';
      const blob = new Blob([fastaContent], { type: 'text/plain' });

      const records = [];
      // @ts-ignore - browser bundle
      for await (const record of window.bioseqStream.parseFastaBrowser(blob)) {
        records.push(record);
      }

      return records;
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'seq1', sequence: 'ACGTACGT', description: '' });
    expect(result[1]).toEqual({ id: 'seq2', sequence: 'TGCATGCA', description: '' });
  });

  test('parseFastaBrowser should handle multiline sequences', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const fastaContent = '>seq1\nACGT\nACGT\n>seq2 description here\nTGCA\nTGCA\n';
      const blob = new Blob([fastaContent], { type: 'text/plain' });

      const records = [];
      // @ts-ignore
      for await (const record of window.bioseqStream.parseFastaBrowser(blob)) {
        records.push(record);
      }

      return records;
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'seq1', sequence: 'ACGTACGT', description: '' });
    expect(result[1]).toEqual({
      id: 'seq2',
      sequence: 'TGCATGCA',
      description: 'description here',
    });
  });

  test('writeFastaBrowser should create FASTA Blob', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const records = [
        { id: 'seq1', sequence: 'ACGTACGT' },
        { id: 'seq2', sequence: 'TGCATGCA', description: 'test' },
      ];

      // @ts-ignore
      const blob = window.bioseqStream.writeFastaBrowser(records, 80);
      const text = await blob.text();
      return text;
    });

    expect(result).toBe('>seq1\nACGTACGT\n>seq2 test\nTGCATGCA\n');
  });

  test('writeFastaBrowser should handle line wrapping', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const records = [{ id: 'seq1', sequence: 'ACGTACGT' }];

      // @ts-ignore
      const blob = window.bioseqStream.writeFastaBrowser(records, 4);
      const text = await blob.text();
      return text;
    });

    expect(result).toBe('>seq1\nACGT\nACGT\n');
  });

  test('parseFastaText should parse FASTA from string', async ({ page }) => {
    const result = await page.evaluate(() => {
      const fastaContent = '>seq1\nACGTACGT\n>seq2\nTGCATGCA\n';

      // @ts-ignore
      return window.bioseqStream.parseFastaText(fastaContent);
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'seq1', sequence: 'ACGTACGT', description: '' });
    expect(result[1]).toEqual({ id: 'seq2', sequence: 'TGCATGCA', description: '' });
  });
});
