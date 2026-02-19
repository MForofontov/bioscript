/**
 * De Bruijn graph utilities for sequence assembly and analysis.
 * De Bruijn graphs represent k-mers as nodes with (k-1) overlaps as edges.
 * Used extensively in genome assembly algorithms (Velvet, SPAdes, etc.).
 *
 * @module debruijn
 */

import { reverseComplement } from './reverse-complement';
import { assertArray, assertNumber } from './validation';
import { normalizeSequence } from './normalize';

/**
 * De Bruijn graph node.
 */
export interface DeBruijnNode {
  /** K-mer sequence */
  kmer: string;
  /** Outgoing edges (next k-mers) */
  edges: string[];
  /** Coverage count */
  coverage: number;
}

/**
 * De Bruijn graph representation with optimized reverse edge index.
 */
export interface DeBruijnGraph {
  /** Map of k-mer to node */
  nodes: Map<string, DeBruijnNode>;
  /** Reverse edge index for O(1) incoming edge lookups */
  reverseEdges: Map<string, Set<string>>;
  /** K-mer length */
  k: number;
}

/**
 * Build De Bruijn graph from sequences.
 * Constructs graph with optimized reverse edge index for efficient incoming edge queries.
 *
 * @param sequences - Array of DNA/RNA sequences.
 * @param k - K-mer length.
 * @param options - Graph construction options.
 * @param options.canonical - Use canonical k-mers.
 * @param options.minCoverage - Minimum coverage to include k-mer (default: 1).
 * @returns De Bruijn graph.
 *
 * @throws {TypeError} If sequences is not an array or k is not a number.
 * @throws {Error} If k is invalid.
 *
 * @example
 * ```typescript
 * const sequences = ['ATCGATCG', 'TCGATCGA'];
 * const graph = buildDeBruijnGraph(sequences, 4);
 * console.log(`Graph has ${graph.nodes.size} nodes`);
 * ```
 *
 * @note Used for: genome assembly, transcript assembly, error correction.
 * @performance O(n * m) where n is number of sequences, m is average length.
 */
export function buildDeBruijnGraph(
  sequences: string[],
  k: number,
  options: { canonical?: boolean; minCoverage?: number } = {}
): DeBruijnGraph {
  assertArray(sequences, 'sequences');
  assertNumber(k, 'k');
  if (k < 2 || !Number.isInteger(k)) {
    throw new Error(`k must be an integer >= 2, got ${k}`);
  }

  const { canonical = false, minCoverage = 1 } = options;
  const nodes = new Map<string, DeBruijnNode>();
  const reverseEdges = new Map<string, Set<string>>();

  // Extract k-mers and build graph
  for (const sequence of sequences) {
    if (typeof sequence !== 'string') {
      continue;
    }

    const normalized = normalizeSequence(sequence);

    for (let i = 0; i <= normalized.length - k; i++) {
      let kmer = normalized.slice(i, i + k);

      if (canonical) {
        const revComp = reverseComplement(kmer);
        kmer = kmer < revComp ? kmer : revComp;
      }

      // Add node if doesn't exist
      if (!nodes.has(kmer)) {
        nodes.set(kmer, { kmer, edges: [], coverage: 0 });
      }

      const node = nodes.get(kmer)!;
      node.coverage++;

      // Add edge to next k-mer
      if (i < normalized.length - k) {
        let nextKmer = normalized.slice(i + 1, i + 1 + k);

        if (canonical) {
          const revComp = reverseComplement(nextKmer);
          nextKmer = nextKmer < revComp ? nextKmer : revComp;
        }

        if (!node.edges.includes(nextKmer)) {
          node.edges.push(nextKmer);

          // Update reverse edge index
          if (!reverseEdges.has(nextKmer)) {
            reverseEdges.set(nextKmer, new Set());
          }
          reverseEdges.get(nextKmer)!.add(kmer);
        }
      }
    }
  }

  // Filter by minimum coverage
  if (minCoverage > 1) {
    for (const [kmer, node] of nodes) {
      if (node.coverage < minCoverage) {
        nodes.delete(kmer);
        reverseEdges.delete(kmer);
      }
    }

    // Remove edges to deleted nodes
    for (const node of nodes.values()) {
      node.edges = node.edges.filter((edge) => nodes.has(edge));
    }

    // Clean up reverse edges
    for (const [, incoming] of reverseEdges) {
      for (const source of incoming) {
        if (!nodes.has(source)) {
          incoming.delete(source);
        }
      }
    }
  }

  return { nodes, reverseEdges, k };
}

/**
 * Find contigs (unbranched paths) in De Bruijn graph.
 *
 * @param graph - De Bruijn graph.
 * @param options - Contig finding options.
 * @param options.minLength - Minimum contig length (default: k+1).
 * @returns Array of contig sequences.
 *
 * @example
 * ```typescript
 * const sequences = ['ATCGATCG', 'TCGATCGA'];
 * const graph = buildDeBruijnGraph(sequences, 4);
 * const contigs = findContigs(graph);
 * contigs.forEach(c => console.log(c));
 * ```
 *
 * @performance O(n) where n is number of nodes.
 */
export function findContigs(graph: DeBruijnGraph, options: { minLength?: number } = {}): string[] {
  const { minLength = graph.k + 1 } = options;
  const contigs: string[] = [];
  const visited = new Set<string>();

  for (const [kmer, node] of graph.nodes) {
    // Skip if already visited or is branching point
    if (visited.has(kmer) || node.edges.length !== 1) {
      continue;
    }

    // Check if previous k-mer has single edge (not branching)
    const incoming = graph.reverseEdges.get(kmer);
    if (incoming && incoming.size === 1) {
      const prevKmer = [...incoming][0];
      const prevNode = graph.nodes.get(prevKmer);
      if (prevNode && prevNode.edges.length === 1) {
        continue; // Not start of contig
      }
    }

    // Extend contig
    let contig = kmer;
    visited.add(kmer);
    let currentKmer = kmer;

    while (true) {
      const currentNode = graph.nodes.get(currentKmer);
      if (!currentNode || currentNode.edges.length !== 1) {
        break;
      }

      const nextKmer = currentNode.edges[0];
      const nextNode = graph.nodes.get(nextKmer);

      if (!nextNode || visited.has(nextKmer)) {
        break;
      }

      // Check if next k-mer has multiple incoming edges
      const incomingEdges = graph.reverseEdges.get(nextKmer);
      if (incomingEdges && incomingEdges.size > 1) {
        break;
      }

      contig += nextKmer[nextKmer.length - 1]; // Append last base
      visited.add(nextKmer);
      currentKmer = nextKmer;
    }

    if (contig.length >= minLength) {
      contigs.push(contig);
    }
  }

  return contigs;
}

/**
 * Calculate graph statistics.
 *
 * @param graph - De Bruijn graph.
 * @returns Graph statistics.
 *
 * @example
 * ```typescript
 * const stats = getGraphStats(graph);
 * console.log(`Nodes: ${stats.nodeCount}`);
 * console.log(`Avg coverage: ${stats.avgCoverage.toFixed(1)}`);
 * ```
 */
export function getGraphStats(graph: DeBruijnGraph): {
  nodeCount: number;
  edgeCount: number;
  avgCoverage: number;
  maxCoverage: number;
  branchingNodes: number;
  deadEnds: number;
} {
  let edgeCount = 0;
  let totalCoverage = 0;
  let maxCoverage = 0;
  let branchingNodes = 0;
  let deadEnds = 0;

  for (const node of graph.nodes.values()) {
    edgeCount += node.edges.length;
    totalCoverage += node.coverage;
    maxCoverage = Math.max(maxCoverage, node.coverage);

    if (node.edges.length > 1) {
      branchingNodes++;
    }
    if (node.edges.length === 0) {
      deadEnds++;
    }
  }

  return {
    nodeCount: graph.nodes.size,
    edgeCount,
    avgCoverage: graph.nodes.size > 0 ? totalCoverage / graph.nodes.size : 0,
    maxCoverage,
    branchingNodes,
    deadEnds,
  };
}

/**
 * Simplify graph by removing tips (dead-end branches).
 *
 * @param graph - De Bruijn graph to simplify (modified in place).
 * @param maxTipLength - Maximum tip length to remove.
 * @returns Number of tips removed.
 *
 * @example
 * ```typescript
 * const graph = buildDeBruijnGraph(sequences, 4);
 * const removed = removeTips(graph, 10);
 * console.log(`Removed ${removed} tips`);
 * ```
 */
export function removeTips(graph: DeBruijnGraph, maxTipLength: number): number {
  let removed = 0;
  const toRemove: string[] = [];

  for (const [kmer, node] of graph.nodes) {
    if (node.edges.length === 0) {
      // Dead end - check if it's a tip
      const pathLength = getTipLength(graph, kmer);
      if (pathLength <= maxTipLength) {
        toRemove.push(kmer);
      }
    }
  }

  // Remove tips
  for (const kmer of toRemove) {
    removeKmer(graph, kmer);
    removed++;
  }

  return removed;
}

/**
 * Remove low-coverage nodes (likely errors).
 *
 * @param graph - De Bruijn graph to clean (modified in place).
 * @param minCoverage - Minimum coverage threshold.
 * @returns Number of nodes removed.
 *
 * @example
 * ```typescript
 * const removed = removeLowCoverageNodes(graph, 3);
 * console.log(`Removed ${removed} low-coverage nodes`);
 * ```
 */
export function removeLowCoverageNodes(graph: DeBruijnGraph, minCoverage: number): number {
  let removed = 0;
  const toRemove: string[] = [];

  for (const [kmer, node] of graph.nodes) {
    if (node.coverage < minCoverage) {
      toRemove.push(kmer);
    }
  }

  for (const kmer of toRemove) {
    removeKmer(graph, kmer);
    removed++;
  }

  return removed;
}

// Helper functions

function getTipLength(graph: DeBruijnGraph, kmer: string): number {
  let length = 0;
  let current = kmer;

  while (true) {
    const incoming = graph.reverseEdges.get(current);
    if (!incoming || incoming.size === 0) {
      break;
    }

    const prev = [...incoming][0];
    const prevNode = graph.nodes.get(prev);
    if (!prevNode || prevNode.edges.length > 1) {
      break;
    }

    length++;
    current = prev;
  }

  return length;
}

function removeKmer(graph: DeBruijnGraph, kmer: string): void {
  // Remove from nodes
  graph.nodes.delete(kmer);

  // Remove from reverse edges
  graph.reverseEdges.delete(kmer);

  // Remove edges pointing to this k-mer
  for (const node of graph.nodes.values()) {
    node.edges = node.edges.filter((edge) => edge !== kmer);
  }

  // Clean up reverse edge references
  for (const incoming of graph.reverseEdges.values()) {
    incoming.delete(kmer);
  }
}
