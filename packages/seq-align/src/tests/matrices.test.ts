import {
  BLOSUM62,
  BLOSUM80,
  PAM250,
  DNA_SIMPLE,
  DNA_FULL,
  MATRICES,
  getMatrix,
  getScore,
} from '../matrices';

/**
 * Unit tests for scoring matrices.
 * Tests cover: matrix structures, getMatrix function, getScore function.
 */
describe('matrices', () => {
  it('1. should have BLOSUM62 matrix with correct dimensions', () => {
    expect(BLOSUM62).toBeDefined();
    expect(Object.keys(BLOSUM62)).toHaveLength(20);
    expect(Object.keys(BLOSUM62.A)).toHaveLength(20);
  });

  it('2. should have correct BLOSUM62 scores for common amino acids', () => {
    expect(BLOSUM62.A.A).toBe(4); // Match
    expect(BLOSUM62.A.R).toBe(-1); // Mismatch
    expect(BLOSUM62.W.W).toBe(11); // High score for rare amino acid
  });

  it('3. should have symmetric scoring matrices', () => {
    expect(BLOSUM62.A.R).toBe(BLOSUM62.R.A);
    expect(BLOSUM62.K.M).toBe(BLOSUM62.M.K);
    expect(PAM250.F.Y).toBe(PAM250.Y.F);
  });

  it('4. should get BLOSUM62 by name', () => {
    const matrix = getMatrix('BLOSUM62');
    expect(matrix).toBe(BLOSUM62);
  });

  it('5. should get matrix case-insensitively', () => {
    const matrix1 = getMatrix('blosum62');
    const matrix2 = getMatrix('BLOSUM62');
    const matrix3 = getMatrix('BlOsUm62');

    expect(matrix1).toBe(BLOSUM62);
    expect(matrix2).toBe(BLOSUM62);
    expect(matrix3).toBe(BLOSUM62);
  });

  it('6. should get score for matching amino acids', () => {
    const score = getScore(BLOSUM62, 'A', 'A');
    expect(score).toBe(4);
  });

  it('7. should get score for non-matching amino acids', () => {
    const score = getScore(BLOSUM62, 'A', 'R');
    expect(score).toBe(-1);
  });

  it('8. should handle lowercase characters in getScore', () => {
    const score1 = getScore(BLOSUM62, 'a', 'a');
    const score2 = getScore(BLOSUM62, 'A', 'A');
    expect(score1).toBe(score2);
    expect(score1).toBe(4);
  });

  it('9. should have DNA_SIMPLE matrix with matches and mismatches', () => {
    expect(DNA_SIMPLE.A.A).toBe(5);
    expect(DNA_SIMPLE.A.C).toBe(-4);
    expect(DNA_SIMPLE.T.U).toBe(5); // T and U are equivalent
  });

  it('10. should have DNA_FULL matrix with transition/transversion scores', () => {
    expect(DNA_FULL.A.G).toBe(-1); // Transition
    expect(DNA_FULL.A.C).toBe(-4); // Transversion
    expect(DNA_FULL.C.T).toBe(-1); // Transition
  });

  it('11. should have all standard matrices in MATRICES registry', () => {
    expect(MATRICES.BLOSUM62).toBe(BLOSUM62);
    expect(MATRICES.BLOSUM80).toBe(BLOSUM80);
    expect(MATRICES.PAM250).toBe(PAM250);
    expect(MATRICES.DNA_SIMPLE).toBe(DNA_SIMPLE);
    expect(MATRICES.DNA_FULL).toBe(DNA_FULL);
  });

  it('12. should return 0 for unknown characters in getScore', () => {
    const score = getScore(BLOSUM62, 'X', 'Z');
    expect(score).toBe(0);
  });

  it('13. should return 0 for DNA bases not in protein matrix', () => {
    const score = getScore(BLOSUM62, 'A', 'T');
    expect(score).toBe(0);
  });

  it('14. should handle T/U equivalence in DNA matrices', () => {
    expect(DNA_SIMPLE.T.U).toBe(DNA_SIMPLE.U.U);
    expect(DNA_FULL.T.U).toBe(DNA_FULL.U.U);
  });

  it('15. should have different scores in BLOSUM62 vs BLOSUM80', () => {
    expect(BLOSUM62.A.A).toBe(4);
    expect(BLOSUM80.A.A).toBe(7);
  });

  it('16. should have PAM250 with different scoring scheme', () => {
    expect(PAM250.A.A).toBe(2);
    expect(BLOSUM62.A.A).toBe(4);
    // Different matrices have different scales
  });

  it('17. should throw Error for unknown matrix name', () => {
    expect(() => getMatrix('UNKNOWN')).toThrow(Error);
    expect(() => getMatrix('UNKNOWN')).toThrow('Unknown scoring matrix');
  });

  it('18. should throw Error with available matrix names', () => {
    expect(() => getMatrix('INVALID')).toThrow('BLOSUM62');
    expect(() => getMatrix('INVALID')).toThrow('PAM250');
    expect(() => getMatrix('INVALID')).toThrow('DNA_SIMPLE');
  });
});
