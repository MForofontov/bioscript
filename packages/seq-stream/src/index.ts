// Main entry point - export all public APIs

// Node.js APIs (use streams from 'stream' module)
export * from './fasta.js';
export * from './fastq.js';
export * from './stats.js';

// Browser APIs (use Web Streams API)
// Import from browser-index for tree-shaking
export * from './browser-index.js';
