// Main entry point - export all public APIs

// Node.js APIs (use streams from 'stream' module)
export * from './fasta';
export * from './fastq';
export * from './stats';

// Browser APIs (use Web Streams API)
// Import from browser-index for tree-shaking
export * from './browser-index';
