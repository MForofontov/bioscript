# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Correct median sequence lengths for odd and even record counts in Node and browser statistics.
- Use numeric Phred encoding constants in the script-tag browser bundle, matching its quality conversion and statistics APIs.

### Changed

- Compute median, N50, and L50 directly from length frequencies, avoiding per-record arrays and repeated sorting during statistics finalization.

## [0.1.1] - 2026-02-17

### Added

- Package exports field for better tree-shaking

### Fixed

- Removed unused imports in tests

## [0.1.0] - 2026-02-15

### Added

- Initial release
- FASTA format parser and writer (Node.js and browser)
- FASTQ format parser and writer (Node.js and browser)
- Quality score conversion (Phred+33 ↔ Phred+64)
- Sequence statistics (GC%, N50, L50, quality metrics)
- Streaming support with constant memory usage
- Auto-detect gzip compression
- Browser support with Web Streams API
- Comprehensive test suite (88.65% coverage)
