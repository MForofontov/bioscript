/**
 * Tests for EMBL parser and converter.
 */

import { parseEMBL, emblToFasta } from '../embl';
import type { EMBLRecord } from '../types';

describe('parseEMBL', () => {
  const simpleEMBL = `ID   X56734; SV 1; linear; mRNA; STD; PLN; 1859 BP.
AC   X56734;
SV   X56734.1
DE   Trifolium repens mRNA for non-cyanogenic beta-glucosidase
KW   beta-glucosidase.
OS   Trifolium repens (white clover)
FH   Key             Location/Qualifiers
FT   source          1..1859
FT                   /organism="Trifolium repens"
FT   CDS             14..1495
FT                   /gene="BGLU1"
FT                   /product="beta-glucosidase"
SQ   Sequence 1859 BP; 609 A; 314 C; 355 G; 581 T; 0 other;
     acaagatgcc attgtccccc ggcctcctgc tgctgctgct ctccggggcc acggccaccg
     ctgccctgcc cctggagggt ggccccaccg gccgagacag cgagcatatg caggaagcgg
//
`;

  it('1. should parse simple EMBL record', () => {
    const record = parseEMBL(simpleEMBL);
    
    expect(record.id).toBe('X56734');
    expect(record.accession).toBe('X56734');
    expect(record.version).toBe('X56734.1');
  });

  it('2. should parse description', () => {
    const record = parseEMBL(simpleEMBL);
    
    expect(record.description).toContain('Trifolium repens');
    expect(record.description).toContain('beta-glucosidase');
  });

  it('3. should parse keywords', () => {
    const record = parseEMBL(simpleEMBL);
    
    expect(record.keywords).toContain('beta-glucosidase');
  });

  it('4. should parse organism', () => {
    const record = parseEMBL(simpleEMBL);
    
    expect(record.organism).toBe('Trifolium repens (white clover)');
  });

  it('5. should parse features', () => {
    const record = parseEMBL(simpleEMBL);
    
    expect(record.features.length).toBe(2);
    expect(record.features[0].type).toBe('source');
    expect(record.features[1].type).toBe('CDS');
  });

  it('6. should parse feature qualifiers', () => {
    const record = parseEMBL(simpleEMBL);
    
    const cds = record.features.find(f => f.type === 'CDS');
    expect(cds).toBeDefined();
    
    const geneQual = cds!.qualifiers.find(q => q.key === 'gene');
    expect(geneQual?.value).toBe('BGLU1');
  });

  it('7. should parse sequence', () => {
    const record = parseEMBL(simpleEMBL);
    
    expect(record.sequence).toMatch(/^[ATGC]+$/);
    expect(record.sequence.length).toBeGreaterThan(100);
  });

  it('8. should handle empty sequence', () => {
    const embl = `ID   TEST; SV 1; linear; mRNA; STD; PLN; 0 BP.
AC   TEST;
SQ   Sequence 0 BP;
//
`;
    const record = parseEMBL(embl);
    expect(record.sequence).toBe('');
  });

  it('9. should throw TypeError when input is not a string', () => {
    expect(() => parseEMBL(123 as any)).toThrow(TypeError);
    expect(() => parseEMBL(123 as any)).toThrow('text must be a string');
  });

  it('10. should throw Error when ID is missing', () => {
    const invalidEMBL = `AC   X56734;
SQ   Sequence 0 BP;
//
`;
    expect(() => parseEMBL(invalidEMBL)).toThrow(Error);
    expect(() => parseEMBL(invalidEMBL)).toThrow('missing ID');
  });
});

describe('emblToFasta', () => {
  const emblRecord: EMBLRecord = {
    id: 'X56734',
    accession: 'X56734',
    version: 'X56734.1',
    description: 'Test sequence',
    keywords: 'test',
    organism: 'Test organism',
    references: [],
    features: [],
    sequence: 'ATGCATGCATGC',
  };

  it('1. should convert EMBL to FASTA', () => {
    const fasta = emblToFasta(emblRecord);
    
    expect(fasta.id).toBe('X56734');
    expect(fasta.description).toBe('Test sequence');
    expect(fasta.sequence).toBe('ATGCATGCATGC');
  });

  it('2. should use ID when accession is empty', () => {
    const record = { ...emblRecord, accession: '' };
    const fasta = emblToFasta(record);
    
    expect(fasta.id).toBe('X56734');
  });

  it('3. should handle empty description', () => {
    const record = { ...emblRecord, description: '' };
    const fasta = emblToFasta(record);
    
    expect(fasta.description).toBe('');
  });

  it('4. should throw TypeError when input is not an object', () => {
    expect(() => emblToFasta(null as any)).toThrow(TypeError);
    expect(() => emblToFasta('string' as any)).toThrow(TypeError);
  });
});
