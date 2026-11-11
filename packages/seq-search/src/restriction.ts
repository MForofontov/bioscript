/**
 * Restriction enzyme site search.
 */

import { findMotif } from './motifs';
import { type FindPatternOptions, type PatternHit } from './find';

export interface RestrictionEnzyme {
  name: string;
  /** Recognition motif in IUPAC (5'→3') */
  site: string;
  /** Cut offset after start on forward strand (optional metadata) */
  cutIndex?: number;
}

/** Common type II restriction enzymes */
export const COMMON_ENZYMES: RestrictionEnzyme[] = [
  { name: 'EcoRI', site: 'GAATTC', cutIndex: 1 },
  { name: 'BamHI', site: 'GGATCC', cutIndex: 1 },
  { name: 'HindIII', site: 'AAGCTT', cutIndex: 1 },
  { name: 'NotI', site: 'GCGGCCGC', cutIndex: 2 },
  { name: 'XhoI', site: 'CTCGAG', cutIndex: 1 },
  { name: 'PstI', site: 'CTGCAG', cutIndex: 5 },
  { name: 'SmaI', site: 'CCCGGG', cutIndex: 3 },
  { name: 'KpnI', site: 'GGTACC', cutIndex: 5 },
  { name: 'SacI', site: 'GAGCTC', cutIndex: 5 },
  { name: 'NdeI', site: 'CATATG', cutIndex: 2 },
];

export interface RestrictionHit extends PatternHit {
  enzyme: string;
  site: string;
}

/**
 * Find restriction sites for one or more enzymes.
 * Defaults to COMMON_ENZYMES when enzymes is omitted.
 */
export function findRestrictionSites(
  sequence: string,
  enzymes: RestrictionEnzyme[] | string[] = COMMON_ENZYMES,
  options: Omit<FindPatternOptions, 'iupac'> = {}
): RestrictionHit[] {
  const list: RestrictionEnzyme[] =
    enzymes.length > 0 && typeof enzymes[0] === 'string'
      ? (enzymes as string[]).map((name) => {
          const found = COMMON_ENZYMES.find((e) => e.name.toLowerCase() === name.toLowerCase());
          if (!found) throw new Error(`unknown enzyme: ${name}`);
          return found;
        })
      : (enzymes as RestrictionEnzyme[]);

  const hits: RestrictionHit[] = [];
  for (const enzyme of list) {
    const matches = findMotif(sequence, enzyme.site, { strand: 'both', ...options });
    for (const m of matches) {
      hits.push({ ...m, enzyme: enzyme.name, site: enzyme.site });
    }
  }
  return hits.sort((a, b) => a.start - b.start);
}
