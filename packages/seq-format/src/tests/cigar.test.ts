/**
 * Unit tests for CIGAR string utilities.
 */

import {
  parseCIGAR,
  formatCIGAR,
  getCIGARStats,
  cigarToAlignedSequence,
  validateCIGAR,
} from '../cigar';

describe('parseCIGAR', () => {
  // Normal usage
  it('1. should parse simple CIGAR string', () => {
    const ops = parseCIGAR('8M');
    
    expect(ops).toEqual([{ length: 8, operation: 'M' }]);
  });

  it('2. should parse complex CIGAR string', () => {
    const ops = parseCIGAR('8M2I4M1D3M');
    
    expect(ops).toEqual([
      { length: 8, operation: 'M' },
      { length: 2, operation: 'I' },
      { length: 4, operation: 'M' },
      { length: 1, operation: 'D' },
      { length: 3, operation: 'M' },
    ]);
  });

  it('3. should parse CIGAR with all operation types', () => {
    const ops = parseCIGAR('5M2I3D1N4S2H1P3=2X');
    
    expect(ops).toHaveLength(9);
    expect(ops[0]).toEqual({ length: 5, operation: 'M' });
    expect(ops[7]).toEqual({ length: 3, operation: '=' });
    expect(ops[8]).toEqual({ length: 2, operation: 'X' });
  });

  // Edge cases
  it('10. should handle unmapped CIGAR (*)', () => {
    const ops = parseCIGAR('*');
    
    expect(ops).toEqual([]);
  });

  it('11. should handle large numbers', () => {
    const ops = parseCIGAR('1000000M');
    
    expect(ops).toEqual([{ length: 1000000, operation: 'M' }]);
  });

  // Error cases
  it('15. should throw TypeError for non-string input', () => {
    expect(() => parseCIGAR(123 as any)).toThrow(TypeError);
    expect(() => parseCIGAR(123 as any)).toThrow('cigar must be a string');
  });

  it('16. should throw Error for invalid CIGAR string', () => {
    expect(() => parseCIGAR('8Q')).toThrow(Error);
    expect(() => parseCIGAR('8Q')).toThrow('Invalid CIGAR string');
  });

  it('17. should throw Error for empty CIGAR string', () => {
    expect(() => parseCIGAR('')).toThrow(Error);
  });
});

describe('formatCIGAR', () => {
  // Normal usage
  it('1. should format simple CIGAR operations', () => {
    const ops = [{ length: 8, operation: 'M' as const }];
    const cigar = formatCIGAR(ops);
    
    expect(cigar).toBe('8M');
  });

  it('2. should format complex CIGAR operations', () => {
    const ops = [
      { length: 8, operation: 'M' as const },
      { length: 2, operation: 'I' as const },
      { length: 4, operation: 'M' as const },
      { length: 1, operation: 'D' as const },
      { length: 3, operation: 'M' as const },
    ];
    const cigar = formatCIGAR(ops);
    
    expect(cigar).toBe('8M2I4M1D3M');
  });

  // Edge cases
  it('10. should handle empty operations array', () => {
    const cigar = formatCIGAR([]);
    
    expect(cigar).toBe('*');
  });

  it('11. should handle single operation', () => {
    const ops = [{ length: 100, operation: 'M' as const }];
    const cigar = formatCIGAR(ops);
    
    expect(cigar).toBe('100M');
  });

  // Error cases
  it('15. should throw TypeError for non-array input', () => {
    expect(() => formatCIGAR('8M' as any)).toThrow(TypeError);
    expect(() => formatCIGAR('8M' as any)).toThrow('operations must be an array');
  });

  it('16. should throw Error for invalid operation length', () => {
    const ops = [{ length: 0, operation: 'M' as const }];
    
    expect(() => formatCIGAR(ops)).toThrow(Error);
    expect(() => formatCIGAR(ops)).toThrow('Invalid operation length');
  });

  it('17. should throw Error for invalid operation type', () => {
    const ops = [{ length: 8, operation: 123 as any }];
    
    expect(() => formatCIGAR(ops)).toThrow(Error);
    expect(() => formatCIGAR(ops)).toThrow('Invalid operation type');
  });
});

describe('getCIGARStats', () => {
  // Normal usage
  it('1. should calculate stats for simple alignment', () => {
    const ops = parseCIGAR('8M');
    const stats = getCIGARStats(ops);
    
    expect(stats.alignedLength).toBe(8);
    expect(stats.matches).toBe(8);
    expect(stats.referenceLength).toBe(8);
    expect(stats.queryLength).toBe(8);
  });

  it('2. should calculate stats for complex alignment', () => {
    const ops = parseCIGAR('8M2I4M1D3M');
    const stats = getCIGARStats(ops);
    
    expect(stats.alignedLength).toBe(18);
    expect(stats.matches).toBe(15);
    expect(stats.insertions).toBe(2);
    expect(stats.deletions).toBe(1);
    expect(stats.referenceLength).toBe(16);
    expect(stats.queryLength).toBe(17);
  });

  it('3. should calculate stats with soft clipping', () => {
    const ops = parseCIGAR('5S8M2S');
    const stats = getCIGARStats(ops);
    
    expect(stats.softClipped).toBe(7);
    expect(stats.matches).toBe(8);
    expect(stats.queryLength).toBe(15);
    expect(stats.referenceLength).toBe(8);
  });

  it('4. should calculate stats with hard clipping', () => {
    const ops = parseCIGAR('5H8M3H');
    const stats = getCIGARStats(ops);
    
    expect(stats.hardClipped).toBe(8);
    expect(stats.matches).toBe(8);
    expect(stats.queryLength).toBe(8);
  });

  it('5. should distinguish = and X operations', () => {
    const ops = parseCIGAR('5=2X3=');
    const stats = getCIGARStats(ops);
    
    expect(stats.matches).toBe(8);
    expect(stats.mismatches).toBe(2);
    expect(stats.alignedLength).toBe(10);
  });

  it('6. should handle skip regions (N)', () => {
    const ops = parseCIGAR('5M100N5M');
    const stats = getCIGARStats(ops);
    
    expect(stats.matches).toBe(10);
    expect(stats.referenceLength).toBe(110);
    expect(stats.queryLength).toBe(10);
    expect(stats.alignedLength).toBe(10);
  });

  // Edge cases
  it('10. should handle empty operations', () => {
    const stats = getCIGARStats([]);
    
    expect(stats.alignedLength).toBe(0);
    expect(stats.matches).toBe(0);
    expect(stats.referenceLength).toBe(0);
  });

  it('11. should handle padding operation', () => {
    const ops = parseCIGAR('5M2P5M');
    const stats = getCIGARStats(ops);
    
    expect(stats.matches).toBe(10);
    expect(stats.referenceLength).toBe(10);
  });

  // Error cases
  it('15. should throw TypeError for non-array input', () => {
    expect(() => getCIGARStats('8M' as any)).toThrow(TypeError);
    expect(() => getCIGARStats('8M' as any)).toThrow('operations must be an array');
  });
});

describe('cigarToAlignedSequence', () => {
  // Normal usage
  it('1. should align sequence with matches', () => {
    const aligned = cigarToAlignedSequence('8M', 'ACGTACGT');
    
    expect(aligned.query).toBe('ACGTACGT');
    expect(aligned.reference).toBe('ACGTACGT');
  });

  it('2. should align sequence with insertions', () => {
    const aligned = cigarToAlignedSequence('3M2I3M', 'ACGTAACG');
    
    expect(aligned.query).toBe('ACGTAACG');
    expect(aligned.reference).toBe('ACG--ACG');
  });

  it('3. should align sequence with deletions', () => {
    const aligned = cigarToAlignedSequence('3M2D3M', 'ACGACG');
    
    expect(aligned.query).toBe('ACG--ACG');
    expect(aligned.reference).toBe('ACGNNACG');
  });

  it('4. should align sequence with soft clipping', () => {
    const aligned = cigarToAlignedSequence('2S4M2S', 'TTACGTGG');
    
    expect(aligned.query).toBe('ttACGTgg');
    expect(aligned.reference).toBe('--ACGT--');
  });

  it('5. should align complex sequence', () => {
    const aligned = cigarToAlignedSequence('3M2I2M1D2M', 'ACGTACGTA');
    
    expect(aligned.query).toBe('ACGTACG-TA');
    expect(aligned.reference).toBe('ACG--CGNTA');
  });

  // Edge cases
  it('10. should handle hard clipping', () => {
    const aligned = cigarToAlignedSequence('2H5M3H', 'ACGTA');
    
    expect(aligned.query).toBe('ACGTA');
    expect(aligned.reference).toBe('ACGTA');
  });

  it('11. should handle skip regions', () => {
    const aligned = cigarToAlignedSequence('3M5N3M', 'ACGACG');
    
    expect(aligned.query).toBe('ACG     ACG');
    expect(aligned.reference).toBe('ACG     ACG');
  });

  it('12. should handle padding', () => {
    const aligned = cigarToAlignedSequence('3M2P3M', 'ACGACG');
    
    expect(aligned.query).toBe('ACG**ACG');
    expect(aligned.reference).toBe('ACG**ACG');
  });

  // Error cases
  it('15. should throw TypeError for non-string cigar', () => {
    expect(() => cigarToAlignedSequence(123 as any, 'ACGT')).toThrow(TypeError);
    expect(() => cigarToAlignedSequence(123 as any, 'ACGT')).toThrow(
      'cigar must be a string'
    );
  });

  it('16. should throw TypeError for non-string query', () => {
    expect(() => cigarToAlignedSequence('4M', 123 as any)).toThrow(TypeError);
    expect(() => cigarToAlignedSequence('4M', 123 as any)).toThrow(
      'querySeq must be a string'
    );
  });

  it('17. should throw Error for mismatched length', () => {
    expect(() => cigarToAlignedSequence('8M', 'ACGT')).toThrow(Error);
    expect(() => cigarToAlignedSequence('8M', 'ACGT')).toThrow(
      "Query sequence length (4) doesn't match CIGAR query length (8)"
    );
  });
});

describe('validateCIGAR', () => {
  // Normal usage
  it('1. should validate simple CIGAR', () => {
    expect(validateCIGAR('8M')).toBe(true);
  });

  it('2. should validate complex CIGAR', () => {
    expect(validateCIGAR('8M2I4M1D3M')).toBe(true);
  });

  it('3. should validate all operation types', () => {
    expect(validateCIGAR('5M2I3D1N4S2H1P3=2X')).toBe(true);
  });

  it('4. should validate unmapped (*)', () => {
    expect(validateCIGAR('*')).toBe(true);
  });

  // Edge cases
  it('10. should validate large numbers', () => {
    expect(validateCIGAR('1000000M')).toBe(true);
  });

  it('11. should invalidate empty string', () => {
    expect(validateCIGAR('')).toBe(false);
  });

  it('12. should invalidate invalid operations', () => {
    expect(validateCIGAR('8Q')).toBe(false);
    expect(validateCIGAR('8M2Z4M')).toBe(false);
  });

  it('13. should invalidate missing numbers', () => {
    expect(validateCIGAR('M')).toBe(false);
    expect(validateCIGAR('8M2')).toBe(false);
  });

  it('14. should invalidate non-string input', () => {
    expect(validateCIGAR(123 as any)).toBe(false);
  });
});
