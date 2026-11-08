import { summarizeLengths } from './length-summary';

/** Compute N50/L50 directly from frequencies, without expanding repeated lengths. */
export function calculateN50L50FromHistogram(lengthDistribution: Map<number, number>): {
  n50: number;
  l50: number;
} {
  const { n50, l50 } = summarizeLengths(lengthDistribution);
  return { n50, l50 };
}
