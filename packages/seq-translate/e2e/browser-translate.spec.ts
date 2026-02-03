import { test, expect } from '@playwright/test';

test.describe('Browser Translation - Basic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/test-page.html');
    await page.waitForFunction(() => window.bioseqTranslate !== undefined);
  });

  test('1. translateBrowser should translate simple sequence', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.translateBrowser('ATGGCCAAA', { table: 'standard' });
    });

    expect(result).toHaveLength(1);
    expect(result[0].sequence).toBe('MAK');
    expect(result[0].frame).toBe(0);
    expect(result[0].isReverse).toBe(false);
  });

  test('2. translateBrowser should handle all frames', async ({ page }) => {
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

  test('3. translateBrowser should handle reverse complement', async ({ page }) => {
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

  test('4. translateBrowser should handle all 6 frames', async ({ page }) => {
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

  test('5. translateBrowser should respect breakOnStop', async ({ page }) => {
    const result = await page.evaluate(() => {
      // @ts-expect-error - browser bundle
      return window.bioseqTranslate.translateBrowser('ATGTAAGGGGCC', {
        table: 'standard',
        breakOnStop: true,
      });
    });

    expect(result[0].sequence).toBe('M*');
  });

  test('6. translateBrowser should use custom stop symbol', async ({ page }) => {
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

test.describe('Browser Translation - Streaming', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/test-page.html');
    await page.waitForFunction(() => window.bioseqTranslate !== undefined);
  });

  test('7. translateBrowserStreaming should stream translate from Blob', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const sequence = 'ATGGCCAAA'.repeat(100); // 900 bases
      const blob = new Blob([sequence], { type: 'text/plain' });

      const chunks = [];
      // @ts-expect-error - browser bundle
      for await (const chunk of window.bioseqTranslate.translateBrowserStreaming(blob, {
        table: 'standard',
        chunkSize: 300
      })) {
        chunks.push(chunk);
      }

      return {
        chunkCount: chunks.length,
        totalLength: chunks.reduce((sum, c) => sum + c.sequence.length, 0),
        firstChunk: chunks[0]
      };
    });

    expect(result.chunkCount).toBeGreaterThan(0);
    expect(result.totalLength).toBe(300); // 900 bases / 3 = 300 amino acids
    expect(result.firstChunk.frame).toBe(0);
    expect(result.firstChunk.isReverse).toBe(false);
  });

  test('8. translateBrowserStreaming should handle large file', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Generate large sequence (30KB) - 9 chars * 3333 = 29,997 chars = 9,999 amino acids
      const sequence = 'ATGGCCAAA'.repeat(3333);

      const blob = new Blob([sequence], { type: 'text/plain' });

      const chunks = [];
      const startTime = performance.now();

      // @ts-expect-error - browser bundle
      for await (const chunk of window.bioseqTranslate.translateBrowserStreaming(blob, {
        table: 'standard',
        chunkSize: 10000
      })) {
        chunks.push(chunk);
      }

      const endTime = performance.now();

      return {
        chunkCount: chunks.length,
        totalLength: chunks.reduce((sum, c) => sum + c.sequence.length, 0),
        duration: endTime - startTime
      };
    });

    expect(result.chunkCount).toBeGreaterThan(1);
    expect(result.totalLength).toBeGreaterThanOrEqual(6666); // Chunking may leave some codons in remainder
    expect(result.duration).toBeLessThan(100);
  });

  test('9. translateBrowserStreaming should respect breakOnStop', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Sequence with stop codon followed by more sequence
      const sequence = 'ATGGCCTAAGGGCCC'; // ATG GCC TAA GGG CCC
      const blob = new Blob([sequence], { type: 'text/plain' });

      const chunks = [];
      // @ts-expect-error - browser bundle
      for await (const chunk of window.bioseqTranslate.translateBrowserStreaming(blob, {
        table: 'standard',
        breakOnStop: true,
        chunkSize: 15
      })) {
        chunks.push(chunk);
      }

      return {
        chunks: chunks.map(c => c.sequence),
        stopped: chunks.some(c => c.sequence.includes('*'))
      };
    });

    expect(result.stopped).toBe(true);
    expect(result.chunks.join('')).toContain('*');
  });

  test('10. translateBrowserStreaming should use custom stop symbol', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const sequence = 'ATGGCCTAA'; // ATG=M, GCC=A, TAA=stop
      const blob = new Blob([sequence], { type: 'text/plain' });

      const chunks = [];
      // @ts-expect-error - browser bundle
      for await (const chunk of window.bioseqTranslate.translateBrowserStreaming(blob, {
        table: 'standard',
        stopSymbol: 'X',
        breakOnStop: false, // Don't break on stop
        chunkSize: 3 // Small chunk size to ensure it's processed
      })) {
        chunks.push(chunk);
      }

      return {
        fullSequence: chunks.map(c => c.sequence).join(''),
        chunkCount: chunks.length,
        chunks: chunks.map(c => c.sequence)
      };
    });

    expect(result.fullSequence).toBe('MAX');
    expect(result.fullSequence).not.toContain('*');
  });

  test('11. translateBrowserStreaming should handle custom chunk size', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const sequence = 'ATGGCC'.repeat(1000); // 6000 bases
      const blob = new Blob([sequence], { type: 'text/plain' });

      const chunks = [];
      // @ts-expect-error - browser bundle
      for await (const chunk of window.bioseqTranslate.translateBrowserStreaming(blob, {
        table: 'standard',
        chunkSize: 1500 // Custom chunk size
      })) {
        chunks.push(chunk);
      }

      return {
        chunkCount: chunks.length,
        totalBases: chunks.reduce((sum, c) => sum + c.sourceLength, 0)
      };
    });

    expect(result.chunkCount).toBeGreaterThan(1);
    expect(result.totalBases).toBe(6000);
  });

  test('12. translateBrowserStreaming should handle empty Blob', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const blob = new Blob([''], { type: 'text/plain' });

      const chunks = [];
      // @ts-expect-error - browser bundle
      for await (const chunk of window.bioseqTranslate.translateBrowserStreaming(blob, {
        table: 'standard'
      })) {
        chunks.push(chunk);
      }

      return chunks.length;
    });

    expect(result).toBe(0);
  });
});
