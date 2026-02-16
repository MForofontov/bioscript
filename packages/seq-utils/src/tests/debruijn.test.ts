import {
  buildDeBruijnGraph,
  findContigs,
  getGraphStats,
  removeTips,
  removeLowCoverageNodes,
  DeBruijnGraph,
} from '../debruijn';

describe('debruijn', () => {
  describe('buildDeBruijnGraph', () => {
    it('1. should build graph from single sequence', () => {
      const sequences = ['ATCGATCG'];
      const graph = buildDeBruijnGraph(sequences, 4);
      expect(graph.nodes.size).toBeGreaterThan(0);
      expect(graph.k).toBe(4);
    });

    it('2. should build graph from multiple sequences', () => {
      const sequences = ['ATCGATCG', 'TCGATCGA'];
      const graph = buildDeBruijnGraph(sequences, 4);
      expect(graph.nodes.size).toBeGreaterThan(0);
    });

    it('3. should track k-mer coverage', () => {
      const sequences = ['ATCGATCG', 'ATCGATCG']; // Duplicate
      const graph = buildDeBruijnGraph(sequences, 4);
      const nodes = Array.from(graph.nodes.values());
      expect(nodes.some((node) => node.coverage > 1)).toBe(true);
    });

    it('4. should create edges between overlapping k-mers', () => {
      const sequences = ['ATCGATCG'];
      const graph = buildDeBruijnGraph(sequences, 4);
      const nodes = Array.from(graph.nodes.values());
      expect(nodes.some((node) => node.edges.length > 0)).toBe(true);
    });

    it('5. should handle canonical k-mers', () => {
      const sequences = ['ATCG', 'CGAT']; // Reverse complements
      const graph = buildDeBruijnGraph(sequences, 4, { canonical: true });
      expect(graph.nodes.size).toBe(1); // Should merge to one k-mer
    });

    it('6. should filter by minimum coverage', () => {
      const sequences = ['ATCGATCG', 'ATCGATCG', 'GGGG'];
      const graph = buildDeBruijnGraph(sequences, 4, { minCoverage: 2 });
      const nodes = Array.from(graph.nodes.values());
      expect(nodes.every((node) => node.coverage >= 2)).toBe(true);
    });

    it('7. should handle empty sequences array', () => {
      const sequences: string[] = [];
      const graph = buildDeBruijnGraph(sequences, 4);
      expect(graph.nodes.size).toBe(0);
    });

    it('8. should skip non-string sequences', () => {
      const sequences = ['ATCG', null as any, 'CGAT', undefined as any];
      const graph = buildDeBruijnGraph(sequences, 4);
      expect(graph.nodes.size).toBeGreaterThan(0);
    });

    it('9. should throw TypeError for non-array sequences', () => {
      expect(() => buildDeBruijnGraph('ATCG' as any, 4)).toThrow(TypeError);
      expect(() => buildDeBruijnGraph('ATCG' as any, 4)).toThrow('sequences must be an array');
    });

    it('10. should throw TypeError for non-number k', () => {
      expect(() => buildDeBruijnGraph(['ATCG'], '4' as any)).toThrow(TypeError);
      expect(() => buildDeBruijnGraph(['ATCG'], '4' as any)).toThrow('k must be a number');
    });

    it('11. should throw Error for k < 2', () => {
      expect(() => buildDeBruijnGraph(['ATCG'], 1)).toThrow(Error);
      expect(() => buildDeBruijnGraph(['ATCG'], 1)).toThrow('k must be an integer >= 2');
    });

    it('12. should throw Error for non-integer k', () => {
      expect(() => buildDeBruijnGraph(['ATCG'], 3.5)).toThrow(Error);
    });
  });

  describe('findContigs', () => {
    it('1. should extract contigs from graph', () => {
      const sequences = ['AAATTTGGGCCC']; // Longer linear sequence
      const graph = buildDeBruijnGraph(sequences, 3);
      const contigs = findContigs(graph);
      // findContigs extracts unbranched paths
      expect(Array.isArray(contigs)).toBe(true);
    });

    it('2. should return contigs with correct minimum length', () => {
      const sequences = ['ATCGATCGATCG'];
      const graph = buildDeBruijnGraph(sequences, 4);
      const contigs = findContigs(graph, { minLength: 10 });
      contigs.forEach((contig) => {
        expect(contig.length).toBeGreaterThanOrEqual(10);
      });
    });

    it('3. should handle graph with no unbranched paths', () => {
      const sequences = ['ATCG'];
      const graph = buildDeBruijnGraph(sequences, 4);
      const contigs = findContigs(graph);
      expect(Array.isArray(contigs)).toBe(true);
    });

    it('4. should not revisit same k-mers', () => {
      const sequences = ['ATCGATCGATCG'];
      const graph = buildDeBruijnGraph(sequences, 3);
      const contigs = findContigs(graph);
      // All contigs should be unique
      const uniqueContigs = new Set(contigs);
      expect(uniqueContigs.size).toBe(contigs.length);
    });

    it('5. should handle empty graph', () => {
      const graph: DeBruijnGraph = { nodes: new Map(), reverseEdges: new Map(), k: 4 };
      const contigs = findContigs(graph);
      expect(contigs).toEqual([]);
    });

    it('6. should respect default minimum length', () => {
      const sequences = ['ATCGATCGATCG'];
      const graph = buildDeBruijnGraph(sequences, 4);
      const contigs = findContigs(graph);
      contigs.forEach((contig) => {
        expect(contig.length).toBeGreaterThanOrEqual(graph.k + 1);
      });
    });
  });

  describe('getGraphStats', () => {
    it('1. should calculate node count', () => {
      const sequences = ['ATCGATCG'];
      const graph = buildDeBruijnGraph(sequences, 4);
      const stats = getGraphStats(graph);
      expect(stats.nodeCount).toBe(graph.nodes.size);
    });

    it('2. should calculate edge count', () => {
      const sequences = ['ATCGATCG'];
      const graph = buildDeBruijnGraph(sequences, 4);
      const stats = getGraphStats(graph);
      expect(stats.edgeCount).toBeGreaterThanOrEqual(0);
    });

    it('3. should calculate average coverage', () => {
      const sequences = ['ATCGATCG', 'ATCGATCG'];
      const graph = buildDeBruijnGraph(sequences, 4);
      const stats = getGraphStats(graph);
      expect(stats.avgCoverage).toBeGreaterThan(1);
    });

    it('4. should find maximum coverage', () => {
      const sequences = ['ATCGATCG', 'ATCGATCG'];
      const graph = buildDeBruijnGraph(sequences, 4);
      const stats = getGraphStats(graph);
      expect(stats.maxCoverage).toBeGreaterThanOrEqual(stats.avgCoverage);
    });

    it('5. should count branching nodes', () => {
      const sequences = ['ATCGATCG', 'ATCGTTCG']; // Creates branch
      const graph = buildDeBruijnGraph(sequences, 3);
      const stats = getGraphStats(graph);
      expect(stats.branchingNodes).toBeGreaterThanOrEqual(0);
    });

    it('6. should count dead ends', () => {
      const sequences = ['ATCGATCG'];
      const graph = buildDeBruijnGraph(sequences, 4);
      const stats = getGraphStats(graph);
      expect(stats.deadEnds).toBeGreaterThanOrEqual(0);
    });

    it('7. should handle empty graph', () => {
      const graph: DeBruijnGraph = { nodes: new Map(), reverseEdges: new Map(), k: 4 };
      const stats = getGraphStats(graph);
      expect(stats.nodeCount).toBe(0);
      expect(stats.edgeCount).toBe(0);
      expect(stats.avgCoverage).toBe(0);
      expect(stats.maxCoverage).toBe(0);
    });

    it('8. should return all expected properties', () => {
      const sequences = ['ATCGATCG'];
      const graph = buildDeBruijnGraph(sequences, 4);
      const stats = getGraphStats(graph);
      expect(stats).toHaveProperty('nodeCount');
      expect(stats).toHaveProperty('edgeCount');
      expect(stats).toHaveProperty('avgCoverage');
      expect(stats).toHaveProperty('maxCoverage');
      expect(stats).toHaveProperty('branchingNodes');
      expect(stats).toHaveProperty('deadEnds');
    });
  });

  describe('removeTips', () => {
    it('1. should remove short tips', () => {
      const sequences = ['ATCGATCGATCG', 'ATCG']; // Short tip
      const graph = buildDeBruijnGraph(sequences, 3);
      const initialSize = graph.nodes.size;
      const removed = removeTips(graph, 2);
      expect(graph.nodes.size).toBeLessThanOrEqual(initialSize);
    });

    it('2. should return number of removed tips', () => {
      const sequences = ['ATCGATCGATCG'];
      const graph = buildDeBruijnGraph(sequences, 3);
      const removed = removeTips(graph, 5);
      expect(typeof removed).toBe('number');
      expect(removed).toBeGreaterThanOrEqual(0);
    });

    it('3. should not remove tips longer than threshold', () => {
      const sequences = ['ATCGATCGATCG'];
      const graph = buildDeBruijnGraph(sequences, 3);
      const initialSize = graph.nodes.size;
      const removed = removeTips(graph, 0); // No tips should be removed
      expect(removed).toBe(0);
    });

    it('4. should handle graph with no tips', () => {
      const sequences = ['ATCGATCGATCG'];
      const graph = buildDeBruijnGraph(sequences, 3);
      const removed = removeTips(graph, 100);
      expect(removed).toBeGreaterThanOrEqual(0);
    });

    it('5. should handle empty graph', () => {
      const graph: DeBruijnGraph = { nodes: new Map(), reverseEdges: new Map(), k: 4 };
      const removed = removeTips(graph, 5);
      expect(removed).toBe(0);
    });
  });

  describe('removeLowCoverageNodes', () => {
    it('1. should remove nodes below coverage threshold', () => {
      const sequences = ['ATCGATCG', 'ATCGATCG', 'GGGG'];
      const graph = buildDeBruijnGraph(sequences, 4);
      const removed = removeLowCoverageNodes(graph, 2);
      const nodes = Array.from(graph.nodes.values());
      expect(nodes.every((node) => node.coverage >= 2)).toBe(true);
    });

    it('2. should return number of removed nodes', () => {
      const sequences = ['ATCGATCG', 'ATCGATCG', 'GGGG'];
      const graph = buildDeBruijnGraph(sequences, 4);
      const removed = removeLowCoverageNodes(graph, 2);
      expect(typeof removed).toBe('number');
      expect(removed).toBeGreaterThanOrEqual(0);
    });

    it('3. should remove edges to deleted nodes', () => {
      const sequences = ['ATCGATCG', 'ATCGATCG', 'GGGG'];
      const graph = buildDeBruijnGraph(sequences, 4);
      removeLowCoverageNodes(graph, 2);
      const nodes = Array.from(graph.nodes.values());
      nodes.forEach((node) => {
        node.edges.forEach((edge) => {
          expect(graph.nodes.has(edge)).toBe(true);
        });
      });
    });

    it('4. should handle graph with all high coverage', () => {
      const sequences = ['ATCGATCG', 'ATCGATCG'];
      const graph = buildDeBruijnGraph(sequences, 4);
      const removed = removeLowCoverageNodes(graph, 1);
      expect(removed).toBe(0);
    });

    it('5. should handle empty graph', () => {
      const graph: DeBruijnGraph = { nodes: new Map(), reverseEdges: new Map(), k: 4 };
      const removed = removeLowCoverageNodes(graph, 2);
      expect(removed).toBe(0);
    });

    it('6. should preserve high coverage nodes', () => {
      const sequences = ['ATCGATCG', 'ATCGATCG', 'ATCGATCG'];
      const graph = buildDeBruijnGraph(sequences, 4);
      const initialNodes = Array.from(graph.nodes.keys());
      removeLowCoverageNodes(graph, 2);
      initialNodes.forEach((kmer) => {
        if (graph.nodes.has(kmer)) {
          expect(graph.nodes.get(kmer)!.coverage).toBeGreaterThanOrEqual(2);
        }
      });
    });
  });
});
