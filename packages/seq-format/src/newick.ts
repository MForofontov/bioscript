/**
 * Newick format parser for phylogenetic trees.
 * Supports tree parsing, formatting, and basic tree operations.
 *
 * @module newick
 */

import type { NewickNode, NewickTree } from './types';

/**
 * Parse Newick format string into tree structure.
 *
 * @param newick - Newick format string (e.g., "((A:0.1,B:0.2):0.3,C:0.4);").
 * @returns Parsed tree with metadata.
 *
 * @throws {TypeError} If newick is not a string.
 * @throws {Error} If Newick string is invalid.
 *
 * @example
 * ```typescript
 * const tree = parseNewick('((A:0.1,B:0.2):0.3,C:0.4);');
 * console.log(tree.leafCount); // 3
 * console.log(tree.hasLengths); // true
 * ```
 *
 * @example
 * ```typescript
 * // Simple tree without branch lengths
 * const tree = parseNewick('((A,B),C);');
 * console.log(tree.hasLengths); // false
 * ```
 *
 * @note Standard Newick format ends with semicolon.
 * @performance O(n) where n is string length.
 */
export function parseNewick(newick: string): NewickTree {
  if (typeof newick !== 'string') {
    throw new TypeError(`newick must be a string, got ${typeof newick}`);
  }

  const trimmed = newick.trim();
  if (!trimmed.endsWith(';')) {
    throw new Error('Newick string must end with semicolon');
  }

  const treeString = trimmed.slice(0, -1); // Remove trailing semicolon
  let position = 0;
  let hasLengths = false;

  const parseNode = (): NewickNode => {
    const node: NewickNode = {};

    // Check for opening parenthesis (internal node)
    if (treeString[position] === '(') {
      position++; // Skip '('
      node.children = [];

      // Parse first child
      node.children.push(parseNode());

      // Parse remaining children
      while (treeString[position] === ',') {
        position++; // Skip ','
        node.children.push(parseNode());
      }

      if (treeString[position] !== ')') {
        throw new Error(`Expected ')' at position ${position}`);
      }
      position++; // Skip ')'
    }

    // Parse node name (optional)
    let name = '';
    while (
      position < treeString.length &&
      treeString[position] !== ':' &&
      treeString[position] !== ',' &&
      treeString[position] !== ')' &&
      treeString[position] !== ';'
    ) {
      name += treeString[position];
      position++;
    }
    if (name) {
      node.name = name;
    }

    // Parse branch length (optional)
    if (treeString[position] === ':') {
      position++; // Skip ':'
      let lengthStr = '';
      while (
        position < treeString.length &&
        treeString[position] !== ',' &&
        treeString[position] !== ')' &&
        treeString[position] !== ';'
      ) {
        lengthStr += treeString[position];
        position++;
      }
      const length = parseFloat(lengthStr);
      if (isNaN(length)) {
        throw new Error(`Invalid branch length: ${lengthStr}`);
      }
      node.length = length;
      hasLengths = true;
    }

    return node;
  };

  try {
    const root = parseNode();

    // Calculate tree metadata
    const leafCount = countLeaves(root);
    const maxDepth = calculateDepth(root);

    return {
      root,
      leafCount,
      maxDepth,
      hasLengths,
    };
  } catch (error) {
    throw new Error(
      `Failed to parse Newick string at position ${position}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Format tree structure back to Newick string.
 *
 * @param tree - Tree structure to format.
 * @param options - Formatting options.
 * @param options.includeLengths - Include branch lengths (default: true).
 * @param options.precision - Decimal precision for lengths (default: 6).
 * @returns Newick format string.
 *
 * @throws {TypeError} If tree is not an object.
 *
 * @example
 * ```typescript
 * const tree = parseNewick('((A:0.1,B:0.2):0.3,C:0.4);');
 * const newick = formatNewick(tree);
 * console.log(newick); // '((A:0.1,B:0.2):0.3,C:0.4);'
 * ```
 *
 * @example
 * ```typescript
 * // Without branch lengths
 * const newick = formatNewick(tree, { includeLengths: false });
 * console.log(newick); // '((A,B),C);'
 * ```
 *
 * @performance O(n) where n is number of nodes.
 */
export function formatNewick(
  tree: NewickTree | NewickNode,
  options: { includeLengths?: boolean; precision?: number } = {}
): string {
  if (typeof tree !== 'object' || tree === null) {
    throw new TypeError(`tree must be an object, got ${typeof tree}`);
  }

  const { includeLengths = true, precision = 6 } = options;
  const root = 'root' in tree ? tree.root : tree;

  const formatNode = (node: NewickNode): string => {
    let result = '';

    // Format children if internal node
    if (node.children && node.children.length > 0) {
      const childStrings = node.children.map((child) => formatNode(child));
      result += `(${childStrings.join(',')})`;
    }

    // Add node name if present
    if (node.name) {
      result += node.name;
    }

    // Add branch length if present and requested
    if (includeLengths && node.length !== undefined) {
      result += `:${node.length.toFixed(precision)}`;
    }

    return result;
  };

  return formatNode(root) + ';';
}

/**
 * Count number of leaf nodes in tree.
 *
 * @param node - Root node to count from.
 * @returns Number of leaf nodes.
 *
 * @example
 * ```typescript
 * const tree = parseNewick('((A,B),(C,D));');
 * const leaves = countLeaves(tree.root);
 * console.log(leaves); // 4
 * ```
 */
export function countLeaves(node: NewickNode): number {
  if (!node.children || node.children.length === 0) {
    return 1; // Leaf node
  }

  return node.children.reduce((count, child) => count + countLeaves(child), 0);
}

/**
 * Calculate maximum depth of tree.
 *
 * @param node - Root node to measure from.
 * @returns Maximum depth (leaves are at depth 0).
 *
 * @example
 * ```typescript
 * const tree = parseNewick('(((A,B),C),D);');
 * const depth = calculateDepth(tree.root);
 * console.log(depth); // 3
 * ```
 */
export function calculateDepth(node: NewickNode): number {
  if (!node.children || node.children.length === 0) {
    return 0; // Leaf node
  }

  const childDepths = node.children.map((child) => calculateDepth(child));
  return 1 + Math.max(...childDepths);
}

/**
 * Get all leaf names from tree.
 *
 * @param node - Root node to collect from.
 * @returns Array of leaf names.
 *
 * @example
 * ```typescript
 * const tree = parseNewick('((A:0.1,B:0.2):0.3,C:0.4);');
 * const leaves = getLeafNames(tree.root);
 * console.log(leaves); // ['A', 'B', 'C']
 * ```
 */
export function getLeafNames(node: NewickNode): string[] {
  if (!node.children || node.children.length === 0) {
    return node.name ? [node.name] : [];
  }

  return node.children.flatMap((child) => getLeafNames(child));
}

/**
 * Calculate total tree length (sum of all branch lengths).
 *
 * @param node - Root node to measure from.
 * @returns Total branch length, or 0 if no lengths present.
 *
 * @example
 * ```typescript
 * const tree = parseNewick('((A:0.1,B:0.2):0.3,C:0.4);');
 * const totalLength = getTotalLength(tree.root);
 * console.log(totalLength); // 1.0
 * ```
 */
export function getTotalLength(node: NewickNode): number {
  let total = node.length || 0;

  if (node.children) {
    total += node.children.reduce((sum, child) => sum + getTotalLength(child), 0);
  }

  return total;
}

/**
 * Validate Newick format string.
 *
 * @param newick - Newick string to validate.
 * @returns True if valid, false otherwise.
 *
 * @example
 * ```typescript
 * validateNewick('((A,B),C);'); // true
 * validateNewick('((A,B),C)'); // false (missing semicolon)
 * validateNewick('((A,B,C);'); // false (unmatched parentheses)
 * ```
 */
export function validateNewick(newick: string): boolean {
  if (typeof newick !== 'string') {
    return false;
  }

  const trimmed = newick.trim();
  if (!trimmed.endsWith(';')) {
    return false;
  }

  // Check parentheses balance
  let depth = 0;
  for (const char of trimmed) {
    if (char === '(') {
      depth++;
    } else if (char === ')') {
      depth--;
      if (depth < 0) {
        return false;
      }
    }
  }

  if (depth !== 0) {
    return false;
  }

  // Try parsing
  try {
    parseNewick(newick);
    return true;
  } catch {
    return false;
  }
}
