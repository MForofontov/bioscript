/**
 * Unit tests for normalization utilities
 */

import {
  normalizeSequence,
  normalizeToDna,
  normalizeToRna,
  rnaToDna,
  dnaToRna,
  isRna,
  isDna,
} from '../normalize';

describe('normalizeSequence', () => {
  it('1. should trim and uppercase sequence', () => {
    expect(normalizeSequence('  atcg  ')).toBe('ATCG');
  });

  it('2. should handle already normalized sequence', () => {
    expect(normalizeSequence('ATCG')).toBe('ATCG');
  });

  it('3. should handle lowercase sequence', () => {
    expect(normalizeSequence('atcg')).toBe('ATCG');
  });

  it('4. should handle mixed case sequence', () => {
    expect(normalizeSequence('AtCg')).toBe('ATCG');
  });

  it('5. should preserve RNA U', () => {
    expect(normalizeSequence('augc')).toBe('AUGC');
  });

  it('6. should handle whitespace', () => {
    expect(normalizeSequence('  ATCG  ')).toBe('ATCG');
  });

  it('7. should handle empty string', () => {
    expect(normalizeSequence('')).toBe('');
  });

  it('8. should handle sequence with N', () => {
    expect(normalizeSequence('atcgn')).toBe('ATCGN');
  });

  it('9. should be idempotent', () => {
    const seq = 'ATCG';
    expect(normalizeSequence(normalizeSequence(seq))).toBe(seq);
  });
});

describe('rnaToDna', () => {
  it('1. should convert RNA to DNA', () => {
    expect(rnaToDna('AUGC')).toBe('ATGC');
  });

  it('2. should preserve case', () => {
    expect(rnaToDna('augc')).toBe('atgc');
  });

  it('3. should handle mixed case', () => {
    expect(rnaToDna('AuGc')).toBe('AtGc');
  });

  it('4. should be idempotent for DNA', () => {
    expect(rnaToDna('ATGC')).toBe('ATGC');
  });

  it('5. should handle empty string', () => {
    expect(rnaToDna('')).toBe('');
  });

  it('6. should preserve N', () => {
    expect(rnaToDna('AUGCN')).toBe('ATGCN');
  });

  it('7. should convert all U characters', () => {
    expect(rnaToDna('UUUU')).toBe('TTTT');
  });
});

describe('dnaToRna', () => {
  it('1. should convert DNA to RNA', () => {
    expect(dnaToRna('ATGC')).toBe('AUGC');
  });

  it('2. should preserve case', () => {
    expect(dnaToRna('atgc')).toBe('augc');
  });

  it('3. should handle mixed case', () => {
    expect(dnaToRna('AtGc')).toBe('AuGc');
  });

  it('4. should be idempotent for RNA', () => {
    expect(dnaToRna('AUGC')).toBe('AUGC');
  });

  it('5. should handle empty string', () => {
    expect(dnaToRna('')).toBe('');
  });

  it('6. should preserve N', () => {
    expect(dnaToRna('ATGCN')).toBe('AUGCN');
  });

  it('7. should convert all T characters', () => {
    expect(dnaToRna('TTTT')).toBe('UUUU');
  });
});

describe('normalizeToDna', () => {
  it('1. should normalize RNA to DNA', () => {
    expect(normalizeToDna('  augc  ')).toBe('ATGC');
  });

  it('2. should normalize DNA', () => {
    expect(normalizeToDna('  atgc  ')).toBe('ATGC');
  });

  it('3. should handle mixed RNA/DNA', () => {
    expect(normalizeToDna('AUTGC')).toBe('ATTGC');
  });

  it('4. should be idempotent', () => {
    const seq = 'ATGC';
    expect(normalizeToDna(normalizeToDna(seq))).toBe(seq);
  });

  it('5. should handle empty string', () => {
    expect(normalizeToDna('')).toBe('');
  });

  it('6. should preserve N', () => {
    expect(normalizeToDna('augcn')).toBe('ATGCN');
  });

  it('7. should handle lowercase RNA', () => {
    expect(normalizeToDna('augc')).toBe('ATGC');
  });

  it('8. should handle mixed case RNA', () => {
    expect(normalizeToDna('AuGc')).toBe('ATGC');
  });
});

describe('normalizeToRna', () => {
  it('1. should normalize DNA to RNA', () => {
    expect(normalizeToRna('  atgc  ')).toBe('AUGC');
  });

  it('2. should normalize RNA', () => {
    expect(normalizeToRna('  augc  ')).toBe('AUGC');
  });

  it('3. should handle mixed RNA/DNA', () => {
    expect(normalizeToRna('AUTGC')).toBe('AUUGC');
  });

  it('4. should be idempotent', () => {
    const seq = 'AUGC';
    expect(normalizeToRna(normalizeToRna(seq))).toBe(seq);
  });

  it('5. should handle empty string', () => {
    expect(normalizeToRna('')).toBe('');
  });

  it('6. should preserve N', () => {
    expect(normalizeToRna('atgcn')).toBe('AUGCN');
  });

  it('7. should handle lowercase DNA', () => {
    expect(normalizeToRna('atgc')).toBe('AUGC');
  });

  it('8. should handle mixed case DNA', () => {
    expect(normalizeToRna('AtGc')).toBe('AUGC');
  });
});

describe('isRna', () => {
  it('1. should return true for RNA sequence', () => {
    expect(isRna('AUGC')).toBe(true);
  });

  it('2. should return true for lowercase RNA', () => {
    expect(isRna('augc')).toBe(true);
  });

  it('3. should return true for mixed case RNA', () => {
    expect(isRna('AuGc')).toBe(true);
  });

  it('4. should return false for DNA sequence', () => {
    expect(isRna('ATGC')).toBe(false);
  });

  it('5. should return false for empty string', () => {
    expect(isRna('')).toBe(false);
  });

  it('6. should return true if any U is present', () => {
    expect(isRna('ATUGC')).toBe(true);
  });

  it('7. should return false for sequence with only standard DNA bases', () => {
    expect(isRna('ATGCN')).toBe(false);
  });
});

describe('isDna', () => {
  it('1. should return true for DNA sequence', () => {
    expect(isDna('ATGC')).toBe(true);
  });

  it('2. should return true for lowercase DNA', () => {
    expect(isDna('atgc')).toBe(true);
  });

  it('3. should return true for mixed case DNA', () => {
    expect(isDna('AtGc')).toBe(true);
  });

  it('4. should return false for RNA sequence', () => {
    expect(isDna('AUGC')).toBe(false);
  });

  it('5. should return false for empty string', () => {
    expect(isDna('')).toBe(false);
  });

  it('6. should return true if any T is present', () => {
    expect(isDna('AUTGC')).toBe(true);
  });

  it('7. should return false for sequence with only standard RNA bases', () => {
    expect(isDna('AUGCN')).toBe(false);
  });
});

describe('Integration tests', () => {
  it('1. normalizeToDna and rnaToDna should produce same result for RNA input', () => {
    const rna = 'AUGC';
    expect(normalizeToDna(rna)).toBe(rnaToDna(rna.toUpperCase()));
  });

  it('2. normalizeToRna and dnaToRna should produce same result for DNA input', () => {
    const dna = 'ATGC';
    expect(normalizeToRna(dna)).toBe(dnaToRna(dna.toUpperCase()));
  });

  it('3. should handle round-trip conversion', () => {
    const originalDna = 'ATGC';
    const rna = dnaToRna(originalDna);
    const backToDna = rnaToDna(rna);
    expect(backToDna).toBe(originalDna);
  });

  it('4. isRna and isDna should be mutually exclusive for pure sequences', () => {
    expect(isRna('AUGC')).toBe(true);
    expect(isDna('AUGC')).toBe(false);

    expect(isDna('ATGC')).toBe(true);
    expect(isRna('ATGC')).toBe(false);
  });

  it('5. mixed T/U sequence should be detected as both', () => {
    const mixed = 'AUTGC';
    expect(isRna(mixed)).toBe(true);
    expect(isDna(mixed)).toBe(true);
  });
});
