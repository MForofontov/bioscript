# GitHub Copilot Instructions for Bioscript

## Project Overview

Bioscript is a comprehensive TypeScript bioinformatics library organized as a monorepo. It provides high-performance tools for sequence processing, translation, and analysis with support for both Node.js and browser environments. The project emphasizes streaming performance, memory efficiency, type safety, and comprehensive testing.

## Architecture & Structure

### Core Principles

- **Streaming First**: Design for processing large (multi-GB) files with constant memory usage
- **Dual Environment**: Support both Node.js (streams) and Browser (Web Streams API)
- **Type Safety**: Complete TypeScript coverage with strict mode enabled
- **Zero Dependencies**: Use only Node.js built-ins and battle-tested libraries
- **Comprehensive Testing**: >85% coverage with unit and e2e tests
- **Performance**: Optimize for high throughput (500+ MB/s) and low memory
- **Documentation**: JSDoc comments with examples and performance notes
- **Modular Design**: Tree-shakeable exports, import only what you need

### Monorepo Structure

```
bioscript/
├── .github/                        # GitHub workflows and documentation
│   ├── copilot-instructions.md     # This file
│   └── workflows/                  # CI/CD pipelines (future)
├── packages/                       # Package directory
│   ├── seq-stream/                 # Streaming FASTA/FASTQ parser
│   │   ├── src/
│   │   │   ├── fasta.ts            # FASTA parser/writer
│   │   │   ├── fastq.ts            # FASTQ parser/writer + quality conversion
│   │   │   ├── stats.ts            # Statistics calculator (GC%, N50/L50)
│   │   │   ├── browser-fasta.ts    # Browser FASTA utilities
│   │   │   ├── browser-fastq.ts    # Browser FASTQ utilities
│   │   │   ├── browser-stats.ts    # Browser statistics
│   │   │   ├── browser-index.ts    # Browser exports
│   │   │   ├── index.ts            # Main exports
│   │   │   └── tests/              # Unit tests
│   │   │       ├── fasta.test.ts
│   │   │       ├── fastq.test.ts
│   │   │       ├── stats.test.ts
│   │   │       └── fixtures/       # Test data files
│   │   ├── e2e/                    # End-to-end browser tests
│   │   │   ├── browser-fasta.spec.ts
│   │   │   ├── browser-fastq.spec.ts
│   │   │   ├── browser-stats.spec.ts
│   │   │   ├── browser-large-file.spec.ts
│   │   │   ├── fixtures/           # E2E test fixtures
│   │   │   └── test-page.html      # Test harness
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── jest.config.ts
│   │   ├── playwright.config.ts
│   │   └── README.md
│   └── seq-translate/              # Genetic code translation
│       ├── src/
│       │   ├── tables.ts           # NCBI genetic code tables (33 tables)
│       │   ├── translate.ts        # Single sequence translation
│       │   ├── translate-frames.ts # Multi-frame translation
│       │   ├── translate-batch.ts  # Batch processing
│       │   ├── worker-translate.ts # Parallel processing (Node.js)
│       │   ├── browser-translate.ts # Browser translation + streaming
│       │   ├── lookup.ts           # Optimized lookup tables
│       │   ├── utils.ts            # Reverse complement, validation
│       │   ├── index.ts            # Main exports
│       │   └── tests/              # Unit tests
│       │       ├── translate.test.ts
│       │       ├── translate-frames.test.ts
│       │       ├── translate-batch.test.ts
│       │       ├── worker-translate.test.ts
│       │       ├── browser-translate.test.ts
│       │       └── utils.test.ts
│       ├── package.json
│       ├── tsconfig.json
│       ├── jest.config.js
│       └── README.md
├── scripts/                        # Build and deployment scripts
│   ├── publish-packages.sh
│   └── test-install-full.sh
├── package.json                    # Root workspace configuration
├── tsconfig.json                   # Root TypeScript config
├── tsconfig.base.json              # Shared TypeScript config
├── jest.config.base.ts             # Shared Jest config
├── eslint.config.mjs               # ESLint configuration
└── README.md                       # Root documentation
```

## Development Guidelines

### Package Philosophy

#### When to Use Battle-Tested Libraries

**DO use existing packages for:**
- **Streaming**: Node.js `stream`, `zlib` (built-in modules)
- **File I/O**: Node.js `fs`, `path` (built-in modules)
- **Compression**: Node.js `zlib` for gzip (built-in)
- **Browser streams**: Web Streams API (`ReadableStream`, `TransformStream`)
- **Worker threads**: Node.js `worker_threads` (built-in)
- **Testing**: `jest`, `@playwright/test`
- **Build tools**: `typescript`, `esbuild`

**DO add value on top with:**
- ✅ **Bioinformatics logic**: Format parsing, quality score conversion, statistics
- ✅ **Streaming workflows**: Auto-detect compression, pipeline composition
- ✅ **Type safety**: TypeScript interfaces for biological data (FastaRecord, FastqRecord)
- ✅ **Performance optimization**: Efficient buffering, chunking strategies
- ✅ **Dual environment**: Node.js streams + Browser Web Streams with unified API
- ✅ **Convenience features**: Auto-detect file formats, smart defaults
- ✅ **Error handling**: Descriptive validation errors with line numbers

**Examples of Good Patterns:**

```typescript
// ✅ GOOD: Uses Node.js zlib but adds auto-detection and streaming
export function createFastaParser(filePath: string): NodeJS.ReadableStream {
  // Uses: fs.createReadStream, zlib.createGunzip
  // Adds: Auto-detect .gz extension, pipeline composition, typed output
  const fileStream = createReadStream(filePath);
  const parser = new FastaParser();

  if (filePath.endsWith('.gz')) {
    return fileStream.pipe(createGunzip()).pipe(parser);
  }

  return fileStream.pipe(parser);
}

// ✅ GOOD: Adds complex bioinformatics statistics
export class StatsCalculator extends Transform {
  // Uses: Node.js Transform streams
  // Adds: GC content, N50/L50, quality scores, length distributions
  // This is domain-specific logic not in stdlib
  
  getStats(): SequenceStats {
    // Calculate N50, L50, median, std dev, etc.
    return {
      n50: this.calculateN50(),
      l50: this.calculateL50(),
      gcContent: (this.gcCount / this.totalBases) * 100,
      // ... complex bioinformatics metrics
    };
  }
}

// ✅ GOOD: Quality score conversion with validation
export function convertQuality(
  quality: string,
  from: QualityEncoding,
  to: QualityEncoding
): string {
  // Uses: String manipulation
  // Adds: FASTQ-specific quality encoding logic, validation
  if (typeof quality !== 'string') {
    throw new TypeError(`quality must be a string, got ${typeof quality}`);
  }

  return quality
    .split('')
    .map(char => {
      const phredScore = char.charCodeAt(0) - from;
      return String.fromCharCode(phredScore + to);
    })
    .join('');
}

// ❌ BAD: Just wrapping fs without adding value
export function readFile(path: string): string {
  return fs.readFileSync(path, 'utf-8');  // Use fs directly instead
}

// ❌ BAD: Reimplementing compression (use Node.js zlib)
export function compressGzip(data: Buffer): Buffer {
  // Don't reimplement compression algorithms!
}
```

### Function Development Standards

#### 1. Bioinformatics Function Template

```typescript
/**
 * Brief description of the biological operation.
 *
 * @param sequence - DNA/RNA sequence to process.
 * @param options - Configuration options.
 * @returns Processed result.
 *
 * @throws {TypeError} If sequence is not a string.
 * @throws {Error} If sequence contains invalid characters.
 *
 * @example
 * ```typescript
 * const protein = translateSequence('ATGGCC', { table: 'standard' });
 * console.log(protein); // 'MA'
 * ```
 *
 * @example
 * ```typescript
 * // Using mitochondrial genetic code
 * const protein = translateSequence('ATGAGA', { 
 *   table: 'vertebrate_mitochondrial' 
 * });
 * console.log(protein); // 'M*' (AGA is stop in vertebrate mito)
 * ```
 *
 * @note Supports all 33 NCBI genetic code tables.
 * @performance O(n) time, O(1) space. Processes ~1M codons/sec.
 */
export function translateSequence(
  sequence: string,
  options: TranslationOptions = {}
): string {
  // Input validation
  if (typeof sequence !== 'string') {
    throw new TypeError(`sequence must be a string, got ${typeof sequence}`);
  }

  const normalized = sequence.trim().toUpperCase();
  
  // Validate sequence contains only valid bases
  if (!/^[ACGTUN]*$/.test(normalized)) {
    throw new Error(
      'sequence contains invalid characters (expected: A, C, G, T, U, N)'
    );
  }

  // Function logic
  const { table = 'standard', stopSymbol = '*', breakOnStop = true } = options;
  const codonTable = getTable(table);
  
  // ... translation logic
}
```

#### 2. Streaming Parser Template

```typescript
/**
 * Stream transformer that parses FASTA format.
 * Handles multi-line sequences and descriptions.
 *
 * @example
 * ```typescript
 * const parser = new FastaParser();
 * fs.createReadStream('sequences.fasta')
 *   .pipe(parser)
 *   .on('data', (record: FastaRecord) => {
 *     console.log(record.id, record.sequence.length);
 *   });
 * ```
 *
 * @performance Constant memory usage regardless of file size.
 * Throughput: 500+ MB/s for uncompressed files.
 */
export class FastaParser extends Transform {
  private buffer: string = '';
  private currentRecord: Partial<FastaRecord> | null = null;

  constructor() {
    super({ objectMode: true });
  }

  _transform(chunk: Buffer, encoding: string, callback: TransformCallback): void {
    this.buffer += chunk.toString();
    const lines = this.buffer.split('\n');

    // Keep last incomplete line in buffer
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      this.processLine(line);
    }

    callback();
  }

  _flush(callback: TransformCallback): void {
    // Process remaining data
    if (this.buffer) {
      this.processLine(this.buffer);
    }

    // Emit final record
    if (this.currentRecord && this.currentRecord.id) {
      this.push(this.currentRecord as FastaRecord);
    }

    callback();
  }

  private processLine(line: string): void {
    // ... parsing logic with validation
  }
}
```

#### 3. Browser Function Template

```typescript
/**
 * Browser-compatible FASTA parser using Web Streams API.
 * Supports File and Blob inputs with automatic gzip decompression.
 *
 * @param input - File, Blob, or ArrayBuffer containing FASTA data.
 * @returns Async iterable of parsed FASTA records.
 *
 * @throws {TypeError} If input is not File, Blob, or ArrayBuffer.
 *
 * @example
 * ```typescript
 * // From file input
 * const fileInput = document.querySelector('input[type="file"]');
 * const file = fileInput.files[0];
 *
 * for await (const record of parseFastaBrowser(file)) {
 *   console.log(`${record.id}: ${record.sequence.length}bp`);
 * }
 * ```
 *
 * @note Browser memory limits apply (~1-2GB). For larger files, use Node.js version.
 * @performance Handles files up to 2GB in browser. Automatic streaming and chunking.
 */
export async function* parseFastaBrowser(
  input: File | Blob | ArrayBuffer
): AsyncIterable<FastaRecord> {
  // Input validation
  if (
    !(input instanceof File) &&
    !(input instanceof Blob) &&
    !(input instanceof ArrayBuffer)
  ) {
    throw new TypeError(
      'input must be File, Blob, or ArrayBuffer'
    );
  }

  // Auto-detect gzip and create stream
  const stream = await createInputStream(input);
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  // ... streaming parsing logic
}
```

### Testing Standards

#### Test Organization

```typescript
import { functionName } from '../path/to/function';

/**
 * Unit tests for functionName.
 * Tests cover: normal usage, edge cases, error handling.
 */
describe('functionName', () => {
  // SECTION 1: Normal/typical usage (60% of tests)
  
  it('1. should parse simple FASTA sequence', () => {
    // Arrange
    const input = '>seq1\nACGT\n';
    const expected = { id: 'seq1', sequence: 'ACGT' };

    // Act
    const result = parseFasta(input);

    // Assert
    expect(result).toEqual(expected);
  });

  it('2. should handle multi-line sequences', () => {
    const input = '>seq1\nACGT\nACGT\n';
    const expected = { id: 'seq1', sequence: 'ACGTACGT' };

    const result = parseFasta(input);

    expect(result).toEqual(expected);
  });

  // SECTION 2: Edge cases (30% of tests)

  it('10. should handle empty sequence', () => {
    const input = '>seq1\n';
    const expected = { id: 'seq1', sequence: '' };

    const result = parseFasta(input);

    expect(result).toEqual(expected);
  });

  it('11. should handle very long sequences', () => {
    const longSeq = 'A'.repeat(1000000);
    const input = `>seq1\n${longSeq}\n`;

    const result = parseFasta(input);

    expect(result.sequence).toHaveLength(1000000);
  });

  // SECTION 3: Error cases (10% of tests - ALWAYS LAST)

  it('15. should throw TypeError when input is not a string', () => {
    const input = 123 as any;

    expect(() => parseFasta(input)).toThrow(TypeError);
    expect(() => parseFasta(input)).toThrow('input must be a string');
  });

  it('16. should throw Error for invalid sequence characters', () => {
    const input = '>seq1\nACGTXYZ\n';

    expect(() => parseFasta(input)).toThrow(Error);
    expect(() => parseFasta(input)).toThrow('invalid characters');
  });
});
```

#### Testing Requirements

- **Test naming**: Use numbered format: `'1. should...'`, `'2. should...'`
- **Test organization**:
  1. Normal usage (60%): Common cases, typical workflows
  2. Edge cases (30%): Empty inputs, large files, boundary conditions
  3. Error cases (10%): **ALWAYS LAST** - Type errors, validation errors
- **Coverage goal**: >85% overall (seq-stream: 88.65%, seq-translate: 84.45%)
- **Performance tests**: Use 100ms threshold for CI compatibility
- **Streaming tests**: Test with realistic file sizes (10KB - 10MB)
- **Browser tests**: Use Playwright for e2e validation

#### E2E Testing (Playwright)

```typescript
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
    expect(result[0]).toEqual({ 
      id: 'seq1', 
      sequence: 'ACGTACGT', 
      description: '' 
    });
  });

  test('6. parseFastaBrowser should handle gzip-compressed File', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const response = await fetch('/e2e/fixtures/test.fasta.gz');
      const arrayBuffer = await response.arrayBuffer();
      const file = new File([arrayBuffer], 'test.fasta.gz', { 
        type: 'application/gzip' 
      });

      const records = [];
      // @ts-expect-error - browser bundle
      for await (const record of window.bioseqStream.parseFastaBrowser(file)) {
        records.push(record);
      }

      return records;
    });

    expect(result).toHaveLength(2);
    expect(result[0].sequence).toBe('ACGTACGT');
  });
});
```

### Bioinformatics-Specific Standards

#### Sequence Validation

```typescript
/**
 * Validate DNA/RNA sequence contains only valid bases.
 */
export function validateSequence(
  sequence: string,
  allowAmbiguous: boolean = false
): boolean {
  if (typeof sequence !== 'string') {
    return false;
  }

  const basePattern = allowAmbiguous
    ? /^[ACGTUNRYKMSWBDHV]+$/i  // IUPAC ambiguity codes
    : /^[ACGTUN]+$/i;             // Standard bases + N

  return basePattern.test(sequence);
}
```

#### Quality Score Handling

```typescript
/**
 * FASTQ quality encoding standards.
 * - Phred+33 (Sanger, Illumina 1.8+): ASCII 33-126
 * - Phred+64 (Illumina 1.3-1.7): ASCII 64-126
 */
export enum QualityEncoding {
  Phred33 = 33,  // Standard for modern sequencing
  Phred64 = 64,  // Legacy Illumina
}

/**
 * Decode quality string to numeric Phred scores.
 * Validates quality scores are in valid range.
 */
export function decodeQualityScores(
  quality: string,
  encoding: QualityEncoding
): number[] {
  if (typeof quality !== 'string') {
    throw new TypeError(`quality must be a string, got ${typeof quality}`);
  }

  return quality.split('').map((char, index) => {
    const phredScore = char.charCodeAt(0) - encoding;
    
    if (phredScore < 0 || phredScore > 93) {
      throw new Error(
        `Invalid quality score at position ${index}: ${phredScore} ` +
        `(expected 0-93 for encoding ${encoding})`
      );
    }
    
    return phredScore;
  });
}
```

#### Genetic Code Tables

```typescript
/**
 * NCBI genetic code table interface.
 * All codons use RNA notation (U instead of T).
 */
export type CodonTable = Record<string, string>;

/**
 * Get genetic code table by name or NCBI number.
 * Supports all 33 NCBI genetic code tables.
 *
 * @param tableId - Table name or NCBI transl_table number.
 * @returns Codon table mapping codons to amino acids.
 *
 * @throws {Error} If table ID is not found.
 *
 * @example
 * ```typescript
 * const standard = getTable('standard');  // NCBI table 1
 * const mito = getTable('2');  // Vertebrate mitochondrial
 * const yeast = getTable('yeast_mitochondrial');
 * ```
 */
export function getTable(tableId: string): CodonTable {
  const table = tables[tableId];
  
  if (!table) {
    throw new Error(
      `Unknown genetic code table: ${tableId}. ` +
      `Available tables: ${Object.keys(tables).join(', ')}`
    );
  }
  
  return table;
}
```

#### Statistics Calculation

```typescript
/**
 * Calculate N50 statistic for assembly quality.
 * N50 is the sequence length at which 50% of bases are in sequences >= that length.
 *
 * @param lengths - Array of sequence lengths (unsorted).
 * @returns N50 value.
 *
 * @example
 * ```typescript
 * const lengths = [100, 200, 300, 400, 500];
 * const n50 = calculateN50(lengths);  // 400
 * ```
 *
 * @complexity O(n log n) due to sorting.
 */
export function calculateN50(lengths: number[]): number {
  if (!Array.isArray(lengths) || lengths.length === 0) {
    throw new Error('lengths must be a non-empty array');
  }

  // Sort lengths in descending order
  const sorted = [...lengths].sort((a, b) => b - a);
  const totalBases = sorted.reduce((sum, len) => sum + len, 0);
  const halfBases = totalBases / 2;

  let cumulativeLength = 0;
  for (const length of sorted) {
    cumulativeLength += length;
    if (cumulativeLength >= halfBases) {
      return length;
    }
  }

  return sorted[sorted.length - 1];
}
```

### Performance Standards

#### Memory Efficiency

- **Streaming**: Process files with constant memory (~50MB) regardless of size
- **Buffering**: Use appropriate buffer sizes (default 64KB chunks)
- **Object creation**: Minimize allocations in hot paths
- **String operations**: Use arrays for building large strings, join at end

#### Throughput Benchmarks

Target performance metrics:
- **FASTA parsing**: 500+ MB/s (Node.js uncompressed)
- **FASTQ parsing**: 300+ MB/s (Node.js uncompressed)
- **Translation**: 1M+ codons/second (single-threaded)
- **Parallel translation**: Near-linear scaling with CPU cores
- **Browser parsing**: 100+ MB/s (depends on browser)

#### Performance Testing

```typescript
it('should parse 10MB file efficiently', async () => {
  // Generate 10MB test data
  const sequences = new Array(10000).fill(0).map((_, i) => 
    `>seq${i}\n${'ACGT'.repeat(250)}\n`
  ).join('');

  const startTime = performance.now();
  
  // Parse data
  const records: FastaRecord[] = [];
  await new Promise<void>((resolve) => {
    const parser = new FastaParser();
    const readable = Readable.from([sequences]);
    
    parser.on('data', (record) => records.push(record));
    parser.on('end', resolve);
    
    readable.pipe(parser);
  });

  const duration = performance.now() - startTime;

  expect(records).toHaveLength(10000);
  expect(duration).toBeLessThan(100);  // Should complete in <100ms
});
```

### Documentation Standards

#### Package README Template

```markdown
# @bioscript/package-name

Brief description of the package's purpose.

## Features

✨ **Feature 1** - Description of feature
📦 **Feature 2** - Description of feature
🚀 **Feature 3** - Description of feature

## Installation

\`\`\`bash
npm install @bioscript/package-name
\`\`\`

## Quick Start

\`\`\`typescript
import { mainFunction } from '@bioscript/package-name';

// Simple example
const result = mainFunction(input);
\`\`\`

## API Documentation

### mainFunction(input, options?)

Description of what the function does.

**Parameters:**
- `input` (string): Description of input
- `options` (object, optional): Configuration options
  - `option1` (boolean, default: false): Description
  - `option2` (string, default: 'default'): Description

**Returns:** Description of return value

**Example:**
\`\`\`typescript
const result = mainFunction('ATGGCC', { option1: true });
\`\`\`

## Performance

- **Throughput**: 500+ MB/s for typical files
- **Memory**: Constant ~50MB regardless of file size
- **Browser**: Handles files up to 2GB

## License

MIT © 2026 Mykyta Forofontov
```

#### Function JSDoc Template

````typescript
/**
 * One-line description of function purpose.
 *
 * Detailed description if needed. Include biological context,
 * algorithm details, or implementation notes.
 *
 * @param sequence - DNA/RNA sequence to process.
 * @param options - Configuration options.
 * @param options.table - Genetic code table name or NCBI number.
 * @param options.stopSymbol - Symbol for stop codon (default: '*').
 * @returns Translated protein sequence.
 *
 * @throws {TypeError} If sequence is not a string.
 * @throws {Error} If sequence contains invalid characters.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const protein = translateSequence('ATGGCCAAA');
 * console.log(protein); // 'MAK'
 * ```
 *
 * @example
 * ```typescript
 * // Using mitochondrial genetic code
 * const protein = translateSequence('ATGAGA', {
 *   table: 'vertebrate_mitochondrial'
 * });
 * console.log(protein); // 'M*'
 * ```
 *
 * @note Supports all 33 NCBI genetic code tables.
 * @see {@link https://www.ncbi.nlm.nih.gov/Taxonomy/Utils/wprintgc.cgi}
 * 
 * @performance O(n) time complexity. Processes ~1M codons/second.
 * Memory: O(n) for result string.
 */
````

### Export Strategy

#### Package Exports

Each package should have clear export patterns:

```typescript
// packages/seq-stream/src/index.ts
// Node.js APIs (use Node.js streams)
export * from './fasta';
export * from './fastq';
export * from './stats';

// Browser APIs (use Web Streams API)
export * from './browser-index';
```

```typescript
// packages/seq-stream/src/browser-index.ts
// Browser-specific exports (tree-shakeable)
export * from './browser-fasta';
export * from './browser-fastq';
export * from './browser-stats';
```

#### Avoid Naming Conflicts

```typescript
// If functions have same name in Node.js and browser versions
export { parseFasta } from './fasta';
export { parseFasta as parseFastaBrowser } from './browser-fasta';
```

### Common Patterns

#### Stream Pipeline Pattern

```typescript
// Node.js streaming pipeline
const parser = createFastaParser('sequences.fasta.gz');  // Auto-detects gzip
const stats = new StatsCalculator();
const output = new PassThrough({ objectMode: true });

await pipeline(parser, stats, output);

const results = stats.getStats();
console.log('Total sequences:', results.totalSequences);
```

#### Browser Streaming Pattern

```typescript
// Browser async iteration
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

for await (const record of parseFastaBrowser(file)) {
  console.log(`${record.id}: ${record.sequence.length}bp`);
}
```

#### Worker Pool Pattern

```typescript
// Parallel processing with worker threads
const pool = new TranslationPool(4);  // 4 worker threads
await pool.initialize();

const batch1 = await pool.translate(sequences1, { table: 'standard' });
const batch2 = await pool.translate(sequences2, { table: 'yeast_mitochondrial' });

await pool.terminate();
```

### Adding New Packages

When adding a new package to the monorepo:

1. **Create package directory**: `packages/new-package/`
2. **Setup package.json**:
   ```json
   {
     "name": "@bioscript/new-package",
     "version": "0.1.0",
     "description": "Package description",
     "main": "dist/index.js",
     "types": "dist/index.d.ts",
     "files": ["dist", "README.md", "LICENSE"],
     "publishConfig": { "access": "public" },
     "engines": { "node": ">=16.0.0" }
   }
   ```
3. **Add TypeScript config**: Extend from `tsconfig.base.json`
4. **Add Jest config**: Extend from `jest.config.base.ts`
5. **Create src/ structure**: Following established patterns
6. **Add comprehensive tests**: Unit and e2e if applicable
7. **Write README**: Following package README template
8. **Copy LICENSE**: From root with correct copyright
9. **Update root README**: Add package to list
10. **Update this document**: Add package-specific guidelines

### Suggested New Packages

#### @bioscript/seq-align
- Pairwise alignment (Needleman-Wunsch, Smith-Waterman)
- Multiple sequence alignment wrappers
- Scoring matrices (BLOSUM, PAM)
- Local and global alignment

#### @bioscript/seq-search
- Pattern matching and motif finding
- Restriction site search
- Primer design utilities
- Regular expression-based searching

#### @bioscript/seq-quality
- FASTQ quality control
- Adapter trimming
- Quality filtering
- Read quality reports

#### @bioscript/seq-format
- Format converters (FASTA ↔ GenBank ↔ EMBL)
- GFF/GTF parsers
- SAM/BAM support
- BED file handling

### CI/CD Standards (Future)

When adding GitHub Actions workflows:

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]

    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build packages
        run: npm run build
      
      - name: Run unit tests
        run: npm test
      
      - name: Run browser tests
        run: npm run test:browser
      
      - name: Check coverage
        run: npm run test:coverage
```

### Best Practices for GitHub Copilot

#### When Adding New Functions

1. **Determine package**: seq-stream (I/O), seq-translate (computation), or new package?
2. **Check dependencies**: Use Node.js built-ins or established libraries only
3. **Follow patterns**: Look at existing functions for consistency
4. **Add validation**: Type checking, sequence validation, parameter validation
5. **Write tests first**: Consider TDD approach for complex functions
6. **Document thoroughly**: JSDoc with examples and biological context
7. **Test performance**: Ensure efficient algorithms and memory usage
8. **Update CHANGELOG**: Immediately add entry to `[Unreleased]` section in package's CHANGELOG.md

#### When Adding New Features

1. **Consider dual environment**: Does this need Node.js and browser versions?
2. **Streaming vs synchronous**: Can this benefit from streaming?
3. **Parallel processing**: Would worker threads help (seq-translate pattern)?
4. **Browser limitations**: Memory constraints, API availability
5. **Backward compatibility**: Don't break existing APIs
6. **Update documentation**: README, JSDoc, examples
7. **Update CHANGELOG**: Immediately add entry to `[Unreleased]` section in package's CHANGELOG.md with Added/Changed/Fixed categories

### CHANGELOG Management

Each package maintains a CHANGELOG.md following [Keep a Changelog](https://keepachangelog.com/) format.

#### Workflow

**During Development:**
1. **Always add changes to `[Unreleased]` section first**
2. Use appropriate categories:
   - `### Added` - New features, functions, parameters
   - `### Changed` - Modifications to existing functionality
   - `### Deprecated` - Features marked for removal
   - `### Removed` - Deleted features or functions
   - `### Fixed` - Bug fixes, error corrections
   - `### Security` - Security vulnerability fixes

**Example - Adding to Unreleased:**
```markdown
## [Unreleased]

### Added
- `calculateGCContent()` function for GC percentage calculation
- Support for ambiguous IUPAC nucleotide codes

### Changed
- Improved performance of k-mer extraction by 2x

### Fixed
- Fixed off-by-one error in N50 calculation
```

**Before Publishing:**
1. **Move `[Unreleased]` content to new version section**
2. **Add version number and release date**
3. **Leave `[Unreleased]` section empty for next cycle**

**Example - On Release:**
```markdown
## [Unreleased]

## [0.3.0] - 2026-02-20

### Added
- `calculateGCContent()` function for GC percentage calculation
- Support for ambiguous IUPAC nucleotide codes

### Changed
- Improved performance of k-mer extraction by 2x

### Fixed
- Fixed off-by-one error in N50 calculation

## [0.2.0] - 2026-02-17
...
```

**CRITICAL:** Never publish without moving `[Unreleased]` to a versioned section. The CHANGELOG must reflect what's in each published version.

#### Code Review Focus

- **Bioinformatics correctness**: Validate against known biological standards
- **Performance**: Profile hot paths, check memory usage
- **Type safety**: Strict TypeScript with no `any`
- **Test coverage**: Comprehensive tests with >85% coverage
- **Documentation**: Clear JSDoc with biological context
- **Consistency**: Follows established patterns and conventions

### Environment & Dependencies

#### Development Environment

- **Node.js**: 16.0.0 or later required
- **TypeScript**: 5.x with strict mode
- **Jest**: 29.x for unit testing
- **Playwright**: 1.x for browser e2e tests
- **ESLint + Prettier**: For code quality

#### Key Dependencies

**Production:**
- Node.js built-ins only (fs, stream, zlib, worker_threads, crypto)

**Development:**
- TypeScript
- Jest + ts-jest
- @playwright/test
- esbuild (browser bundles)
- ESLint + Prettier

#### Build & Test Commands

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run unit tests
npm test

# Run browser e2e tests
npm run test:browser

# Run all tests
npm run test:all

# Check coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Publish packages
npm run publish:all
```

---

This document serves as a comprehensive guide for maintaining code quality, consistency, and best practices in the bioscript project. Update this document when adding new packages, establishing new patterns, or changing standards.
