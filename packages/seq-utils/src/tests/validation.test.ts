/**
 * Unit tests for validation utilities
 */

import {
  assertString,
  assertNumber,
  assertTwoSequences,
  validateSequence,
  assertValidSequence,
  isValidSequence,
} from '../validation';

describe('assertString', () => {
  it('1. should not throw for valid string', () => {
    expect(() => assertString('ATCG', 'sequence')).not.toThrow();
  });

  it('2. should throw TypeError for number', () => {
    expect(() => assertString(123 as any, 'sequence')).toThrow(TypeError);
    expect(() => assertString(123 as any, 'sequence')).toThrow('sequence must be a string, got number');
  });

  it('3. should throw TypeError for null', () => {
    expect(() => assertString(null as any, 'sequence')).toThrow(TypeError);
    expect(() => assertString(null as any, 'sequence')).toThrow('sequence must be a string, got object');
  });

  it('4. should throw TypeError for undefined', () => {
    expect(() => assertString(undefined as any, 'sequence')).toThrow(TypeError);
    expect(() => assertString(undefined as any, 'sequence')).toThrow('sequence must be a string, got undefined');
  });

  it('5. should throw TypeError for object', () => {
    expect(() => assertString({} as any, 'sequence')).toThrow(TypeError);
    expect(() => assertString({} as any, 'sequence')).toThrow('sequence must be a string, got object');
  });

  it('6. should throw TypeError for array', () => {
    expect(() => assertString([] as any, 'sequence')).toThrow(TypeError);
    expect(() => assertString([] as any, 'sequence')).toThrow('sequence must be a string, got object');
  });
});

describe('assertNumber', () => {
  it('1. should not throw for valid number', () => {
    expect(() => assertNumber(42, 'k')).not.toThrow();
  });

  it('2. should not throw for zero', () => {
    expect(() => assertNumber(0, 'k')).not.toThrow();
  });

  it('3. should not throw for negative number', () => {
    expect(() => assertNumber(-5, 'k')).not.toThrow();
  });

  it('4. should throw TypeError for string', () => {
    expect(() => assertNumber('42' as any, 'k')).toThrow(TypeError);
    expect(() => assertNumber('42' as any, 'k')).toThrow('k must be a number, got string');
  });

  it('5. should throw TypeError for null', () => {
    expect(() => assertNumber(null as any, 'k')).toThrow(TypeError);
    expect(() => assertNumber(null as any, 'k')).toThrow('k must be a number, got object');
  });

  it('6. should throw TypeError for undefined', () => {
    expect(() => assertNumber(undefined as any, 'k')).toThrow(TypeError);
    expect(() => assertNumber(undefined as any, 'k')).toThrow('k must be a number, got undefined');
  });
});

describe('assertTwoSequences', () => {
  it('1. should not throw for two valid strings', () => {
    expect(() => assertTwoSequences('ATCG', 'GCTA')).not.toThrow();
  });

  it('2. should throw TypeError if first sequence is not a string', () => {
    expect(() => assertTwoSequences(123 as any, 'GCTA')).toThrow(TypeError);
    expect(() => assertTwoSequences(123 as any, 'GCTA')).toThrow('seq1 must be a string');
  });

  it('3. should throw TypeError if second sequence is not a string', () => {
    expect(() => assertTwoSequences('ATCG', 123 as any)).toThrow(TypeError);
    expect(() => assertTwoSequences('ATCG', 123 as any)).toThrow('seq2 must be a string');
  });

  it('4. should use custom parameter names in error messages', () => {
    expect(() => assertTwoSequences(123 as any, 'GCTA', 'query', 'target')).toThrow('query must be a string');
    expect(() => assertTwoSequences('ATCG', 123 as any, 'query', 'target')).toThrow('target must be a string');
  });

  it('5. should throw for null values', () => {
    expect(() => assertTwoSequences(null as any, 'GCTA')).toThrow(TypeError);
    expect(() => assertTwoSequences('ATCG', null as any)).toThrow(TypeError);
  });
});

describe('validateSequence', () => {
  it('1. should not throw for valid DNA sequence', () => {
    expect(() => validateSequence('ATCG', true)).not.toThrow();
  });

  it('2. should not throw for valid RNA sequence', () => {
    expect(() => validateSequence('AUCG', true)).not.toThrow();
  });

  it('3. should not throw for sequence with N', () => {
    expect(() => validateSequence('ATCGN', true)).not.toThrow();
  });

  it('4. should not throw for lowercase sequence', () => {
    expect(() => validateSequence('atcg', true)).not.toThrow();
  });

  it('5. should not throw for mixed case sequence', () => {
    expect(() => validateSequence('AtCg', true)).not.toThrow();
  });

  it('6. should throw Error for invalid characters in strict mode', () => {
    expect(() => validateSequence('ATCXYZ', true)).toThrow(Error);
    expect(() => validateSequence('ATCXYZ', true)).toThrow('invalid characters');
  });

  it('7. should not throw for invalid characters in non-strict mode', () => {
    expect(() => validateSequence('ATCXYZ', false)).not.toThrow();
  });

  it('8. should not throw for empty sequence', () => {
    expect(() => validateSequence('', true)).not.toThrow();
  });

  it('9. should throw for numeric characters in strict mode', () => {
    expect(() => validateSequence('ATC123', true)).toThrow(Error);
  });

  it('10. should throw for special characters in strict mode', () => {
    expect(() => validateSequence('ATC-GTA', true)).toThrow(Error);
  });
});

describe('assertValidSequence', () => {
  it('1. should not throw for valid DNA sequence', () => {
    expect(() => assertValidSequence('ATCG')).not.toThrow();
  });

  it('2. should not throw for valid RNA sequence', () => {
    expect(() => assertValidSequence('AUCG')).not.toThrow();
  });

  it('3. should not throw for lowercase sequence', () => {
    expect(() => assertValidSequence('atcg')).not.toThrow();
  });

  it('4. should throw Error for invalid characters', () => {
    expect(() => assertValidSequence('ATCXYZ')).toThrow(Error);
    expect(() => assertValidSequence('ATCXYZ')).toThrow('sequence contains invalid characters');
  });

  it('5. should not throw for empty sequence', () => {
    expect(() => assertValidSequence('')).not.toThrow();
  });

  it('6. should throw for numeric characters', () => {
    expect(() => assertValidSequence('ATC123')).toThrow(Error);
  });
});

describe('isValidSequence', () => {
  it('1. should return true for valid DNA sequence', () => {
    expect(isValidSequence('ATCG')).toBe(true);
  });

  it('2. should return true for valid RNA sequence', () => {
    expect(isValidSequence('AUCG')).toBe(true);
  });

  it('3. should return true for sequence with N', () => {
    expect(isValidSequence('ATCGN')).toBe(true);
  });

  it('4. should return true for lowercase sequence', () => {
    expect(isValidSequence('atcg')).toBe(true);
  });

  it('5. should return true for IUPAC ambiguity codes', () => {
    expect(isValidSequence('ATCGRYKMSWBDHV')).toBe(true);
  });

  it('6. should return false for invalid characters', () => {
    expect(isValidSequence('ATCXYZ')).toBe(false);
  });

  it('7. should return false for non-string input', () => {
    expect(isValidSequence(123 as any)).toBe(false);
    expect(isValidSequence(null as any)).toBe(false);
    expect(isValidSequence(undefined as any)).toBe(false);
  });

  it('8. should return false for empty string', () => {
    expect(isValidSequence('')).toBe(false);
  });

  it('9. should return false for ambiguity codes when not allowed', () => {
    expect(isValidSequence('ATCGRYKMSWBDHV', false)).toBe(false);
  });

  it('10. should return true for standard bases when ambiguity not allowed', () => {
    expect(isValidSequence('ATCGUN', false)).toBe(true);
  });
});
