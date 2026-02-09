/**
 * Tests for GenBank parser and converter.
 */

import { parseGenBank, genBankToFasta, fastaToGenBank } from '../genbank';
import type { GenBankRecord, FastaRecord } from '../types';

describe('parseGenBank', () => {
  const simpleGenBank = `LOCUS       SEQ1                     100 bp    DNA     linear   20260209
DEFINITION  Test sequence
ACCESSION   SEQ1
VERSION     SEQ1.1
KEYWORDS    .
SOURCE      Test organism
  ORGANISM  Test organism
            Bacteria.
FEATURES             Location/Qualifiers
     source          1..100
                     /organism="Test organism"
     CDS             10..90
                     /gene="testGene"
                     /product="test protein"
ORIGIN
        1 atgcatgcat gcatgcatgc atgcatgcat gcatgcatgc atgcatgcat
       51 gcatgcatgc atgcatgcat gcatgcatgc atgcatgcat gcatgcatgc
//
`;

  it('1. should parse simple GenBank record', () => {
    const record = parseGenBank(simpleGenBank);
    
    expect(record.locus).toBe('SEQ1');
    expect(record.definition).toBe('Test sequence');
    expect(record.accession).toBe('SEQ1');
    expect(record.version).toBe('SEQ1.1');
    expect(record.source).toBe('Test organism');
    expect(record.organism).toBe('Test organism Bacteria.');
  });

  it('2. should parse sequence correctly', () => {
    const record = parseGenBank(simpleGenBank);
    
    expect(record.sequence).toMatch(/^[ATGC]+$/);
    expect(record.sequence.length).toBe(100);
  });

  it('3. should parse features', () => {
    const record = parseGenBank(simpleGenBank);
    
    expect(record.features.length).toBe(2);
    expect(record.features[0].type).toBe('source');
    expect(record.features[1].type).toBe('CDS');
  });

  it('4. should parse feature qualifiers', () => {
    const record = parseGenBank(simpleGenBank);
    
    const cds = record.features.find(f => f.type === 'CDS');
    expect(cds).toBeDefined();
    expect(cds!.qualifiers.length).toBeGreaterThan(0);
    
    const geneQual = cds!.qualifiers.find(q => q.key === 'gene');
    expect(geneQual?.value).toBe('testGene');
  });

  it('5. should parse multi-line definition', () => {
    const gb = `LOCUS       SEQ1
DEFINITION  This is a very long definition that spans
            multiple lines in the GenBank file.
ACCESSION   SEQ1
ORIGIN
        1 atgc
//
`;
    const record = parseGenBank(gb);
    expect(record.definition).toContain('very long definition');
    expect(record.definition).toContain('multiple lines');
  });

  it('6. should parse references', () => {
    const gb = `LOCUS       SEQ1
ACCESSION   SEQ1
REFERENCE   1  (bases 1 to 100)
  AUTHORS   Smith,J. and Doe,J.
  TITLE     Test paper
ORIGIN
        1 atgc
//
`;
    const record = parseGenBank(gb);
    expect(record.references.length).toBeGreaterThan(0);
  });

  it('7. should handle empty sequence', () => {
    const gb = `LOCUS       SEQ1
ACCESSION   SEQ1
ORIGIN
//
`;
    const record = parseGenBank(gb);
    expect(record.sequence).toBe('');
  });

  it('8. should throw TypeError when input is not a string', () => {
    expect(() => parseGenBank(123 as any)).toThrow(TypeError);
    expect(() => parseGenBank(123 as any)).toThrow('text must be a string');
  });

  it('9. should throw Error when LOCUS is missing', () => {
    const invalidGb = `ACCESSION   SEQ1
ORIGIN
        1 atgc
//
`;
    expect(() => parseGenBank(invalidGb)).toThrow(Error);
    expect(() => parseGenBank(invalidGb)).toThrow('missing LOCUS');
  });
});

describe('genBankToFasta', () => {
  const gbRecord: GenBankRecord = {
    locus: 'SEQ1',
    definition: 'Test sequence',
    accession: 'SEQ1',
    version: 'SEQ1.1',
    keywords: '',
    source: 'Test',
    organism: 'Test',
    references: [],
    features: [
      {
        type: 'CDS',
        location: '10..30',
        qualifiers: [
          { key: 'gene', value: 'testGene' },
          { key: 'product', value: 'test protein' },
        ],
      },
    ],
    sequence: 'ATGCATGCATGCATGCATGCATGCATGCATGC',
  };

  it('1. should convert GenBank to FASTA', () => {
    const fastaRecords = genBankToFasta(gbRecord);
    
    expect(fastaRecords.length).toBe(1);
    expect(fastaRecords[0].id).toBe('SEQ1');
    expect(fastaRecords[0].description).toBe('Test sequence');
    expect(fastaRecords[0].sequence).toBe(gbRecord.sequence);
  });

  it('2. should extract CDS features when includeFeatures is true', () => {
    const fastaRecords = genBankToFasta(gbRecord, true);
    
    expect(fastaRecords.length).toBeGreaterThan(1);
    expect(fastaRecords[0].id).toBe('SEQ1'); // Main sequence
    expect(fastaRecords[1].id).toBe('testGene'); // CDS feature
  });

  it('3. should use locus when accession is empty', () => {
    const record = { ...gbRecord, accession: '' };
    const fastaRecords = genBankToFasta(record);
    
    expect(fastaRecords[0].id).toBe('SEQ1');
  });

  it('4. should throw TypeError when input is not an object', () => {
    expect(() => genBankToFasta(null as any)).toThrow(TypeError);
    expect(() => genBankToFasta('string' as any)).toThrow(TypeError);
  });
});

describe('fastaToGenBank', () => {
  const fastaRecord: FastaRecord = {
    id: 'seq1',
    description: 'Test sequence',
    sequence: 'ATGCATGCATGC',
  };

  it('1. should convert FASTA to GenBank format', () => {
    const gb = fastaToGenBank(fastaRecord);
    
    expect(gb).toContain('LOCUS');
    expect(gb).toContain('seq1');
    expect(gb).toContain('DEFINITION');
    expect(gb).toContain('Test sequence');
    expect(gb).toContain('ORIGIN');
    expect(gb.toLowerCase()).toContain('atgcatgcat');
    expect(gb).toContain('//');
  });

  it('2. should include organism in GenBank output', () => {
    const gb = fastaToGenBank(fastaRecord, { organism: 'E. coli' });
    
    expect(gb).toContain('E. coli');
    expect(gb).toContain('SOURCE');
    expect(gb).toContain('ORGANISM');
  });

  it('3. should format sequence in 60-char lines', () => {
    const longSeq = 'A'.repeat(100);
    const fasta = { ...fastaRecord, sequence: longSeq };
    const gb = fastaToGenBank(fasta);
    
    const lines = gb.split('\n');
    const seqLines = lines.filter(l => l.match(/^\s+\d+/));
    
    expect(seqLines.length).toBeGreaterThan(1);
  });

  it('4. should handle empty description', () => {
    const fasta = { ...fastaRecord, description: '' };
    const gb = fastaToGenBank(fasta);
    
    expect(gb).toContain('No description');
  });

  it('5. should throw TypeError when input is not an object', () => {
    expect(() => fastaToGenBank(null as any)).toThrow(TypeError);
    expect(() => fastaToGenBank('string' as any)).toThrow(TypeError);
  });
});
