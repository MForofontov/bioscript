# Bioscript

A collection of bioinformatics tools and utilities organized as a monorepo.
Install and import individual `@bioscript/*` packages — this workspace root is not published as an umbrella library.

## Packages

### [@bioscript/seq-utils](./packages/seq-utils)

Core DNA/RNA utilities: complement, reverse complement, normalization, validation, k-mers, minimizers, and De Bruijn graphs.

### [@bioscript/seq-stream](./packages/seq-stream)

High-performance streaming parser and writer for FASTA and FASTQ:

- Streaming design for large files with minimal memory
- FASTA and FASTQ formats with automatic gzip support
- Quality score conversion between Phred encodings
- Sequence statistics (GC%, N50/L50)
- Browser and Node.js support

### [@bioscript/seq-translate](./packages/seq-translate)

Genetic code translation with all NCBI transl_table codes (1–33), multi-frame translation, ORF finding, worker-thread batching, and browser APIs.

### [@bioscript/seq-align](./packages/seq-align)

Pairwise sequence alignment:

- Global (Needleman-Wunsch), local (Smith-Waterman), semi-global, overlap, banded, Hirschberg
- BLOSUM / PAM / DNA scoring matrices
- Pure TypeScript, zero runtime dependencies beyond `@bioscript/seq-utils`

### [@bioscript/seq-format](./packages/seq-format)

Bioinformatics file format parsers and writers:

- GenBank, EMBL, GFF3/GTF, BED, VCF, SAM (text), Newick, CIGAR utilities
- BAM binary is not supported (convert with samtools)

### [@bioscript/seq-search](./packages/seq-search)

Pattern and motif search: IUPAC motifs, exact/regex find, restriction sites, and basic primer utilities (Tm, GC, pair checks).

### [@bioscript/seq-quality](./packages/seq-quality)

FASTQ quality control: Phred helpers, length/quality/N-content filters, quality trimming, adapter trimming, and FastQC-lite reports.

## Getting Started

This is a monorepo using npm workspaces:

```bash
# Install dependencies for all packages
npm install

# Build all packages
npm run build

# Typecheck all packages
npm run typecheck

# Run tests for all packages
npm run test

# Run alignment reference validation
npm run validate:reference -w @bioscript/seq-align

# Run tests in browser environments
npm run test:browser
```

## Development

Each package has its own README:

- [seq-utils](./packages/seq-utils/README.md)
- [seq-stream](./packages/seq-stream/README.md)
- [seq-translate](./packages/seq-translate/README.md)
- [seq-align](./packages/seq-align/README.md)
- [seq-format](./packages/seq-format/README.md)
- [seq-search](./packages/seq-search/README.md)
- [seq-quality](./packages/seq-quality/README.md)

## License

MIT © 2026 [Mykyta Forofontov](https://github.com/MForofontov)
