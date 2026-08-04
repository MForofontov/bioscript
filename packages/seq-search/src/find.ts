/**
 * Generic pattern search on nucleotide sequences.
 */

import { normalizeToDna, reverseComplement, assertString } from '@bioscript/seq-utils';
import { assertIupacMotif, iupacToRegex } from './iupac';

export type SearchStrand = '+' | '-' | 'both';

export interface PatternHit {
  start: number;
  end: number;
  /**
   * Matched substring in 5′→3′ coding orientation.
   * For minus-strand hits this differs from `sequence.slice(start, end)`.
   */
  match: string;
  strand: '+' | '-';
}

export interface FindPatternOptions {
  /** Search forward (+), reverse (-), or both (default: '+') */
  strand?: SearchStrand;
  /** Allow overlapping matches (default: false) */
  overlapping?: boolean;
  /** Treat pattern as IUPAC motif (default: false → literal/RegExp source) */
  iupac?: boolean;
  /** Case-insensitive literal match (default: true) */
  ignoreCase?: boolean;
}

/**
 * Find all occurrences of a pattern (literal string, RegExp, or IUPAC motif).
 */
export function findPattern(
  sequence: string,
  pattern: string | RegExp,
  options: FindPatternOptions = {}
): PatternHit[] {
  assertString(sequence, 'sequence');
  const {
    strand = '+',
    overlapping = false,
    iupac = false,
    ignoreCase = true,
  } = options;

  const seq = normalizeToDna(sequence);
  const hits: PatternHit[] = [];

  const searchOne = (haystack: string, hitStrand: '+' | '-') => {
    let regex: RegExp;
    if (pattern instanceof RegExp) {
      let flags = pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g';
      if (ignoreCase && !flags.includes('i')) {
        flags += 'i';
      } else if (!ignoreCase) {
        flags = flags.replace(/i/g, '');
      }
      regex = new RegExp(pattern.source, flags);
    } else if (iupac) {
      assertIupacMotif(pattern);
      regex = iupacToRegex(pattern, ignoreCase ? 'gi' : 'g');
    } else {
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      regex = new RegExp(escaped, ignoreCase ? 'gi' : 'g');
    }

    let match: RegExpExecArray | null;
    let lastIndex = 0;
    while ((match = regex.exec(haystack)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (hitStrand === '+') {
        hits.push({ start, end, match: match[0], strand: '+' });
      } else {
        // Map reverse-complement coordinates back to original forward strand
        const fwdStart = haystack.length - end;
        const fwdEnd = haystack.length - start;
        hits.push({
          start: fwdStart,
          end: fwdEnd,
          match: match[0],
          strand: '-',
        });
      }

      if (overlapping && match[0].length > 0) {
        regex.lastIndex = start + 1;
      } else if (match[0].length === 0) {
        regex.lastIndex = start + 1;
      }

      if (regex.lastIndex <= lastIndex) {
        break;
      }
      lastIndex = regex.lastIndex;
    }
  };

  if (strand === '+' || strand === 'both') {
    searchOne(seq, '+');
  }
  if (strand === '-' || strand === 'both') {
    searchOne(reverseComplement(seq), '-');
  }

  const sorted = hits.sort((a, b) => a.start - b.start || a.end - b.end);

  if (strand === 'both') {
    const seen = new Set<string>();
    return sorted.filter((hit) => {
      const key = `${hit.start}:${hit.end}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return sorted;
}
