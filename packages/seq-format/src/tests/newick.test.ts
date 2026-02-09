/**
 * Unit tests for Newick tree parser.
 */

import {
  parseNewick,
  formatNewick,
  countLeaves,
  calculateDepth,
  getLeafNames,
  getTotalLength,
  validateNewick,
} from '../newick';

describe('parseNewick', () => {
  // Normal usage
  it('1. should parse simple tree', () => {
    const tree = parseNewick('(A,B);');
    
    expect(tree.leafCount).toBe(2);
    expect(tree.maxDepth).toBe(1);
    expect(tree.hasLengths).toBe(false);
  });

  it('2. should parse tree with branch lengths', () => {
    const tree = parseNewick('(A:0.1,B:0.2);');
    
    expect(tree.leafCount).toBe(2);
    expect(tree.hasLengths).toBe(true);
    expect(tree.root.children?.[0].length).toBe(0.1);
    expect(tree.root.children?.[1].length).toBe(0.2);
  });

  it('3. should parse nested tree', () => {
    const tree = parseNewick('((A,B),C);');
    
    expect(tree.leafCount).toBe(3);
    expect(tree.maxDepth).toBe(2);
  });

  it('4. should parse complex tree', () => {
    const tree = parseNewick('((A:0.1,B:0.2):0.3,C:0.4);');
    
    expect(tree.leafCount).toBe(3);
    expect(tree.maxDepth).toBe(2);
    expect(tree.hasLengths).toBe(true);
  });

  it('5. should parse tree with internal node names', () => {
    const tree = parseNewick('((A,B)internal,C);');
    
    expect(tree.root.children?.[0].name).toBe('internal');
  });

  it('6. should parse deeply nested tree', () => {
    const tree = parseNewick('(((A,B),C),D);');
    
    expect(tree.leafCount).toBe(4);
    expect(tree.maxDepth).toBe(3);
  });

  // Edge cases
  it('10. should handle single node', () => {
    const tree = parseNewick('A;');
    
    expect(tree.leafCount).toBe(1);
    expect(tree.maxDepth).toBe(0);
  });

  it('11. should handle whitespace', () => {
    const tree = parseNewick('  (A,B);  ');
    
    expect(tree.leafCount).toBe(2);
  });

  it('12. should handle multiple children', () => {
    const tree = parseNewick('(A,B,C,D);');
    
    expect(tree.leafCount).toBe(4);
    expect(tree.root.children).toHaveLength(4);
  });

  it('13. should handle scientific notation lengths', () => {
    const tree = parseNewick('(A:1e-6,B:2.5e-3);');
    
    expect(tree.root.children?.[0].length).toBeCloseTo(0.000001);
    expect(tree.root.children?.[1].length).toBeCloseTo(0.0025);
  });

  // Error cases
  it('15. should throw TypeError for non-string input', () => {
    expect(() => parseNewick(123 as any)).toThrow(TypeError);
    expect(() => parseNewick(123 as any)).toThrow('newick must be a string');
  });

  it('16. should throw Error for missing semicolon', () => {
    expect(() => parseNewick('(A,B)')).toThrow(Error);
    expect(() => parseNewick('(A,B)')).toThrow('must end with semicolon');
  });

  it('17. should throw Error for unmatched parentheses', () => {
    expect(() => parseNewick('((A,B);')).toThrow(Error);
  });

  it('18. should throw Error for invalid branch length', () => {
    expect(() => parseNewick('(A:xyz,B);')).toThrow(Error);
    expect(() => parseNewick('(A:xyz,B);')).toThrow('Invalid branch length');
  });
});

describe('formatNewick', () => {
  // Normal usage
  it('1. should format simple tree', () => {
    const tree = parseNewick('(A,B);');
    const newick = formatNewick(tree, { includeLengths: false });
    
    expect(newick).toBe('(A,B);');
  });

  it('2. should format tree with branch lengths', () => {
    const tree = parseNewick('(A:0.1,B:0.2);');
    const newick = formatNewick(tree);
    
    expect(newick).toBe('(A:0.100000,B:0.200000);');
  });

  it('3. should format nested tree', () => {
    const tree = parseNewick('((A,B),C);');
    const newick = formatNewick(tree, { includeLengths: false });
    
    expect(newick).toBe('((A,B),C);');
  });

  it('4. should format with custom precision', () => {
    const tree = parseNewick('(A:0.123456789,B:0.987654321);');
    const newick = formatNewick(tree, { precision: 2 });
    
    expect(newick).toBe('(A:0.12,B:0.99);');
  });

  it('5. should format tree with internal names', () => {
    const tree = parseNewick('((A,B)internal,C);');
    const newick = formatNewick(tree, { includeLengths: false });
    
    expect(newick).toBe('((A,B)internal,C);');
  });

  // Edge cases
  it('10. should format single node', () => {
    const tree = parseNewick('A;');
    const newick = formatNewick(tree, { includeLengths: false });
    
    expect(newick).toBe('A;');
  });

  it('11. should handle tree without lengths', () => {
    const tree = parseNewick('(A,B);');
    const newick = formatNewick(tree);
    
    expect(newick).toBe('(A,B);');
  });

  // Error cases
  it('15. should throw TypeError for invalid input', () => {
    expect(() => formatNewick(null as any)).toThrow(TypeError);
    expect(() => formatNewick(null as any)).toThrow('tree must be an object');
  });
});

describe('countLeaves', () => {
  // Normal usage
  it('1. should count leaves in simple tree', () => {
    const tree = parseNewick('(A,B);');
    const count = countLeaves(tree.root);
    
    expect(count).toBe(2);
  });

  it('2. should count leaves in nested tree', () => {
    const tree = parseNewick('((A,B),(C,D));');
    const count = countLeaves(tree.root);
    
    expect(count).toBe(4);
  });

  it('3. should count leaves in asymmetric tree', () => {
    const tree = parseNewick('(((A,B),C),D);');
    const count = countLeaves(tree.root);
    
    expect(count).toBe(4);
  });

  // Edge cases
  it('10. should handle single node', () => {
    const tree = parseNewick('A;');
    const count = countLeaves(tree.root);
    
    expect(count).toBe(1);
  });

  it('11. should handle many children', () => {
    const tree = parseNewick('(A,B,C,D,E,F,G,H);');
    const count = countLeaves(tree.root);
    
    expect(count).toBe(8);
  });
});

describe('calculateDepth', () => {
  // Normal usage
  it('1. should calculate depth of simple tree', () => {
    const tree = parseNewick('(A,B);');
    const depth = calculateDepth(tree.root);
    
    expect(depth).toBe(1);
  });

  it('2. should calculate depth of nested tree', () => {
    const tree = parseNewick('((A,B),C);');
    const depth = calculateDepth(tree.root);
    
    expect(depth).toBe(2);
  });

  it('3. should calculate depth of deeply nested tree', () => {
    const tree = parseNewick('((((A,B),C),D),E);');
    const depth = calculateDepth(tree.root);
    
    expect(depth).toBe(4);
  });

  // Edge cases
  it('10. should handle single node', () => {
    const tree = parseNewick('A;');
    const depth = calculateDepth(tree.root);
    
    expect(depth).toBe(0);
  });

  it('11. should handle asymmetric tree', () => {
    const tree = parseNewick('(((A,B),C),D);');
    const depth = calculateDepth(tree.root);
    
    expect(depth).toBe(3);
  });
});

describe('getLeafNames', () => {
  // Normal usage
  it('1. should get leaf names from simple tree', () => {
    const tree = parseNewick('(A,B);');
    const names = getLeafNames(tree.root);
    
    expect(names).toEqual(['A', 'B']);
  });

  it('2. should get leaf names from nested tree', () => {
    const tree = parseNewick('((A,B),C);');
    const names = getLeafNames(tree.root);
    
    expect(names).toEqual(['A', 'B', 'C']);
  });

  it('3. should preserve leaf order', () => {
    const tree = parseNewick('(((D,C),B),A);');
    const names = getLeafNames(tree.root);
    
    expect(names).toEqual(['D', 'C', 'B', 'A']);
  });

  // Edge cases
  it('10. should handle single node', () => {
    const tree = parseNewick('OnlyOne;');
    const names = getLeafNames(tree.root);
    
    expect(names).toEqual(['OnlyOne']);
  });

  it('11. should handle unnamed leaves', () => {
    const tree = parseNewick('(A,,B);');
    const names = getLeafNames(tree.root);
    
    expect(names).toEqual(['A', 'B']);
  });
});

describe('getTotalLength', () => {
  // Normal usage
  it('1. should calculate total length', () => {
    const tree = parseNewick('(A:0.1,B:0.2);');
    const total = getTotalLength(tree.root);
    
    expect(total).toBeCloseTo(0.3);
  });

  it('2. should calculate nested tree length', () => {
    const tree = parseNewick('((A:0.1,B:0.2):0.3,C:0.4);');
    const total = getTotalLength(tree.root);
    
    expect(total).toBeCloseTo(1.0);
  });

  it('3. should handle complex tree', () => {
    const tree = parseNewick('(((A:1,B:2):3,C:4):5,D:6);');
    const total = getTotalLength(tree.root);
    
    expect(total).toBe(21);
  });

  // Edge cases
  it('10. should return 0 for tree without lengths', () => {
    const tree = parseNewick('(A,B);');
    const total = getTotalLength(tree.root);
    
    expect(total).toBe(0);
  });

  it('11. should handle partial lengths', () => {
    const tree = parseNewick('(A:0.5,B);');
    const total = getTotalLength(tree.root);
    
    expect(total).toBeCloseTo(0.5);
  });
});

describe('validateNewick', () => {
  // Normal usage
  it('1. should validate simple tree', () => {
    expect(validateNewick('(A,B);')).toBe(true);
  });

  it('2. should validate tree with lengths', () => {
    expect(validateNewick('(A:0.1,B:0.2);')).toBe(true);
  });

  it('3. should validate nested tree', () => {
    expect(validateNewick('((A,B),C);')).toBe(true);
  });

  it('4. should validate single node', () => {
    expect(validateNewick('A;')).toBe(true);
  });

  // Edge cases
  it('10. should invalidate missing semicolon', () => {
    expect(validateNewick('(A,B)')).toBe(false);
  });

  it('11. should invalidate unmatched opening paren', () => {
    expect(validateNewick('((A,B);')).toBe(false);
  });

  it('12. should invalidate unmatched closing paren', () => {
    expect(validateNewick('(A,B));')).toBe(false);
  });

  it('13. should invalidate invalid branch length', () => {
    expect(validateNewick('(A:xyz,B);')).toBe(false);
  });

  it('14. should invalidate empty string', () => {
    expect(validateNewick('')).toBe(false);
  });

  it('15. should invalidate non-string input', () => {
    expect(validateNewick(123 as any)).toBe(false);
  });
});
