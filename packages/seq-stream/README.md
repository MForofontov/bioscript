# @bioscript/seq-stream

[![npm version](https://badge.fury.io/js/%40bioscript%2Fseq-stream.svg)](https://www.npmjs.com/package/@bioscript/seq-stream)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

High-performance streaming parser and writer for FASTA and FASTQ bioinformatics file formats. Designed for low-memory processing of huge sequence files with support for gzip compression, quality score conversion, and comprehensive statistics.

## Features

✨ **Streaming Design** - Process gigabyte-sized files with minimal memory footprint  
📦 **FASTA & FASTQ Support** - Parse and write both major sequence formats  
🗜️ **Automatic Gzip Handling** - Transparently read/write .gz files  
🔄 **Quality Score Conversion** - Convert between Phred+33 and Phred+64 encodings  
📊 **Rich Statistics** - Calculate GC%, N-content, length distributions, mean quality  
🚀 **TypeScript Native** - Full type definitions included  
⚡ **Zero Dependencies** - Uses only Node.js built-in modules  
🌐 **Browser Support** - Web-compatible version for client-side processing (files up to ~1GB)

## Installation

```bash
npm install @bioscript/seq-stream
```

### Browser Usage

For browser environments, use the browser-specific module:

```html
<!-- For use in browsers -->
<script type="module">
  import { parseFastaBrowser, calculateStatsBrowser } from './dist/browser-index.js';

  // Process files from <input type="file">
  async function handleFile(file) {
    const records = parseFastaBrowser(file);
    const stats = await calculateStatsBrowser(records);
    console.log(stats);
  }
</script>
```

**Browser modules are modular** - import only what you need:

```typescript
// Specific imports for tree-shaking
import { parseFastaBrowser } from '@bioscript/seq-stream/browser';
import { calculateN50Browser } from '@bioscript/seq-stream/browser';
import { downloadFasta } from '@bioscript/seq-stream/browser';
```

**⚠️ Browser Limitations:** Browsers have memory limits (~2-4GB). For files >1GB, use Node.js version. For 300GB files, server-side processing is required.

**📂 File Structure:**

- `browser-fasta.ts` - FASTA parsing/writing
- `browser-fastq.ts` - FASTQ parsing/writing + quality conversion
- `browser-stats.ts` - Statistics calculation (GC%, N50/L50)
- `browser-download.ts` - File download utilities
- `browser-index.ts` - Unified exports

## Quick Start

### Parse a FASTA file

```typescript
import { createFastaParser } from '@bioscript/seq-stream';

const parser = createFastaParser('sequences.fasta');

parser.on('data', (record) => {
  console.log(`${record.id}: ${record.sequence.length}bp`);
});

await new Promise((resolve) => parser.on('end', resolve));
```

### Parse a FASTQ file and calculate statistics

```typescript
import { createFastqParser, StatsCalculator, QualityEncoding } from '@bioscript/seq-stream';
import { pipeline } from 'stream/promises';
import { PassThrough } from 'stream';

const parser = createFastqParser('reads.fastq.gz'); // Auto-handles gzip
const stats = new StatsCalculator(QualityEncoding.Phred33);

await pipeline(parser, stats, new PassThrough({ objectMode: true }));

const results = stats.getStats();
console.log('Total reads:', results.totalSequences);
console.log('GC content:', results.gcContent.toFixed(2) + '%');
console.log('Mean quality:', results.meanQuality?.toFixed(2));
```

### Convert quality encoding from Phred+64 to Phred+33

```typescript
import {
  createFastqParser,
  createFastqWriter,
  QualityConverter,
  QualityEncoding,
} from '@bioscript/seq-stream';
import { pipeline } from 'stream/promises';

const parser = createFastqParser('old_illumina.fastq');
const converter = new QualityConverter(QualityEncoding.Phred64, QualityEncoding.Phred33);
const writer = createFastqWriter('converted.fastq');

await pipeline(parser, converter, writer);
```

### Filter sequences by length and quality

```typescript
import {
  createFastqParser,
  createFastqWriter,
  LengthFilter,
  QualityFilter,
} from '@bioscript/seq-stream';
import { pipeline } from 'stream/promises';

const parser = createFastqParser('reads.fastq');
const lengthFilter = new LengthFilter(100, 500); // Keep 100-500bp
const qualityFilter = new QualityFilter(20); // Keep mean Q >= 20
const writer = createFastqWriter('filtered.fastq');

await pipeline(parser, lengthFilter, qualityFilter, writer);
```

## API Reference

### FASTA

#### `createFastaParser(filePath: string)`

Create a streaming parser for FASTA files. Auto-detects and handles `.gz` files.

#### `createFastaWriter(filePath: string, lineWidth?: number)`

Create a streaming writer for FASTA files. Auto-detects and handles `.gz` files.

- `lineWidth`: Number of bases per line (default: 80)

#### `FastaParser`

Transform stream that emits `FastaRecord` objects.

#### `FastaWriter`

Transform stream that accepts `FastaRecord` objects and outputs FASTA format.

#### `FastaRecord`

```typescript
interface FastaRecord {
  id: string;
  description?: string;
  sequence: string;
}
```

### FASTQ

#### `createFastqParser(filePath: string)`

Create a streaming parser for FASTQ files. Auto-detects and handles `.gz` files.

#### `createFastqWriter(filePath: string)`

Create a streaming writer for FASTQ files. Auto-detects and handles `.gz` files.

#### `FastqParser`

Transform stream that emits `FastqRecord` objects.

#### `FastqWriter`

Transform stream that accepts `FastqRecord` objects and outputs FASTQ format.

#### `FastqRecord`

```typescript
interface FastqRecord {
  id: string;
  description?: string;
  sequence: string;
  quality: string;
}
```

### Quality Scores

#### `QualityEncoding`

```typescript
enum QualityEncoding {
  Phred33 = 33, // Sanger, Illumina 1.8+
  Phred64 = 64, // Illumina 1.3-1.7
}
```

#### `QualityConverter`

Transform stream that converts quality encoding between Phred+33 and Phred+64.

```typescript
new QualityConverter(fromEncoding: QualityEncoding, toEncoding: QualityEncoding)
```

#### `convertQualityScores(quality: string, from: QualityEncoding, to: QualityEncoding): string`

Convert quality string between encodings.

#### `decodeQualityScores(quality: string, encoding: QualityEncoding): number[]`

Decode quality string to numeric scores.

#### `encodeQualityScores(scores: number[], encoding: QualityEncoding): string`

Encode numeric scores to quality string.

### Statistics

#### `StatsCalculator`

Transform stream that calculates comprehensive sequence statistics.

```typescript
new StatsCalculator(qualityEncoding?: QualityEncoding)

const stats = calculator.getStats();
```

#### `SequenceStats`

```typescript
interface SequenceStats {
  totalSequences: number;
  totalBases: number;
  lengthDistribution: Map<number, number>;
  gcContent: number;
  nContent: number;
  minLength: number;
  maxLength: number;
  meanLength: number;
  medianLength: number;
  meanQuality?: number; // Only for FASTQ
}
```

#### `calculateN50(lengths: number[]): number`

Calculate N50 assembly metric.

#### `calculateL50(lengths: number[]): number`

Calculate L50 assembly metric.

### Filters

#### `LengthFilter`

Filter sequences by length range.

```typescript
new LengthFilter(minLength?: number, maxLength?: number)
```

#### `QualityFilter`

Filter FASTQ sequences by minimum mean quality score.

```typescript
new QualityFilter(minMeanQuality: number, qualityEncoding?: QualityEncoding)
```

## Advanced Usage

### Chain multiple transformations

```typescript
import {
  createFastqParser,
  createFastqWriter,
  QualityConverter,
  LengthFilter,
  StatsCalculator,
  QualityEncoding,
} from '@bioscript/seq-stream';
import { pipeline } from 'stream/promises';

const parser = createFastqParser('input.fastq.gz');
const converter = new QualityConverter(QualityEncoding.Phred64, QualityEncoding.Phred33);
const lengthFilter = new LengthFilter(50, 1000);
const stats = new StatsCalculator(QualityEncoding.Phred33);
const writer = createFastqWriter('output.fastq.gz');

// Chain operations: read -> convert -> filter -> stats -> write
await pipeline(parser, converter, lengthFilter, stats, writer);

console.log('Processing complete:', stats.getStats());
```

### Process records manually

```typescript
import { FastqParser } from '@bioscript/seq-stream';
import { createReadStream } from 'fs';

const parser = new FastqParser();
createReadStream('reads.fastq').pipe(parser);

for await (const record of parser) {
  // Custom processing
  if (record.sequence.includes('AAAA')) {
    console.log('Found poly-A:', record.id);
  }
}
```

## Performance

Designed for low-memory streaming processing:

- Processes files in chunks, not loading entire file into memory
- Handles multi-gigabyte files efficiently (tested with 1.5GB+ files)
- Automatic backpressure management via Node.js streams
- Minimal allocations and garbage collection
- Constant ~50MB memory usage regardless of file size

### Large File Example

Process a 1.5GB FASTA file:

```bash
# Generate a 1.5GB test file
npx tsx examples/generate-1.5gb-test.ts

# Process it with constant memory usage
npx tsx examples/process-1.5gb-file.ts test-1.5gb.fasta
```

## Testing

```bash
# Run Node.js tests (Jest) - 21 tests
npm test

# Run browser tests (Playwright) - 14 tests
npm run test:browser

# Run all tests - 35 total
npm run test:all

# Watch mode
npm run test:watch
```

**Test Coverage:**

- ✅ **Node.js Streaming**: 21 tests for FASTA/FASTQ parsing, writing, and statistics
- ✅ **Browser Web Streams**: 14 tests including 10MB file processing
- ✅ **Total**: 35 tests across both environments

## License

MIT © 2026 [Mykyta Forofontov](https://github.com/MForofontov)

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

## Related Projects

- [bionode](https://github.com/bionode/bionode) - Modular bioinformatics toolkit
- [biotk](https://github.com/biotk) - Bioinformatics toolkit for Node.js
- [bioseq](https://github.com/4ment/bioseq) - Python bioinformatics library

## Citation

If you use this software in your research, please cite:

```
@bioscript/seq-stream: High-performance streaming parser for bioinformatics sequence formats
```
