import { getHashMinimizers, getMinimizers, getMinimizerDensity } from '../minimizers';
import { reverseComplement } from '../reverse-complement';

test.each([0, -1, 1.5, NaN, Infinity])('hash minimizers reject invalid k/w %p', (value) => {
  expect(() => getHashMinimizers('ACGT', value, 1)).toThrow();
  expect(() => getHashMinimizers('ACGT', 1, value)).toThrow();
});

test('empty and shorter-than-k inputs have zero density', () => {
  expect(getMinimizerDensity('', 1, 1)).toBe(0);
  expect(getMinimizerDensity('A', 3, 1)).toBe(0);
});

test('deque selection matches a naive oracle, including ties and canonical k-mers', () => {
  for (const sequence of ['AAAAAAAAAAA', 'ACGTTGCAACGT', 'NACGTNACGT']) {
    for (const canonical of [false, true]) {
      for (const k of [1, 3]) {
        for (const w of [1, 3, 5]) {
          const kmers = Array.from({ length: sequence.length - k + 1 }, (_, position) => {
            let kmer = sequence.slice(position, position + k);
            if (canonical) kmer = [kmer, reverseComplement(kmer)].sort()[0];
            return { kmer, position };
          });
          const expected: typeof kmers = [];
          for (let start = 0; start + w <= kmers.length; start++) {
            const best = kmers.slice(start, start + w).reduce((a, b) => (a.kmer <= b.kmer ? a : b));
            if (expected[expected.length - 1]?.position !== best.position) expected.push(best);
          }
          expect(getMinimizers(sequence, k, w, { canonical })).toEqual(expected);
          const hash = (s: string) => s.charCodeAt(0) % 3;
          const hashed: Array<{ kmer: string; position: number; hash: number }> = [];
          for (let start = 0; start + w <= kmers.length; start++) {
            const best = kmers
              .slice(start, start + w)
              .reduce((a, b) => (hash(a.kmer) <= hash(b.kmer) ? a : b));
            if (hashed[hashed.length - 1]?.position !== best.position)
              hashed.push({ ...best, hash: hash(best.kmer) });
          }
          expect(getHashMinimizers(sequence, k, w, { canonical, hashFunction: hash })).toEqual(
            hashed
          );
        }
      }
    }
  }
});
