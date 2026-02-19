# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
