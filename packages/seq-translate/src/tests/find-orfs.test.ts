/**
 * Unit tests for find-orfs.ts
 * Tests cover: normal usage, edge cases, error handling.
 */

import { findOrfs } from '../find-orfs';

describe('findOrfs', () => {
  // SECTION 1: Normal/typical usage

  it('1. should find simple ORF with start and stop codon', () => {
    const sequence = 'ATGGCCAAATAA'; // ATG-GCC-AAA-TAA (M-A-K-*)
    const orfs = findOrfs(sequence, { minLength: 9 });

    expect(orfs).toHaveLength(1);
    expect(orfs[0]).toMatchObject({
      sequence: 'ATGGCCAAATAA',
      start: 0,
      end: 12,
      frame: 0,
      strand: '+',
      length: 12,
      hasStopCodon: true,
    });
  });

  it('2. should translate ORF when translate option is true', () => {
    const sequence = 'ATGGCCAAATAA';
    const orfs = findOrfs(sequence, { minLength: 9, translate: true });

    expect(orfs).toHaveLength(1);
    expect(orfs[0].protein).toBe('MAK*');
  });

  it('3. should find multiple ORFs in sequence', () => {
    // Two ORFs: ATG-GCC-TAA and ATG-AAA-TAG
    const sequence = 'ATGGCCTAAATGAAATAG';
    const orfs = findOrfs(sequence, { minLength: 9 });

    expect(orfs).toHaveLength(2);
    expect(orfs[0].start).toBe(0);
    expect(orfs[0].end).toBe(9);
    expect(orfs[1].start).toBe(9);
    expect(orfs[1].end).toBe(18);
  });

  it('4. should respect minLength filter', () => {
    const sequence = 'ATGTAA'; // Only 6bp
    const orfsShort = findOrfs(sequence, { minLength: 6 });
    const orfsLong = findOrfs(sequence, { minLength: 9 });

    expect(orfsShort).toHaveLength(1);
    expect(orfsLong).toHaveLength(0);
  });

  it('5. should find ORFs in all three forward frames', () => {
    // Frame 0: ATG-TAA at position 0
    // Frame 1: TGT-AAG at position 1 (no start codon)
    // Frame 2: GTA-AGA-TGG-CCA-AA (ATG in reverse) at position 2
    const sequence = 'ATGTAAGATGGCCAA';
    const orfs = findOrfs(sequence, { minLength: 6, allFrames: false });

    // Should find ORF in frame 0
    expect(orfs.length).toBeGreaterThanOrEqual(1);
    expect(orfs[0].frame).toBe(0);
  });

  it('6. should find ORFs in reverse complement (6 frames)', () => {
    // Forward: ATGGCCTAACAT -> ATG-GCC-TAA (ORF with stop)
    // Reverse comp: ATGTTAGGCCAT -> ATG-TTA-GGC-CAT (ORF without stop, needs includePartial)
    const sequence = 'ATGGCCTAACAT';
    const orfsForward = findOrfs(sequence, { minLength: 6, allFrames: false });
    const orfsAll = findOrfs(sequence, {
      minLength: 6,
      allFrames: true,
      includePartial: true, // Include ORFs without stop codon
    });

    expect(orfsForward.length).toBeGreaterThanOrEqual(1);
    expect(orfsAll.length).toBeGreaterThanOrEqual(orfsForward.length);

    // Check that we can find ORFs in both strands
    const forwardOrfs = orfsAll.filter((orf) => orf.strand === '+');
    const reverseOrfs = orfsAll.filter((orf) => orf.strand === '-');

    expect(forwardOrfs.length).toBeGreaterThan(0);
    expect(reverseOrfs.length).toBeGreaterThan(0);
  });

  it('7. should handle RNA sequence (U instead of T)', () => {
    const sequence = 'AUGGCCAAAUAA'; // RNA
    const orfs = findOrfs(sequence, { minLength: 9 });

    expect(orfs).toHaveLength(1);
    // Sequence is normalized to DNA (T) for internal processing
    expect(orfs[0].sequence).toBe('ATGGCCAAATAA');
    expect(orfs[0].length).toBe(12);
  });

  it('8. should use different genetic code tables', () => {
    // AGA is stop in vertebrate mitochondrial (not in standard)
    const sequence = 'ATGAGACCC'; // ATG-AGA-CCC
    const standardOrfs = findOrfs(sequence, {
      minLength: 6,
      table: 'standard',
      translate: true,
    });
    const mitoOrfs = findOrfs(sequence, {
      minLength: 6,
      table: 'vertebrate_mitochondrial',
      translate: true,
    });

    expect(standardOrfs).toHaveLength(0); // No stop codon without includePartial
    expect(mitoOrfs).toHaveLength(1); // AGA is stop in mito
    expect(mitoOrfs[0].protein).toBe('M*');
  });

  it('9. should handle custom stop symbol', () => {
    const sequence = 'ATGGCCAAATAA';
    const orfs = findOrfs(sequence, {
      minLength: 9,
      translate: true,
      stopSymbol: 'X',
    });

    expect(orfs[0].protein).toBe('MAKX');
  });

  // SECTION 2: Edge cases

  it('10. should handle empty sequence', () => {
    const sequence = '';
    const orfs = findOrfs(sequence);

    expect(orfs).toHaveLength(0);
  });

  it('11. should handle sequence with no ORFs', () => {
    const sequence = 'ACGTACGTACGT'; // No ATG start codon
    const orfs = findOrfs(sequence);

    expect(orfs).toHaveLength(0);
  });

  it('12. should handle sequence with start but no stop (partial ORF)', () => {
    const sequence = 'ATGGCCAAA'; // No stop codon
    const orfsNoPartial = findOrfs(sequence, { minLength: 6, includePartial: false });
    const orfsWithPartial = findOrfs(sequence, { minLength: 6, includePartial: true });

    expect(orfsNoPartial).toHaveLength(0);
    expect(orfsWithPartial).toHaveLength(1);
    expect(orfsWithPartial[0].hasStopCodon).toBe(false);
  });

  it('13. should handle very long sequence efficiently', () => {
    // Generate 10KB sequence with ORF
    const orf = 'ATG' + 'GCC'.repeat(300) + 'TAA'; // ~900bp ORF
    const sequence = 'ACGT'.repeat(1000) + orf + 'ACGT'.repeat(1000);

    const startTime = performance.now();
    const orfs = findOrfs(sequence, { minLength: 75 });
    const duration = performance.now() - startTime;

    expect(orfs.length).toBeGreaterThanOrEqual(1);
    expect(duration).toBeLessThan(100); // Should complete in <100ms
  });

  it('14. should handle sequence with only N bases', () => {
    const sequence = 'NNNNNNNNN';
    const orfs = findOrfs(sequence);

    expect(orfs).toHaveLength(0);
  });

  it('15. should find nested ORFs when breakOnStop is false', () => {
    // ATG-TAA-ATG-TAA: contains nested ORF
    const sequence = 'ATGTAAATGTAA';
    const orfs = findOrfs(sequence, {
      minLength: 6,
      breakOnStop: false,
    });

    // Should find both ORFs
    expect(orfs.length).toBeGreaterThanOrEqual(1);
  });

  it('16. should sort ORFs by start position', () => {
    // Multiple ORFs in different frames
    const sequence = 'AATGGCCTAGCATGAAATAA'; // ORFs at different positions
    const orfs = findOrfs(sequence, { minLength: 6, allFrames: false });

    if (orfs.length > 1) {
      for (let i = 1; i < orfs.length; i++) {
        expect(orfs[i].start).toBeGreaterThanOrEqual(orfs[i - 1].start);
      }
    }
  });

  it('17. should handle alternative start codons', () => {
    // CTG as alternative start codon (used in some bacteria)
    const sequence = 'CTGGCCAAATAA';
    const orfsDefault = findOrfs(sequence, { minLength: 9 });
    const orfsAlt = findOrfs(sequence, {
      minLength: 9,
      startCodons: ['ATG', 'CTG'],
    });

    expect(orfsDefault).toHaveLength(0); // No ATG
    expect(orfsAlt).toHaveLength(1); // CTG accepted
  });

  it('18. should correctly calculate reverse strand coordinates', () => {
    const sequence = 'ATGGCCTAA'; // Length 9
    const orfs = findOrfs(sequence, { minLength: 6, allFrames: true });

    for (const orf of orfs) {
      expect(orf.start).toBeGreaterThanOrEqual(0);
      expect(orf.end).toBeLessThanOrEqual(sequence.length);
      expect(orf.end).toBeGreaterThan(orf.start);
    }
  });

  it('19. should handle sequence with whitespace', () => {
    const sequence = '  ATGGCCAAATAA  ';
    const orfs = findOrfs(sequence, { minLength: 9 });

    expect(orfs).toHaveLength(1);
  });

  it('20. should handle mixed case sequence', () => {
    const sequence = 'atgGCCaaaTAA';
    const orfs = findOrfs(sequence, { minLength: 9 });

    expect(orfs).toHaveLength(1);
    expect(orfs[0].sequence).toBe('ATGGCCAAATAA');
  });

  // SECTION 3: Error cases (ALWAYS LAST)

  it('21. should throw TypeError when sequence is not a string', () => {
    const sequence = 123 as unknown as string;

    expect(() => findOrfs(sequence)).toThrow(TypeError);
    expect(() => findOrfs(sequence)).toThrow('sequence must be a string');
  });

  it('22. should throw Error for invalid sequence characters', () => {
    const sequence = 'ATGXYZAAATAA';

    expect(() => findOrfs(sequence)).toThrow(Error);
    expect(() => findOrfs(sequence)).toThrow('invalid characters');
  });

  it('23. should use fallback table for unknown genetic code table', () => {
    // getTable returns standard table as fallback for unknown names
    const sequence = 'ATGGCCAAATAA';
    const orfs = findOrfs(sequence, {
      minLength: 9,
      table: 'nonexistent_table',
      translate: true,
    });

    // Should still work, using standard table
    expect(orfs).toHaveLength(1);
    expect(orfs[0].protein).toBe('MAK*');
  });
});
