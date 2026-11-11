# @bioscript/seq-search

Pattern matching, IUPAC motif search, restriction enzyme sites, and basic primer utilities.

## Install

```bash
npm install @bioscript/seq-search
```

## Quick start

```typescript
import {
  findMotif,
  findRestrictionSites,
  primerTm,
  checkPrimerPair,
} from '@bioscript/seq-search';

const hits = findMotif('ACGTGAATTCACGT', 'GAATTC');
const sites = findRestrictionSites('NNNGAATTCNNN', ['EcoRI']);
const tm = primerTm('ATGCGCATGC');
const pair = checkPrimerPair('ATGCGCATGCATGC', 'GCATGCATGCATGC');
```

## Features

- IUPAC motif → regex expansion
- Exact / regex / IUPAC search with optional overlapping and reverse-strand hits
- Common restriction enzymes (EcoRI, BamHI, HindIII, NotI, …)
- Wallace Tm, GC content, basic primer-pair heuristics

## License

MIT © 2026 Mykyta Forofontov
