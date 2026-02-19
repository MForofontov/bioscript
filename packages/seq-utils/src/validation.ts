/**
 * Sequence validation utilities.
 * Provides reusable validation functions for input checking and sequence validation.
 *
 * @module validation
 */

/**
 * Assert that a value is a string, throwing TypeError if not.
 *
 * @param value - Value to validate
 * @param paramName - Parameter name for error message
 * @throws {TypeError} If value is not a string
 *
 * @example
 * ```typescript
 * assertString(sequence, 'sequence');
 * // Throws: TypeError: sequence must be a string, got number
 * ```
 */
export function assertString(value: unknown, paramName: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError(`${paramName} must be a string, got ${typeof value}`);
  }
}

/**
 * Assert that a value is a number, throwing TypeError if not.
 *
 * @param value - Value to validate
 * @param paramName - Parameter name for error message
 * @throws {TypeError} If value is not a number
 *
 * @example
 * ```typescript
 * assertNumber(k, 'k');
 * // Throws: TypeError: k must be a number, got string
 * ```
 */
export function assertNumber(value: unknown, paramName: string): asserts value is number {
  if (typeof value !== 'number') {
    throw new TypeError(`${paramName} must be a number, got ${typeof value}`);
  }
}

/**
 * Validate sequence contains only valid nucleotide characters.
 * Accepts: A, C, G, T, U, N (case-insensitive)
 *
 * @param sequence - Sequence to validate
 * @param strict - If true, throw error on invalid characters. If false, only warn.
 * @throws {Error} If strict mode and sequence contains invalid characters
 *
 * @example
 * ```typescript
 * validateSequence('ATCG', true); // OK
 * validateSequence('ATCXYZ', true); // Throws Error
 * validateSequence('ATCXYZ', false); // No error (lenient)
 * ```
 */
export function validateSequence(sequence: string, strict: boolean = false): void {
  const validPattern = /^[ACGTUN]*$/i;
  if (!validPattern.test(sequence)) {
    const message = 'Sequence contains invalid characters (expected: A, C, G, T, U, N)';
    if (strict) {
      throw new Error(message);
    }
  }
}

/**
 * Validate sequence contains only valid nucleotide characters (strict mode).
 * Throws error if invalid characters are found.
 *
 * @param sequence - Sequence to validate
 * @throws {Error} If sequence contains invalid characters
 *
 * @example
 * ```typescript
 * assertValidSequence('ATCG'); // OK
 * assertValidSequence('ATCXYZ'); // Throws Error
 * ```
 */
export function assertValidSequence(sequence: string): void {
  if (!/^[ACGTUN]*$/i.test(sequence)) {
    throw new Error('sequence contains invalid characters (expected: A, C, G, T, U, N)');
  }
}

/**
 * Check if sequence contains only valid nucleotide characters.
 * Non-throwing version for conditional logic.
 *
 * @param sequence - Sequence to check
 * @param allowAmbiguous - If true, allow IUPAC ambiguity codes (default: true)
 * @returns true if sequence is valid
 *
 * @example
 * ```typescript
 * isValidSequence('ATCG'); // true
 * isValidSequence('ATCXYZ'); // false
 * isValidSequence('ATCGRYKMSWBDHV'); // true (with ambiguous codes)
 * ```
 */
export function isValidSequence(sequence: string, allowAmbiguous: boolean = true): boolean {
  if (typeof sequence !== 'string') {
    return false;
  }

  const pattern = allowAmbiguous
    ? /^[ACGTUNRYKMSWBDHV]+$/i  // IUPAC ambiguity codes
    : /^[ACGTUN]+$/i;             // Standard bases + N

  return pattern.test(sequence);
}

/**
 * Assert that two sequences are provided and are strings.
 * Common validation for pairwise operations (alignment, comparison, etc.)
 *
 * @param seq1 - First sequence
 * @param seq2 - Second sequence
 * @param paramName1 - Parameter name for seq1 (default: 'seq1')
 * @param paramName2 - Parameter name for seq2 (default: 'seq2')
 * @throws {TypeError} If either value is not a string
 *
 * @example
 * ```typescript
 * assertTwoSequences(seq1, seq2);
 * assertTwoSequences(query, target, 'query', 'target');
 * ```
 */
export function assertTwoSequences(
  seq1: unknown,
  seq2: unknown,
  paramName1: string = 'seq1',
  paramName2: string = 'seq2'
): void {
  assertString(seq1, paramName1);
  assertString(seq2, paramName2);
}

/**
 * Assert that a value is an array, throwing TypeError if not.
 *
 * @param value - Value to validate
 * @param paramName - Parameter name for error message
 * @throws {TypeError} If value is not an array
 *
 * @example
 * ```typescript
 * assertArray(records, 'records');
 * // Throws: TypeError: records must be an array, got string
 * ```
 */
export function assertArray(value: unknown, paramName: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new TypeError(`${paramName} must be an array, got ${typeof value}`);
  }
}

/**
 * Assert that a value is a non-null object, throwing TypeError if not.
 *
 * @param value - Value to validate
 * @param paramName - Parameter name for error message
 * @throws {TypeError} If value is not an object or is null
 *
 * @example
 * ```typescript
 * assertObject(record, 'record');
 * // Throws: TypeError: record must be an object, got string
 * ```
 */
export function assertObject(value: unknown, paramName: string): asserts value is object {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError(`${paramName} must be an object, got ${typeof value}`);
  }
}

/**
 * Assert that a number is a positive integer, throwing Error if not.
 *
 * @param value - Number to validate
 * @param paramName - Parameter name for error message
 * @throws {Error} If value is not a positive integer
 *
 * @example
 * ```typescript
 * assertPositiveInteger(k, 'k');
 * // Throws: Error: k must be a positive integer, got 0
 * ```
 */
export function assertPositiveInteger(value: number, paramName: string): void {
  if (value < 1 || !Number.isInteger(value)) {
    throw new Error(`${paramName} must be a positive integer, got ${value}`);
  }
}

/**
 * Assert that two (already-normalized) sequences are non-empty.
 * Call after normalizing sequences so whitespace-only inputs are caught.
 *
 * @param s1 - First normalized sequence
 * @param s2 - Second normalized sequence
 * @throws {Error} If either sequence is empty
 *
 * @example
 * ```typescript
 * const s1 = normalizeSequence(seq1);
 * const s2 = normalizeSequence(seq2);
 * assertNonEmptySequences(s1, s2);
 * ```
 */
export function assertNonEmptySequences(s1: string, s2: string): void {
  if (s1.length === 0 || s2.length === 0) {
    throw new Error('sequences cannot be empty');
  }
}
