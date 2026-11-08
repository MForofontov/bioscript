/** Compute order statistics without expanding one entry per sequence. */
export function summarizeLengths(distribution: ReadonlyMap<number, number>) {
  const lengths = [...distribution.keys()].sort((a, b) => a - b);
  let count = 0;
  let totalBases = 0;
  for (const length of lengths) {
    const frequency = distribution.get(length)!;
    count += frequency;
    totalBases += length * frequency;
  }
  if (!count) return { minLength: 0, maxLength: 0, medianLength: 0, n50: 0, l50: 0 };

  const lowerIndex = Math.floor((count - 1) / 2);
  const upperIndex = Math.floor(count / 2);
  let seen = 0;
  let lower = 0;
  let upper = 0;
  for (const length of lengths) {
    const next = seen + distribution.get(length)!;
    if (seen <= lowerIndex && lowerIndex < next) lower = length;
    if (seen <= upperIndex && upperIndex < next) {
      upper = length;
      break;
    }
    seen = next;
  }

  let bases = 0;
  let sequences = 0;
  let n50 = 0;
  let l50 = 0;
  for (let i = lengths.length - 1; i >= 0; i--) {
    const length = lengths[i];
    const frequency = distribution.get(length)!;
    if (bases + length * frequency >= totalBases / 2) {
      n50 = length;
      l50 =
        sequences + (length === 0 ? 1 : Math.max(1, Math.ceil((totalBases / 2 - bases) / length)));
      break;
    }
    bases += length * frequency;
    sequences += frequency;
  }
  return {
    minLength: lengths[0],
    maxLength: lengths[lengths.length - 1],
    medianLength: (lower + upper) / 2,
    n50,
    l50,
  };
}
