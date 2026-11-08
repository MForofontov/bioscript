import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e/test-page.html');
});

test('final lines, CRLF, and truncated FASTQ', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = (window as unknown as { bioseqStream: typeof import('../src/browser-index') })
      .bioseqStream;
    const fastq = [];
    for await (const record of api.parseFastqBrowser(new Blob(['@read café\r\nAC\r\n+\r\n!!'])))
      fastq.push(record);
    const fasta = [];
    for await (const record of api.parseFastaBrowser(new Blob(['>first\nAC\n>last'])))
      fasta.push(record);
    let rejected = false;
    try {
      for await (const record of api.parseFastqBrowser(new Blob(['@read\nAC\n+\n']))) void record;
    } catch {
      rejected = true;
    }
    return { fastq, fasta, rejected };
  });
  expect(result.fastq).toEqual([
    { id: 'read', description: 'café', sequence: 'AC', quality: '!!' },
  ]);
  expect(result.fasta.map((r) => r.id)).toEqual(['first', 'last']);
  expect(result.rejected).toBe(true);
});

test('cancels a source when the consumer stops early', async ({ page }) => {
  expect(
    await page.evaluate(async () => {
      const api = (window as unknown as { bioseqStream: typeof import('../src/browser-index') })
        .bioseqStream;
      let cancelled = false;
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('@r\nAC\n+\n!!\n'));
        },
        cancel() {
          cancelled = true;
        },
      });
      const file = { stream: () => stream } as Blob;
      for await (const record of api.parseFastqBrowser(file)) {
        void record;
        break;
      }
      return cancelled;
    })
  ).toBe(true);
});

test('bundle quality encoding constants preserve conversions and statistics', async ({ page }) => {
  const result = await page.evaluate(() => {
    const api = window.bioseqStream;
    return {
      converted: api.convertQualityBrowser(
        'IIII',
        api.QualityEncoding.Phred33,
        api.QualityEncoding.Phred64
      ),
      mean: api.calculateStatsSync(
        [{ id: 'r', sequence: 'AC', quality: 'hh' }],
        api.QualityEncoding.Phred64
      ).meanQuality,
    };
  });
  expect(result).toEqual({ converted: 'hhhh', mean: 40 });
});

test('preserves split UTF-8 bytes and rejects corrupt gzip sources', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = window.bioseqStream;
    const bytes = new TextEncoder().encode('>r café\r\nAC');
    let offset = 0;
    const file = {
      stream: () =>
        new ReadableStream<Uint8Array>({
          pull(controller) {
            if (offset < bytes.length) controller.enqueue(bytes.slice(offset, ++offset));
            else controller.close();
          },
        }),
    } as Blob;
    const records = [];
    for await (const record of api.parseFastaBrowser(file)) records.push(record);
    let rejected = false;
    try {
      for await (const record of api.parseFastqBrowser(new File(['not gzip'], 'broken.fastq.gz')))
        void record;
    } catch {
      rejected = true;
    }
    return { records, rejected };
  });
  expect(result).toEqual({
    records: [{ id: 'r', description: 'café', sequence: 'AC' }],
    rejected: true,
  });
});
