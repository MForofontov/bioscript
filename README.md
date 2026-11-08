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
- ⚡ Dynamic programming with configurable scoring and gap penalties
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

### [@bioscript/seq-utils](./packages/seq-utils)

DNA/RNA conversion, complements, k-mers, minimizers, and De Bruijn graphs.

### [@bioscript/seq-translate](./packages/seq-translate)

Codon-table translation, reading frames, ORF detection, browser streaming, and Node worker pools.

## Getting Started

This monorepo uses npm workspaces. Use Node.js 22 or newer for development tooling. Published libraries retain Node.js 16 support; browser streaming requires Web Streams and gzip support requires DecompressionStream.

To get started:

```bash
# Install dependencies for all packages
npm ci --ignore-scripts

# Build all packages
npm run build

# Run tests for all packages
npm run test

# Install the browser used by the test suite
npx playwright install chromium

# Run the complete verification suite
npm run verify

# Run reproducible performance benchmarks after building
npm run benchmark
```

## Development

Each package has its own README with specific documentation. Navigate to the package directory for more details:

- [seq-stream package documentation](./packages/seq-stream/README.md)
- [seq-align package documentation](./packages/seq-align/README.md)
- [seq-format package documentation](./packages/seq-format/README.md)
- [seq-utils package documentation](./packages/seq-utils/README.md)
- [seq-translate package documentation](./packages/seq-translate/README.md)

## Verification and compatibility

`npm run verify` builds and type-checks all five workspaces, checks lint and formatting, runs unit and Chromium tests, verifies alignment against exhaustive path enumeration, and tests installed package tarballs outside the workspace. CI runs on Windows and Linux and uploads test artifacts on failures.

Type checking includes tests, browser tests, and validation scripts. Browser checks run with one worker and a two-minute test timeout, using dedicated local servers on ports 3111 and 3112. Failed browser runs retain traces. Generated test reports are excluded from module discovery and linting.

`npm run benchmark` uses seeded inputs, one warmup and five measured repetitions. It reports median runtime and cumulative process peak RSS. Timings depend on the machine; unit tests do not impose timing limits. Multi-gigabyte browser stress tests run separately with `npm run test:stress` and one worker. Ordinary browser checks still cover files up to 100 MB.

Stream parsers reject incomplete FASTQ records and propagate file and gzip errors. A record contains a complete sequence, so FASTA memory usage includes the largest record. Public format line parsers reject malformed numeric fields; whole-file format parsers retain their existing behavior of skipping malformed lines.

Worker pools reuse workers across batches. Always await `pool.terminate()` after use; termination rejects queued and active tasks, and further submissions fail. Worker chunk sizes are rounded down to whole codons, with a minimum of three bases. Concatenated frame-zero results match whole-sequence translation, including the first stop codon.

Alignment APIs retain their historical `normalize` behavior: global/local alignment normalize input case; semi-global, overlap, banded, and Hirschberg normalize the score when requested. Hirschberg uses a linear penalty (`gapOpen` per gap base), while other algorithms use affine penalties. Banded results are optimal within the requested band; they cannot certify that the unrestricted optimum lies inside it.

## License

MIT
