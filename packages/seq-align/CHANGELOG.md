# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-07-29

### Fixed
- Hirschberg divide step (no double-reverse); identical DNA matches Needleman–Wunsch under linear gaps
- Overlap alignment uses classic suffix–prefix free ends
- Semi-global reports real `startPos1` / `startPos2` for the scored region

## [Unreleased]

### Fixed
- Corrected reference validation fixtures to match verified optimal alignments (affine-gap convention)
- Documented that semi-global results include free end-gap padding in alignment strings
- Renamed internal module `banded.ts` → `banded-align.ts` (public API unchanged) so coverage tooling collects the file

### Changed
- All alignment functions now use `assertTwoSequences()` from `@bioscript/seq-utils` for input validation (replaces inline `typeof` checks)
- All alignment functions now use `normalizeSequence()` from `@bioscript/seq-utils` instead of inline `.trim().toUpperCase()`
- All alignment functions now use `assertNonEmptySequences()` from `@bioscript/seq-utils` after normalization (replaces inline `length === 0` checks; standardizes error message to `'sequences cannot be empty'` across all 6 algorithm files)
- Added `@bioscript/seq-utils` as a dependency

## [0.1.0] - 2026-02-17

### Added
- Initial release
- Needleman-Wunsch global alignment
- Smith-Waterman local alignment
- Hirschberg space-efficient alignment
- Semi-global overlap alignment
- BLOSUM and PAM scoring matrices
- Custom scoring matrix support
- DNA alignment with match/mismatch scoring
- Comprehensive test suite (139 tests, 95.55% coverage)
