/**
 * Tests for VCF parser and formatter.
 */

import { parseVCFHeader, parseVCFLine, parseVCF, formatVCFLine, formatVCF } from '../vcf';
import type { VCFHeader, VCFRecord } from '../types';

describe('parseVCFHeader', () => {
  const vcfText = `##fileformat=VCFv4.2
##contig=<ID=20,length=62435964>
##INFO=<ID=NS,Number=1,Type=Integer,Description="Number of Samples">
##INFO=<ID=DP,Number=1,Type=Integer,Description="Total Depth">
##FILTER=<ID=PASS,Description="All filters passed">
##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">
##FORMAT=<ID=GQ,Number=1,Type=Integer,Description="Genotype Quality">
#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tNA00001\tNA00002
20\t14370\trs6054257\tG\tA\t29\tPASS\tNS=3;DP=14\tGT:GQ\t0|0:48\t1|0:48
`;

  it('1. should parse VCF header', () => {
    const header = parseVCFHeader(vcfText);
    
    expect(header.fileformat).toBe('VCFv4.2');
  });

  it('2. should parse contigs', () => {
    const header = parseVCFHeader(vcfText);
    
    expect(header.contigs.length).toBe(1);
    expect(header.contigs[0].id).toBe('20');
    expect(header.contigs[0].length).toBe(62435964);
  });

  it('3. should parse INFO fields', () => {
    const header = parseVCFHeader(vcfText);
    
    expect(header.info.length).toBe(2);
    expect(header.info[0].id).toBe('NS');
    expect(header.info[0].type).toBe('Integer');
  });

  it('4. should parse FILTER fields', () => {
    const header = parseVCFHeader(vcfText);
    
    expect(header.filter.length).toBe(1);
    expect(header.filter[0].id).toBe('PASS');
  });

  it('5. should parse FORMAT fields', () => {
    const header = parseVCFHeader(vcfText);
    
    expect(header.format.length).toBe(2);
    expect(header.format[0].id).toBe('GT');
    expect(header.format[1].id).toBe('GQ');
  });

  it('6. should parse sample names', () => {
    const header = parseVCFHeader(vcfText);
    
    expect(header.samples).toEqual(['NA00001', 'NA00002']);
  });

  it('7. should throw TypeError when input is not a string', () => {
    expect(() => parseVCFHeader(123 as any)).toThrow(TypeError);
  });

  it('8. should throw Error when fileformat is missing', () => {
    const invalidVcf = `#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\n`;
    expect(() => parseVCFHeader(invalidVcf)).toThrow(Error);
    expect(() => parseVCFHeader(invalidVcf)).toThrow('missing ##fileformat');
  });
});

describe('parseVCFLine', () => {
  it('1. should parse VCF record line', () => {
    const line = '20\t14370\trs6054257\tG\tA\t29\tPASS\tNS=3;DP=14';
    const record = parseVCFLine(line);
    
    expect(record.chrom).toBe('20');
    expect(record.pos).toBe(14370);
    expect(record.id).toBe('rs6054257');
    expect(record.ref).toBe('G');
    expect(record.alt).toEqual(['A']);
    expect(record.qual).toBe(29);
    expect(record.filter).toBe('PASS');
  });

  it('2. should parse INFO field', () => {
    const line = '20\t14370\trs6054257\tG\tA\t29\tPASS\tNS=3;DP=14;AF=0.5';
    const record = parseVCFLine(line);
    
    expect(record.info.NS).toBe(3);
    expect(record.info.DP).toBe(14);
    expect(record.info.AF).toBe(0.5);
  });

  it('3. should handle INFO flags', () => {
    const line = '20\t14370\trs6054257\tG\tA\t29\tPASS\tDB;H2';
    const record = parseVCFLine(line);
    
    expect(record.info.DB).toBe(true);
    expect(record.info.H2).toBe(true);
  });

  it('4. should parse multiple ALT alleles', () => {
    const line = '20\t14370\trs6054257\tG\tA,T\t29\tPASS\tNS=3';
    const record = parseVCFLine(line);
    
    expect(record.alt).toEqual(['A', 'T']);
  });

  it('5. should handle missing QUAL', () => {
    const line = '20\t14370\trs6054257\tG\tA\t.\tPASS\tNS=3';
    const record = parseVCFLine(line);
    
    expect(record.qual).toBeNull();
  });

  it('6. should parse FORMAT and sample columns', () => {
    const line = '20\t14370\trs6054257\tG\tA\t29\tPASS\tNS=3\tGT:GQ:DP\t0|0:48:1\t1|0:48:8';
    const record = parseVCFLine(line, ['NA00001', 'NA00002']);
    
    expect(record.format).toEqual(['GT', 'GQ', 'DP']);
    expect(record.samples).toBeDefined();
    expect(record.samples![0].GT).toBe('0|0');
    expect(record.samples![0].GQ).toBe('48');
  });

  it('7. should throw TypeError when input is not a string', () => {
    expect(() => parseVCFLine(123 as any)).toThrow(TypeError);
  });

  it('8. should throw Error for comment lines', () => {
    expect(() => parseVCFLine('# comment')).toThrow(Error);
  });

  it('9. should throw Error when field count is less than 8', () => {
    const line = '20\t14370\trs6054257';
    expect(() => parseVCFLine(line)).toThrow(Error);
    expect(() => parseVCFLine(line)).toThrow('expected at least 8 fields');
  });
});

describe('formatVCFLine', () => {
  it('1. should format VCF record', () => {
    const record: VCFRecord = {
      chrom: '20',
      pos: 14370,
      id: 'rs6054257',
      ref: 'G',
      alt: ['A'],
      qual: 29,
      filter: 'PASS',
      info: { NS: 3, DP: 14 },
    };
    const line = formatVCFLine(record);
    
    expect(line).toContain('20\t14370\trs6054257\tG\tA\t29\tPASS');
    expect(line).toContain('NS=3');
    expect(line).toContain('DP=14');
  });

  it('2. should format INFO flags', () => {
    const record: VCFRecord = {
      chrom: '20',
      pos: 14370,
      id: 'rs6054257',
      ref: 'G',
      alt: ['A'],
      qual: null,
      filter: 'PASS',
      info: { DB: true, H2: true },
    };
    const line = formatVCFLine(record);
    
    expect(line).toContain('DB');
    expect(line).toContain('H2');
  });

  it('3. should format sample columns', () => {
    const record: VCFRecord = {
      chrom: '20',
      pos: 14370,
      id: 'rs6054257',
      ref: 'G',
      alt: ['A'],
      qual: 29,
      filter: 'PASS',
      info: { NS: 3 },
      format: ['GT', 'GQ'],
      samples: [
        { GT: '0|0', GQ: '48' },
        { GT: '1|0', GQ: '48' },
      ],
    };
    const line = formatVCFLine(record);
    
    expect(line).toContain('GT:GQ');
    expect(line).toContain('0|0:48');
    expect(line).toContain('1|0:48');
  });

  it('4. should throw TypeError when input is not an object', () => {
    expect(() => formatVCFLine(null as any)).toThrow(TypeError);
  });
});

describe('parseVCF', () => {
  const vcfText = `##fileformat=VCFv4.2
##contig=<ID=20>
#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO
20\t14370\trs1\tG\tA\t29\tPASS\tNS=3
20\t17330\trs2\tT\tA\t3\tq10\tNS=3
`;

  it('1. should parse complete VCF file', () => {
    const { header, records } = parseVCF(vcfText);
    
    expect(header.fileformat).toBe('VCFv4.2');
    expect(records.length).toBe(2);
  });

  it('2. should parse all records', () => {
    const { records } = parseVCF(vcfText);
    
    expect(records[0].id).toBe('rs1');
    expect(records[1].id).toBe('rs2');
  });

  it('3. should throw TypeError when input is not a string', () => {
    expect(() => parseVCF(123 as any)).toThrow(TypeError);
  });
});

describe('formatVCF', () => {
  const header: VCFHeader = {
    fileformat: 'VCFv4.2',
    contigs: [{ id: '20', length: 62435964 }],
    info: [{ id: 'NS', number: '1', type: 'Integer', description: 'Number of Samples' }],
    filter: [{ id: 'PASS', description: 'All filters passed' }],
    format: [{ id: 'GT', number: '1', type: 'String', description: 'Genotype' }],
    samples: ['NA00001', 'NA00002'],
    other: [],
  };

  const records: VCFRecord[] = [
    {
      chrom: '20',
      pos: 14370,
      id: 'rs1',
      ref: 'G',
      alt: ['A'],
      qual: 29,
      filter: 'PASS',
      info: { NS: 3 },
      format: ['GT'],
      samples: [{ GT: '0|0' }, { GT: '1|0' }],
    },
  ];

  it('1. should format complete VCF file', () => {
    const vcfText = formatVCF(header, records);
    
    expect(vcfText).toContain('##fileformat=VCFv4.2');
    expect(vcfText).toContain('##contig=<ID=20');
    expect(vcfText).toContain('#CHROM\tPOS');
  });

  it('2. should format all records', () => {
    const vcfText = formatVCF(header, records);
    
    expect(vcfText).toContain('20\t14370\trs1');
  });

  it('3. should throw TypeError when header is invalid', () => {
    expect(() => formatVCF(null as any, records)).toThrow(TypeError);
  });

  it('4. should throw TypeError when records is not an array', () => {
    expect(() => formatVCF(header, 'not array' as any)).toThrow(TypeError);
  });
});
