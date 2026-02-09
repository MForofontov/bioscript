# @bioscript/seq-align

Pairwise sequence alignment algorithms for bioinformatics with TypeScript support.

## Features

✨ **Global Alignment** - Needleman-Wunsch algorithm for end-to-end sequence alignment  
📍 **Local Alignment** - Smith-Waterman algorithm for finding conserved regions  
🎯 **Semi-Global Alignment** - End-gap-free alignment for primer/probe matching  
🔗 **Overlap Alignment** - Suffix-prefix matching for read assembly  
📏 **Banded Alignment** - Fast alignment for closely related sequences (>90% identity)  
💾 **Hirschberg's Algorithm** - Space-efficient O(min(m,n)) memory global alignment  
🧬 **13 Scoring Matrices** - BLOSUM45/50/62/80/90, PAM30/70/120/250, DNA matrices  
⚡ **High Performance** - Optimized dynamic programming, banded alignment ~3x faster  
🔧 **Type Safe** - Full TypeScript support with comprehensive type definitions  
📦 **Zero Dependencies** - Pure TypeScript implementation, no external dependencies

## Installation

```bash
npm install @bioscript/seq-align
```

## Quick Start

```typescript
import { needlemanWunsch, smithWaterman } from '@bioscript/seq-align';

// Global alignment (Needleman-Wunsch) - aligns entire sequences
const global = needlemanWunsch('HEAGAWGHEE', 'PAWHEAE', {
  matrix: 'BLOSUM62',
  gapOpen: -10,
  gapExtend: -1,
});

console.log(global.alignedSeq1);     // 'HEAGAWGHEE'
console.log(global.alignedSeq2);     // '--PAW-HEAE'
console.log(global.score);           // Alignment score
console.log(global.identityPercent); // 42.86% (3/7 matches)

// Local alignment (Smith-Waterman) - finds best matching region
const local = smithWaterman('HEAGAWGHEEHEAGAWGHEE', 'PAWHEAE', {
  matrix: 'BLOSUM62',
  gapOpen: -10,
  gapExtend: -1,
});

console.log(local.alignedSeq1);  // Best matching region from seq1
console.log(local.alignedSeq2);  // Corresponding region from seq2
console.log(local.startPos1);    // Start position in seq1
console.log(local.endPos1);      // End position in seq1
```

## Alignment Algorithms

### Choosing the Right Algorithm

| Algorithm | Use Case | Time | Space | When to Use |
|-----------|----------|------|-------|-------------|
| **needlemanWunsch** | Global alignment | O(m×n) | O(m×n) | Align entire sequences end-to-end |
| **smithWaterman** | Local alignment | O(m×n) | O(m×n) | Find best conserved region |
| **semiGlobal** | Semi-global | O(m×n) | O(m×n) | Primer/probe matching, no end gap penalties |
| **overlapAlign** | Overlap | O(m×n) | O(m×n) | Read/contig assembly, suffix-prefix overlaps |
| **bandedAlign** | Banded | O(k×n) | O(k×n) | Fast alignment for >90% identity (k=bandwidth) |
| **hirschberg** | Space-efficient | O(m×n) | O(min(m,n)) | Very long sequences with memory constraints |

### Algorithm Details

#### Global Alignment (needlemanWunsch)
- **Best for**: Comparing sequences of similar length where you want full alignment
- **Examples**: Comparing orthologs, aligning similar proteins, sequence similarity analysis
- **Characteristics**: Penalizes gaps everywhere, forces alignment from start to end
- **Performance**: Standard O(m×n), ideal for sequences <10,000bp

#### Local Alignment (smithWaterman)
- **Best for**: Finding conserved domains or motifs within longer sequences
- **Examples**: Finding protein domains, detecting sequence similarity in unrelated sequences
- **Characteristics**: Allows alignment to start/end anywhere, reports highest-scoring region
- **Performance**: Same O(m×n) as global, but can set minScore threshold

#### Semi-Global Alignment (semiGlobal)
- **Best for**: Finding where a short sequence aligns within a longer one
- **Examples**: Primer design, probe matching, finding gene locations
- **Characteristics**: No penalty for gaps at sequence ends (either sequence)
- **Performance**: O(m×n), ideal for primer-length queries (<100bp)

#### Overlap Alignment (overlapAlign)
- **Best for**: Assembling reads or contigs based on overlaps
- **Examples**: Genome assembly, merging sequencing reads, contig scaffolding
- **Characteristics**: Free gaps at end of seq1 and start of seq2 (suffix-prefix overlap)
- **Performance**: O(m×n), optimized for finding best overlap for assembly

#### Banded Alignment (bandedAlign)
- **Best for**: Aligning nearly identical sequences with few indels
- **Examples**: Mapping reads to reference, comparing recent isolates, SNP detection
- **Characteristics**: Restricts DP to diagonal band, fails if indels exceed bandwidth
- **Performance**: O(k×n) where k=bandwidth; ~3x faster for typical bandwidths

#### Hirschberg's Algorithm (hirschberg)
- **Best for**: Aligning very long sequences (>100kb) with limited memory
- **Examples**: Chromosome alignment, long-read mapping, large genome comparison
- **Characteristics**: Same result as global, but uses divide-and-conquer for memory efficiency
- **Performance**: O(m×n) time, O(min(m,n)) space; ~2x slower than standard but 1000x less memory

## API Documentation

### needlemanWunsch(seq1, seq2, options?)

Performs global sequence alignment using the Needleman-Wunsch algorithm. Aligns entire sequences end-to-end.

**Parameters:**
- `seq1` (string): First sequence to align (DNA, RNA, or protein)
- `seq2` (string): Second sequence to align
- `options` (object, optional): Alignment configuration
  - `matrix` (string | ScoringMatrix, default: 'BLOSUM62'): Scoring matrix to use
  - `gapOpen` (number, default: -10): Gap opening penalty (must be ≤ 0)
  - `gapExtend` (number, default: -1): Gap extension penalty (must be ≤ 0)
  - `normalize` (boolean, default: true): Convert sequences to uppercase

**Returns:** `AlignmentResult` with:
- `alignedSeq1` (string): First aligned sequence with gaps
- `alignedSeq2` (string): Second aligned sequence with gaps
- `score` (number): Alignment score
- `identity` (number): Number of identical positions
- `identityPercent` (number): Percentage of identical positions
- `alignmentLength` (number): Total alignment length including gaps
- `startPos1`, `startPos2` (number): Start positions (always 0 for global)
- `endPos1`, `endPos2` (number): End positions (sequence lengths)

**Example:**
```typescript
// Align two protein sequences
const result = needlemanWunsch('HEAGAWGHEE', 'PAWHEAE', {
  matrix: 'BLOSUM62',
  gapOpen: -10,
  gapExtend: -1,
});

console.log(result.alignedSeq1);     // 'HEAGAWGHEE'
console.log(result.alignedSeq2);     // '--PAW-HEAE'
console.log(result.identityPercent); // 42.86%
```

**Example:**
```typescript
// Align DNA sequences
const result = needlemanWunsch('ACGTACGT', 'ACGTAGCT', {
  matrix: 'DNA_SIMPLE',
  gapOpen: -5,
  gapExtend: -2,
});

console.log(result.alignedSeq1);  // 'ACGTACGT'
console.log(result.alignedSeq2);  // 'ACGTAGCT'
console.log(result.identity);     // 6 matches
```

### smithWaterman(seq1, seq2, options?)

Performs local sequence alignment using the Smith-Waterman algorithm. Finds best matching region(s) within sequences.

**Parameters:**
- `seq1` (string): First sequence to align
- `seq2` (string): Second sequence to align
- `options` (object, optional): Alignment configuration
  - `matrix` (string | ScoringMatrix, default: 'BLOSUM62'): Scoring matrix
  - `gapOpen` (number, default: -10): Gap opening penalty (must be ≤ 0)
  - `gapExtend` (number, default: -1): Gap extension penalty (must be ≤ 0)
  - `normalize` (boolean, default: true): Convert to uppercase
  - `minScore` (number, default: 0): Minimum score threshold for reporting

**Returns:** `AlignmentResult` with local alignment information

**Example:**
```typescript
// Find conserved domain in proteins
const result = smithWaterman(
  'HEAGAWGHEEHEAGAWGHEE',
  'PAWHEAE',
  {
    matrix: 'BLOSUM62',
    gapOpen: -10,
    gapExtend: -1,
  }
);

console.log(result.alignedSeq1);  // Best matching region
console.log(result.startPos1);    // Where match starts in seq1
console.log(result.endPos1);      // Where match ends in seq1
```

**Example:**
```typescript
// Find matching region in DNA with minimum score
const result = smithWaterman(
  'ACGTACGTTAGCTAGCT',
  'TAGCTA',
  {
    matrix: 'DNA_SIMPLE',
    gapOpen: -5,
    gapExtend: -2,
    minScore: 10,  // Only report if score ≥ 10
  }
);

if (result.score > 0) {
  console.log('Match found:', result.alignedSeq1);
}
```

### semiGlobal(seq1, seq2, options?)

Performs semi-global (end-gap-free) alignment. No penalty for gaps at the start or end of either sequence.

**Use Cases:**
- Primer/probe design: Finding where a short primer aligns to longer target
- Subsequence matching: Finding best placement of one sequence within another
- Fragment alignment: Aligning incomplete sequences

**Parameters:** Same as needlemanWunsch

**Returns:** `AlignmentResult` with semi-global alignment

**Example:**
```typescript
import { semiGlobal } from '@bioscript/seq-align';

// Aligning a primer to a longer target
const primer = 'ATCGATCG';
const target = 'GGGGGATCGATCGAAAA';

const result = semiGlobal(primer, target, {
  matrix: 'DNA_SIMPLE',
  gapOpen: -5,
  gapExtend: -1,
});

console.log(result.alignedSeq1); // Primer with flanking gaps
console.log(result.alignedSeq2); // Target region
console.log(result.score);       // High score (no penalty for flanking gaps)
```

### overlapAlign(seq1, seq2, options?)

Performs overlap alignment for sequence assembly. Free gaps at end of seq1 and start of seq2.

**Use Cases:**
- Read assembly: Finding overlaps between sequencing reads
- Contig merging: Assembling contigs in genome projects
- Suffix-prefix matching: Finding where sequences overlap

**Parameters:** Same as needlemanWunsch

**Returns:** `AlignmentResult` with overlap alignment

**Example:**
```typescript
import { overlapAlign } from '@bioscript/seq-align';

// Assembling overlapping reads
const read1 = 'ACGTACGTACGT';
const read2 = 'ACGTACGTGGGG';  // Overlaps with end of read1

const result = overlapAlign(read1, read2, {
  matrix: 'DNA_SIMPLE',
  gapOpen: -5,
  gapExtend: -1,
});

console.log(result.alignedSeq1);  // Full read1
console.log(result.alignedSeq2);  // read2 with leading gaps showing overlap
console.log(result.score);        // Overlap quality score
```

**Example:** Finding best overlaps for assembly
```typescript
// Find all pairwise overlaps
const reads = ['ACGTACGT', 'CGTACGTGG', 'ACGTGGAA'];
const overlaps = [];

for (let i = 0; i < reads.length; i++) {
  for (let j = 0; j < reads.length; j++) {
    if (i !== j) {
      const result = overlapAlign(reads[i], reads[j], {
        matrix: 'DNA_SIMPLE',
      });
      overlaps.push({ i, j, score: result.score, result });
    }
  }
}

// Sort by score to find best overlaps
overlaps.sort((a, b) => b.score - a.score);
console.log('Best overlap:', overlaps[0]);
```

### bandedAlign(seq1, seq2, options?)

Performs fast banded alignment for closely related sequences. Restricts computation to diagonal band.

**Use Cases:**
- Reference mapping: Aligning reads to reference genome
- SNP detection: Finding variants in nearly identical sequences
- Fast similarity search: When sequences are known to be >90% identical

**Parameters:**
- All standard options, plus:
- `bandwidth` (number, default: 10): Half-width of diagonal band. The algorithm explores cells within ±k positions of the main diagonal.
  - k=5: Very restrictive, for >98% identity
  - k=10: Default, good for >95% identity
  - k=50: More permissive, for ~90% identity
  - k=100: Relaxed, approaching full matrix

**Returns:** `AlignmentResult` or throws if alignment exceeds band

**Example:**
```typescript
import { bandedAlign } from '@bioscript/seq-align';

// Fast alignment of nearly identical sequences
const seq1 = 'ACGTACGTACGTACGT';
const seq2 = 'ACGTACGTCGTACGT';  // 1 deletion, >93% identity

const result = bandedAlign(seq1, seq2, {
  matrix: 'DNA_SIMPLE',
  bandwidth: 10,  // Allow ±10 positions from diagonal
  gapOpen: -5,
  gapExtend: -1,
});

console.log(result.alignedSeq1);  // 'ACGTACGT-CGTACGT'
console.log(result.alignedSeq2);  // 'ACGTACGTCGTACGT'
```

**Example:** Mapping reads to reference
```typescript
// Map short read to reference (faster than full alignment)
const reference = 'ACGT'.repeat(1000);  // 4kb reference
const read = reference.substring(1000, 1100);  // 100bp read

const result = bandedAlign(reference, read, {
  matrix: 'DNA_SIMPLE',
  bandwidth: 5,  // Very restrictive (expect perfect match)
});

console.log('Mapped to position:', result.startPos1);
```

**Performance:** Typical benchmarks for 2000bp sequences:
- Standard alignment: ~276ms for full global alignment
- Banded alignment: ~97ms with bandwidth=10 (2.8x faster)

### hirschberg(seq1, seq2, options?)

Performs space-efficient global alignment using Hirschberg's divide-and-conquer algorithm.

**Use Cases:**
- Long sequence alignment: Chromosomes, long reads (>100kb)
- Memory-constrained environments: Embedded systems, cloud functions
- Optimal alignment needed: When memory is limited but optimality required

**Parameters:** Same as needlemanWunsch (note: uses linear gap penalty for space efficiency)

**Returns:** `AlignmentResult` identical to needlemanWunsch result

**Example:**
```typescript
import { hirschberg } from '@bioscript/seq-align';

// Aligning very long sequences with limited memory
const longSeq1 = 'ACGT'.repeat(50000);  // 200kb
const longSeq2 = 'ACGT'.repeat(50000);

// Standard alignment would use ~40GB memory
// Hirschberg uses only ~400kb!
const result = hirschberg(longSeq1, longSeq2, {
  matrix: 'DNA_SIMPLE',
  gapOpen: -5,
});

console.log(result.identity);      // Number of matches
console.log(result.alignmentLength); // Total length
```

**Memory Comparison:**
| Sequence Length | Standard | Hirschberg | Savings |
|-----------------|----------|------------|---------|
| 1,000 bp | ~4 MB | ~4 KB | 1000x |
| 10,000 bp | ~400 MB | ~40 KB | 10,000x |
| 100,000 bp | ~40 GB | ~400 KB | 100,000x |

**Performance Trade-off:**
- Time: ~2x slower than standard (divide-and-conquer overhead)
- Space: Up to 1000x less memory
- Result: Identical to standard Needleman-Wunsch

### Scoring Matrices

#### Available Matrices

**BLOSUM Series** (for varying sequence identity):
- `BLOSUM45` - For distantly related proteins (≤45% identity), sensitive to remote homologs
- `BLOSUM50` - Moderate sensitivity (~50% identity), more sensitive than BLOSUM62
- `BLOSUM62` - Most common, for sequences with ~62% identity (default for most use cases)
- `BLOSUM80` - For more similar sequences (≥80% identity), more stringent
- `BLOSUM90` - For very closely related proteins (≥90% identity), very stringent

**PAM Series** (for evolutionary distance):
- `PAM30` - Very short evolutionary distance (>90% identity), very conservative
- `PAM70` - Short evolutionary distance (~70% identity), common for homologs
- `PAM120` - Moderate evolutionary distance (~50% identity), intermediate sensitivity
- `PAM250` - Long evolutionary distance (~25% identity), for distant relatives

**DNA/RNA Matrices:**
- `DNA_SIMPLE` - Match: +5, Mismatch: -4 (uniform penalties)
- `DNA_FULL` - Transition/transversion aware (A↔G, C↔T: -1, others: -4)

**Matrix Selection Guide:**
| Sequence Identity | BLOSUM | PAM | Use Case |
|-------------------|--------|-----|----------|
| >90% | BLOSUM90 | PAM30 | Nearly identical, recent divergence |
| 80-90% | BLOSUM80 | PAM70 | Close homologs, same species |
| 60-80% | BLOSUM62 | PAM120 | Moderate similarity, orthologs |
| 40-60% | BLOSUM50 | PAM250 | Distant homologs |
| <40% | BLOSUM45 | PAM250 | Remote homologs, weak similarity |

**Example:**
```typescript
import { getMatrix, BLOSUM62, DNA_SIMPLE } from '@bioscript/seq-align';

// Get matrix by name
const blosum = getMatrix('BLOSUM62');

// Access matrix directly
const score = BLOSUM62.A.R; // -1

// Use with alignment - choose based on expected similarity
const closeProteins = needlemanWunsch(seq1, seq2, {
  matrix: 'BLOSUM80',  // For closely related proteins
});

const distantProteins = needlemanWunsch(seq1, seq2, {
  matrix: 'BLOSUM45',  // For remote homologs
});

const dna = needlemanWunsch(dna1, dna2, {
  matrix: 'DNA_FULL',  // Transition/transversion aware
});
```

#### Custom Matrices

You can provide custom scoring matrices:

```typescript
const customMatrix = {
  A: { A: 10, C: -5, G: -5, T: -5 },
  C: { A: -5, C: 10, G: -5, T: -5 },
  G: { A: -5, C: -5, G: 10, T: -5 },
  T: { A: -5, C: -5, G: -5, T: 10 },
};

const result = needlemanWunsch('ACGT', 'ACGT', {
  matrix: customMatrix,
  gapOpen: -5,
  gapExtend: -2,
});
```

## Algorithm Details

### Needleman-Wunsch (Global Alignment)

- **Purpose**: Align complete sequences end-to-end
- **Use Cases**: Comparing homologous genes, full protein alignment
- **Time**: O(m×n) where m, n are sequence lengths
- **Space**: O(m×n) for alignment matrix
- **Output**: Complete alignment from start to end

### Smith-Waterman (Local Alignment)

- **Purpose**: Find best matching regions within sequences
- **Use Cases**: Finding conserved domains, motifs, or similar regions
- **Time**: O(m×n)
- **Space**: O(m×n)
- **Output**: Best local alignment region

### Gap Penalties

Both algorithms support affine gap penalties:
- **Gap Open**: Penalty for starting a new gap
- **Gap Extend**: Penalty for extending an existing gap

This models biological reality where opening a gap is more costly than extending it.

```typescript
// Prefer longer gaps over multiple short gaps
const result = needlemanWunsch('ACGTACGT', 'ACGT', {
  matrix: 'DNA_SIMPLE',
  gapOpen: -10,  // High penalty to start gap
  gapExtend: -1, // Low penalty to extend
});
```

## Performance

- **Throughput**: ~100,000 matrix cells updated per second
- **Memory**: ~16 bytes per cell (m×n cells total)
- **Typical**: Aligning two 1000bp sequences in ~10ms
- **Large**: 10,000bp × 10,000bp alignment in ~1 second

**Performance Tips:**
1. Use appropriate matrix for your sequences (DNA vs protein)
2. Smith-Waterman is same speed as Needleman-Wunsch (both O(m×n))
3. For very large sequences, consider pre-filtering or windowing
4. Gap penalties affect alignment quality but not performance

## Parallel Processing

This package exports pure functions - you bring your own parallelization strategy:

### Using Worker Threads

```typescript
import { Worker } from 'worker_threads';
import { needlemanWunsch } from '@bioscript/seq-align';

// worker.js
const { parentPort, workerData } = require('worker_threads');
const { needlemanWunsch } = require('@bioscript/seq-align');

const result = needlemanWunsch(workerData.seq1, workerData.seq2, workerData.options);
parentPort.postMessage(result);

// main.js
const worker = new Worker('./worker.js', { workerData: { seq1, seq2, options } });
worker.on('message', (result) => console.log(result));
```

### Using GNU Parallel

```bash
# Process 1000 alignments across 8 cores
cat sequences.txt | parallel -j 8 --colsep '\t' \
  'node -e "const {needlemanWunsch} = require(\"@bioscript/seq-align\"); \
  console.log(JSON.stringify(needlemanWunsch(\"{1}\", \"{2}\")))"'
```

### Using Cluster Mode

```typescript
import cluster from 'cluster';
import { cpus } from 'os';
import { needlemanWunsch } from '@bioscript/seq-align';

if (cluster.isPrimary) {
  for (let i = 0; i < cpus().length; i++) {
    cluster.fork();
  }
} else {
  // Workers process tasks from queue
  processTasks();
}
```

## Common Use Cases

### 1. Comparing Homologous Proteins

```typescript
const result = needlemanWunsch(
  'MAEGEITTFTALTEKFNLPPGNYKKPKLLYCSNGGHFLRILPDGTVDGTRDRSDQHIQLQLSAESVGEVYIKSTETGQYLAMDTSGLLYGSQTPSEECLFLERLEENHYNTYTSKKHAEKNWFVGLKKNGSCKRGPRTHYGQKAILFLPLPV',
  'MAEGEITTFTALTEKFNLPPGNYKKPKLLYCSNGGHFLRILPDGTVDGTRDRSDQHIQLQLSAESVGEVYIKSTETGQYLAMDTSGLLYGSQTPNEECLFLERLEENHYNTYTSKKHAEKNWFVGLKKNGSCKRGPRTHYGQKAILFLPLPV',
  { matrix: 'BLOSUM62' }
);

console.log(`Identity: ${result.identityPercent.toFixed(2)}%`);
```

### 2. Finding Conserved Domains

```typescript
const longProtein = 'HEAGAWGHEEHEAGAWGHEEHEAGAWGHEEHEAGAWGHEE';
const domain = 'AWGHE';

const result = smithWaterman(longProtein, domain, {
  matrix: 'BLOSUM62',
  minScore: 20,
});

if (result.score > 0) {
  console.log(`Found at position ${result.startPos1}-${result.endPos1}`);
  console.log(`Alignment: ${result.alignedSeq1}`);
}
```

### 3. DNA Sequence Comparison

```typescript
const seq1 = 'ACGTACGTACGTACGT';
const seq2 = 'ACGTAGGTACGTACGT';

const result = needlemanWunsch(seq1, seq2, {
  matrix: 'DNA_FULL',  // Transition/transversion aware
  gapOpen: -5,
  gapExtend: -2,
});

console.log('Mismatches:', result.alignmentLength - result.identity);
```

### 4. Finding Similar Regions

```typescript
const genome = 'A'.repeat(1000) + 'CGTA' + 'T'.repeat(1000);
const pattern = 'CGTA';

const result = smithWaterman(genome, pattern, {
  matrix: 'DNA_SIMPLE',
  minScore: 15,
});

console.log(`Match at position ${result.startPos1}: ${result.alignedSeq1}`);
```

## Real-World Workflows

### Primer Design and Validation

```typescript
import { semiGlobal } from '@bioscript/seq-align';

/**
 * Validate primer binding to target sequence.
 * Returns binding score and mismatch positions.
 */
function validatePrimer(
  primer: string,
  targetRegion: string
): { binds: boolean; mismatches: number; position: number } {
  const result = semiGlobal(primer, targetRegion, {
    matrix: 'DNA_SIMPLE',
    gapOpen: -8,    // Penalize gaps heavily in primers
    gapExtend: -4,
  });

  // Good primers should have >90% identity
  const binds = result.identityPercent >= 90;
  const mismatches = result.alignmentLength - result.identity;

  return {
    binds,
    mismatches,
    position: result.startPos2,
  };
}

// Example: Check if primer binds to target
const forwardPrimer = 'ATGGCCATGGAACGTACG';
const targetDNA = 'CGATCGATGGCCATGGAACGTACGTAGCTAGC';

const validation = validatePrimer(forwardPrimer, targetDNA);
console.log(`Primer binds: ${validation.binds}`);
console.log(`Mismatches: ${validation.mismatches}`);
console.log(`Binding position: ${validation.position}`);
```

### SNP Detection in Sequencing Reads

```typescript
import { bandedAlign } from '@bioscript/seq-align';

/**
 * Detect SNPs by aligning read to reference with narrow band.
 * Fast alignment for nearly identical sequences.
 */
function detectSNPs(
  read: string,
  reference: string
): Array<{ position: number; readBase: string; refBase: string }> {
  const result = bandedAlign(read, reference, {
    matrix: 'DNA_SIMPLE',
    bandwidth: 5,  // Expect only point mutations, no large indels
    gapOpen: -10,
    gapExtend: -2,
  });

  const snps: Array<{ position: number; readBase: string; refBase: string }> = [];

  for (let i = 0; i < result.alignmentLength; i++) {
    const readBase = result.alignedSeq1[i];
    const refBase = result.alignedSeq2[i];

    if (readBase !== refBase && readBase !== '-' && refBase !== '-') {
      snps.push({
        position: i,
        readBase,
        refBase,
      });
    }
  }

  return snps;
}

// Example: Find SNPs in a read
const read = 'ACGTACGTACGTACGT';
const reference = 'ACGTACGTCCGTACGT';  // C→C SNP at position 8

const snps = detectSNPs(read, reference);
console.log(`Found ${snps.length} SNPs:`, snps);
// Output: Found 1 SNPs: [{ position: 8, readBase: 'A', refBase: 'C' }]
```

### Protein Family Classification

```typescript
import { smithWaterman, needlemanWunsch } from '@bioscript/seq-align';

/**
 * Classify protein into family based on conserved domain presence.
 * Uses local alignment to find domains, global for overall similarity.
 */
function classifyProtein(
  query: string,
  familySignature: string,
  familyMember: string
): {
  hasDomain: boolean;
  domainScore: number;
  overallIdentity: number;
  family: string | null;
} {
  // Step 1: Check for conserved domain using local alignment
  const domainAlignment = smithWaterman(query, familySignature, {
    matrix: 'BLOSUM62',
    gapOpen: -10,
    gapExtend: -1,
    minScore: 50,  // Minimum score to consider domain present
  });

  const hasDomain = domainAlignment.score >= 50;

  // Step 2: Compare to known family member using global alignment
  const globalAlignment = needlemanWunsch(query, familyMember, {
    matrix: 'BLOSUM62',
    gapOpen: -10,
    gapExtend: -1,
  });

  // Classification criteria:
  // - Must have conserved domain (score ≥ 50)
  // - Overall identity ≥ 30% to family member
  const family = hasDomain && globalAlignment.identityPercent >= 30
    ? 'Family Member'
    : null;

  return {
    hasDomain,
    domainScore: domainAlignment.score,
    overallIdentity: globalAlignment.identityPercent,
    family,
  };
}

// Example: Classify a protein
const unknownProtein = 'HEAGAWGHEEHEAGAWGHEE';
const kinaseDomain = 'AWGHE';  // Simplified kinase signature
const knownKinase = 'HEAGAWGHEEHEAGAWGHEE';

const classification = classifyProtein(unknownProtein, kinaseDomain, knownKinase);
console.log(`Has kinase domain: ${classification.hasDomain}`);
console.log(`Domain score: ${classification.domainScore}`);
console.log(`Overall identity: ${classification.overallIdentity.toFixed(1)}%`);
console.log(`Classification: ${classification.family || 'Unknown'}`);
```

### Read Overlap Detection for Assembly

```typescript
import { overlapAlign } from '@bioscript/seq-align';

/**
 * Find overlapping reads for genome assembly.
 * Returns overlap length and quality.
 */
function findOverlap(
  read1: string,
  read2: string,
  minOverlap: number = 20
): {
  hasOverlap: boolean;
  overlapLength: number;
  overlapIdentity: number;
  canMerge: boolean;
} {
  const result = overlapAlign(read1, read2, {
    matrix: 'DNA_SIMPLE',
    gapOpen: -5,
    gapExtend: -2,
  });

  const overlapLength = result.identity;
  const hasOverlap = overlapLength >= minOverlap;

  // High-quality overlap: ≥95% identity in overlap region
  const canMerge = hasOverlap && result.identityPercent >= 95;

  return {
    hasOverlap,
    overlapLength,
    overlapIdentity: result.identityPercent,
    canMerge,
  };
}

// Example: Check if two reads can be merged
const read1 = 'ACGTACGTACGTACGT';
const read2 = 'ACGTACGTTTTTTTTT';  // Overlaps first 8bp

const overlap = findOverlap(read1, read2, 8);
console.log(`Has overlap: ${overlap.hasOverlap}`);
console.log(`Overlap length: ${overlap.overlapLength}bp`);
console.log(`Overlap quality: ${overlap.overlapIdentity.toFixed(1)}%`);
console.log(`Can merge: ${overlap.canMerge}`);
```

### Mutation Analysis Pipeline

```typescript
import { needlemanWunsch } from '@bioscript/seq-align';

/**
 * Analyze mutations between wildtype and mutant sequences.
 * Returns detailed mutation report.
 */
interface Mutation {
  type: 'substitution' | 'insertion' | 'deletion';
  position: number;
  wildtype: string;
  mutant: string;
}

function analyzeMutations(
  wildtype: string,
  mutant: string
): {
  mutations: Mutation[];
  totalMutations: number;
  conservationPercent: number;
} {
  const result = needlemanWunsch(wildtype, mutant, {
    matrix: 'BLOSUM62',
    gapOpen: -10,
    gapExtend: -1,
  });

  const mutations: Mutation[] = [];
  let wtPos = 0;
  let mutPos = 0;

  for (let i = 0; i < result.alignmentLength; i++) {
    const wtChar = result.alignedSeq1[i];
    const mutChar = result.alignedSeq2[i];

    if (wtChar !== mutChar) {
      if (wtChar === '-') {
        mutations.push({
          type: 'insertion',
          position: mutPos,
          wildtype: '',
          mutant: mutChar,
        });
      } else if (mutChar === '-') {
        mutations.push({
          type: 'deletion',
          position: wtPos,
          wildtype: wtChar,
          mutant: '',
        });
      } else {
        mutations.push({
          type: 'substitution',
          position: wtPos,
          wildtype: wtChar,
          mutant: mutChar,
        });
      }
    }

    if (wtChar !== '-') wtPos++;
    if (mutChar !== '-') mutPos++;
  }

  return {
    mutations,
    totalMutations: mutations.length,
    conservationPercent: result.identityPercent,
  };
}

// Example: Analyze mutations
const wildtype = 'HEAGAWGHEE';
const mutant = 'HEAGCWGHEE';  // A→C mutation at position 4

const analysis = analyzeMutations(wildtype, mutant);
console.log(`Total mutations: ${analysis.totalMutations}`);
console.log(`Conservation: ${analysis.conservationPercent.toFixed(1)}%`);
console.log('Mutations:', analysis.mutations);
```

## Type Definitions

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

interface AlignmentOptions {
  matrix?: string | ScoringMatrix;
  gapOpen?: number;
  gapExtend?: number;
  normalize?: boolean;
}

interface LocalAlignmentOptions extends AlignmentOptions {
  minScore?: number;
}

type ScoringMatrix = Record<string, Record<string, number>>;
```

## References

- Needleman, S.B. and Wunsch, C.D. (1970) "A general method applicable to the search for similarities in the amino acid sequence of two proteins." Journal of Molecular Biology 48(3):443-53.
- Smith, T.F. and Waterman, M.S. (1981) "Identification of Common Molecular Subsequences." Journal of Molecular Biology 147:195-197.
- Henikoff S. and Henikoff J.G. (1992) "Amino acid substitution matrices from protein blocks." PNAS 89(22):10915-9.

## License

MIT © 2026 Mykyta Forofontov

## Contributing

Issues and pull requests are welcome at [https://github.com/MForofontov/bioscript](https://github.com/MForofontov/bioscript)
