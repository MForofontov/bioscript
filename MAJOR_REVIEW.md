# Major review — 29 October 2026

## Resolved findings

- **P1 — alignment correctness:** global/local alignment inferred gap costs from a single direction. With match 3, mismatch -5, gap open -3 and extension -1, global alignment of `A` and `AAC` returned -3 instead of -1. All affine algorithms now track three independent states through scoring and traceback. Tests independently enumerate short alignment paths and rescore returned alignments. Compact typed rows retain only the requested band.
- **P1 — Hirschberg correctness:** suffix scoring reversed the first suffix twice, and the one-character base case forced a mismatch even when gaps scored better. `AAC` versus `CA` with the review's custom matrix and linear gap -3 returned -6 instead of -5. Both cases are corrected. Hirschberg retains its documented linear gap model.
- **P1 — worker lifecycle:** `TranslationPool` started idle workers but launched fresh workers for tasks. It now sends tasks to persistent workers, rejects active and queued tasks on termination, replaces crashed workers for queued work, and reports missing built assets. Worker paths are platform independent. Counts and chunk sizes must be positive safe integers.
- **P1 — translation data loss:** chunk boundaries could split codons and translation could resume after a stop codon. Browser translation also discarded the final buffer below its chunk threshold. Worker and browser chunks now preserve frame zero and stop semantics, including empty/custom stop symbols.
- **P1 — streaming reliability:** truncated FASTQ was silently accepted; browser parsing discarded final lines; Node parser exceptions escaped stream callbacks; file and gzip failures were not propagated consistently. Incremental UTF-8 decoding, EOF checks, pipeline error handling, browser cancellation, and readable backpressure now cover these cases. Writers reject invalid line widths and retain downstream error visibility until file completion.
- **P2 — format data loss and validation:** VCF INFO arrays and string prefixes were coerced to partial numbers; SAM tags/header values were truncated at colons; CIGAR accepted partially matched strings. Parsing now preserves complete values, supports reordered/escaped VCF metadata, and validates numeric fields, coordinate ordering, phases, and BED block counts. Whole-file parsers retain their existing permissive skipping behavior.
- **P2 — utilities:** hash minimizers accepted invalid window sizes; empty density could be nonfinite; canonical rolling hashes depended on input strand; graph contigs omitted isolated and cyclic components. Regression tests cover each correction. Unknown complement characters retain their existing behavior.
- **P2 — minimizer performance:** window rescanning was replaced with a monotonic deque, preserving leftmost ties, positions, canonical keys, output order, and deterministic custom hashes. Window selection is amortized linear; construction/hashing still costs O(k) per k-mer.
- **P2 — verification gaps:** complete workspace builds, explicit type checking, portable browser builds, installed-tarball smoke checks, and Windows/Linux CI are now provided. The previously absent `test:github` command exists. All five packages are included in build/publish preparation. No packages were published.
- **P2 — stress-test resource exhaustion:** multi-gigabyte fixture generation ignored write-stream backpressure. It now waits for drain, uses test output directories, and runs separately through `npm run test:stress` with one worker. Normal browser checks still exercise files up to 100 MB.

## Dependency triage

The initial locked audit reported 26 findings (including one critical and seven high). Removing the redundant deprecated `jest-allure` reporter and applying compatible dependency fixes reduced this to seven low findings in the Jest/deepmerge development chain. npm proposes a breaking Jest downgrade for that remainder; it is deliberately excluded. Libraries have no new external runtime dependencies.

## Compatibility and limits

- Public function names and return types remain intact. The documented stream browser subpath now resolves and bundles without Node built-ins.
- Existing alignment normalization differences and Hirschberg's linear penalty are retained and documented in the README.
- Banded alignment guarantees an optimum within the band, not an unrestricted optimum. Complete FASTA records still require memory proportional to the largest record.
- Multi-gigabyte browser stress tests are opt-in; their successful completion is not claimed by the normal verification suite.
- Automatic approval review blocked cleanup of the generated `packages/seq-stream/e2e/test-fasta-1gb.fasta` and `test-fasta-2gb.fasta` files from the initial stress run. They are ignored by Git.

## Reproduction

Use Node 22 or newer for tooling, then run `npm ci --ignore-scripts`, `npx playwright install chromium`, and `npm run verify`. The package smoke check can test Node 16 consumers by setting `BIOSCRIPT_RUNTIME_NODE` to its executable; CI does this on Windows and Linux. Run `npm run benchmark` after building for deterministic input sizes, warmups, medians, and cumulative peak RSS. Timing measurements are machine-specific and are not unit-test gates.

## Verification results

`npm run verify` passed: all five workspace builds and type checks, formatting, lint (zero errors; 959 nonblocking warnings), 786 unit tests across 36 suites, 51 Chromium tests, 21 independent alignment reference checks, and five installed-tarball checks. Runtime dependency audit: zero vulnerabilities. The VCF escaped-header round trip received an additional targeted run: 41 tests and lint passed. Multi-gigabyte stress tests remain opt-in and were not completed on this machine.

## Measured benchmark results

Windows, Node v24.22.1, Intel(R) Core(TM) i7-7700HQ CPU @ 2.80GHz. Seed 42, one warmup, median of five measured runs. Inputs are recorded in the [before](benchmarks/review-before.json) and [after](benchmarks/review-after.json) results.

- lexicographic minimizers: 455.733 ms → 12.762 ms (35.71× faster).
- hash minimizers: 1180.309 ms → 12.532 ms (94.18× faster).
- global alignment: 64.573 ms → 68.671 ms (1.06× slower).
- banded alignment: 15.393 ms → 7.522 ms (2.05× faster).
- FASTA streaming: 15.978 ms → 13.895 ms (1.15× faster).
- worker startup and batch: 77.547 ms → 57.717 ms (1.34× faster).
- pool repeated batch: 51.768 ms → 0.389 ms (133.08× faster).

RSS is a cumulative process high-water mark, not per-operation memory. These measurements are evidence for these workloads, not universal speed guarantees. Global alignment now computes correct independent affine states; this has a measurable cost relative to the incorrect single-state baseline. That correctness cost is retained and disclosed rather than described as a speed optimization.
