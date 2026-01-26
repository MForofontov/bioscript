import { test, expect } from '@playwright/test';

test.describe('Browser FASTQ Parser', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/test-page.html');
    await page.waitForFunction(() => window.bioseqStream !== undefined);
  });

  test('parseFastqBrowser should parse FASTQ from Blob', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const fastqContent = '@read1\nACGT\n+\nIIII\n@read2\nTGCA\n+\nJJJJ\n';
      const blob = new Blob([fastqContent], { type: 'text/plain' });

      const records = [];
      // @ts-expect-error - Browser bundle types
      for await (const record of window.bioseqStream.parseFastqBrowser(blob)) {
        records.push(record);
      }

      return records;
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'read1', sequence: 'ACGT', quality: 'IIII', description: '' });
    expect(result[1]).toEqual({ id: 'read2', sequence: 'TGCA', quality: 'JJJJ', description: '' });
  });

  test('parseFastqBrowser should handle descriptions', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const fastqContent = '@read1 description here\nACGT\n+\nIIII\n';
      const blob = new Blob([fastqContent], { type: 'text/plain' });

      const records = [];
      // @ts-expect-error - Browser bundle types
      for await (const record of window.bioseqStream.parseFastqBrowser(blob)) {
        records.push(record);
      }

      return records;
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'read1',
      sequence: 'ACGT',
      quality: 'IIII',
      description: 'description here',
    });
  });

  test('writeFastqBrowser should create FASTQ Blob', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const records = [
        { id: 'read1', sequence: 'ACGT', quality: 'IIII' },
        { id: 'read2', sequence: 'TGCA', quality: 'JJJJ', description: 'test' },
      ];

      // @ts-expect-error - Browser bundle types
      const blob = window.bioseqStream.writeFastqBrowser(records);
      const text = await blob.text();
      return text;
    });

    expect(result).toBe('@read1\nACGT\n+\nIIII\n@read2 test\nTGCA\n+\nJJJJ\n');
  });

  test('parseFastqText should parse FASTQ from string', async ({ page }) => {
    const result = await page.evaluate(() => {
      const fastqContent = '@read1\nACGT\n+\nIIII\n@read2\nTGCA\n+\nJJJJ\n';

      // @ts-expect-error - Browser bundle types
      return window.bioseqStream.parseFastqText(fastqContent);
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'read1', sequence: 'ACGT', quality: 'IIII', description: '' });
    expect(result[1]).toEqual({ id: 'read2', sequence: 'TGCA', quality: 'JJJJ', description: '' });
  });

  test('convertQualityBrowser should convert Phred+33 to Phred+64', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - Use numeric values: 33 for Phred+33, 64 for Phred+64
      return window.bioseqStream.convertQualityBrowser('IIII', 33, 64);
    });

    expect(result).toBe('hhhh');
  });

  test('convertQualityBrowser should convert Phred+64 to Phred+33', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - Use numeric values: 64 for Phred+64, 33 for Phred+33
      return window.bioseqStream.convertQualityBrowser('hhhh', 64, 33);
    });

    expect(result).toBe('IIII');
  });
});
