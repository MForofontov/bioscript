# @bioscript/seq-quality

FASTQ quality control: Phred helpers, filters, trimming, adapter removal, and FastQC-lite reports.

## Install

```bash
npm install @bioscript/seq-quality
```

## Quick start

```typescript
import {
  filterByMeanQuality,
  trimEndsByQuality,
  trimAdapter,
  ILLUMINA_ADAPTERS,
  qualityReport,
} from '@bioscript/seq-quality';
import type { FastqRecord } from '@bioscript/seq-stream';

const records: FastqRecord[] = [/* ... */];
const filtered = filterByMeanQuality(records, 20);
const trimmed = filtered.map((r) =>
  trimAdapter(trimEndsByQuality(r), ILLUMINA_ADAPTERS.TruSeqUniversal)
);
const report = qualityReport(trimmed);
```

## Features

- Mean/min Phred helpers and encoding detection
- Length, mean-quality, and N-content filters
- Fixed trim, hard clip, sliding-window quality trim
- Illumina adapter constants + mismatch-tolerant trim
- Aggregate quality report (length hist, per-cycle mean Q, GC%, N%)

## License

MIT © 2026 Mykyta Forofontov
