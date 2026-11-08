# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Strip CRLF carriage returns from SAM header values and comments.
- Reject incomplete Newick parses, malformed numeric branch lengths, and nonfinite lengths.
- Reject reserved opening parentheses inside unquoted Newick labels, keeping parsing consistent with validation.

## [0.1.0] - 2026-02-17

### Added

- Initial release
- GenBank format parser and writer
- EMBL format parser and writer
- GFF3 format parser and writer
- Bidirectional format conversion (GenBank ↔ EMBL ↔ GFF3)
- Complete feature preservation during conversion
- Comprehensive test suite (239 tests, 95.86% coverage)
