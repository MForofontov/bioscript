import { smithWaterman } from '../smith-waterman';
import { BLOSUM62, DNA_SIMPLE } from '../matrices';

/**
 * Unit tests for Smith-Waterman local alignment.
 * Tests cover: normal alignments, local regions, edge cases, error handling.
 */
describe('smithWaterman', () => {
  // SECTION 1: Normal/typical usage (60% of tests)

  it('1. should find local alignment in identical sequences', () => {
    const result = smithWaterman('ACGT', 'ACGT', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
    });

    expect(result.alignedSeq1).toBe('ACGT');
    expect(result.alignedSeq2).toBe('ACGT');
    expect(result.identity).toBe(4);
    expect(result.identityPercent).toBe(100);
    expect(result.score).toBeGreaterThan(0);
  });

  it('2. should find best local region in longer sequences', () => {
    const result = smithWaterman('ACGTACGTTAGCTAGCT', 'TAGCTA', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
    });

    // Should find the matching region
    expect(result.alignedSeq1).toContain('TAGCT');
    expect(result.alignedSeq2).toContain('TAGCT');
    expect(result.score).toBeGreaterThan(0);
  });

  it('3. should find conserved domain in protein sequences', () => {
    const result = smithWaterman('HEAGAWGHEEHEAGAWGHEE', 'PAWHEAE', {
      matrix: 'BLOSUM62',
      gapOpen: -10,
      gapExtend: -1,
    });

    expect(result.alignedSeq1).toBeDefined();
    expect(result.alignedSeq2).toBeDefined();
    expect(result.score).toBeGreaterThan(0);
    expect(result.startPos1).toBeGreaterThanOrEqual(0);
    expect(result.startPos2).toBeGreaterThanOrEqual(0);
  });

  it('4. should report correct start and end positions', () => {
    const result = smithWaterman('AAACGTAAA', 'CGT', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
    });

    expect(result.alignedSeq1).toBe('CGT');
    expect(result.alignedSeq2).toBe('CGT');
    expect(result.startPos1).toBe(3); // Starts at position 3 in seq1
    expect(result.endPos1).toBe(6); // Ends at position 6
  });

  it('5. should normalize sequences to uppercase by default', () => {
    const result = smithWaterman('acgt', 'ACGT', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
    });

    expect(result.alignedSeq1).toBe('ACGT');
    expect(result.alignedSeq2).toBe('ACGT');
    expect(result.identity).toBe(4);
  });

  it('6. should respect normalize=false option', () => {
    const result = smithWaterman('acgt', 'acgt', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
      normalize: false,
    });

    expect(result.alignedSeq1).toBe('acgt');
    expect(result.alignedSeq2).toBe('acgt');
  });

  it('7. should use default parameters when options not provided', () => {
    const result = smithWaterman('ACGT', 'ACGT');

    expect(result.alignedSeq1).toBe('ACGT');
    expect(result.alignedSeq2).toBe('ACGT');
    expect(result.score).toBeGreaterThan(0);
  });

  it('8. should introduce gaps in local alignment', () => {
    const result = smithWaterman('ACGTA', 'ACT', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
    });

    // Should find best local alignment, possibly with gaps
    expect(result.score).toBeGreaterThan(0);
    expect(result.alignmentLength).toBeGreaterThanOrEqual(2);
  });

  it('9. should work with custom scoring matrix', () => {
    const customMatrix = {
      A: { A: 10, C: -5, G: -5, T: -5 },
      C: { A: -5, C: 10, G: -5, T: -5 },
      G: { A: -5, C: -5, G: 10, T: -5 },
      T: { A: -5, C: -5, G: -5, T: 10 },
    };

    const result = smithWaterman('ACGT', 'ACGT', {
      matrix: customMatrix,
      gapOpen: -5,
      gapExtend: -2,
    });

    expect(result.identity).toBe(4);
    expect(result.score).toBeGreaterThan(0);
  });

  it('10. should calculate identity percentage correctly', () => {
    const result = smithWaterman('AAAA', 'AA', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
    });

    expect(result.identity).toBe(2);
    expect(result.identityPercent).toBe(100);
  });


  it('11. should handle single character sequences', () => {
    const result = smithWaterman('A', 'A', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
    });

    expect(result.alignedSeq1).toBe('A');
    expect(result.alignedSeq2).toBe('A');
    expect(result.identity).toBe(1);
  });

  it('12. should return empty alignment when no good match exists', () => {
    const result = smithWaterman('AAAA', 'TTTT', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
      minScore: 100, // Set high threshold
    });

    expect(result.alignedSeq1).toBe('');
    expect(result.alignedSeq2).toBe('');
    expect(result.score).toBe(0);
    expect(result.identity).toBe(0);
  });

  it('13. should respect minScore threshold', () => {
    const result = smithWaterman('ACGTACGT', 'ACGT', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
      minScore: 5,
    });

    expect(result.score).toBeGreaterThanOrEqual(5);
  });

  it('14. should handle sequences with whitespace when normalized', () => {
    const result = smithWaterman('  ACGT  ', '  ACG  ', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
      normalize: true,
    });

    expect(result.alignedSeq1).toBe('ACG');
    expect(result.alignedSeq2).toBe('ACG');
  });

  it('15. should find short match in long sequences', () => {
    const seq1 = 'A'.repeat(50) + 'CGTA' + 'T'.repeat(50);
    const seq2 = 'CGTA';

    const result = smithWaterman(seq1, seq2, {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
    });

    expect(result.alignedSeq1).toBe('CGTA');
    expect(result.alignedSeq2).toBe('CGTA');
    expect(result.identity).toBe(4);
  });

  it('16. should handle affine gap penalties correctly', () => {
    const result = smithWaterman('ACGTA', 'ACGT', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -10,
      gapExtend: -1,
    });

    // Should prefer matching regions over gaps
    expect(result.score).toBeGreaterThan(0);
  });

  it('17. should align long sequences efficiently', () => {
    const seq1 = 'A'.repeat(50) + 'CGTA'.repeat(10) + 'T'.repeat(50);
    const seq2 = 'CGTA'.repeat(10);

    const startTime = performance.now();
    const result = smithWaterman(seq1, seq2, {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
    });
    const duration = performance.now() - startTime;

    expect(result.score).toBeGreaterThan(0);
    expect(duration).toBeLessThan(100); // Should complete in <100ms
  });

  it('18. should throw TypeError when seq1 is not a string', () => {
    expect(() => smithWaterman(123 as any, 'ACGT')).toThrow(TypeError);
    expect(() => smithWaterman(123 as any, 'ACGT')).toThrow(
      'seq1 must be a string'
    );
  });

  it('19. should throw TypeError when seq2 is not a string', () => {
    expect(() => smithWaterman('ACGT', 123 as any)).toThrow(TypeError);
    expect(() => smithWaterman('ACGT', 123 as any)).toThrow(
      'seq2 must be a string'
    );
  });

  it('20. should throw Error for empty sequence after normalization', () => {
    expect(() => smithWaterman('', 'ACGT')).toThrow(Error);
    expect(() => smithWaterman('', 'ACGT')).toThrow('empty');
  });

  it('21. should throw Error for whitespace-only sequences', () => {
    expect(() => smithWaterman('   ', 'ACGT')).toThrow(Error);
    expect(() => smithWaterman('ACGT', '   ')).toThrow(Error);
  });

  it('22. should throw Error for positive gapOpen penalty', () => {
    expect(() => smithWaterman('ACGT', 'ACGT', { gapOpen: 5 })).toThrow(
      Error
    );
    expect(() => smithWaterman('ACGT', 'ACGT', { gapOpen: 5 })).toThrow(
      'gapOpen must be ≤ 0'
    );
  });

  it('23. should throw Error for positive gapExtend penalty', () => {
    expect(() => smithWaterman('ACGT', 'ACGT', { gapExtend: 5 })).toThrow(
      Error
    );
    expect(() => smithWaterman('ACGT', 'ACGT', { gapExtend: 5 })).toThrow(
      'gapExtend must be ≤ 0'
    );
  });
});
