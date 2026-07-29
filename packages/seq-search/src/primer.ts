/**
 * Basic primer design utilities.
 */

import { assertString, normalizeSequence, reverseComplement } from '@bioscript/seq-utils';

export interface PrimerPairCheck {
  tmFwd: number;
  tmRev: number;
  gcFwd: number;
  gcRev: number;
  tmDelta: number;
  maxHomopolymer: number;
  selfDimerScore: number;
  heterodimerScore: number;
  hairpinScore: number;
  ok: boolean;
  warnings: string[];
}

/**
 * GC content as a fraction in [0, 1].
 */
export function gcContent(sequence: string): number {
  assertString(sequence, 'sequence');
  const seq = normalizeSequence(sequence).replace(/U/g, 'T');
  if (seq.length === 0) return 0;
  let gc = 0;
  for (const b of seq) {
    if (b === 'G' || b === 'C') gc++;
  }
  return gc / seq.length;
}

/**
 * Wallace rule Tm (°C): 2*(A+T) + 4*(G+C) for primers roughly 14–20 nt.
 * Optional simple salt adjustment: +16.6*log10([Na+]) when saltMolar is set.
 */
export function primerTm(sequence: string, saltMolar?: number): number {
  assertString(sequence, 'sequence');
  const seq = normalizeSequence(sequence).replace(/U/g, 'T');
  if (seq.length === 0) throw new Error('sequence cannot be empty');

  let at = 0;
  let gc = 0;
  for (const b of seq) {
    if (b === 'A' || b === 'T') at++;
    else if (b === 'G' || b === 'C') gc++;
  }
  let tm = 2 * at + 4 * gc;
  if (saltMolar !== undefined) {
    if (!(saltMolar > 0)) throw new Error('saltMolar must be > 0');
    tm += 16.6 * Math.log10(saltMolar);
  }
  return tm;
}

function maxHomopolymerRun(seq: string): number {
  let max = 1;
  let run = 1;
  for (let i = 1; i < seq.length; i++) {
    if (seq[i] === seq[i - 1]) {
      run++;
      max = Math.max(max, run);
    } else {
      run = 1;
    }
  }
  return seq.length === 0 ? 0 : max;
}

/** Count complementary matches for a simple 3'-end dimer heuristic. */
function dimerScore(a: string, b: string, window = 5): number {
  const left = a.slice(-window);
  const right = reverseComplement(b.slice(-window));
  let score = 0;
  const n = Math.min(left.length, right.length);
  for (let i = 0; i < n; i++) {
    if (left[i] === right[i]) score++;
  }
  return score;
}

/** Rough hairpin: complementary match between 5' and 3' windows. */
function hairpinScore(seq: string, window = 4): number {
  if (seq.length < window * 2) return 0;
  const five = seq.slice(0, window);
  const three = reverseComplement(seq.slice(-window));
  let score = 0;
  for (let i = 0; i < window; i++) {
    if (five[i] === three[i]) score++;
  }
  return score;
}

/**
 * Basic primer-pair sanity checks (not a substitute for dedicated primer design tools).
 */
export function checkPrimerPair(
  forward: string,
  reverse: string,
  options: { maxTmDelta?: number; saltMolar?: number } = {}
): PrimerPairCheck {
  const { maxTmDelta = 5, saltMolar } = options;
  assertString(forward, 'forward');
  assertString(reverse, 'reverse');

  const fwd = normalizeSequence(forward).replace(/U/g, 'T');
  const rev = normalizeSequence(reverse).replace(/U/g, 'T');

  const tmFwd = primerTm(fwd, saltMolar);
  const tmRev = primerTm(rev, saltMolar);
  const gcFwd = gcContent(fwd);
  const gcRev = gcContent(rev);
  const tmDelta = Math.abs(tmFwd - tmRev);
  const maxHomopolymer = Math.max(maxHomopolymerRun(fwd), maxHomopolymerRun(rev));
  const selfDimerScore = Math.max(dimerScore(fwd, fwd), dimerScore(rev, rev));
  const heterodimerScore = dimerScore(fwd, rev);
  const hairpin = Math.max(hairpinScore(fwd), hairpinScore(rev));

  const warnings: string[] = [];
  if (tmDelta > maxTmDelta) warnings.push(`Tm difference ${tmDelta.toFixed(1)} > ${maxTmDelta}`);
  if (gcFwd < 0.4 || gcFwd > 0.6) warnings.push(`forward GC ${(gcFwd * 100).toFixed(0)}% outside 40–60%`);
  if (gcRev < 0.4 || gcRev > 0.6) warnings.push(`reverse GC ${(gcRev * 100).toFixed(0)}% outside 40–60%`);
  if (maxHomopolymer >= 5) warnings.push(`homopolymer run of ${maxHomopolymer}`);
  if (selfDimerScore >= 4) warnings.push(`possible self-dimer (score ${selfDimerScore})`);
  if (heterodimerScore >= 4) warnings.push(`possible heterodimer (score ${heterodimerScore})`);
  if (hairpin >= 3) warnings.push(`possible hairpin (score ${hairpin})`);

  return {
    tmFwd,
    tmRev,
    gcFwd,
    gcRev,
    tmDelta,
    maxHomopolymer,
    selfDimerScore,
    heterodimerScore,
    hairpinScore: hairpin,
    ok: warnings.length === 0,
    warnings,
  };
}
