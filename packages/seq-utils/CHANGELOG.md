# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `assertArray()` - Assert a value is an array, throwing `TypeError` if not
- `assertObject()` - Assert a value is a non-null object, throwing `TypeError` if not
- `assertPositiveInteger()` - Assert a number is a positive integer, throwing `Error` if not
- `assertNonEmptySequences()` - Assert two normalized sequences are non-empty, throwing `Error` if either is empty (standardizes the "sequences cannot be empty" message across all callers)

### Changed
- `normalize.ts` no longer re-implements `rnaToDna`/`dnaToRna`; now imports them from `dna-rna.ts` (eliminates internal duplication)
- `kmers.ts`: replaced inline `k < 1 || !Number.isInteger(k)` guards with `assertPositiveInteger()` in all 6 functions
- `minimizers.ts`: replaced inline positive-integer guards for `k` and `w` with `assertPositiveInteger()`
- `debruijn.ts`: replaced `!Array.isArray` + `typeof k !== 'number'` guards with `assertArray()` + `assertNumber()`

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
