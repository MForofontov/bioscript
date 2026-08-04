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

  it('honors ignoreCase for literal and RegExp patterns', () => {
    const literal = findPattern('ACGTACGT', 'acgt', { ignoreCase: false });
    expect(literal).toHaveLength(0);
    const literalCi = findPattern('ACGTACGT', 'acgt', { ignoreCase: true });
    expect(literalCi.length).toBeGreaterThan(0);

    const regex = findPattern('ACGT', /acgt/, { ignoreCase: false });
    expect(regex).toHaveLength(0);
    const regexCi = findPattern('ACGT', /acgt/, { ignoreCase: true });
    expect(regexCi).toHaveLength(1);
  });

  it('reports coding-oriented match on minus strand', () => {
    const seq = 'AAAGGCCATTTT';
    const hits = findPattern(seq, 'ATGGCC', { strand: '-' });
    expect(hits[0].start).toBe(3);
    expect(hits[0].end).toBe(9);
    expect(hits[0].match).toBe('ATGGCC');
    expect(seq.slice(hits[0].start, hits[0].end)).toBe('GGCCAT');
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
    // Palindromic site is reported once (deduped across strands)
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ enzyme: 'EcoRI', start: 3, end: 9, strand: '+' });
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
