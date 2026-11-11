import {
  isValidIupacMotif,
  assertIupacMotif,
  iupacToRegex,
  expandIupacBase,
  findPattern,
  findMotif,
  findExact,
  findConsensus,
  findRestrictionSites,
  COMMON_ENZYMES,
  gcContent,
  primerTm,
  checkPrimerPair,
} from '../index';

describe('iupac', () => {
  it('validates motifs', () => {
    expect(isValidIupacMotif('GAATTC')).toBe(true);
    expect(isValidIupacMotif('RYSWKM')).toBe(true);
    expect(isValidIupacMotif('')).toBe(false);
    expect(isValidIupacMotif('GAXTTC')).toBe(false);
  });

  it('assertIupacMotif throws on bad input', () => {
    expect(() => assertIupacMotif(123 as any)).toThrow(TypeError);
    expect(() => assertIupacMotif('ZZZ')).toThrow(/invalid IUPAC/);
  });

  it('expands motifs to regex and bases', () => {
    expect(iupacToRegex('GAATTC').test('GAATTC')).toBe(true);
    expect(iupacToRegex('R').test('A')).toBe(true);
    expect(iupacToRegex('R').test('G')).toBe(true);
    expect(iupacToRegex('R').test('C')).toBe(false);
    expect(expandIupacBase('N')).toBe('ACGT');
    expect(() => expandIupacBase('XX')).toThrow(TypeError);
    expect(() => expandIupacBase('Z')).toThrow(/unsupported/);
  });
});

describe('findPattern / motifs', () => {
  it('finds exact and overlapping matches', () => {
    const hits = findExact('AAAA', 'AA', { overlapping: true });
    expect(hits.map((h) => h.start)).toEqual([0, 1, 2]);
  });

  it('finds IUPAC motifs on both strands', () => {
    const hits = findMotif('GAATTC', 'GAATTC', { strand: 'both' });
    expect(hits.some((h) => h.strand === '+')).toBe(true);
    expect(hits.some((h) => h.strand === '-')).toBe(true);
  });

  it('accepts RegExp patterns', () => {
    const hits = findPattern('ACGTACGT', /CGT/g);
    expect(hits).toHaveLength(2);
  });

  it('builds consensus with IUPAC ambiguity', () => {
    expect(findConsensus(['ATGC', 'ATGC'])).toBe('ATGC');
    expect(findConsensus(['ATGC', 'ATGT'], 0.5)).toMatch(/^ATG[CY]$/);
    expect(() => findConsensus([])).toThrow(/non-empty/);
    expect(() => findConsensus(['AT', 'ATG'])).toThrow(/equal length/);
  });
});

describe('restriction', () => {
  it('finds EcoRI site', () => {
    const hits = findRestrictionSites('NNNGAATTCNNN', ['EcoRI']);
    // Palindromic site reports on both strands
    expect(hits.length).toBeGreaterThanOrEqual(1);
    expect(hits.every((h) => h.enzyme === 'EcoRI')).toBe(true);
    expect(hits.some((h) => h.start === 3 && h.strand === '+')).toBe(true);
  });

  it('searches common enzymes by default', () => {
    expect(COMMON_ENZYMES.length).toBeGreaterThan(5);
    const hits = findRestrictionSites('GGATCC');
    expect(hits.some((h) => h.enzyme === 'BamHI')).toBe(true);
  });

  it('throws on unknown enzyme name', () => {
    expect(() => findRestrictionSites('ATGC', ['NoSuchEnzyme'])).toThrow(/unknown enzyme/);
  });
});

describe('primer', () => {
  it('computes GC and Wallace Tm', () => {
    expect(gcContent('GCGC')).toBe(1);
    expect(gcContent('ATAT')).toBe(0);
    expect(primerTm('ATGC')).toBe(2 * 2 + 4 * 2);
    // Salt term is 16.6*log10([Na+]); 1M ≈ no change vs Wallace alone + 0
    expect(primerTm('ATGC', 1)).toBeCloseTo(primerTm('ATGC'), 5);
    expect(primerTm('ATGC', 0.05)).toBeLessThan(primerTm('ATGC'));
    expect(() => primerTm('')).toThrow(/empty/);
  });

  it('checks primer pairs and reports warnings', () => {
    const ok = checkPrimerPair('GCGCGCGC', 'GCGCGCGC');
    expect(ok.tmFwd).toBeGreaterThan(0);
    expect(typeof ok.ok).toBe('boolean');

    const bad = checkPrimerPair('AAAAAAAAAA', 'GGGGGGGGGG');
    expect(bad.warnings.length).toBeGreaterThan(0);
    expect(bad.ok).toBe(false);
  });
});
