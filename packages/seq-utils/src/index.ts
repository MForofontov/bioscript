/**
 * @bioscript/seq-utils
 * Core sequence manipulation utilities for DNA/RNA operations
 */

export { dnaToRna, rnaToDna } from './dna-rna';
export { complement } from './complement';
export { reverseComplement } from './reverse-complement';

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
