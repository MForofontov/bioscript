# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2026-02-17

### Changed
- Updated dependency: `@bioscript/seq-utils` from ^0.1.0 to ^0.2.0

### Fixed
- Resolved shadowed variable in worker pool
- Fixed floating promise in tests

## [0.1.0] - 2026-02-15

### Added
- Initial release
- Support for all 33 NCBI genetic code tables
- Single sequence translation
- Multi-frame translation (6 reading frames)
- Batch processing
- Parallel processing with worker threads (Node.js)
- Browser-compatible translation with streaming
- Optimized lookup tables
- Reverse complement utilities
