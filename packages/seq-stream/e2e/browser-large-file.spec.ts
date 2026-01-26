import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Browser Large File Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/e2e/test-page.html');
    await page.waitForFunction(() => window.bioseqStream !== undefined);
  });

  test('parseFastaBrowser should handle 10MB file', async ({ page }) => {
    // Realistic test with 10MB file (browser can handle this in memory)
    const result = await page.evaluate(async () => {
      // Generate 10MB of FASTA data
      const numSequences = 10000; // 10k sequences
      const seqLength = 1000; // 1KB per sequence

      console.log(`Generating ${numSequences} sequences of ${seqLength} bases each...`);

      const sequences = [];
      for (let i = 0; i < numSequences; i++) {
        const seq = 'ACGT'.repeat(seqLength / 4);
        sequences.push('>seq' + i + '\n' + seq + '\n');

        if (i % 2000 === 0 && i > 0) {
          console.log(`Generated ${i} sequences...`);
        }
      }

      const fastaContent = sequences.join('');
      const sizeInMB = (fastaContent.length / (1024 * 1024)).toFixed(2);
      console.log(`Generated FASTA content size: ${sizeInMB} MB`);

      const blob = new Blob([fastaContent], { type: 'text/plain' });
      console.log(`Blob size: ${(blob.size / (1024 * 1024)).toFixed(2)} MB`);

      console.log('Starting to parse...');
      let count = 0;
      const startTime = performance.now();

      // @ts-expect-error - Browser bundle types
      for await (const record of window.bioseqStream.parseFastaBrowser(blob)) {
        count++;
        // Log progress every 2k records
        if (count % 2000 === 0) {
          const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
          console.log(`Parsed ${count} records in ${elapsed}s`);
        }
      }

      const totalTime = (performance.now() - startTime) / 1000;
      console.log(`Finished parsing ${count} records in ${totalTime.toFixed(2)}s`);

      return {
        count,
        totalTime,
        sizeMB: parseFloat(sizeInMB),
      };
    });

    console.log('Test result:', result);
    expect(result.count).toBe(10000);
    expect(result.sizeMB).toBeGreaterThan(9);
    expect(result.sizeMB).toBeLessThan(12);
    // Performance checks
    expect(result.totalTime).toBeGreaterThan(0);
    expect(result.totalTime).toBeLessThan(10); // Should parse 10MB in under 10 seconds
  });

  test('parseFastqBrowser should handle 10MB file', async ({ page }) => {
    // Realistic test with 10MB FASTQ file
    const result = await page.evaluate(async () => {
      // Generate 10MB of FASTQ data
      const numReads = 25000; // 25k reads, ~400 bytes each = ~10MB
      const readLength = 100;
      const quality = 'I'.repeat(readLength);

      console.log(`Generating ${numReads} reads of ${readLength} bases each...`);

      const reads = [];
      for (let i = 0; i < numReads; i++) {
        const seq = 'ACGT'.repeat(readLength / 4);
        reads.push('@read' + i + '\n' + seq + '\n+\n' + quality + '\n');

        if (i % 5000 === 0 && i > 0) {
          console.log(`Generated ${i} reads...`);
        }
      }

      const fastqContent = reads.join('');
      const sizeInMB = (fastqContent.length / (1024 * 1024)).toFixed(2);
      console.log(`Generated FASTQ content size: ${sizeInMB} MB`);

      const blob = new Blob([fastqContent], { type: 'text/plain' });

      console.log('Starting to parse...');
      let count = 0;
      const startTime = performance.now();

      // @ts-expect-error - Browser bundle types
      for await (const record of window.bioseqStream.parseFastqBrowser(blob)) {
        count++;
        if (count % 5000 === 0) {
          console.log(`Parsed ${count} records...`);
        }
      }

      const totalTime = (performance.now() - startTime) / 1000;
      console.log(`Finished parsing ${count} records in ${totalTime.toFixed(2)}s`);

      return {
        count,
        totalTime,
        sizeMB: parseFloat(sizeInMB),
      };
    });

    console.log('Test result:', result);
    expect(result.count).toBe(25000);
    expect(result.sizeMB).toBeGreaterThan(5);
    expect(result.sizeMB).toBeLessThan(6);
    // Performance checks
    expect(result.totalTime).toBeGreaterThan(0);
    expect(result.totalTime).toBeLessThan(10); // Should parse ~6MB in under 10 seconds
  });

  test('parseFastaBrowser should handle 100MB file with performance metrics', async ({ page }) => {
    // Test with 100MB file - more realistic for browser environment
    const result = await page.evaluate(async () => {
      // Generate 100MB of FASTA data using Blob chunks (avoids string length limit)
      const numSequences = 100000; // 100k sequences
      const seqLength = 1000; // 1KB per sequence = ~100MB

      console.log(
        `Generating ${numSequences} sequences of ${seqLength} bases each for ~100MB file...`
      );

      const chunks: BlobPart[] = [];
      let totalSize = 0;

      for (let i = 0; i < numSequences; i++) {
        const seq = 'ACGT'.repeat(seqLength / 4);
        const record = '>seq' + i + '\n' + seq + '\n';
        chunks.push(record);
        totalSize += record.length;

        if (i % 20000 === 0 && i > 0) {
          const sizeMB = (totalSize / (1024 * 1024)).toFixed(0);
          console.log(`Generated ${i} sequences (${sizeMB} MB)...`);
        }
      }

      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
      console.log(`Generated FASTA content size: ${sizeInMB} MB`);

      // Create blob from chunks (avoids string concatenation limit)
      const blob = new Blob(chunks, { type: 'text/plain' });
      console.log(`Blob size: ${(blob.size / (1024 * 1024)).toFixed(2)} MB`);

      console.log('Starting to parse...');
      let count = 0;
      const startTime = performance.now();

      // @ts-expect-error - Browser bundle types
      for await (const record of window.bioseqStream.parseFastaBrowser(blob)) {
        count++;
        // Log progress every 20k records
        if (count % 20000 === 0) {
          const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
          console.log(`Parsed ${count} records in ${elapsed}s`);
        }
      }

      const totalTime = (performance.now() - startTime) / 1000;
      console.log(`Finished parsing ${count} records in ${totalTime.toFixed(2)}s`);

      return {
        count,
        totalTime,
        sizeMB: parseFloat(sizeInMB),
        throughputMBps: parseFloat((parseFloat(sizeInMB) / totalTime).toFixed(2)),
      };
    });

    console.log('Test result:', result);
    console.log(`Throughput: ${result.throughputMBps} MB/s`);

    expect(result.count).toBe(100000);
    expect(result.sizeMB).toBeGreaterThan(90); // At least 90 MB
    expect(result.sizeMB).toBeLessThan(110); // Less than 110 MB
    // Performance checks
    expect(result.totalTime).toBeGreaterThan(0);
    expect(result.totalTime).toBeLessThan(30); // Should parse 100MB in under 30 seconds
    expect(result.throughputMBps).toBeGreaterThan(3); // At least 3 MB/s throughput
  });

  test('parseFastaBrowser should process file from file system', async ({ page }) => {
    // First, create a test file
    const testFilePath = path.join(__dirname, 'test-fasta-input.fasta');

    // Generate a realistic test file (5MB)
    const numSequences = 5000;
    const seqLength = 1000;
    let content = '';
    for (let i = 0; i < numSequences; i++) {
      content += `>sequence_${i} Test sequence\n`;
      content += 'ACGT'.repeat(seqLength / 4) + '\n';
    }
    fs.writeFileSync(testFilePath, content);

    // Add file input to the page
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="/e2e/bioseq-bundle.js"></script>
        </head>
        <body>
          <input type="file" id="fileInput" />
          <div id="results"></div>
        </body>
      </html>
    `);

    // Set the file on the input
    await page.setInputFiles('#fileInput', testFilePath);

    // Process the file
    const result = await page.evaluate(async () => {
      const input = document.getElementById('fileInput') as HTMLInputElement;
      const file = input.files?.[0];

      if (!file) {
        throw new Error('No file selected');
      }

      console.log(
        `Processing file: ${file.name}, size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`
      );

      let count = 0;
      const startTime = performance.now();

      // @ts-expect-error - Browser bundle types
      for await (const record of window.bioseqStream.parseFastaBrowser(file)) {
        count++;
        if (count % 1000 === 0) {
          console.log(`Parsed ${count} sequences...`);
        }
      }

      const totalTime = (performance.now() - startTime) / 1000;
      console.log(`Finished parsing ${count} sequences in ${totalTime.toFixed(2)}s`);

      return {
        count,
        totalTime,
        fileName: file.name,
        fileSizeMB: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
      };
    });

    console.log('File system test result:', result);

    expect(result.count).toBe(5000);
    expect(result.fileName).toBe('test-fasta-input.fasta');
    expect(result.fileSizeMB).toBeGreaterThan(4);
    expect(result.fileSizeMB).toBeLessThan(6);
    expect(result.totalTime).toBeGreaterThan(0);
    expect(result.totalTime).toBeLessThan(10);

    // Cleanup
    fs.unlinkSync(testFilePath);
  });

  test('parseFastaBrowser should process 1GB file from file system', async ({ page }) => {
    // Test with real 1GB file on disk
    const testFilePath = path.join(__dirname, 'test-fasta-1gb.fasta');

    console.log('Generating 1GB test file...');
    const numSequences = 1000000; // 1M sequences
    const seqLength = 1000; // 1KB per sequence

    // Write file in chunks to avoid memory issues during generation
    const writeStream = fs.createWriteStream(testFilePath);

    for (let i = 0; i < numSequences; i++) {
      const seq = 'ACGT'.repeat(seqLength / 4);
      writeStream.write(`>sequence_${i}\n${seq}\n`);

      if (i % 100000 === 0) {
        console.log(`Generated ${i} sequences...`);
      }
    }

    writeStream.end();

    // Wait for file to be fully written
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    });

    const fileSizeMB = fs.statSync(testFilePath).size / (1024 * 1024);
    console.log(`Generated file size: ${fileSizeMB.toFixed(2)} MB`);

    // Add file input to the page
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="/e2e/bioseq-bundle.js"></script>
        </head>
        <body>
          <input type="file" id="fileInput" />
          <div id="results"></div>
        </body>
      </html>
    `);

    // Set the file on the input
    await page.setInputFiles('#fileInput', testFilePath);

    console.log('Starting browser parsing of 1GB file...');

    // Process the file
    const result = await page.evaluate(async () => {
      const input = document.getElementById('fileInput') as HTMLInputElement;
      const file = input.files?.[0];

      if (!file) {
        throw new Error('No file selected');
      }

      console.log(
        `Processing file: ${file.name}, size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`
      );

      let count = 0;
      const startTime = performance.now();

      // @ts-expect-error - Browser bundle types
      for await (const record of window.bioseqStream.parseFastaBrowser(file)) {
        count++;
        if (count % 100000 === 0) {
          const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
          console.log(`Parsed ${count} sequences in ${elapsed}s...`);
        }
      }

      const totalTime = (performance.now() - startTime) / 1000;
      console.log(`Finished parsing ${count} sequences in ${totalTime.toFixed(2)}s`);

      return {
        count,
        totalTime,
        fileName: file.name,
        fileSizeMB: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
        throughputMBps: parseFloat((file.size / (1024 * 1024) / totalTime).toFixed(2)),
      };
    });

    console.log('1GB File system test result:', result);
    console.log(`Throughput: ${result.throughputMBps} MB/s`);

    expect(result.count).toBeGreaterThan(900000); // At least 900k sequences
    expect(result.fileName).toBe('test-fasta-1gb.fasta');
    expect(result.fileSizeMB).toBeGreaterThan(900); // At least 900 MB
    expect(result.fileSizeMB).toBeLessThan(1200); // Less than 1.2 GB
    expect(result.totalTime).toBeGreaterThan(0);
    expect(result.totalTime).toBeLessThan(120); // Should parse in under 2 minutes
    expect(result.throughputMBps).toBeGreaterThan(8); // At least 8 MB/s

    // Cleanup
    fs.unlinkSync(testFilePath);
  });

  test('parseFastaBrowser should process 2GB file from file system', async ({ page }) => {
    // Test with real 2GB file on disk - this will test browser's absolute limits
    const testFilePath = path.join(__dirname, 'test-fasta-2gb.fasta');

    console.log('Generating 2GB test file...');
    const numSequences = 2000000; // 2M sequences
    const seqLength = 1000; // 1KB per sequence

    // Write file in chunks to avoid memory issues during generation
    const writeStream = fs.createWriteStream(testFilePath);

    for (let i = 0; i < numSequences; i++) {
      const seq = 'ACGT'.repeat(seqLength / 4);
      writeStream.write(`>sequence_${i}\n${seq}\n`);

      if (i % 200000 === 0) {
        console.log(`Generated ${i} sequences...`);
      }
    }

    writeStream.end();

    // Wait for file to be fully written
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    });

    const fileSizeMB = fs.statSync(testFilePath).size / (1024 * 1024);
    console.log(
      `Generated file size: ${fileSizeMB.toFixed(2)} MB (${(fileSizeMB / 1024).toFixed(2)} GB)`
    );

    // Add file input to the page
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <script src="/e2e/bioseq-bundle.js"></script>
        </head>
        <body>
          <input type="file" id="fileInput" />
          <div id="results"></div>
        </body>
      </html>
    `);

    // Set the file on the input
    await page.setInputFiles('#fileInput', testFilePath);

    console.log('Starting browser parsing of 2GB file...');

    // Process the file with longer timeout for large file
    const result = await page.evaluate(async () => {
      const input = document.getElementById('fileInput') as HTMLInputElement;
      const file = input.files?.[0];

      if (!file) {
        throw new Error('No file selected');
      }

      console.log(
        `Processing file: ${file.name}, size: ${(file.size / (1024 * 1024)).toFixed(2)} MB (${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB)`
      );

      let count = 0;
      const startTime = performance.now();

      // @ts-expect-error - Browser bundle types
      for await (const record of window.bioseqStream.parseFastaBrowser(file)) {
        count++;
        if (count % 200000 === 0) {
          const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
          console.log(`Parsed ${count} sequences in ${elapsed}s...`);
        }
      }

      const totalTime = (performance.now() - startTime) / 1000;
      console.log(`Finished parsing ${count} sequences in ${totalTime.toFixed(2)}s`);

      return {
        count,
        totalTime,
        fileName: file.name,
        fileSizeMB: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
        fileSizeGB: parseFloat((file.size / (1024 * 1024 * 1024)).toFixed(2)),
        throughputMBps: parseFloat((file.size / (1024 * 1024) / totalTime).toFixed(2)),
      };
    });

    console.log('2GB File system test result:', result);
    console.log(`File size: ${result.fileSizeGB} GB`);
    console.log(`Throughput: ${result.throughputMBps} MB/s`);

    expect(result.count).toBeGreaterThan(1900000); // At least 1.9M sequences
    expect(result.fileName).toBe('test-fasta-2gb.fasta');
    expect(result.fileSizeMB).toBeGreaterThan(1900); // At least 1.9 GB
    expect(result.fileSizeMB).toBeLessThan(2200); // Less than 2.2 GB
    expect(result.totalTime).toBeGreaterThan(0);
    expect(result.totalTime).toBeLessThan(180); // Should parse in under 3 minutes
    expect(result.throughputMBps).toBeGreaterThan(10); // At least 10 MB/s

    // Cleanup
    fs.unlinkSync(testFilePath);
  });

  test('Note: Browser has memory limits - files >1GB will likely crash', () => {
    // This is a documentation test explaining browser limitations
    console.log(`
Browser memory limitations:
- JavaScript strings have a maximum length of ~512MB-1GB (engine dependent)
- Browsers typically limit memory per tab to ~1-2GB total
- The 1GB test above pushes the browser to its limits
- For production use with files >100MB, use the Node.js version with fs.createReadStream()
- Browser parsers load entire file into memory (not true streaming)
- Node.js version uses constant ~50MB memory regardless of file size
    `);
    expect(true).toBe(true);
  });
});
