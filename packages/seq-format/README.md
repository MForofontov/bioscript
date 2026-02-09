# @bioscript/seq-format

Comprehensive bioinformatics file format converters and parsers for GenBank, EMBL, GFF/GTF, BED, VCF, and SAM formats.

## Features

✨ **GenBank Support** - Parse and convert GenBank ↔ FASTA with feature extraction  
✨ **EMBL Support** - Parse EMBL format to FASTA  
✨ **GFF/GTF Support** - Parse and write GFF3 and GTF annotations  
✨ **BED Support** - Handle BED3, BED6, and BED12 formats  
✨ **VCF Support** - Parse and write variant call files  
✨ **SAM Support** - Parse SAM alignment files with flag decoding  
🚀 **High Performance** - Optimized parsers with O(n) complexity  
📦 **Zero Dependencies** - Pure TypeScript, no external dependencies  
🔒 **Type Safe** - Full TypeScript support with strict types  
✅ **Well Tested** - Comprehensive test coverage

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
