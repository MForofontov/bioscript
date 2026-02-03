# @bioscript/seq-utils

Core sequence manipulation utilities for DNA/RNA operations.

## Features

✨ **DNA/RNA Conversion** - Bidirectional DNA ↔ RNA conversion  
🧬 **Complement** - Calculate complement sequences for DNA and RNA  
🔄 **Reverse Complement** - Generate reverse complement sequences  
⚡ **High Performance** - Optimized for processing large sequences  
📦 **Zero Dependencies** - Pure TypeScript with no external dependencies  
🔒 **Type Safe** - Full TypeScript support with comprehensive types

## Installation

```bash
npm install @bioscript/seq-utils
```

## Quick Start

```typescript
import { dnaToRna, complement, reverseComplement } from '@bioscript/seq-utils';

// DNA to RNA conversion
const rna = dnaToRna('ATGC');
console.log(rna); // 'AUGC'

// Get complement
const comp = complement('ATGC');
console.log(comp); // 'TACG'

// Get reverse complement
const revComp = reverseComplement('ATGC');
console.log(revComp); // 'GCAT'
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

## Features & Capabilities

- **Case Preservation**: All functions preserve the case of input sequences
- **Auto-Detection**: `complement` automatically detects DNA vs RNA sequences
- **N Character Support**: Handles ambiguous bases (N) appropriately
- **Long Sequences**: Efficiently processes sequences of any length
- **Unknown Characters**: Preserves unknown characters in sequences

## Performance

- **Conversion**: O(n) time complexity, processes millions of bases per second
- **Complement**: O(n) time complexity with minimal allocations
- **Memory**: O(n) space complexity, proportional to input size

## Related Packages

- **[@bioscript/seq-translate](../seq-translate)** - Sequence translation with all NCBI genetic codes
- **[@bioscript/seq-stream](../seq-stream)** - Streaming FASTA/FASTQ parsing

## License

MIT © 2026 Mykyta Forofontov
