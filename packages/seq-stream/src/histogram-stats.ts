/**
 * Histogram-based N50/L50 without materializing all sequence lengths.
 */

export function calculateN50L50FromHistogram(
  lengthDistribution: Map<number, number>
): { n50: number; l50: number } {
  if (lengthDistribution.size === 0) {
    return { n50: 0, l50: 0 };
  }

  const sorted = Array.from(lengthDistribution.entries()).sort((a, b) => b[0] - a[0]);
  const totalLength = sorted.reduce((sum, [len, count]) => sum + len * count, 0);
  const halfTotal = totalLength / 2;

  let sum = 0;
  let n50 = sorted[sorted.length - 1][0];
  let l50 = 0;

  for (let i = 0; i < sorted.length; i++) {
    const [length, count] = sorted[i];
    for (let c = 0; c < count; c++) {
      sum += length;
      l50++;
      if (sum >= halfTotal) {
        return { n50: length, l50 };
      }
    }
  }

  return { n50, l50 };
}
