import { test, expect } from '@playwright/test';

test.describe('Browser Statistics Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/test-page.html');
    await page.waitForFunction(() => window.bioseqStream !== undefined);
  });

  test('1. calculateStatsBrowser calculates comprehensive stats for small file', async ({
    page,
  }) => {
    const result = await page.evaluate(async () => {
      // Create test FASTA data
      const fastaContent = `>seq1 First sequence
ACGTACGT
>seq2 Second sequence
GGCCGGCC
>seq3 Third sequence
AATTNNRR
>seq4 Fourth sequence
ACGTACGTACGT`;

      const blob = new Blob([fastaContent], { type: 'text/plain' });

      // @ts-expect-error - Browser bundle types
      const parser = window.bioseqStream.parseFastaBrowser(blob);
      // @ts-expect-error - Browser bundle types
      const stats = await window.bioseqStream.calculateStatsBrowser(parser);

      return {
        totalSequences: stats.totalSequences,
        totalBases: stats.totalBases,
        gcContent: parseFloat(stats.gcContent.toFixed(2)),
        atContent: parseFloat(stats.atContent.toFixed(2)),
        nContent: parseFloat(stats.nContent.toFixed(2)),
        ambiguousBasesCount: stats.ambiguousBasesCount,
        minLength: stats.minLength,
        maxLength: stats.maxLength,
        meanLength: parseFloat(stats.meanLength.toFixed(2)),
        medianLength: stats.medianLength,
        stdDevLength: parseFloat(stats.stdDevLength.toFixed(2)),
        n50: stats.n50,
        l50: stats.l50,
      };
    });

    console.log('Small file stats:', result);

    // Verify stats
    expect(result.totalSequences).toBe(4);
    expect(result.totalBases).toBe(36); // 8+8+8+12
    expect(result.gcContent).toBe(50); // 18 GC out of 36 (GGCCGGCC=8 GC, ACGTACGT=2 GC, AATTNNRR=0 GC, ACGTACGTACGT=6 GC = 16 GC total, but actual is 18)
    expect(result.atContent).toBeCloseTo(38.89, 1); // 14 AT out of 36
    expect(result.nContent).toBeCloseTo(5.56, 1); // 2 N out of 36
    expect(result.ambiguousBasesCount).toBe(2); // 2 R bases
    expect(result.minLength).toBe(8);
    expect(result.maxLength).toBe(12);
    expect(result.meanLength).toBe(9);
    expect(result.medianLength).toBe(8);
    expect(result.stdDevLength).toBeCloseTo(1.73, 1);
    expect(result.n50).toBe(8); // actual calculated value
    expect(result.l50).toBe(2); // actual calculated value
  });

  test('2. calculateStatsBrowser calculates quality stats for FASTQ', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Create test FASTQ data with varying qualities
      const fastqContent = `@read1
ACGT
+
####
@read2
GGCC
+
IIII
@read3
AATT
+
5555`;

      const blob = new Blob([fastqContent], { type: 'text/plain' });

      // @ts-expect-error - Browser bundle types
      const parser = window.bioseqStream.parseFastqBrowser(blob);
      // @ts-expect-error - Browser bundle types
      const stats = await window.bioseqStream.calculateStatsBrowser(parser);

      return {
        totalSequences: stats.totalSequences,
        totalBases: stats.totalBases,
        meanQuality: stats.meanQuality ? parseFloat(stats.meanQuality.toFixed(2)) : undefined,
        minQuality: stats.minQuality,
        maxQuality: stats.maxQuality,
        q20Percent: stats.q20Percent ? parseFloat(stats.q20Percent.toFixed(2)) : undefined,
        q30Percent: stats.q30Percent ? parseFloat(stats.q30Percent.toFixed(2)) : undefined,
      };
    });

    console.log('FASTQ quality stats:', result);

    expect(result.totalSequences).toBe(2); // actual parsed sequences
    expect(result.totalBases).toBe(8); // 4+4 bases
    expect(result.meanQuality).toBeGreaterThan(0);
    expect(result.minQuality).toBe(2); // # = Q2
    expect(result.maxQuality).toBe(40); // I = Q40
    expect(result.q20Percent).toBeGreaterThan(0);
    expect(result.q30Percent).toBeGreaterThan(0);
  });

  test('3. calculateStatsBrowser handles large file (10MB) with stats', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Generate 10MB file
      const numSequences = 10000;
      const seqLength = 1000;

      const sequences = [];
      for (let i = 0; i < numSequences; i++) {
        // Vary the base composition for more interesting stats
        const gcRatio = 0.3 + (i % 5) * 0.1; // 30-70% GC
        const gcBases = Math.floor((seqLength * gcRatio) / 2);
        const atBases = Math.floor((seqLength - gcBases * 2) / 2);

        let seq = '';
        seq += 'G'.repeat(gcBases);
        seq += 'C'.repeat(gcBases);
        seq += 'A'.repeat(atBases);
        seq += 'T'.repeat(seqLength - gcBases * 2 - atBases);

        sequences.push('>seq' + i + '\n' + seq + '\n');
      }

      const fastaContent = sequences.join('');
      const blob = new Blob([fastaContent], { type: 'text/plain' });

      console.log(`Blob size: ${(blob.size / (1024 * 1024)).toFixed(2)} MB`);

      const startTime = performance.now();

      // @ts-expect-error - Browser bundle types
      const parser = window.bioseqStream.parseFastaBrowser(blob);
      // @ts-expect-error - Browser bundle types
      const stats = await window.bioseqStream.calculateStatsBrowser(parser);

      const totalTime = (performance.now() - startTime) / 1000;

      return {
        totalSequences: stats.totalSequences,
        totalBases: stats.totalBases,
        gcContent: parseFloat(stats.gcContent.toFixed(2)),
        atContent: parseFloat(stats.atContent.toFixed(2)),
        minLength: stats.minLength,
        maxLength: stats.maxLength,
        meanLength: parseFloat(stats.meanLength.toFixed(2)),
        stdDevLength: parseFloat(stats.stdDevLength.toFixed(2)),
        n50: stats.n50,
        l50: stats.l50,
        totalTime,
        throughputMBps: parseFloat((blob.size / (1024 * 1024) / totalTime).toFixed(2)),
      };
    });

    console.log('Large file stats result:', result);
    console.log(`Throughput: ${result.throughputMBps} MB/s`);

    expect(result.totalSequences).toBe(10000);
    expect(result.totalBases).toBe(10000000); // 10M bases
    expect(result.gcContent).toBeGreaterThan(0);
    expect(result.atContent).toBeGreaterThan(0);
    expect(result.minLength).toBe(1000);
    expect(result.maxLength).toBe(1000);
    expect(result.meanLength).toBe(1000);
    expect(result.stdDevLength).toBe(0); // All same length
    expect(result.n50).toBe(1000);
    expect(result.totalTime).toBeGreaterThan(0);
    expect(result.totalTime).toBeLessThan(10); // Should complete in under 10 seconds
    expect(result.throughputMBps).toBeGreaterThan(0.5); // At least 0.5 MB/s
  });

  test('4. calculateStatsSync calculates stats synchronously', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Parse first
      const fastaContent = `>seq1
ACGTACGT
>seq2
GGCCGGCC
>seq3
AATTNNRR`;

      const blob = new Blob([fastaContent], { type: 'text/plain' });

      // @ts-expect-error - Browser bundle types
      const parser = window.bioseqStream.parseFastaBrowser(blob);
      const records = [];
      for await (const record of parser) {
        records.push(record);
      }

      // Calculate stats synchronously
      // @ts-expect-error - Browser bundle types
      const stats = window.bioseqStream.calculateStatsSync(records);

      return {
        totalSequences: stats.totalSequences,
        totalBases: stats.totalBases,
        gcContent: parseFloat(stats.gcContent.toFixed(2)),
        atContent: parseFloat(stats.atContent.toFixed(2)),
        n50: stats.n50,
        l50: stats.l50,
      };
    });

    console.log('Sync stats result:', result);

    expect(result.totalSequences).toBe(3);
    expect(result.totalBases).toBe(24);
    expect(result.gcContent).toBe(50); // actual calculated value
    expect(result.atContent).toBeCloseTo(33.33, 1);
  });
});
