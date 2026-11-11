/**
 * @bioscript/seq-search
 * Pattern matching, IUPAC motifs, restriction sites, and primer utilities.
 */

export {
  isValidIupacMotif,
  assertIupacMotif,
  iupacToRegex,
  expandIupacBase,
} from './iupac';

export { findPattern, type PatternHit, type FindPatternOptions, type SearchStrand } from './find';

export { findMotif, findExact, findConsensus } from './motifs';

export {
  COMMON_ENZYMES,
  findRestrictionSites,
  type RestrictionEnzyme,
  type RestrictionHit,
} from './restriction';

export { gcContent, primerTm, checkPrimerPair, type PrimerPairCheck } from './primer';
