# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-02-17

### Added
- `validateSequence()` - Strict sequence validation with optional ambiguity codes
- `getKmersWithRollingHash()` - O(1) rolling hash for efficient k-mer generation
- `getSuperKmers()` - Maximal k-mer compression for assembly
- `getSyncmers()` - Synchronized k-mers for sequence sketching
- Reverse edge lookups in De Bruijn graphs for O(1) performance
- Comprehensive test suite (42 new tests)

### Changed
- Improved test coverage from 70.26% to 93.17%
- Enhanced De Bruijn graph with bidirectional edge queries

### Fixed
- Removed unused functions and variables

## [0.1.0] - 2026-02-15

### Added
- Initial release
- K-mer extraction and counting
- De Bruijn graph construction and traversal
- Minimizer generation for sequence sketching
- Reverse complement utilities
