# Major check and fix validation

Follow-up started 1 November 2026. Preserve the existing uncommitted fixes; validate the working tree, not just HEAD. Historical results in MAJOR_REVIEW.md are not a substitute for a fresh run.

## Check order

1. Establish the baseline: inspect the existing diff, build all five packages, and run explicit TypeScript checks. Use Node 22+ for tooling and a separate Node 16 consumer check for the advertised runtime minimum.
2. Reproduce correctness findings with regression tests before changing code. Prioritize alignment scores/traceback, translation chunk boundaries and worker shutdown, parser EOF/error handling, and format round trips.
3. Review statistics and utilities for empty inputs, duplicate values, odd/even counts, invalid options, strand invariance, and large record counts. Compare Node and browser results on identical inputs.
4. Apply focused fixes and update package changelogs. Preserve public APIs. Optimize demonstrated allocation or algorithmic problems and state complexity precisely.
5. Run `npm run verify`: builds, type checks, lint, formatting, all unit tests, Chromium tests, independent alignment reference checks, and installed-tarball smoke checks. Record actual results and failures below.
6. Run deterministic benchmarks after correctness passes. Compare identical workloads and runtime versions; distinguish timing measurements from complexity improvements. Run multi-gigabyte stress checks separately through `npm run test:stress` when resources permit.
7. Before release, require Windows/Linux CI, runtime compatibility checks, reviewed package contents, and explicit documentation of remaining limits. Publishing is outside this check.

## Findings in this follow-up

- Statistics median selection used the wrong rank for odd counts and failed to average the two central lengths for even counts in all three calculators. Added shared frequency-based rank selection and regression cases across Node, browser async, and browser synchronous APIs.
- Corrected an existing unit assertion that expected 4 as the median of `[4, 8, 8]`; the middle value is 8.
- Statistics finalization expanded length frequencies to one array element per sequence and sorted copies separately for N50 and L50. The shared summary now sorts only unique lengths, using O(u) auxiliary memory and O(u log u) work for u unique lengths, independent of the number of repeated records.
- Preserve existing zero-length N50/L50 behavior, including L50 = 1 for nonempty collections containing only empty sequences.
- Fresh lint exposed an unsafe throw in the package smoke check's cleanup `finally` block. An invalid cleanup path now reports failure and skips deletion without replacing the primary check error.

## Fresh validation

- Confirmed the baseline browser implementation from HEAD reports median 2 for both `[2, 8, 14]` (expected 8) and `[2, 8]` (expected 5).
- The initial targeted regression run passed all seven cases, including the four-billion-record frequency map. Additional singleton and mixed-frequency cases are included in the full run.
- All workspace builds and TypeScript checks passed under bundled Node v24.22.1.
- Full lint after the cleanup fix: zero errors, 959 existing warnings. Formatting passed.
- Complete unit rerun after correcting the historical median expectation: 795 tests passed across 37 suites, including nine new statistics regression cases.
- Chromium: all 51 tests passed (24 stream, 27 translation) with `--workers 1 --timeout 120000`. The default two-worker run timed out creating its first pages before assertions and was stopped; the successful retry used the same test cases and production code with only CLI scheduling/timeout changes.
- Independent alignment reference run: all 21 cases passed.
- All five installed tarballs passed CommonJS, ESM, TypeScript declarations, worker execution, and browser bundling checks. CommonJS/ESM consumers ran under Node v16.14.2, with tooling under Node v24.22.1.
- The verification stages passed individually with the browser retry options above; a default `npm run verify` success is not claimed. Historical benchmark speedups and prior verification counts remain in MAJOR_REVIEW.md. Multi-gigabyte stress tests, Linux CI, fresh dependency installation, and benchmark timing comparisons were not rerun in this follow-up.

On this Windows installation, `npm.cmd` invokes its adjacent Node 16 executable even when a newer Node directory is prepended to PATH. Run the verification stages directly with the bundled Node 24 executable, or use a Node 22+ installation with its matching npm. Keep `BIOSCRIPT_RUNTIME_NODE` pointed at Node 16 for installed-package consumer checks.

## Implementation audit — 2 November 2026

### Corrections and verification improvements

- Preserved the existing working-tree fixes. Added regressions for contig branch/merge endpoints, self-loops and cycles, SAM CRLF headers, malformed Newick numbers, and unconsumed Newick input. Against the initial source snapshot, seven new regression cases failed; all 25 cases in the two affected suites pass after correction.
- Contig extraction now visits edges rather than marking shared endpoint nodes as consumed. Branching graphs such as `['ACG', 'ACT']` with k = 2 now return both complete paths instead of an empty array. Traversal is O(V + E); overlap validation adds O(kE), plus string construction.
- A final canonical-graph check reproduced invalid contig spelling: `['ACGT']`, k = 2, `canonical: true` produced `ACGC`. Canonical keys do not store edge orientation. Contig extraction now rejects nonoverlapping edges with an actionable error instead of returning corrupt sequence data; build with `canonical: false` for assembly. Canonical graph counting/statistics remain available. The added regression failed before the guard.
- SAM headers strip CRLF terminators. Newick parsing validates complete finite numeric values and requires the entire tree to be consumed, rather than silently accepting inputs such as `(A:1junk,B);` and `A,B;`.
- The script-tag stream bundle exported string quality encodings even though its conversion/statistics functions require numeric offsets. Its constants now reuse the shared numeric enum. Before correction, converting `IIII` with the bundle's own constants produced four NUL characters; the regression expects `hhhh` and a Phred64 mean quality of 40.
- `npm run typecheck` now checks tests, browser tests, and scripts through `tsconfig.check.json`. Typed browser globals replace obsolete error suppressions. This exposed and resolved previously unchecked test typing errors, and reduced lint warnings from the historical 959 to 441 without disabling rules.
- Jest and ESLint exclude generated report directories. The working tree contained over 10,000 Allure JSON files that were unnecessarily crawled during module discovery.
- Browser checks use one worker, a 120-second test timeout, dedicated loopback ports 3111/3112, explicit test-page readiness, and traces retained on failure. The standard command no longer needs the previous manual worker/timeout overrides.
- Added independent short-sequence alignment checks across zero gaps, gap-open/extension penalty orderings, zero-width/narrow/wide bands, returned-alignment rescoring, and Hirschberg linear penalties. Added synchronous/browser/worker parity across six frames, alternate tables, RNA, incomplete codons, empty inputs, custom stop symbols, and stop behavior. Browser regressions also exercise split UTF-8 and corrupt gzip input.
- CI remains configured for Windows and Linux, with a 30-minute job limit and package-local Allure artifacts included. No packages were published.

### Performance evidence

Hirschberg no longer allocates a temporary three-element array in every scoring cell. The benchmark now includes that algorithm. On Windows, Node v24.22.1, Intel i7-7700HQ, seed 42, one warmup and five measured repetitions, its 600-base identical-input median was 164.380 ms before and 143.975 ms after. See [before](benchmarks/audit-20261102-before.json) and [after](benchmarks/audit-20261102-after.json).

These are machine-specific observations, not timing gates or universal speed guarantees. Other unchanged workloads also varied between runs; only the removal of per-cell temporary arrays is attributed to this change. RSS remains a cumulative process high-water mark and does not establish an isolated memory reduction.

### Dependencies and remaining gates

- A fresh `npm ci --ignore-scripts` succeeded in an isolated copy containing the working-tree source (installation: Node v24.18.1 and npm 8.5.0). Final verification uses Node v24.22.1 with npm 11.6.2, with `BIOSCRIPT_RUNTIME_NODE` pointing to Node v16.14.2 for consumer checks. The lockfile was unchanged by this audit.
- Fresh production audit: zero vulnerabilities. Full development audit: 33 findings (29 moderate, four low), originating from minimatch and deepmerge advisory chains. A compatible-update dry run did not remove these findings. Breaking tool downgrades and forced transitive major-version overrides were not applied.
- Linux execution is not confirmed locally: the Docker backend did not respond within a bounded 10-second probe. Windows/Linux CI must pass before release. Multi-gigabyte browser stress tests remain optional and were not run.

### Standard verification results

The working tree completed the unmodified `npm run verify` command with the configured defaults: all five workspace builds, expanded TypeScript checks, lint (zero errors, 441 warnings), formatting, 806 unit tests across 37 suites, 53 Chromium tests (26 stream and 27 translation), 22 independent alignment-reference cases, and all five installed-tarball checks. Tarball checks cover CommonJS, ESM, declarations, worker execution, and browser bundling; Node consumers ran under v16.14.2. No manual test scheduling or timeout flags were supplied.

The isolated clean-install copy also completed the full standard command before the final orientation guard (805 unit tests, 53 Chromium tests, 22 reference cases, and five tarballs). After that last correction, the final utility source and regression were copied there; builds, expanded type checks, all 44 affected graph/utility tests, and all five installed-tarball checks passed again. The guard does not change browser code. `git diff --check` passed for the working tree.

## Release integration — 8 November 2026

Registry inspection found that the published packages were newer than the main-branch manifests. Publishing the audited checkout over `latest` would have removed existing normalization and validation exports. The release integrates `origin/dev-branch` at `2888d39` with the audited fixes, including the published search and quality packages.

Prepared versions: `seq-utils` 0.3.2; `seq-stream` 0.2.3; `seq-translate`, `seq-align`, `seq-format`, `seq-search`, and `seq-quality` 0.2.4. Internal dependencies require the corresponding corrected releases. Existing release history is preserved in each package changelog.

Compatibility checks cover all 303 published exports across nine module entry points, including browser entry points. Export presence and structural types passed; classes were checked for public member presence because separate class declarations have nominal private fields. Tests also preserve published score-normalization controls, Hirschberg defaults, numeric VCF INFO arrays, strict parser options, quoted Newick labels, missing BED scores, hyphenated GTF keys, canonical super-k-mers, and canonical graph edge validity. The public histogram helper now uses the audited frequency summary without per-record loops.

A fresh `npm ci --ignore-scripts --no-audit --no-fund` installed all seven workspaces in an isolated release directory. Its source matched all 218 working-tree files byte-for-byte before this report update. The standard `npm run verify` passed with no scheduling or timeout overrides: seven workspace builds, expanded TypeScript checks, lint (zero errors, 480 nonblocking warnings), formatting, 996 unit tests across 42 suites, 55 Chromium tests (28 stream and 27 translation), 25 independent alignment-reference cases, and seven installed-tarball checks. CommonJS/ESM consumers and workers were checked under Node v16.14.2; tooling used Node v24.22.1 and npm 11.6.2.

Release artifacts are packed from that fresh build to avoid stale compiled files. Package contents are checked for accidental tests, reports, credentials, and other unreviewed paths. Windows/Linux CI must pass on the pushed commit before publication. Multi-gigabyte browser stress checks remain optional and were not run. npm authentication is required for the final publication step.
