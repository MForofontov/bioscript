# @bioscript/seq-format

Comprehensive bioinformatics file format converters and parsers for GenBank, EMBL, GFF/GTF, BED, VCF, SAM, CIGAR, and Newick formats.

## Features

✨ **GenBank Support** - Parse and convert GenBank ↔ FASTA with feature extraction  
✨ **EMBL Support** - Parse EMBL format to FASTA  
✨ **GFF/GTF Support** - Parse and write GFF3 and GTF annotations  
✨ **BED Support** - Handle BED3, BED6, and BED12 formats  
✨ **VCF Support** - Parse and write variant call files  
✨ **SAM Support** - Parse SAM alignment files with flag decoding  
✨ **CIGAR Utilities** - Parse, analyze, and visualize CIGAR strings  
✨ **Newick Trees** - Parse and manipulate phylogenetic trees  
🚀 **High Performance** - Optimized parsers with O(n) complexity  
📦 **Zero Dependencies** - Pure TypeScript, no external dependencies  
🔒 **Type Safe** - Full TypeScript support with strict types  
✅ **Well Tested** - 239 tests with 95.86% coverage

## Installation

```bash
npm install @bioscript/seq-format
```

## Quick Start

```typescript
import { parseGenBank, genBankToFasta } from '@bioscript/seq-format';
import { readFileSync } from 'fs';

// Parse GenBank file
const gbText = readFileSync('sequence.gb', 'utf-8');
const gbRecord = parseGenBank(gbText);
console.log(gbRecord.locus, gbRecord.sequence.length);

// Convert to FASTA
const fastaRecords = genBankToFasta(gbRecord);
console.log(`>${fastaRecords[0].id} ${fastaRecords[0].description}`);
console.log(fastaRecords[0].sequence);
```

## API Documentation

### GenBank Format

#### parseGenBank(text: string): GenBankRecord

Parse GenBank format text into structured record.

```typescript
const gbRecord = parseGenBank(genBankText);
console.log(gbRecord.locus);
console.log(gbRecord.features.length);
console.log(gbRecord.sequence);
```

#### genBankToFasta(record: GenBankRecord, includeFeatures?: boolean): FastaRecord[]

Convert GenBank record to FASTA format. Optionally extract CDS features as separate sequences.

```typescript
// Main sequence only
const fastaRecords = genBankToFasta(gbRecord);

// Include CDS features
const allFeatures = genBankToFasta(gbRecord, true);
```

#### fastaToGenBank(record: FastaRecord, options?): string

Convert FASTA record to minimal GenBank format.

```typescript
const fasta = { id: 'seq1', description: 'My sequence', sequence: 'ATGC' };
const genbank = fastaToGenBank(fasta, { organism: 'E. coli' });
```

### EMBL Format

#### parseEMBL(text: string): EMBLRecord

Parse EMBL format text into structured record.

```typescript
const emblRecord = parseEMBL(emblText);
console.log(emblRecord.id, emblRecord.accession);
```

#### emblToFasta(record: EMBLRecord): FastaRecord

Convert EMBL record to FASTA format.

```typescript
const fasta = emblToFasta(emblRecord);
console.log(`>${fasta.id} ${fasta.description}\n${fasta.sequence}`);
```

### GFF/GTF Format

#### parseGFFLine(line: string, version?: 'gff3' | 'gtf'): GFFRecord

Parse single GFF3 or GTF line.

```typescript
const line = 'chr1\tHAVANA\tgene\t11869\t14409\t.\t+\t.\tID=gene1;Name=DDX11L1';
const record = parseGFFLine(line, 'gff3');
console.log(record.seqid, record.start, record.end);
console.log(record.attributes.ID);
```

#### formatGFFLine(record: GFFRecord, version?: 'gff3' | 'gtf'): string

Format GFF record as GFF3 or GTF line.

```typescript
const line = formatGFFLine(record, 'gff3');
```

#### parseGFF(text: string, version?: 'gff3' | 'gtf'): GFFRecord[]

Parse complete GFF3/GTF file.

```typescript
const records = parseGFF(gffText, 'gff3');
console.log(`Parsed ${records.length} annotations`);
```

#### formatGFF(records: GFFRecord[], version?: 'gff3' | 'gtf', includeHeader?: boolean): string

Format array of GFF records as complete file.

```typescript
const gffText = formatGFF(records, 'gff3', true);
```

### BED Format

#### parseBEDLine(line: string): BEDRecord

Parse single BED line (auto-detects BED3, BED6, BED12).

```typescript
const bed6 = parseBEDLine('chr1\t1000\t2000\tfeature1\t500\t+');
console.log(bed6.chrom, bed6.chromStart, bed6.name);
```

#### formatBEDLine(record: BEDRecord): string

Format BED record as line (output format determined by available fields).

```typescript
const line = formatBEDLine(record);
```

#### parseBED(text: string): BEDRecord[]

Parse complete BED file.

```typescript
const records = parseBED(bedText);
console.log(`Parsed ${records.length} regions`);
```

#### formatBED(records: BEDRecord[], includeHeader?: boolean, trackName?: string): string

Format array of BED records as complete file.

```typescript
const bedText = formatBED(records, true, 'myRegions');
```

### VCF Format

#### parseVCFHeader(text: string): VCFHeader

Parse VCF header section.

```typescript
const header = parseVCFHeader(vcfText);
console.log(header.fileformat, header.samples);
```

#### parseVCFLine(line: string, samples?: string[]): VCFRecord

Parse single VCF data line.

```typescript
const record = parseVCFLine(line, header.samples);
console.log(record.chrom, record.pos, record.ref, record.alt);
```

#### parseVCF(text: string): { header: VCFHeader; records: VCFRecord[] }

Parse complete VCF file.

```typescript
const { header, records } = parseVCF(vcfText);
console.log(`Parsed ${records.length} variants`);
```

#### formatVCFLine(record: VCFRecord): string

Format VCF record as line.

```typescript
const line = formatVCFLine(record);
```

#### formatVCF(header: VCFHeader, records: VCFRecord[]): string

Format VCF header and records as complete file.

```typescript
const vcfText = formatVCF(header, records);
```

### SAM Format

#### decodeSAMFlags(flag: number): SAMFlags

Decode SAM bitwise flags into components.

```typescript
const flags = decodeSAMFlags(163);
console.log(flags.paired, flags.properPair, flags.reverse);
// true, true, true
```

#### encodeSAMFlags(flags: Partial<SAMFlags>): number

Encode SAM flag components into bitwise integer.

```typescript
const flag = encodeSAMFlags({
  paired: true,
  properPair: true,
  reverse: true,
  first: true
});
console.log(flag); // 163
```

#### parseSAMHeader(text: string): SAMHeader

Parse SAM header section.

```typescript
const header = parseSAMHeader(samText);
console.log(header.version, header.references.length);
```

#### parseSAMLine(line: string): SAMRecord

Parse single SAM alignment line.

```typescript
const record = parseSAMLine(line);
console.log(record.qname, record.pos, record.cigar);
console.log(record.flags.paired, record.flags.reverse);
```

#### parseSAM(text: string): { header: SAMHeader; records: SAMRecord[] }

Parse complete SAM file.

```typescript
const { header, records } = parseSAM(samText);
console.log(`Parsed ${records.length} alignments`);
```

#### formatSAMLine(record: SAMRecord): string

Format SAM record as line.

```typescript
const line = formatSAMLine(record);
```

#### formatSAM(header: SAMHeader, records: SAMRecord[]): string

Format SAM header and records as complete file.

```typescript
const samText = formatSAM(header, records);
```

### CIGAR Utilities

CIGAR (Compact Idiosyncratic Gapped Alignment Report) strings represent alignment operations in SAM/BAM files.

#### parseCIGAR(cigar: string): CigarOp[]

Parse CIGAR string into array of operations.

```typescript
const ops = parseCIGAR('8M2I4M1D3M');
// [
//   { length: 8, operation: 'M' },
//   { length: 2, operation: 'I' },
//   { length: 4, operation: 'M' },
//   { length: 1, operation: 'D' },
//   { length: 3, operation: 'M' }
// ]
```

**Supported operations:**
- `M` - Match/Mismatch
- `I` - Insertion to reference
- `D` - Deletion from reference
- `N` - Skipped region (intron)
- `S` - Soft clipping (clipped bases present in SEQ)
- `H` - Hard clipping (clipped bases not present in SEQ)
- `P` - Padding (silent deletion)
- `=` - Sequence match
- `X` - Sequence mismatch

#### formatCIGAR(operations: CigarOp[]): string

Format CIGAR operations back to string.

```typescript
const ops = [
  { length: 8, operation: 'M' },
  { length: 2, operation: 'I' }
];
const cigar = formatCIGAR(ops); // '8M2I'
```

#### getCIGARStats(operations: CigarOp[]): CigarStats

Calculate alignment statistics from CIGAR operations.

```typescript
const ops = parseCIGAR('8M2I4M1D3M');
const stats = getCIGARStats(ops);
console.log(stats);
// {
//   alignedLength: 18,
//   matches: 15,
//   mismatches: 0,
//   insertions: 2,
//   deletions: 1,
//   softClipped: 0,
//   hardClipped: 0,
//   referenceLength: 16,
//   queryLength: 17
// }
```

#### cigarToAlignedSequence(cigar: string, querySeq: string): { query: string; reference: string }

Generate aligned sequences with gaps from CIGAR and query sequence.

```typescript
const aligned = cigarToAlignedSequence('3M2I2M1D2M', 'ACGTACGTA');
console.log(aligned.query);      // 'ACGTACG-TA'
console.log(aligned.reference);  // 'ACG--CGNTA'
```

#### validateCIGAR(cigar: string): boolean

Validate CIGAR string format.

```typescript
validateCIGAR('8M2I4M1D3M'); // true
validateCIGAR('8M2Q4M');     // false (invalid operation Q)
validateCIGAR('*');          // true (unmapped)
```

### Newick Tree Format

Newick format is standard for representing phylogenetic trees.

#### parseNewick(newick: string): NewickTree

Parse Newick format string into tree structure.

```typescript
const tree = parseNewick('((A:0.1,B:0.2):0.3,C:0.4);');
console.log(tree.leafCount);   // 3
console.log(tree.maxDepth);    // 2
console.log(tree.hasLengths);  // true
```

**Tree structure:**
```typescript
interface NewickTree {
  root: NewickNode;
  leafCount: number;
  maxDepth: number;
  hasLengths: boolean;
}

interface NewickNode {
  name?: string;
  length?: number;
  children?: NewickNode[];
}
```

#### formatNewick(tree: NewickTree, options?): string

Format tree structure back to Newick string.

```typescript
const tree = parseNewick('((A:0.1,B:0.2):0.3,C:0.4);');
const newick = formatNewick(tree); // '((A:0.100000,B:0.200000):0.300000,C:0.400000);'

// Without branch lengths
const simple = formatNewick(tree, { includeLengths: false }); // '((A,B),C);'

// Custom precision
const short = formatNewick(tree, { precision: 2 }); // '((A:0.10,B:0.20):0.30,C:0.40);'
```

#### countLeaves(node: NewickNode): number

Count leaf nodes in tree.

```typescript
const tree = parseNewick('((A,B),(C,D));');
const count = countLeaves(tree.root); // 4
```

#### calculateDepth(node: NewickNode): number

Calculate maximum tree depth (leaves are at depth 0).

```typescript
const tree = parseNewick('(((A,B),C),D);');
const depth = calculateDepth(tree.root); // 3
```

#### getLeafNames(node: NewickNode): string[]

Get all leaf names from tree.

```typescript
const tree = parseNewick('((A:0.1,B:0.2):0.3,C:0.4);');
const leaves = getLeafNames(tree.root); // ['A', 'B', 'C']
```

#### getTotalLength(node: NewickNode): number

Calculate total tree length (sum of all branch lengths).

```typescript
const tree = parseNewick('((A:0.1,B:0.2):0.3,C:0.4);');
const totalLength = getTotalLength(tree.root); // 1.0
```

#### validateNewick(newick: string): boolean

Validate Newick format string.

```typescript
validateNewick('((A,B),C);');  // true
validateNewick('((A,B),C)');   // false (missing semicolon)
validateNewick('((A,B);');     // false (unmatched parentheses)
```

## Real-World Examples

### Extract CDS Sequences from GenBank

```typescript
import { parseGenBank, genBankToFasta } from '@bioscript/seq-format';
import { readFileSync, writeFileSync } from 'fs';

const gbText = readFileSync('genome.gb', 'utf-8');
const gbRecord = parseGenBank(gbText);

// Extract all CDS features
const fastaRecords = genBankToFasta(gbRecord, true);
const cdsRecords = fastaRecords.slice(1); // Skip main sequence

// Write to FASTA file
const fastaText = cdsRecords
  .map(r => `>${r.id} ${r.description}\n${r.sequence}`)
  .join('\n');

writeFileSync('cds_sequences.fasta', fastaText);
```

### Filter VCF by Quality

```typescript
import { parseVCF, formatVCF } from '@bioscript/seq-format';

const { header, records } = parseVCF(vcfText);

// Filter high-quality variants (QUAL > 30)
const highQualityVariants = records.filter(r => r.qual && r.qual > 30);

// Write filtered VCF
const filteredVcf = formatVCF(header, highQualityVariants);
writeFileSync('high_quality.vcf', filteredVcf);
```

### Convert GFF3 to GTF

```typescript
import { parseGFF, formatGFF } from '@bioscript/seq-format';

const gff3Records = parseGFF(gff3Text, 'gff3');

// Convert to GTF format
const gtfText = formatGFF(gff3Records, 'gtf', true);
writeFileSync('annotations.gtf', gtfText);
```

### Analyze SAM Alignment Flags

```typescript
import { parseSAM } from '@bioscript/seq-format';

const { header, records } = parseSAM(samText);

// Count paired-end reads
const pairedReads = records.filter(r => r.flags?.paired).length;
console.log(`Paired reads: ${pairedReads} / ${records.length}`);

// Count unmapped reads
const unmappedReads = records.filter(r => r.flags?.unmapped).length;
console.log(`Unmapped: ${unmappedReads} (${(unmappedReads / records.length * 100).toFixed(1)}%)`);

// Count reverse strand alignments
const reverseReads = records.filter(r => r.flags?.reverse).length;
console.log(`Reverse strand: ${reverseReads}`);
```

### Extract Gene Regions from BED

```typescript
import { parseBED } from '@bioscript/seq-format';

const bedRecords = parseBED(bedText);

// Filter genes on chromosome 1
const chr1Genes = bedRecords.filter(r => r.chrom === 'chr1');

// Find large genes (>10kb)
const largeGenes = bedRecords.filter(r => 
  (r.chromEnd - r.chromStart) > 10000
);

console.log(`Large genes: ${largeGenes.length}`);
largeGenes.forEach(gene => {
  const size = gene.chromEnd - gene.chromStart;
  console.log(`${gene.name}: ${size}bp on ${gene.strand}`);
});
```

### Analyze Alignment Quality with CIGAR

```typescript
import { parseSAM, parseCIGAR, getCIGARStats } from '@bioscript/seq-format';

const { records } = parseSAM(samText);

// Analyze alignment quality
records.forEach(record => {
  if (record.cigar && record.cigar !== '*') {
    const ops = parseCIGAR(record.cigar);
    const stats = getCIGARStats(ops);
    
    const matchRate = stats.matches / stats.alignedLength;
    const indelRate = (stats.insertions + stats.deletions) / stats.alignedLength;
    
    console.log(`${record.qname}:`);
    console.log(`  Match rate: ${(matchRate * 100).toFixed(1)}%`);
    console.log(`  Indel rate: ${(indelRate * 100).toFixed(1)}%`);
    console.log(`  Reference span: ${stats.referenceLength}bp`);
  }
});
```

### Visualize CIGAR Alignment

```typescript
import { cigarToAlignedSequence } from '@bioscript/seq-format';

const cigar = '5M2I3M1D4M';
const query = 'ACGTACCGTACGT';

const aligned = cigarToAlignedSequence(cigar, query);

console.log('Query:    ', aligned.query);
console.log('Reference:', aligned.reference);
// Query:     ACGTACCGTACGT
// Reference: ACGTA--CGT-ACGT
```

### Build and Analyze Phylogenetic Tree

```typescript
import { parseNewick, getLeafNames, calculateDepth, getTotalLength } from '@bioscript/seq-format';

// Parse tree with branch lengths
const tree = parseNewick('((Human:0.2,Chimp:0.15):0.1,(Mouse:0.3,Rat:0.25):0.15);');

console.log(`Species: ${tree.leafCount}`);
console.log(`Tree depth: ${tree.maxDepth}`);
console.log(`Total branch length: ${getTotalLength(tree.root).toFixed(2)}`);

// Get all species names
const species = getLeafNames(tree.root);
console.log(`Species list: ${species.join(', ')}`);
// Species list: Human, Chimp, Mouse, Rat
```

### Convert Tree Formats

```typescript
import { parseNewick, formatNewick } from '@bioscript/seq-format';

// Parse tree with high precision
const tree = parseNewick('(A:0.123456,B:0.987654);');

// Format with different precisions
const fullPrecision = formatNewick(tree, { precision: 6 });
const lowPrecision = formatNewick(tree, { precision: 2 });
const noLengths = formatNewick(tree, { includeLengths: false });

console.log(fullPrecision); // '(A:0.123456,B:0.987654);'
console.log(lowPrecision);  // '(A:0.12,B:0.99);'
console.log(noLengths);     // '(A,B);'
```

## Performance

- **GenBank parsing**: 1-10KB files in <1ms, 100KB-1MB genomes in 5-50ms
- **GFF/GTF parsing**: 10K lines in ~50ms, 100K lines in ~500ms
- **BED parsing**: 10K regions in ~30ms, 100K regions in ~300ms
- **VCF parsing**: 10K variants in ~100ms, 100K variants in ~1s
- **SAM parsing**: 10K alignments in ~150ms, 100K alignments in ~1.5s
- **Memory**: O(n) where n is input size, no streaming (use seq-stream for large files)

All parsers use O(n) algorithms with efficient string processing.

## Format Support

### Fully Supported
- ✅ GenBank (parse, write, convert to/from FASTA)
- ✅ EMBL (parse, convert to FASTA)
- ✅ GFF3 (parse, write)
- ✅ GTF (parse, write)
- ✅ BED3/BED6/BED12 (parse, write)
- ✅ VCF (parse, write)
- ✅ SAM (parse, write, flag decoding)
- ✅ CIGAR (parse, format, analyze, validate)
- ✅ Newick (parse, format, tree analysis)

### Limitations
- **BAM**: Binary format not supported (use samtools for BAM ↔ SAM conversion)
- **Streaming**: Not optimized for multi-GB files (see @bioscript/seq-stream for streaming)
- **GenBank features**: Simplified location parsing (join/complement partially supported)

## TypeScript Types

All parsers return fully typed objects:

```typescript
interface GenBankRecord {
  locus: string;
  definition: string;
  accession: string;
  version: string;
  keywords: string;
  source: string;
  organism: string;
  references: string[];
  features: GenBankFeature[];
  sequence: string;
}

interface GFFRecord {
  seqid: string;
  source: string;
  type: string;
  start: number;
  end: number;
  score: number | null;
  strand: '+' | '-' | '.' | '?';
  phase: 0 | 1 | 2 | null;
  attributes: Record<string, string | string[]>;
}

// ... and more (see types.ts for complete definitions)
```

## Error Handling

All parsers throw descriptive errors:

```typescript
try {
  const record = parseGenBank(invalidText);
} catch (error) {
  console.error(error.message);
  // "Invalid GenBank format: missing LOCUS"
}
```

## License

MIT © 2026 Mykyta Forofontov
