/**
 * @bioscript/seq-utils
 * Core sequence manipulation utilities for DNA/RNA operations
 */

// DNA/RNA conversion (legacy exports - prefer normalize module)
export { dnaToRna, rnaToDna } from './dna-rna';

// Complement operations
export { complement } from './complement';
export { reverseComplement } from './reverse-complement';

// Validation utilities (NEW - centralized validation functions)
export {
  assertString,
  assertNumber,
  assertTwoSequences,
  assertArray,
  assertObject,
  assertPositiveInteger,
  assertNonEmptySequences,
  validateSequence,
  assertValidSequence,
  isValidSequence,
} from './validation';

// Normalization utilities (NEW - centralized normalization functions)
export {
  normalizeSequence,
  normalizeToDna,
  normalizeToRna,
  isRna,
  isDna,
  // Re-export conversion functions for convenience
  rnaToDna as convertRnaToDna,
  dnaToRna as convertDnaToRna,
} from './normalize';

// K-mer analysis
export {
  getKmers,
  countKmers,
  getKmerSpectrum,
  getUniqueKmers,
  getKmerJaccard,
  getKmersWithRollingHash,
  getSuperKmers,
  getSyncmers,
} from './kmers';

// Minimizer extraction
export {
  getMinimizers,
  getHashMinimizers,
  getMinimizerDensity,
  getMinimizerJaccard,
  type Minimizer,
} from './minimizers';

// De Bruijn graphs
export {
  buildDeBruijnGraph,
  findContigs,
  getGraphStats,
  removeTips,
  removeLowCoverageNodes,
  type DeBruijnNode,
  type DeBruijnGraph,
} from './debruijn';
