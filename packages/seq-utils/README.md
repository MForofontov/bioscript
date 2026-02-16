# @bioscript/seq-utils

Core sequence manipulation utilities for DNA/RNA operations including k-mer analysis, minimizers, and De Bruijn graphs.

## Features

✨ **DNA/RNA Conversion** - Bidirectional DNA ↔ RNA conversion  
🧬 **Complement** - Calculate complement sequences for DNA and RNA  
🔄 **Reverse Complement** - Generate reverse complement sequences  
🔬 **K-mer Analysis** - Extract, count, and analyze k-mers with canonical support  
⚡ **Rolling Hash** - Efficient k-mer hashing for large k values  
🎯 **Super-k-mers** - Maximal k-mer compression for storage optimization  
🔀 **Syncmers** - Evenly distributed sequence sketching  
📊 **Minimizers** - Efficient sequence sketching for similarity detection  
🕸️ **De Bruijn Graphs** - Optimized graph-based assembly with O(1) edge lookups  
✅ **Sequence Validation** - Optional strict mode for nucleotide validation  
⚡ **High Performance** - Optimized algorithms with reverse edge indexing  
📦 **Zero Dependencies** - Pure TypeScript with no external dependencies  
🔒 **Type Safe** - Full TypeScript support with comprehensive types

## Installation

```bash
npm install @bioscript/seq-utils
```

## Quick Start

```typescript
import { 
  dnaToRna, 
  complement, 
  reverseComplement,
  getKmers,
  countKmers,
  getMinimizers,
  buildDeBruijnGraph
} from '@bioscript/seq-utils';

// DNA to RNA conversion
const rna = dnaToRna('ATGC');
console.log(rna); // 'AUGC'

// Get complement
const comp = complement('ATGC');
console.log(comp); // 'TACG'

// Get reverse complement
const revComp = reverseComplement('ATGC');
console.log(revComp); // 'GCAT'

// Extract k-mers
const kmers = getKmers('ATCGATCG', 3);
console.log(kmers); // ['ATC', 'TCG', 'CGA', 'GAT', 'ATC', 'TCG']

// Count k-mers
const counts = countKmers('ATCGATCG', 3);
console.log(counts.get('ATC')); // 2

// Get minimizers for sequence sketching
const minimizers = getMinimizers('ATCGATCGATCG', 3, 4);
minimizers.forEach(m => console.log(`${m.kmer} at position ${m.position}`));

// Build De Bruijn graph for assembly
const graph = buildDeBruijnGraph(['ATCGATCG', 'TCGATCGA'], 4);
console.log(`Graph has ${graph.nodes.size} nodes`);
```

## API Documentation

### dnaToRna(sequence)

Convert DNA sequence to RNA by replacing T with U.

**Parameters:**
- `sequence` (string): DNA sequence to convert

**Returns:** RNA sequence (string)

**Example:**
```typescript
dnaToRna('ATGC'); // 'AUGC'
dnaToRna('atgc'); // 'augc' (preserves case)
```

### rnaToDna(sequence)

Convert RNA sequence to DNA by replacing U with T.

**Parameters:**
- `sequence` (string): RNA sequence to convert

**Returns:** DNA sequence (string)

**Example:**
```typescript
rnaToDna('AUGC'); // 'ATGC'
rnaToDna('augc'); // 'atgc' (preserves case)
```

### complement(sequence)

Calculate the complement of a nucleotide sequence. Automatically detects DNA or RNA based on sequence content.

**Parameters:**
- `sequence` (string): DNA or RNA sequence

**Returns:** Complement sequence (string)

**Example:**
```typescript
// DNA: A↔T, G↔C
complement('ATGC'); // 'TACG'

// RNA: A↔U, G↔C
complement('AUGC'); // 'UACG'
```

### reverseComplement(sequence)

Calculate the reverse complement of a nucleotide sequence.

**Parameters:**
- `sequence` (string): DNA or RNA sequence

**Returns:** Reverse complement sequence (string)

**Example:**
```typescript
reverseComplement('ATGC'); // 'GCAT'
reverseComplement('AUGC'); // 'GCAU'
```

### K-mer Analysis

#### getKmers(sequence, k, options?)

Extract all k-mers from a sequence.

**Parameters:**
- `sequence` (string): DNA/RNA sequence
- `k` (number): K-mer length
- `options` (object, optional):
  - `canonical` (boolean): Use canonical k-mers (default: false)
  - `strict` (boolean): Validate sequence for ACGTUN characters (default: false)

**Returns:** Array of k-mer strings

**Example:**
```typescript
const kmers = getKmers('ATCGATCG', 3);
// Returns: ['ATC', 'TCG', 'CGA', 'GAT', 'ATC', 'TCG']

// With sequence validation
const validated = getKmers('ATCGATCG', 3, { strict: true });

// Invalid sequence throws error
getKmers('ATCXYZ', 3, { strict: true }); // Error: Invalid characters
// ['ATC', 'TCG', 'CGA', 'GAT', 'ATC', 'TCG']

// Canonical k-mers (lexicographically smaller of k-mer and reverse complement)
const canonical = getKmers('ATCG', 2, { canonical: true });
// ['AT', 'GA', 'CG'] (TC -> GA is canonical)
```

#### countKmers(sequence, k, options?)

Count k-mer occurrences.

**Parameters:**
- `sequence` (string): DNA/RNA sequence
- `k` (number): K-mer length
- `options` (object, optional):
  - `canonical` (boolean): Use canonical k-mers (default: false)

**Returns:** Map of k-mer to count

**Example:**
```typescript
const counts = countKmers('ATCGATCG', 3);
counts.get('ATC'); // 2
counts.get('TCG'); // 2
counts.get('CGA'); // 1
```

#### getKmerSpectrum(sequence, k, options?)

Calculate k-mer frequency spectrum (histogram of k-mer counts).

**Parameters:**
- `sequence` (string): DNA/RNA sequence
- `k` (number): K-mer length
- `options` (object, optional):
  - `canonical` (boolean): Use canonical k-mers (default: false)

**Returns:** Map of frequency to count

**Example:**
```typescript
const spectrum = getKmerSpectrum('ATCGATCG', 3);
spectrum.get(1); // Number of k-mers appearing once
spectrum.get(2); // Number of k-mers appearing twice
```

#### getUniqueKmers(sequence, k, options?)

Find k-mers appearing exactly once.

**Parameters:**
- `sequence` (string): DNA/RNA sequence
- `k` (number): K-mer length
- `options` (object, optional):
  - `canonical` (boolean): Use canonical k-mers (default: false)

**Returns:** Set of unique k-mer strings

**Example:**
```typescript
const unique = getUniqueKmers('ATCGATCG', 3);
// Set containing k-mers that appear exactly once
```

#### getKmerJaccard(seq1, seq2, k, options?)

Calculate Jaccard similarity between two sequences based on k-mers.

**Parameters:**
- `seq1` (string): First sequence
- `seq2` (string): Second sequence
- `k` (number): K-mer length
- `options` (object, optional):
  - `canonical` (boolean): Use canonical k-mers (default: false)

**Returns:** Jaccard similarity (0-1)

**Example:**
```typescript
const similarity = getKmerJaccard('ATCGATCG', 'ATCGATCG', 3);
// 1.0 (identical)

const partial = getKmerJaccard('ATCGATCG', 'ATCGGGCG', 3);
// 0.4 (40% k-mer overlap)
```

#### getKmersWithRollingHash(sequence, k, options?)

Extract k-mers using rolling hash (efficient for large k).

**Parameters:**
- `sequence` (string): DNA/RNA sequence
- `k` (number): K-mer length
- `options` (object, optional):
  - `canonical` (boolean): Use canonical k-mers (default: false)
  - `strict` (boolean): Validate sequence (default: false)

**Returns:** Map of k-mer to hash value

**Example:**
```typescript
const hashed = getKmersWithRollingHash('ATCGATCG', 5);
hashed.forEach((hash, kmer) => {
  console.log(`${kmer}: ${hash}`);
});
```

**Note:** Rolling hash is O(1) per k-mer after initial O(k) computation, much faster than string comparison for large k values.

#### getSuperKmers(sequence, k, options?)

Extract super-k-mers (maximal sequences of overlapping k-mers).

**Parameters:**
- `sequence` (string): DNA/RNA sequence
- `k` (number): K-mer length
- `options` (object, optional):
  - `canonical` (boolean): Use canonical k-mers (default: false)

**Returns:** Array of super-k-mer strings

**Example:**
```typescript
const superKmers = getSuperKmers('ATCGATCGATCG', 3);
// Returns longer sequences where k-mers overlap consecutively
```

**Note:** Super-k-mers reduce storage by grouping consecutive k-mers, useful for k-mer databases.

#### getSyncmers(sequence, k, s, options?)

Extract syncmers (synchronized k-mers using s-mers).

**Parameters:**
- `sequence` (string): DNA/RNA sequence
- `k` (number): K-mer length
- `s` (number): S-mer length (s < k)
- `options` (object, optional):
  - `canonical` (boolean): Use canonical k-mers (default: false)

**Returns:** Array of syncmer objects with `kmer` and `position`

**Example:**
```typescript
const syncmers = getSyncmers('ATCGATCGATCG', 5, 2);
syncmers.forEach(sm => {
  console.log(`${sm.kmer} at position ${sm.position}`);
});
```

**Note:** Syncmers provide more evenly distributed sampling than minimizers, reducing density variance.

### Minimizers

#### getMinimizers(sequence, k, w, options?)

Extract minimizers for sequence sketching.

**Parameters:**
- `sequence` (string): DNA/RNA sequence
- `k` (number): K-mer length (minimizer size)
- `w` (number): Window size (number of k-mers per window)
- `options` (object, optional):
  - `canonical` (boolean): Use canonical k-mers (default: false)

**Returns:** Array of `Minimizer` objects with `kmer` and `position`

**Example:**
```typescript
const minimizers = getMinimizers('ATCGATCGATCG', 3, 4);
minimizers.forEach(m => {
  console.log(`${m.kmer} at position ${m.position}`);
});
```

#### getHashMinimizers(sequence, k, w, options?)

Extract minimizers using hash-based selection (faster for large k).

**Parameters:**
- `sequence` (string): DNA/RNA sequence
- `k` (number): K-mer length
- `w` (number): Window size
- `options` (object, optional):
  - `canonical` (boolean): Use canonical k-mers (default: false)
  - `hashFunction` (function): Custom hash function (default: simple string hash)

**Returns:** Array of `Minimizer` objects with `kmer`, `position`, and `hash`

**Example:**
```typescript
const minimizers = getHashMinimizers('ATCGATCGATCG', 5, 10);
minimizers.forEach(m => {
  console.log(`${m.kmer} (hash: ${m.hash}) at ${m.position}`);
});
```

#### getMinimizerDensity(sequence, k, w, options?)

Calculate minimizer density (minimizers per base).

**Returns:** Density value (0-1)

**Example:**
```typescript
const density = getMinimizerDensity('ATCGATCGATCG', 3, 4);
console.log(`${(density * 100).toFixed(1)}% of sequence covered`);
```

#### getMinimizerJaccard(seq1, seq2, k, w, options?)

Compare two sequences using minimizer Jaccard similarity (faster than full k-mer Jaccard).

**Returns:** Jaccard similarity (0-1)

**Example:**
```typescript
const similarity = getMinimizerJaccard('ATCGATCG', 'ATCGGGCG', 3, 4);
console.log(`${(similarity * 100).toFixed(1)}% similar`);
```

### De Bruijn Graphs

#### buildDeBruijnGraph(sequences, k, options?)

Build De Bruijn graph from sequences with optimized reverse edge index for O(1) incoming edge lookups.

**Parameters:**
- `sequences` (string[]): Array of DNA/RNA sequences
- `k` (number): K-mer length
- `options` (object, optional):
  - `canonical` (boolean): Use canonical k-mers (default: false)
  - `minCoverage` (number): Minimum coverage to include k-mer (default: 1)

**Returns:** `DeBruijnGraph` object with forward and reverse edge indexes

**Example:**
```typescript
const sequences = ['ATCGATCG', 'TCGATCGA'];
const graph = buildDeBruijnGraph(sequences, 4);
console.log(`Graph has ${graph.nodes.size} nodes`);

// Filter low-coverage k-mers
const filtered = buildDeBruijnGraph(sequences, 4, { minCoverage: 2 });
```

**Note:** Graph includes reverse edge index for O(1) incoming edge queries, improving contig finding and tip removal performance.

#### findContigs(graph, options?)

Find contigs (unbranched paths) in De Bruijn graph.

**Parameters:**
- `graph` (DeBruijnGraph): De Bruijn graph
- `options` (object, optional):
  - `minLength` (number): Minimum contig length (default: k+1)

**Returns:** Array of contig sequences

**Example:**
```typescript
const graph = buildDeBruijnGraph(sequences, 4);
const contigs = findContigs(graph, { minLength: 10 });
contigs.forEach(c => console.log(`Contig: ${c}`));
```

#### getGraphStats(graph)

Calculate graph statistics.

**Returns:** Object with `nodeCount`, `edgeCount`, `avgCoverage`, `maxCoverage`, `branchingNodes`, `deadEnds`

**Example:**
```typescript
const stats = getGraphStats(graph);
console.log(`Nodes: ${stats.nodeCount}`);
console.log(`Avg coverage: ${stats.avgCoverage.toFixed(1)}`);
console.log(`Branching nodes: ${stats.branchingNodes}`);
```

#### removeTips(graph, maxTipLength)

Simplify graph by removing tips (dead-end branches).

**Parameters:**
- `graph` (DeBruijnGraph): Graph to modify (in place)
- `maxTipLength` (number): Maximum tip length to remove

**Returns:** Number of tips removed

**Example:**
```typescript
const removed = removeTips(graph, 10);
console.log(`Removed ${removed} tips`);
```

#### removeLowCoverageNodes(graph, minCoverage)

Remove low-coverage nodes (likely sequencing errors).

**Parameters:**
- `graph` (DeBruijnGraph): Graph to modify (in place)
- `minCoverage` (number): Minimum coverage threshold

**Returns:** Number of nodes removed

**Example:**
```typescript
const removed = removeLowCoverageNodes(graph, 3);
console.log(`Removed ${removed} low-coverage nodes`);
```

## Features & Capabilities

- **Case Preservation**: All functions preserve the case of input sequences
- **Auto-Detection**: `complement` automatically detects DNA vs RNA sequences
- **N Character Support**: Handles ambiguous bases (N) appropriately
- **Long Sequences**: Efficiently processes sequences of any length
- **Unknown Characters**: Preserves unknown characters in sequences
- **Canonical K-mers**: Support for treating k-mer and reverse complement as equivalent
- **Streaming-Ready**: K-mer functions designed for batch processing
- **Assembly Tools**: De Bruijn graph utilities for sequence assembly pipelines

## Performance

- **Conversion**: O(n) time complexity, processes millions of bases per second
- **Complement**: O(n) time complexity with minimal allocations
- **K-mer Extraction**: O(n) where n is sequence length
- **K-mer Counting**: O(n) with O(1) lookup using Map
- **Minimizers**: O(n * w) where w is window size
- **De Bruijn Graphs**: O(n * m) where n is number of sequences, m is average length
- **Memory**: O(n) space complexity, proportional to input size

## Use Cases

### K-mer Analysis
- **Genome size estimation**: Using k-mer spectrum analysis
- **Error correction**: Identifying low-frequency k-mers
- **Sequence similarity**: Fast similarity detection using Jaccard index
- **Repeat detection**: Finding repeated k-mers in sequences

### Minimizers
- **Read alignment**: Efficient seed finding for sequence alignment
- **Overlap detection**: Finding read overlaps in genome assembly
- **Sequence clustering**: Grouping similar sequences
- **Data compression**: Reducing sequence size while preserving similarity

### De Bruijn Graphs
- **Genome assembly**: De novo assembly from sequencing reads
- **Transcript assembly**: Reconstructing full-length transcripts
- **Error correction**: Graph-based cleaning of sequencing data
- **Variant detection**: Identifying structural variants

## Related Packages

- **[@bioscript/seq-translate](../seq-translate)** - Sequence translation with all NCBI genetic codes
- **[@bioscript/seq-stream](../seq-stream)** - Streaming FASTA/FASTQ parsing
- **[@bioscript/seq-format](../seq-format)** - Bioinformatics format parsers

## License

MIT © 2026 Mykyta Forofontov
