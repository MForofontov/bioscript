import {
  getKmersWithRollingHash,
  reverseComplement,
  buildDeBruijnGraph,
  findContigs,
  getGraphStats,
  removeLowCoverageNodes,
} from '../index';

test('canonical rolling hashes depend on the canonical key rather than strand', () => {
  const sequence = 'ACGTTGCA';
  expect([...getKmersWithRollingHash(sequence, 3, { canonical: true })].sort()).toEqual(
    [...getKmersWithRollingHash(reverseComplement(sequence), 3, { canonical: true })].sort()
  );
});

test('reverse complement is an involution for DNA and RNA with N', () => {
  for (const sequence of ['AcgTN', 'AcgUN', '', 'NNNN'])
    expect(reverseComplement(reverseComplement(sequence))).toBe(sequence);
});

test('graph includes isolated nodes and cyclic components', () => {
  expect(findContigs(buildDeBruijnGraph(['AC'], 2), { minLength: 2 })).toEqual(['AC']);
  const cycle = buildDeBruijnGraph(['ACGACG'], 2);
  expect(findContigs(cycle).length).toBeGreaterThan(0);
  expect(getGraphStats(buildDeBruijnGraph([], 2)).avgCoverage).toBe(0);
});

test('contigs include every branch edge and shared merge endpoint', () => {
  expect(findContigs(buildDeBruijnGraph(['ACG', 'ACT'], 2)).sort()).toEqual(['ACG', 'ACT']);
  expect(findContigs(buildDeBruijnGraph(['ACG', 'TCG'], 2)).sort()).toEqual(['ACG', 'TCG']);
});

test('contigs include self loops and closed cycles exactly once', () => {
  expect(findContigs(buildDeBruijnGraph(['AAA'], 2))).toEqual(['AAA']);
  expect(findContigs(buildDeBruijnGraph(['ACGAC'], 2))).toEqual(['ACGAC']);
});

test('contigs reject edges whose canonical keys have lost strand orientation', () => {
  const graph = buildDeBruijnGraph(['ACGT'], 2, { canonical: true });
  expect(findContigs(graph)).toEqual(['ACG']);
  // Model an invalid edge supplied by an older builder or a manually edited graph.
  graph.nodes.get('CG')!.edges.push('AC');
  expect(() => findContigs(graph)).toThrow('canonical: false');
});

test('coverage pruning keeps forward and reverse edges consistent', () => {
  const graph = buildDeBruijnGraph(['AACGT', 'AAC'], 2);
  removeLowCoverageNodes(graph, 2);
  for (const [key, node] of graph.nodes) {
    for (const next of node.edges) expect(graph.reverseEdges.get(next)?.has(key)).toBe(true);
  }
  for (const [key, incoming] of graph.reverseEdges) {
    expect(graph.nodes.has(key)).toBe(true);
    for (const source of incoming) expect(graph.nodes.get(source)?.edges).toContain(key);
  }
});
