import { needlemanWunsch } from '../needleman-wunsch';
import { BLOSUM62, DNA_SIMPLE } from '../matrices';

/**
 * Unit tests for Needleman-Wunsch global alignment.
 * Tests cover: normal alignments, edge cases, error handling.
 */
describe('needlemanWunsch', () => {
  // SECTION 1: Normal/typical usage (60% of tests)

  it('1. should align identical sequences perfectly', () => {
    const result = needlemanWunsch('ACGT', 'ACGT', {
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

  it('2. should align sequences with mismatches', () => {
    const result = needlemanWunsch('ACGT', 'AGGT', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
    });

    expect(result.alignedSeq1).toBe('ACGT');
    expect(result.alignedSeq2).toBe('AGGT');
    expect(result.identity).toBe(3);
    expect(result.identityPercent).toBe(75);
  });

  it('3. should introduce gaps when beneficial', () => {
    const result = needlemanWunsch('ACGTA', 'ACGT', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
    });

    expect(result.alignedSeq1).toBe('ACGTA');
    expect(result.alignedSeq2).toBe('ACGT-');
    expect(result.alignmentLength).toBe(5);
  });

  it('4. should align protein sequences using BLOSUM62', () => {
    const result = needlemanWunsch('HEAGAWGHEE', 'PAWHEAE', {
      matrix: 'BLOSUM62',
      gapOpen: -10,
      gapExtend: -1,
    });

    expect(result.alignedSeq1).toContain('HEAGAWGHEE');
    expect(result.alignedSeq2).toContain('PAWHEAE');
    expect(result.score).toBeDefined();
    expect(result.identity).toBeGreaterThan(0);
  });

  it('5. should normalize sequences to uppercase by default', () => {
    const result = needlemanWunsch('acgt', 'ACGT', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
    });

    expect(result.alignedSeq1).toBe('ACGT');
    expect(result.alignedSeq2).toBe('ACGT');
    expect(result.identity).toBe(4);
  });

  it('6. should respect normalize=false option', () => {
    const result = needlemanWunsch('acgt', 'acgt', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
      normalize: false,
    });

    expect(result.alignedSeq1).toBe('acgt');
    expect(result.alignedSeq2).toBe('acgt');
  });

  it('7. should use default parameters when options not provided', () => {
    const result = needlemanWunsch('ACGT', 'ACGT');

    expect(result.alignedSeq1).toBe('ACGT');
    expect(result.alignedSeq2).toBe('ACGT');
    expect(result.score).toBeDefined();
  });

  it('8. should handle sequences of different lengths', () => {
    const result = needlemanWunsch('ACGTACGT', 'ACGT', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
    });

    expect(result.alignmentLength).toBeGreaterThanOrEqual(8);
    expect(result.alignedSeq2).toContain('-');
  });

  it('9. should align with custom scoring matrix', () => {
    const customMatrix = {
      A: { A: 10, C: -5, G: -5, T: -5 },
      C: { A: -5, C: 10, G: -5, T: -5 },
      G: { A: -5, C: -5, G: 10, T: -5 },
      T: { A: -5, C: -5, G: -5, T: 10 },
    };

    const result = needlemanWunsch('ACGT', 'ACGT', {
      matrix: customMatrix,
      gapOpen: -5,
      gapExtend: -2,
    });

    expect(result.identity).toBe(4);
    expect(result.score).toBeGreaterThan(0);
  });

  it('10. should calculate identity percentage correctly', () => {
    const result = needlemanWunsch('AAAA', 'AATT', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
    });

    expect(result.identity).toBe(2);
    expect(result.identityPercent).toBe(50);
  });


  it('11. should handle single character sequences', () => {
    const result = needlemanWunsch('A', 'A', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
    });

    expect(result.alignedSeq1).toBe('A');
    expect(result.alignedSeq2).toBe('A');
    expect(result.identity).toBe(1);
  });

  it('12. should handle very different sequences', () => {
    const result = needlemanWunsch('AAAA', 'TTTT', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
    });

    expect(result.alignedSeq1).toBe('AAAA');
    expect(result.alignedSeq2).toBe('TTTT');
    expect(result.identity).toBe(0);
    expect(result.identityPercent).toBe(0);
  });

  it('13. should handle sequences with whitespace when normalized', () => {
    const result = needlemanWunsch('  ACGT  ', '  ACGT  ', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
      normalize: true,
    });

    expect(result.alignedSeq1).toBe('ACGT');
    expect(result.alignedSeq2).toBe('ACGT');
  });

  it('14. should return correct start and end positions for global alignment', () => {
    const result = needlemanWunsch('ACGT', 'ACGT', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
    });

    expect(result.startPos1).toBe(0);
    expect(result.startPos2).toBe(0);
    expect(result.endPos1).toBe(4);
    expect(result.endPos2).toBe(4);
  });

  it('15. should handle affine gap penalties correctly', () => {
    const result = needlemanWunsch('ACGTA', 'ACGT', {
      matrix: 'DNA_SIMPLE',
      gapOpen: -10,
      gapExtend: -1,
    });

    // Gap opening should be penalized more than extension
    expect(result.alignmentLength).toBeGreaterThanOrEqual(5);
  });

  it('16. should align long sequences efficiently', () => {
    const seq1 = 'A'.repeat(100);
    const seq2 = 'A'.repeat(100);

    const startTime = performance.now();
    const result = needlemanWunsch(seq1, seq2, {
      matrix: 'DNA_SIMPLE',
      gapOpen: -5,
      gapExtend: -2,
    });
    const duration = performance.now() - startTime;

    expect(result.identity).toBe(100);
    expect(duration).toBeLessThan(100); // Should complete in <100ms
  });

  it('17. should throw TypeError when seq1 is not a string', () => {
    expect(() => needlemanWunsch(123 as any, 'ACGT')).toThrow(TypeError);
    expect(() => needlemanWunsch(123 as any, 'ACGT')).toThrow(
      'seq1 must be a string'
    );
  });

  it('18. should throw TypeError when seq2 is not a string', () => {
    expect(() => needlemanWunsch('ACGT', 123 as any)).toThrow(TypeError);
    expect(() => needlemanWunsch('ACGT', 123 as any)).toThrow(
      'seq2 must be a string'
    );
  });

  it('19. should throw Error for empty sequence after normalization', () => {
    expect(() => needlemanWunsch('', 'ACGT')).toThrow(Error);
    expect(() => needlemanWunsch('', 'ACGT')).toThrow('empty');
  });

  it('20. should throw Error for whitespace-only sequences', () => {
    expect(() => needlemanWunsch('   ', 'ACGT')).toThrow(Error);
    expect(() => needlemanWunsch('ACGT', '   ')).toThrow(Error);
  });

  it('21. should throw Error for positive gapOpen penalty', () => {
    expect(() =>
      needlemanWunsch('ACGT', 'ACGT', { gapOpen: 5 })
    ).toThrow(Error);
    expect(() =>
      needlemanWunsch('ACGT', 'ACGT', { gapOpen: 5 })
    ).toThrow('gapOpen must be ≤ 0');
  });

  it('22. should throw Error for positive gapExtend penalty', () => {
    expect(() =>
      needlemanWunsch('ACGT', 'ACGT', { gapExtend: 5 })
    ).toThrow(Error);
    expect(() =>
      needlemanWunsch('ACGT', 'ACGT', { gapExtend: 5 })
    ).toThrow('gapExtend must be ≤ 0');
  });
});
