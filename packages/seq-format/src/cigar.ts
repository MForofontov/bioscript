/**
 * CIGAR string utilities for SAM/BAM alignment format.
 * Provides parsing, formatting, and analysis of CIGAR strings.
 *
 * @module cigar
 */

import type { CigarOp, CigarOperation, CigarStats } from './types';

/**
 * Parse CIGAR string into array of operations.
 *
 * @param cigar - CIGAR string (e.g., "8M2I4M1D3M").
 * @returns Array of parsed CIGAR operations.
 *
 * @throws {TypeError} If cigar is not a string.
 * @throws {Error} If CIGAR string is invalid.
 *
 * @example
 * ```typescript
 * const ops = parseCIGAR('8M2I4M1D3M');
 * console.log(ops);
 * // [
 * //   { length: 8, operation: 'M' },
 * //   { length: 2, operation: 'I' },
 * //   { length: 4, operation: 'M' },
 * //   { length: 1, operation: 'D' },
 * //   { length: 3, operation: 'M' }
 * // ]
 * ```
 *
 * @performance O(n) where n is CIGAR string length.
 */
export function parseCIGAR(cigar: string): CigarOp[] {
  if (typeof cigar !== 'string') {
    throw new TypeError(`cigar must be a string, got ${typeof cigar}`);
  }

  if (cigar === '*') {
    return [];
  }

  const operations: CigarOp[] = [];
  const pattern = /(\d+)([MIDNSHP=X])/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(cigar)) !== null) {
    operations.push({
      length: parseInt(match[1], 10),
      operation: match[2] as CigarOperation,
    });
  }

  if (operations.length === 0) {
    throw new Error(`Invalid CIGAR string: ${cigar}`);
  }

  return operations;
}

/**
 * Format CIGAR operations back to CIGAR string.
 *
 * @param operations - Array of CIGAR operations.
 * @returns CIGAR string.
 *
 * @throws {TypeError} If operations is not an array.
 * @throws {Error} If operations array is invalid.
 *
 * @example
 * ```typescript
 * const ops = [
 *   { length: 8, operation: 'M' },
 *   { length: 2, operation: 'I' },
 *   { length: 4, operation: 'M' }
 * ];
 * const cigar = formatCIGAR(ops);
 * console.log(cigar); // '8M2I4M'
 * ```
 *
 * @performance O(n) where n is number of operations.
 */
export function formatCIGAR(operations: CigarOp[]): string {
  if (!Array.isArray(operations)) {
    throw new TypeError(`operations must be an array, got ${typeof operations}`);
  }

  if (operations.length === 0) {
    return '*';
  }

  return operations
    .map((op) => {
      if (typeof op.length !== 'number' || op.length <= 0) {
        throw new Error(`Invalid operation length: ${op.length}`);
      }
      if (typeof op.operation !== 'string') {
        throw new Error(`Invalid operation type: ${String(op.operation)}`);
      }
      return `${op.length}${op.operation}`;
    })
    .join('');
}

/**
 * Calculate statistics from CIGAR operations.
 *
 * @param operations - Array of CIGAR operations.
 * @returns Statistics about the alignment.
 *
 * @throws {TypeError} If operations is not an array.
 *
 * @example
 * ```typescript
 * const ops = parseCIGAR('8M2I4M1D3M');
 * const stats = getCIGARStats(ops);
 * console.log(stats);
 * // {
 * //   alignedLength: 18,
 * //   matches: 15,
 * //   mismatches: 0,
 * //   insertions: 2,
 * //   deletions: 1,
 * //   softClipped: 0,
 * //   hardClipped: 0,
 * //   referenceLength: 16,
 * //   queryLength: 17
 * // }
 * ```
 *
 * @note M operations count as matches (use = and X for exact match/mismatch).
 * @performance O(n) where n is number of operations.
 */
export function getCIGARStats(operations: CigarOp[]): CigarStats {
  if (!Array.isArray(operations)) {
    throw new TypeError(`operations must be an array, got ${typeof operations}`);
  }

  const stats: CigarStats = {
    alignedLength: 0,
    matches: 0,
    mismatches: 0,
    insertions: 0,
    deletions: 0,
    softClipped: 0,
    hardClipped: 0,
    referenceLength: 0,
    queryLength: 0,
  };

  for (const op of operations) {
    switch (op.operation) {
      case 'M':
        stats.matches += op.length;
        stats.referenceLength += op.length;
        stats.queryLength += op.length;
        stats.alignedLength += op.length;
        break;
      case '=':
        stats.matches += op.length;
        stats.referenceLength += op.length;
        stats.queryLength += op.length;
        stats.alignedLength += op.length;
        break;
      case 'X':
        stats.mismatches += op.length;
        stats.referenceLength += op.length;
        stats.queryLength += op.length;
        stats.alignedLength += op.length;
        break;
      case 'I':
        stats.insertions += op.length;
        stats.queryLength += op.length;
        stats.alignedLength += op.length;
        break;
      case 'D':
        stats.deletions += op.length;
        stats.referenceLength += op.length;
        stats.alignedLength += op.length;
        break;
      case 'N':
        stats.referenceLength += op.length;
        break;
      case 'S':
        stats.softClipped += op.length;
        stats.queryLength += op.length;
        break;
      case 'H':
        stats.hardClipped += op.length;
        break;
      case 'P':
        // Padding doesn't affect lengths
        break;
    }
  }

  return stats;
}

/**
 * Generate aligned sequence with gaps from CIGAR and query sequence.
 *
 * @param cigar - CIGAR string.
 * @param querySeq - Query sequence.
 * @returns Object with aligned query and reference representations.
 *
 * @throws {TypeError} If cigar or querySeq is not a string.
 * @throws {Error} If query sequence length doesn't match CIGAR.
 *
 * @example
 * ```typescript
 * const aligned = cigarToAlignedSequence('3M2I2M1D2M', 'ACGTACGTA');
 * console.log(aligned.query); // 'ACGTACGTA'
 * console.log(aligned.reference); // 'ACG--TA-TA'
 * ```
 *
 * @note Hard clipped bases are not included in query sequence.
 * @performance O(n) where n is CIGAR alignment length.
 */
export function cigarToAlignedSequence(
  cigar: string,
  querySeq: string
): { query: string; reference: string } {
  if (typeof cigar !== 'string') {
    throw new TypeError(`cigar must be a string, got ${typeof cigar}`);
  }
  if (typeof querySeq !== 'string') {
    throw new TypeError(`querySeq must be a string, got ${typeof querySeq}`);
  }

  const operations = parseCIGAR(cigar);
  const stats = getCIGARStats(operations);

  if (querySeq.length !== stats.queryLength) {
    throw new Error(
      `Query sequence length (${querySeq.length}) doesn't match CIGAR query length (${stats.queryLength})`
    );
  }

  let queryPos = 0;
  let alignedQuery = '';
  let alignedRef = '';

  for (const op of operations) {
    switch (op.operation) {
      case 'M':
      case '=':
      case 'X': {
        const segment = querySeq.slice(queryPos, queryPos + op.length);
        alignedQuery += segment;
        alignedRef += segment;
        queryPos += op.length;
        break;
      }
      case 'I': {
        const segment = querySeq.slice(queryPos, queryPos + op.length);
        alignedQuery += segment;
        alignedRef += '-'.repeat(op.length);
        queryPos += op.length;
        break;
      }
      case 'D':
        alignedQuery += '-'.repeat(op.length);
        alignedRef += 'N'.repeat(op.length); // Unknown reference bases
        break;
      case 'N':
        // Skip region - not aligned
        alignedQuery += ' '.repeat(op.length);
        alignedRef += ' '.repeat(op.length);
        break;
      case 'S': {
        const segment = querySeq.slice(queryPos, queryPos + op.length);
        alignedQuery += segment.toLowerCase(); // Lowercase for soft clip
        alignedRef += '-'.repeat(op.length);
        queryPos += op.length;
        break;
      }
      case 'H':
        // Hard clip - not in query sequence
        break;
      case 'P':
        // Padding - silent deletion
        alignedQuery += '*'.repeat(op.length);
        alignedRef += '*'.repeat(op.length);
        break;
    }
  }

  return { query: alignedQuery, reference: alignedRef };
}

/**
 * Validate CIGAR string format.
 *
 * @param cigar - CIGAR string to validate.
 * @returns True if valid, false otherwise.
 *
 * @example
 * ```typescript
 * validateCIGAR('8M2I4M1D3M'); // true
 * validateCIGAR('8M2Q4M'); // false (invalid operation Q)
 * validateCIGAR('*'); // true (unmapped)
 * ```
 */
export function validateCIGAR(cigar: string): boolean {
  if (typeof cigar !== 'string') {
    return false;
  }

  if (cigar === '*') {
    return true;
  }

  const pattern = /^(\d+[MIDNSHP=X])+$/;
  return pattern.test(cigar);
}
