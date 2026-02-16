# @bioscript/seq-align

Sequence alignment algorithms for bioinformatics.

## Features

- **Global Alignment** - Needleman-Wunsch for end-to-end alignment
- **Local Alignment** - Smith-Waterman for conserved regions
- **Semi-Global** - End-gap-free alignment for primers/probes
- **Overlap Alignment** - Suffix-prefix matching for assembly
- **Banded Alignment** - Fast alignment for >90% identity
- **Hirschberg** - Memory-efficient O(min(m,n)) space
- **13 Scoring Matrices** - BLOSUM, PAM, DNA matrices
- **Type Safe** - Full TypeScript support
- **Zero Dependencies** - Pure TypeScript

## Installation

```bash
npm install @bioscript/seq-align
```

## Quick Start

```typescript
import { needlemanWunsch, smithWaterman } from '@bioscript/seq-align';

// Global alignment
const global = needlemanWunsch('HEAGAWGHEE', 'PAWHEAE', {
  matrix: 'BLOSUM62',
  gapOpen: -10,
  gapExtend: -1,
});

console.log(global.alignedSeq1);     // 'HEAGAWGHEE'
console.log(global.alignedSeq2);     // '--PAW-HEAE'
console.log(global.identityPercent); // 42.86%

// Local alignment
const local = smithWaterman('HEAGAWGHEEHEAGAWGHEE', 'PAWHEAE', {
  matrix: 'BLOSUM62',
});

console.log(local.alignedSeq1);  // Best matching region
console.log(local.startPos1);    // Start position
```

## API

### needlemanWunsch(seq1, seq2, options?)

Global alignment for complete sequences.

**Options:**
- `matrix` - Scoring matrix (default: 'BLOSUM62')
- `gapOpen` - Gap opening penalty (default: -10)
- `gapExtend` - Gap extension penalty (default: -1)

```typescript
const result = needlemanWunsch('ACGTACGT', 'ACGTAGCT', {
  matrix: 'DNA_SIMPLE',
  gapOpen: -5,
  gapExtend: -2,
});
```

### smithWaterman(seq1, seq2, options?)

Local alignment for finding best matching regions.

**Options:** Same as needlemanWunsch, plus:
- `minScore` - Minimum score threshold (default: 0)

```typescript
const result = smithWaterman('HEAGAWGHEE', 'AWGHE', {
  matrix: 'BLOSUM62',
  minScore: 20,
});
```

### semiGlobal(seq1, seq2, options?)

Semi-global alignment with free end gaps.

```typescript
const result = semiGlobal('ATCGATCG', 'GGGGGATCGATCGAAAA', {
  matrix: 'DNA_SIMPLE',
});
```

### overlapAlign(seq1, seq2, options?)

Overlap alignment for sequence assembly.

```typescript
const result = overlapAlign('ACGTACGTACGT', 'ACGTACGTGGGG', {
  matrix: 'DNA_SIMPLE',
});
```

### bandedAlign(seq1, seq2, options?)

Fast banded alignment for closely related sequences.

**Options:** Same as needlemanWunsch, plus:
- `bandwidth` - Half-width of diagonal band (default: 10)

```typescript
const result = bandedAlign(seq1, seq2, {
  matrix: 'DNA_SIMPLE',
  bandwidth: 10,
});
```

### hirschberg(seq1, seq2, options?)

Memory-efficient global alignment for very long sequences.

```typescript
const result = hirschberg(longSeq1, longSeq2, {
  matrix: 'DNA_SIMPLE',
});
```

## Scoring Matrices

**BLOSUM:** BLOSUM45, BLOSUM50, BLOSUM62, BLOSUM80, BLOSUM90

**PAM:** PAM30, PAM70, PAM120, PAM250

**DNA:** DNA_SIMPLE, DNA_FULL

```typescript
import { getMatrix, BLOSUM62 } from '@bioscript/seq-align';

const matrix = getMatrix('BLOSUM62');
const score = BLOSUM62.A.R; // -1
```

## Return Type

All functions return `AlignmentResult`:

```typescript
interface AlignmentResult {
  alignedSeq1: string;
  alignedSeq2: string;
  score: number;
  startPos1: number;
  startPos2: number;
  endPos1: number;
  endPos2: number;
  identity: number;
  identityPercent: number;
  alignmentLength: number;
}
```

## License

MIT © 2026 Mykyta Forofontov
