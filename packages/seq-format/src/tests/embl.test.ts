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

    const cds = record.features.find((f) => f.type === 'CDS');
    expect(cds).toBeDefined();

    const geneQual = cds!.qualifiers.find((q) => q.key === 'gene');
    expect(geneQual?.value).toBe('BGLU1');
  });

  it('7. should parse sequence', () => {
    const record = parseEMBL(simpleEMBL);

    expect(record.sequence).toMatch(/^[ATGC]+$/);
    expect(record.sequence.length).toBeGreaterThan(100);
  });

  it('8. should stop at first record terminator in multi-record files', () => {
    const multiRecord = `${simpleEMBL}ID   SECOND; SV 1; linear; mRNA; STD; PLN; 2 BP.
AC   SECOND;
DE   Second record
SQ   Sequence 2 BP; 1 A; 0 C; 0 G; 1 T; 0 other;
     at
//
`;
    const firstOnly = parseEMBL(simpleEMBL);
    const record = parseEMBL(multiRecord);
    expect(record.id).toBe('X56734');
    expect(record.sequence).toBe(firstOnly.sequence);
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

  it('11. should concatenate multi-line DE and KW fields', () => {
    const embl = `ID   TEST; SV 1; linear; mRNA; STD; PLN; 12 BP.
AC   TEST;
SV   TEST.1
DE   First description line
DE   continues here
KW   keyword1;
KW   keyword2.
OS   Test sp.
RN   [1]
RP   1-12
RA   Author A.;
RT   "A title";
RL   Journal 1:1-2(2020).
FH   Key             Location/Qualifiers
FT   source          1..12
FT                   /organism="Test sp."
FT                   /note="a long note that
FT                   continues on the next line"
FT   CDS             join(1..6,
FT                   7..12)
FT                   /gene="g1"
FT                   /pseudo
SQ   Sequence 12 BP; 3 A; 3 C; 3 G; 3 T; 0 other;
     atgcatgcatgc
//
`;
    const record = parseEMBL(embl);
    expect(record.description).toContain('First description line');
    expect(record.description).toContain('continues here');
    expect(record.keywords).toContain('keyword1');
    expect(record.keywords).toContain('keyword2');
    expect(record.references.length).toBeGreaterThan(0);
    expect(record.references[0]).toContain('RN');
    const cds = record.features.find((f) => f.type === 'CDS');
    expect(cds).toBeDefined();
    expect(cds!.location).toContain('join');
    expect(cds!.location).toContain('7..12');
    const note = record.features[0].qualifiers.find((q) => q.key === 'organism');
    expect(note?.value).toBe('Test sp.');
    const gene = cds!.qualifiers.find((q) => q.key === 'gene');
    expect(gene?.value).toBe('g1');
    const pseudo = cds!.qualifiers.find((q) => q.key === 'pseudo');
    expect(pseudo).toBeDefined();
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
