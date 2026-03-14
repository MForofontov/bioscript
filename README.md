# Bioscript

A collection of bioinformatics tools and utilities organized as a monorepo.

## Packages

### [@bioscript/seq-stream](./packages/seq-stream)

High-performance streaming parser and writer for FASTA and FASTQ bioinformatics file formats. Features include:

- ✨ Streaming design for processing large files with minimal memory
- 📦 Support for both FASTA and FASTQ formats
- 🗜️ Automatic gzip compression/decompression
- 🔄 Quality score conversion between Phred encodings
- 📊 Comprehensive sequence statistics
- 🌐 Browser and Node.js support

### [@bioscript/seq-align](./packages/seq-align)

Pairwise sequence alignment algorithms for bioinformatics. Features include:

- ✨ Global alignment (Needleman-Wunsch) for end-to-end alignment
- 📍 Local alignment (Smith-Waterman) for finding conserved regions
- 🧬 Multiple scoring matrices (BLOSUM62, BLOSUM80, PAM250, DNA)
- ⚡ High-performance dynamic programming (~100k cell updates/sec)
- 🔧 Full TypeScript support with comprehensive type definitions
- 📦 Zero dependencies, pure TypeScript implementation

### [@bioscript/seq-format](./packages/seq-format)

Comprehensive bioinformatics file format converters and parsers. Features include:

- ✨ GenBank format parsing and FASTA conversion
- 📦 EMBL format support
- 🧬 GFF3/GTF annotation parsing and writing
- 📍 BED format support (BED3, BED6, BED12)
- 🔬 VCF variant call format parsing
- 🎯 SAM alignment format with flag decoding
- 🚀 High-performance O(n) parsers
- 📦 Zero dependencies, pure TypeScript

## Getting Started

This is a monorepo using npm workspaces. To get started:

```bash
# Install dependencies for all packages
npm install

# Build all packages
npm run build

# Run tests for all packages
npm run test

# Run tests in browser environments
npm run test:browser
```

## Development

Each package has its own README with specific documentation. Navigate to the package directory for more details:

- [seq-stream package documentation](./packages/seq-stream/README.md)
- [seq-align package documentation](./packages/seq-align/README.md)
- [seq-format package documentation](./packages/seq-format/README.md)

## License

MIT © 2026 [Mykyta Forofontov](https://github.com/MForofontov)
