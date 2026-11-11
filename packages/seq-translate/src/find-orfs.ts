/**
 * Open Reading Frame (ORF) finding
 * Identifies potential protein-coding sequences
 */

import { getTable, type CodonTable } from './tables';
import { buildLookup } from './lookup';
import { reverseComplement, assertString, assertValidSequence, normalizeToDna } from '@bioscript/seq-utils';
import type { TranslationOptions } from './translate';

/**
 * Open Reading Frame representation
 */
export interface Orf {
  /**
   * ORF nucleotide sequence in 5′→3′ coding orientation.
   * For minus-strand ORFs this is reverse-complemented relative to
   * `sequence.slice(start, end)` on the forward reference.
   */
  sequence: string;
  /** Start position (0-indexed, relative to input sequence) */
  start: number;
  /** End position (0-indexed, exclusive, relative to input sequence) */
  end: number;
  /** Reading frame: 0, 1, 2 for forward; -1, -2, -3 for reverse */
  frame: number;
  /** Strand: '+' for forward, '-' for reverse complement */
  strand: '+' | '-';
  /** Length in nucleotides */
  length: number;
  /** Translated protein sequence (if translate option is true) */
  protein?: string;
  /** Whether this ORF has a stop codon */
  hasStopCodon: boolean;
}

/**
 * Options for ORF finding
 */
export interface OrfOptions extends TranslationOptions {
  /** Minimum ORF length in nucleotides (default: 75) */
  minLength?: number;
  /** Include ORFs without stop codon (partial ORFs, default: false) */
  includePartial?: boolean;
  /** Search all 6 frames (3 forward + 3 reverse, default: true) */
  allFrames?: boolean;
  /** Automatically translate ORFs to protein (default: false) */
  translate?: boolean;
  /** Alternative start codons (default: all codons encoding Met in the genetic table) */
  startCodons?: string[];
}

/**
 * Derive default start codons from a genetic code table (all codons encoding Met).
 */
export function getDefaultStartCodons(table: CodonTable): string[] {
  const codons: string[] = [];
  for (const [codon, aa] of Object.entries(table)) {
    if (aa === 'M') {
      codons.push(codon.toUpperCase().replace(/U/g, 'T'));
    }
  }
  return codons.length > 0 ? codons : ['ATG'];
}

/**
 * Find all Open Reading Frames (ORFs) in a nucleotide sequence.
 */
export function findOrfs(sequence: string, options: OrfOptions = {}): Orf[] {
  assertString(sequence, 'sequence');

  const dnaSequence = normalizeToDna(sequence);
  assertValidSequence(dnaSequence);

  const {
    minLength = 75,
    includePartial = false,
    allFrames = true,
    translate = false,
    table = 'standard',
    stopSymbol = '*',
    breakOnStop = true,
    startCodons,
  } = options;

  const codonTable = getTable(table);
  const lookup = buildLookup(codonTable);
  const normalizedStartCodons = new Set(
    (startCodons ?? getDefaultStartCodons(codonTable)).map((c) => c.toUpperCase().replace(/U/g, 'T'))
  );

  const orfs: Orf[] = [];

  for (let frame = 0; frame < 3; frame++) {
    const frameOrfs = findOrfsInFrame(
      dnaSequence,
      frame,
      '+',
      normalizedStartCodons,
      lookup,
      minLength,
      includePartial,
      translate,
      stopSymbol,
      breakOnStop
    );
    orfs.push(...frameOrfs);
  }

  if (allFrames) {
    const revComp = reverseComplement(dnaSequence);
    const seqLength = dnaSequence.length;

    for (let frame = 0; frame < 3; frame++) {
      const frameOrfs = findOrfsInFrame(
        revComp,
        frame,
        '-',
        normalizedStartCodons,
        lookup,
        minLength,
        includePartial,
        translate,
        stopSymbol,
        breakOnStop
      );

      for (const orf of frameOrfs) {
        const revStart = orf.start;
        const revEnd = orf.end;
        orf.start = seqLength - revEnd;
        orf.end = seqLength - revStart;
        orf.frame = -(frame + 1);
      }

      orfs.push(...frameOrfs);
    }
  }

  return orfs.sort((a, b) => a.start - b.start);
}

function findOrfsInFrame(
  sequence: string,
  frame: number,
  strand: '+' | '-',
  startCodons: Set<string>,
  lookup: Map<string, string>,
  minLength: number,
  includePartial: boolean,
  translate: boolean,
  stopSymbol: string,
  breakOnStop: boolean
): Orf[] {
  const orfs: Orf[] = [];
  let inOrf = false;
  let orfStart = -1;

  for (let i = frame; i + 3 <= sequence.length; i += 3) {
    const codon = sequence.slice(i, i + 3);
    const aa = lookup.get(codon) ?? 'X';

    if (!inOrf) {
      if (startCodons.has(codon)) {
        inOrf = true;
        orfStart = i;
      }
    } else if (aa === '*') {
      const orfEnd = i + 3;
      const orfLength = orfEnd - orfStart;

      if (orfLength >= minLength) {
        const orfSeq = sequence.slice(orfStart, orfEnd);
        const orf: Orf = {
          sequence: orfSeq,
          start: orfStart,
          end: orfEnd,
          frame: strand === '+' ? frame : -(frame + 1),
          strand,
          length: orfLength,
          hasStopCodon: true,
        };

        if (translate) {
          orf.protein = translateOrf(orfSeq, lookup, stopSymbol, breakOnStop);
        }

        orfs.push(orf);
      }

      inOrf = false;
      orfStart = -1;

      if (breakOnStop) {
        break;
      }
    }
  }

  if (inOrf && includePartial) {
    const orfEnd = sequence.length - ((sequence.length - frame) % 3 || 0);
    const orfLength = orfEnd - orfStart;

    if (orfLength >= minLength) {
      const orfSeq = sequence.slice(orfStart, orfEnd);
      const orf: Orf = {
        sequence: orfSeq,
        start: orfStart,
        end: orfEnd,
        frame: strand === '+' ? frame : -(frame + 1),
        strand,
        length: orfLength,
        hasStopCodon: false,
      };

      if (translate) {
        orf.protein = translateOrf(orfSeq, lookup, stopSymbol, breakOnStop);
      }

      orfs.push(orf);
    }
  }

  return orfs;
}

function translateOrf(
  orfSeq: string,
  lookup: Map<string, string>,
  stopSymbol: string,
  breakOnStop: boolean
): string {
  const protein: string[] = [];

  for (let i = 0; i + 3 <= orfSeq.length; i += 3) {
    const codon = orfSeq.slice(i, i + 3);
    const aa = lookup.get(codon) ?? 'X';

    if (aa === '*') {
      protein.push(stopSymbol);
      if (breakOnStop) break;
    } else {
      protein.push(aa);
    }
  }

  return protein.join('');
}
