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

## License

MIT
