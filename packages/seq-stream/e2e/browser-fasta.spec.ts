import { test, expect } from '@playwright/test';

test.describe('Browser FASTA Parser', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/test-page.html');
    await page.waitForFunction(() => window.bioseqStream !== undefined);
  });

  test('1. parseFastaBrowser should parse FASTA from Blob', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const fastaContent = '>seq1\nACGTACGT\n>seq2\nTGCATGCA\n';
      const blob = new Blob([fastaContent], { type: 'text/plain' });

      const records = [];
      // @ts-expect-error - browser bundle
      for await (const record of window.bioseqStream.parseFastaBrowser(blob)) {
        records.push(record);
      }

      return records;
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'seq1', sequence: 'ACGTACGT', description: '' });
    expect(result[1]).toEqual({ id: 'seq2', sequence: 'TGCATGCA', description: '' });
  });

  test('2. parseFastaBrowser should handle multiline sequences', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const fastaContent = '>seq1\nACGT\nACGT\n>seq2 description here\nTGCA\nTGCA\n';
      const blob = new Blob([fastaContent], { type: 'text/plain' });

      const records = [];
      // @ts-expect-error - Browser bundle types
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

  test('3. writeFastaBrowser should create FASTA Blob', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const records = [
        { id: 'seq1', sequence: 'ACGTACGT' },
        { id: 'seq2', sequence: 'TGCATGCA', description: 'test' },
      ];

      // @ts-expect-error - Browser bundle types
      const blob = window.bioseqStream.writeFastaBrowser(records, 80);
      const text = await blob.text();
      return text;
    });

    expect(result).toBe('>seq1\nACGTACGT\n>seq2 test\nTGCATGCA\n');
  });

  test('4. writeFastaBrowser should handle line wrapping', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const records = [{ id: 'seq1', sequence: 'ACGTACGT' }];

      // @ts-expect-error - Browser bundle types
      const blob = window.bioseqStream.writeFastaBrowser(records, 4);
      const text = await blob.text();
      return text;
    });

    expect(result).toBe('>seq1\nACGT\nACGT\n');
  });

  test('5. parseFastaText should parse FASTA from string', async ({ page }) => {
    const result = await page.evaluate(() => {
      const fastaContent = '>seq1\nACGTACGT\n>seq2\nTGCATGCA\n';

      // @ts-expect-error - Browser bundle types
      return window.bioseqStream.parseFastaText(fastaContent);
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'seq1', sequence: 'ACGTACGT', description: '' });
    expect(result[1]).toEqual({ id: 'seq2', sequence: 'TGCATGCA', description: '' });
  });

  test('6. parseFastaBrowser should handle gzip-compressed File', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Fetch the gzip-compressed test file
      const response = await fetch('/e2e/fixtures/test.fasta.gz');
      const arrayBuffer = await response.arrayBuffer();
      const file = new File([arrayBuffer], 'test.fasta.gz', { type: 'application/gzip' });

      const records = [];
      // @ts-expect-error - Browser bundle types
      for await (const record of window.bioseqStream.parseFastaBrowser(file)) {
        records.push(record);
      }

      return records;
    });

    // Verify the decompressed content
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('seq1');
    expect(result[0].sequence).toBe('ACGTACGT');
    expect(result[1].id).toBe('seq2');
    expect(result[1].sequence).toBe('TGCATGCA');
  });
});
