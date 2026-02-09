/**
 * Tests for GFF/GTF parser and formatter.
 */

import { parseGFFLine, formatGFFLine, parseGFF, formatGFF } from '../gff';
import type { GFFRecord } from '../types';

describe('parseGFFLine', () => {
  it('1. should parse GFF3 line', () => {
    const line = 'chr1\tHAVANA\tgene\t11869\t14409\t.\t+\t.\tID=gene1;Name=DDX11L1';
    const record = parseGFFLine(line, 'gff3');
    
    expect(record.seqid).toBe('chr1');
    expect(record.source).toBe('HAVANA');
    expect(record.type).toBe('gene');
    expect(record.start).toBe(11869);
    expect(record.end).toBe(14409);
    expect(record.strand).toBe('+');
  });

  it('2. should parse GFF3 attributes', () => {
    const line = 'chr1\tHAVANA\tgene\t1\t100\t.\t+\t.\tID=gene1;Name=DDX11L1;Note=Test%20gene';
    const record = parseGFFLine(line, 'gff3');
    
    expect(record.attributes.ID).toBe('gene1');
    expect(record.attributes.Name).toBe('DDX11L1');
    expect(record.attributes.Note).toBe('Test gene'); // URL decoded
  });

  it('3. should parse GTF line', () => {
    const line = 'chr1\tHAVANA\texon\t11869\t12227\t.\t+\t.\tgene_id "DDX11L1"; transcript_id "DDX11L1.1";';
    const record = parseGFFLine(line, 'gtf');
    
    expect(record.seqid).toBe('chr1');
    expect(record.type).toBe('exon');
    expect(record.attributes.gene_id).toBe('DDX11L1');
    expect(record.attributes.transcript_id).toBe('DDX11L1.1');
  });

  it('4. should handle null score', () => {
    const line = 'chr1\tsource\tgene\t1\t100\t.\t+\t.\tID=test';
    const record = parseGFFLine(line, 'gff3');
    
    expect(record.score).toBeNull();
  });

  it('5. should handle null phase', () => {
    const line = 'chr1\tsource\tgene\t1\t100\t.\t+\t.\tID=test';
    const record = parseGFFLine(line, 'gff3');
    
    expect(record.phase).toBeNull();
  });

  it('6. should parse multi-value attributes', () => {
    const line = 'chr1\tsource\tgene\t1\t100\t.\t+\t.\tParent=gene1,gene2,gene3';
    const record = parseGFFLine(line, 'gff3');
    
    expect(Array.isArray(record.attributes.Parent)).toBe(true);
    expect(record.attributes.Parent).toEqual(['gene1', 'gene2', 'gene3']);
  });

  it('7. should throw TypeError when input is not a string', () => {
    expect(() => parseGFFLine(123 as any)).toThrow(TypeError);
  });

  it('8. should throw Error for comment lines', () => {
    expect(() => parseGFFLine('# comment')).toThrow(Error);
  });

  it('9. should throw Error when field count is wrong', () => {
    const line = 'chr1\tsource\tgene'; // Only 3 fields
    expect(() => parseGFFLine(line)).toThrow(Error);
    expect(() => parseGFFLine(line)).toThrow('expected 9 fields');
  });

  it('10. should throw Error for invalid strand', () => {
    const line = 'chr1\tsource\tgene\t1\t100\t.\tX\t.\tID=test';
    expect(() => parseGFFLine(line)).toThrow(Error);
    expect(() => parseGFFLine(line)).toThrow('Invalid strand');
  });
});

describe('formatGFFLine', () => {
  const record: GFFRecord = {
    seqid: 'chr1',
    source: 'HAVANA',
    type: 'gene',
    start: 11869,
    end: 14409,
    score: null,
    strand: '+',
    phase: null,
    attributes: { ID: 'gene1', Name: 'DDX11L1' },
  };

  it('1. should format GFF3 line', () => {
    const line = formatGFFLine(record, 'gff3');
    
    expect(line).toContain('chr1');
    expect(line).toContain('HAVANA');
    expect(line).toContain('gene');
    expect(line).toContain('11869');
    expect(line).toContain('14409');
    expect(line).toContain('ID=gene1');
  });

  it('2. should format GTF line', () => {
    const line = formatGFFLine(record, 'gtf');
    
    expect(line).toContain('ID "gene1"');
    expect(line).toContain('Name "DDX11L1"');
    expect(line.endsWith(';')).toBe(true);
  });

  it('3. should handle multi-value attributes', () => {
    const multiRecord = {
      ...record,
      attributes: { Parent: ['gene1', 'gene2'] },
    };
    const line = formatGFFLine(multiRecord, 'gff3');
    
    expect(line).toContain('Parent=gene1,gene2');
  });

  it('4. should encode special characters', () => {
    const specialRecord = {
      ...record,
      attributes: { Note: 'Test gene' },
    };
    const line = formatGFFLine(specialRecord, 'gff3');
    
    expect(line).toContain('Note=Test%20gene');
  });

  it('5. should throw TypeError when input is not an object', () => {
    expect(() => formatGFFLine(null as any)).toThrow(TypeError);
  });
});

describe('parseGFF', () => {
  const gffText = `##gff-version 3
chr1\tHAVANA\tgene\t11869\t14409\t.\t+\t.\tID=gene1;Name=DDX11L1
chr1\tHAVANA\texon\t11869\t12227\t.\t+\t.\tID=exon1;Parent=gene1
# comment line
chr1\tHAVANA\texon\t12613\t12721\t.\t+\t.\tID=exon2;Parent=gene1
`;

  it('1. should parse multiple GFF lines', () => {
    const records = parseGFF(gffText, 'gff3');
    
    expect(records.length).toBe(3);
    expect(records[0].type).toBe('gene');
    expect(records[1].type).toBe('exon');
    expect(records[2].type).toBe('exon');
  });

  it('2. should skip comment lines', () => {
    const records = parseGFF(gffText, 'gff3');
    
    records.forEach(record => {
      expect(record.seqid).not.toContain('#');
    });
  });

  it('3. should handle empty input', () => {
    const records = parseGFF('', 'gff3');
    expect(records.length).toBe(0);
  });

  it('4. should throw TypeError when input is not a string', () => {
    expect(() => parseGFF(123 as any)).toThrow(TypeError);
  });
});

describe('formatGFF', () => {
  const records: GFFRecord[] = [
    {
      seqid: 'chr1',
      source: 'HAVANA',
      type: 'gene',
      start: 11869,
      end: 14409,
      score: null,
      strand: '+',
      phase: null,
      attributes: { ID: 'gene1', Name: 'DDX11L1' },
    },
    {
      seqid: 'chr1',
      source: 'HAVANA',
      type: 'exon',
      start: 11869,
      end: 12227,
      score: null,
      strand: '+',
      phase: null,
      attributes: { ID: 'exon1', Parent: 'gene1' },
    },
  ];

  it('1. should format multiple records', () => {
    const gffText = formatGFF(records, 'gff3', false);
    const lines = gffText.trim().split('\n');
    
    expect(lines.length).toBe(2);
  });

  it('2. should include GFF3 header when requested', () => {
    const gffText = formatGFF(records, 'gff3', true);
    
    expect(gffText).toContain('##gff-version 3');
  });

  it('3. should include GTF header when requested', () => {
    const gtfText = formatGFF(records, 'gtf', true);
    
    expect(gtfText).toContain('#gtf-version 2.2');
  });

  it('4. should throw TypeError when records is not an array', () => {
    expect(() => formatGFF('not array' as any)).toThrow(TypeError);
  });
});
