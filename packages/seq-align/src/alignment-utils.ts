/**
 * Shared alignment helpers.
 */

export function assertGapPenalties(gapOpen: number, gapExtend: number): void {
  if (gapOpen > 0) {
    throw new Error(`gapOpen must be ≤ 0, got ${gapOpen}`);
  }
  if (gapExtend > 0) {
    throw new Error(`gapExtend must be ≤ 0, got ${gapExtend}`);
  }
}

/**
 * Score normalization for banded/semi-global/overlap alignments.
 * Prefers `normalizeScore`; falls back to legacy `normalize` for one release.
 */
export function resolveNormalizeScore(
  normalizeScore: boolean | undefined,
  normalize: boolean | undefined
): boolean {
  return normalizeScore ?? normalize ?? false;
}
