# @bioscript/seq-translate

Efficient sequence translation utilities supporting all NCBI genetic code tables with browser and Node.js support.

## Features

- ✨ **Universal**: Works in both Node.js and browsers
- 🚀 **Fast**: Optimized lookup tables for high-performance translation
- 🔄 **Parallel Processing**: Worker threads support for Node.js multiprocessing
- 📊 **All NCBI Tables**: Supports all 33 NCBI genetic code tables
- 🌊 **Streaming**: Browser streaming API for large sequences
- 🎯 **Multiple Frames**: Translate single or all 6 reading frames
- 🧬 **ORF Finding**: Identify Open Reading Frames with customizable options
- 💪 **TypeScript**: Full type safety with TypeScript support

## Installation

```bash
npm install @bioscript/seq-translate
```

## Usage

### Node.js - Basic Translation

```typescript
import { translateSequence, translateAllFrames } from '@bioscript/seq-translate';

// Simple translation
const protein = translateSequence('ATGGCCAAATAA', { table: 'standard' });
console.log(protein); // 'MAK*'

// All three forward reading frames
const frames = translateAllFrames('ATGGCCAAATAA');
console.log(frames); // ['MAK*', 'WPN', 'GQI']
```

### Node.js - Multiprocessing with Worker Threads

```typescript
import { translateWorker, TranslationPool } from '@bioscript/seq-translate';

// Translate multiple sequences in parallel
const sequences = ['ATGGCC', 'ATGTAA', 'ATGCCC'];
const results = await translateWorker(sequences, { 
  table: 'vertebrate_mitochondrial',
  allFrames: true 
});

results.forEach((seqResults, i) => {
  console.log(`Sequence ${i}:`);
  seqResults.forEach(r => {
    console.log(`  Frame ${r.frame}: ${r.sequence}`);
  });
});

// Use a worker pool for multiple batches
const pool = new TranslationPool(4); // 4 workers
await pool.initialize();

const batch1 = await pool.translate(sequences1, { table: 'standard' });
const batch2 = await pool.translate(sequences2, { table: 'yeast_mitochondrial' });

await pool.terminate();
```

### Browser - Client-side Translation

```typescript
import { translateBrowser } from '@bioscript/seq-translate/browser';

// Basic browser translation
const results = translateBrowser('ATGGCCAAA', { 
  table: 'standard',
  allFrames: true 
});

results.forEach(r => {
  console.log(`Frame ${r.frame}: ${r.sequence}`);
});
```

### Browser - Streaming Large Files

```typescript
import { translateBrowserStreaming } from '@bioscript/seq-translate/browser';

// Translate from file input
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

for await (const chunk of translateBrowserStreaming(file, { 
  table: 'standard',
  chunkSize: 10000 
})) {
  console.log(`Translated chunk: ${chunk.sequence.slice(0, 50)}...`);
  // Process chunk as it arrives
}
```

### Browser - Direct Script Tag

```html
<script src="node_modules/@bioscript/seq-translate/dist/bioseq-translate.bundle.js"></script>
<script>
  const protein = bioseqTranslate.translateSequence('ATGGCC', { table: 'standard' });
  console.log(protein); // 'MA'
</script>
```

### Using Different Genetic Code Tables

```typescript
import { translateSequence, tables } from '@bioscript/seq-translate';

// By NCBI table number
const result1 = translateSequence('ATGATG', { table: '2' }); // Vertebrate mitochondrial

// By name
const result2 = translateSequence('ATGATG', { table: 'yeast_mitochondrial' });

// Available tables
console.log(Object.keys(tables));
// ['1', '2', '3', ..., 'standard', 'vertebrate_mitochondrial', ...]
```

### Batch Translation

```typescript
import { translateBatch } from '@bioscript/seq-translate';

const sequences = ['ATGGCC', 'ATGTAA', 'ATGCCC'];
const proteins = translateBatch(sequences, { 
  table: 'standard',
  breakOnStop: true 
});

proteins.forEach((p, i) => {
  console.log(`Sequence ${i}: ${p}`);
});
```

### Advanced Options

```typescript
import { translateSequence, translateSixFrames } from '@bioscript/seq-translate';

// Custom stop symbol
const protein = translateSequence('ATGGCCTAA', {
  table: 'standard',
  stopSymbol: 'X',
  breakOnStop: false // Continue past stop codons
});

// All 6 reading frames (3 forward + 3 reverse)
const allFrames = translateSixFrames('ATGGCCAAA', {
  table: 'standard'
});
console.log(allFrames); // 6 translations
```

### Open Reading Frame (ORF) Finding

```typescript
import { findOrfs } from '@bioscript/seq-translate';

// Find all ORFs (start codon to stop codon)
const orfs = findOrfs('ATGGCCAAATAAGATGGGGTAGCCC', {
  minLength: 9,        // Minimum ORF length in bp
  allFrames: true,     // Search all 6 frames
  translate: true,     // Include protein translation
  table: 'standard'
});

orfs.forEach(orf => {
  console.log(`ORF at ${orf.start}-${orf.end} (frame ${orf.frame}, ${orf.strand} strand)`);
  console.log(`  Sequence: ${orf.sequence}`);
  console.log(`  Protein: ${orf.protein}`);
  console.log(`  Has stop: ${orf.hasStopCodon}`);
});

// Include partial ORFs (no stop codon)
const partialOrfs = findOrfs(sequence, {
  minLength: 75,
  includePartial: true  // Include ORFs without stop codon
});

// Use alternative start codons
const altOrfs = findOrfs(sequence, {
  startCodons: ['ATG', 'CTG', 'GTG'],  // Alternative starts
  minLength: 30
});
```

## API Reference

### Translation Functions

- **`translateSequence(seq, options)`** - Translate a single sequence
- **`translateAllFrames(seq, options)`** - Translate 3 forward frames
- **`translateSixFrames(seq, options)`** - Translate all 6 frames
- **`translateBatch(sequences, options)`** - Batch translate multiple sequences

### ORF Finding

- **`findOrfs(sequence, options)`** - Find Open Reading Frames in sequence
  - Returns: Array of `Orf` objects with position, frame, strand, sequence, and optional protein
  - Options: `minLength`, `includePartial`, `allFrames`, `translate`, `startCodons`

### Worker Functions (Node.js only)

- **`translateWorker(sequences, options)`** - Parallel translation with workers
- **`translateWorkerChunked(sequence, options)`** - Chunk large sequence for parallel processing
- **`TranslationPool`** - Reusable worker pool for multiple batches

### Browser Functions

- **`translateBrowser(sequence, options)`** - Browser-optimized translation
- **`translateBrowserStreaming(file, options)`** - Stream large files
- **`translateBrowserBatch(sequences, options)`** - Batch browser translation

### Utility Functions

- **`dnaToRna(seq)`** - Convert DNA to RNA (T → U)
- **`rnaToDna(seq)`** - Convert RNA to DNA (U → T)
- **`complement(seq)`** - Get complement sequence
- **`reverseComplement(seq)`** - Get reverse complement

### Genetic Code Tables

All NCBI genetic code tables (1-33) are supported:
- Standard (1)
- Vertebrate Mitochondrial (2)
- Yeast Mitochondrial (3)
- Mold, Protozoan, and Coelenterate Mitochondrial (4)
- Invertebrate Mitochondrial (5)
- And 28 more specialized tables...

See [NCBI Genetic Codes](https://www.ncbi.nlm.nih.gov/Taxonomy/Utils/wprintgc.cgi) for full details.

## Performance

- **Optimized Lookups**: Map-based O(1) codon lookups
- **Batch Processing**: Reuse lookup tables across sequences
- **Worker Threads**: Distribute work across CPU cores
- **Streaming**: Process large files without loading into memory
- **Tree-shakeable**: Only bundle what you use

## TypeScript Support

Full TypeScript definitions included:

```typescript
interface TranslationOptions {
  table?: string;
  stopSymbol?: string;
  breakOnStop?: boolean;
}

interface TranslationResult {
  sequence: string;
  frame: number;
  isReverse: boolean;
  sourceLength: number;
}

interface Orf {
  sequence: string;
  start: number;
  end: number;
  frame: number;
  strand: '+' | '-';
  length: number;
  protein?: string;
  hasStopCodon: boolean;
}

interface OrfOptions extends TranslationOptions {
  minLength?: number;
  includePartial?: boolean;
  allFrames?: boolean;
  translate?: boolean;
  startCodons?: string[];
}
```

## Scripts

- `npm run build` — Compile TypeScript
- `npm run build:browser` — Build browser bundle
- `npm run build:all` — Build both Node.js and browser
- `npm test` — Run unit tests
- `npm run lint` — Lint code

## License

MIT

