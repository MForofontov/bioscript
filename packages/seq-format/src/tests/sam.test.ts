/**
 * Tests for SAM parser and formatter.
 */

import {
  decodeSAMFlags,
  encodeSAMFlags,
  parseSAMHeader,
  parseSAMLine,
  parseSAM,
  formatSAMLine,
  formatSAM,
} from '../sam';
import type { SAMHeader, SAMRecord, SAMFlags } from '../types';

describe('decodeSAMFlags', () => {
  it('1. should decode flag 163', () => {
    const flags = decodeSAMFlags(163);

    expect(flags.paired).toBe(true);
    expect(flags.properPair).toBe(true);
    expect(flags.reverse).toBe(false);
    expect(flags.mateReverse).toBe(true);
    expect(flags.first).toBe(false);
    expect(flags.second).toBe(true);
  });

  it('2. should decode flag 0', () => {
    const flags = decodeSAMFlags(0);

    expect(flags.paired).toBe(false);
    expect(flags.properPair).toBe(false);
    expect(flags.unmapped).toBe(false);
  });

  it('3. should decode unmapped read', () => {
    const flags = decodeSAMFlags(4);

    expect(flags.unmapped).toBe(true);
    expect(flags.paired).toBe(false);
  });

  it('4. should decode secondary alignment', () => {
    const flags = decodeSAMFlags(256);

    expect(flags.secondary).toBe(true);
  });

  it('5. should throw TypeError when input is not a number', () => {
    expect(() => decodeSAMFlags('163' as any)).toThrow(TypeError);
  });
});

describe('encodeSAMFlags', () => {
  it('1. should encode flag 163', () => {
    const flag = encodeSAMFlags({
      paired: true,
      properPair: true,
      mateReverse: true,
      second: true,
    });

    expect(flag).toBe(163);
  });

  it('2. should encode flag 0', () => {
    const flag = encodeSAMFlags({});

    expect(flag).toBe(0);
  });

  it('3. should encode unmapped read', () => {
    const flag = encodeSAMFlags({ unmapped: true });

    expect(flag).toBe(4);
  });

  it('4. should encode multiple flags', () => {
    const flag = encodeSAMFlags({
      paired: true,
      unmapped: true,
      mateUnmapped: true,
    });

    expect(flag).toBe(13); // 1 + 4 + 8
  });

  it('5. should throw TypeError when input is not an object', () => {
    expect(() => encodeSAMFlags(null as any)).toThrow(TypeError);
  });
});

describe('parseSAMHeader', () => {
  const samText = `@HD\tVN:1.6\tSO:coordinate
@SQ\tSN:ref\tLN:45
@RG\tID:group1\tSM:sample1
@PG\tID:bwa\tPN:bwa\tVN:0.7.17
@CO\tThis is a comment
r001\t99\tref\t7\t30\t8M2I4M1D3M\t=\t37\t39\tTTAGATAAAGGATACTG\t*\tNM:i:1
`;

  it('1. should parse SAM header', () => {
    const header = parseSAMHeader(samText);

    expect(header.version).toBe('1.6');
    expect(header.sortOrder).toBe('coordinate');
  });

  it('2. should parse reference sequences', () => {
    const header = parseSAMHeader(samText);

    expect(header.references.length).toBe(1);
    expect(header.references[0].name).toBe('ref');
    expect(header.references[0].length).toBe(45);
  });

  it('3. should parse read groups', () => {
    const header = parseSAMHeader(samText);

    expect(header.readGroups.length).toBe(1);
    expect(header.readGroups[0].ID).toBe('group1');
    expect(header.readGroups[0].SM).toBe('sample1');
  });

  it('4. should parse programs', () => {
    const header = parseSAMHeader(samText);

    expect(header.programs.length).toBe(1);
    expect(header.programs[0].ID).toBe('bwa');
    expect(header.programs[0].PN).toBe('bwa');
  });

  it('5. should parse comments', () => {
    const header = parseSAMHeader(samText);

    expect(header.comments.length).toBe(1);
    expect(header.comments[0]).toBe('This is a comment');
  });

  it('6. should throw TypeError when input is not a string', () => {
    expect(() => parseSAMHeader(123 as any)).toThrow(TypeError);
  });
});

describe('parseSAMLine', () => {
  it('1. should parse SAM alignment line', () => {
    const line = 'r001\t99\tref\t7\t30\t8M2I4M1D3M\t=\t37\t39\tTTAGATAAAGGATACTG\t*';
    const record = parseSAMLine(line);

    expect(record.qname).toBe('r001');
    expect(record.flag).toBe(99);
    expect(record.rname).toBe('ref');
    expect(record.pos).toBe(7);
    expect(record.mapq).toBe(30);
    expect(record.cigar).toBe('8M2I4M1D3M');
  });

  it('2. should decode flags automatically', () => {
    const line = 'r001\t163\tref\t7\t30\t8M\t=\t37\t39\tTTAGATAA\t*';
    const record = parseSAMLine(line);

    expect(record.flags).toBeDefined();
    expect(record.flags!.paired).toBe(true);
    expect(record.flags!.properPair).toBe(true);
    expect(record.flags!.mateReverse).toBe(true);
    expect(record.flags!.second).toBe(true);
  });

  it('3. should parse optional tags', () => {
    const line = 'r001\t99\tref\t7\t30\t8M\t=\t37\t39\tTTAGATAA\t*\tNM:i:1\tMD:Z:8\tAS:i:8';
    const record = parseSAMLine(line);

    expect(record.tags.NM).toBe(1);
    expect(record.tags.MD).toBe('8');
    expect(record.tags.AS).toBe(8);
  });

  it('4. should parse integer tags', () => {
    const line = 'r001\t99\tref\t7\t30\t8M\t=\t37\t39\tTTAGATAA\t*\tNM:i:5';
    const record = parseSAMLine(line);

    expect(typeof record.tags.NM).toBe('number');
    expect(record.tags.NM).toBe(5);
  });

  it('5. should parse float tags', () => {
    const line = 'r001\t99\tref\t7\t30\t8M\t=\t37\t39\tTTAGATAA\t*\tAS:f:1.5';
    const record = parseSAMLine(line);

    expect(typeof record.tags.AS).toBe('number');
    expect(record.tags.AS).toBe(1.5);
  });

  it('6. should throw TypeError when input is not a string', () => {
    expect(() => parseSAMLine(123 as any)).toThrow(TypeError);
  });

  it('7. should throw Error for header lines', () => {
    expect(() => parseSAMLine('@HD\tVN:1.6')).toThrow(Error);
  });

  it('8. should throw Error when field count is less than 11', () => {
    const line = 'r001\t99\tref\t7\t30';
    expect(() => parseSAMLine(line)).toThrow(Error);
    expect(() => parseSAMLine(line)).toThrow('expected at least 11 fields');
  });
});

describe('formatSAMLine', () => {
  it('1. should format SAM record', () => {
    const record: SAMRecord = {
      qname: 'r001',
      flag: 99,
      rname: 'ref',
      pos: 7,
      mapq: 30,
      cigar: '8M',
      rnext: '=',
      pnext: 37,
      tlen: 39,
      seq: 'TTAGATAA',
      qual: '*',
      tags: {},
    };
    const line = formatSAMLine(record);

    expect(line).toBe('r001\t99\tref\t7\t30\t8M\t=\t37\t39\tTTAGATAA\t*');
  });

  it('2. should format optional tags', () => {
    const record: SAMRecord = {
      qname: 'r001',
      flag: 99,
      rname: 'ref',
      pos: 7,
      mapq: 30,
      cigar: '8M',
      rnext: '=',
      pnext: 37,
      tlen: 39,
      seq: 'TTAGATAA',
      qual: '*',
      tags: { NM: 1, MD: '8' },
    };
    const line = formatSAMLine(record);

    expect(line).toContain('NM:i:1');
    expect(line).toContain('MD:Z:8');
  });

  it('3. should format float tags', () => {
    const record: SAMRecord = {
      qname: 'r001',
      flag: 99,
      rname: 'ref',
      pos: 7,
      mapq: 30,
      cigar: '8M',
      rnext: '=',
      pnext: 37,
      tlen: 39,
      seq: 'TTAGATAA',
      qual: '*',
      tags: { AS: 1.5 },
    };
    const line = formatSAMLine(record);

    expect(line).toContain('AS:f:1.5');
  });

  it('4. should throw TypeError when input is not an object', () => {
    expect(() => formatSAMLine(null as any)).toThrow(TypeError);
  });
});

describe('parseSAM', () => {
  const samText = `@HD\tVN:1.6
@SQ\tSN:ref\tLN:45
r001\t99\tref\t7\t30\t8M\t=\t37\t39\tTTAGATAA\t*\tNM:i:1
r002\t0\tref\t9\t30\t3S6M\t*\t0\t0\tAAAAAGATAA\t*
`;

  it('1. should parse complete SAM file', () => {
    const { header, records } = parseSAM(samText);

    expect(header.version).toBe('1.6');
    expect(records.length).toBe(2);
  });

  it('2. should parse all records', () => {
    const { records } = parseSAM(samText);

    expect(records[0].qname).toBe('r001');
    expect(records[1].qname).toBe('r002');
  });

  it('3. should throw TypeError when input is not a string', () => {
    expect(() => parseSAM(123 as any)).toThrow(TypeError);
  });
});

describe('formatSAM', () => {
  const header: SAMHeader = {
    version: '1.6',
    sortOrder: 'coordinate',
    references: [{ name: 'ref', length: 45 }],
    readGroups: [{ ID: 'group1', SM: 'sample1' }],
    programs: [{ ID: 'bwa', PN: 'bwa' }],
    comments: ['This is a comment'],
  };

  const records: SAMRecord[] = [
    {
      qname: 'r001',
      flag: 99,
      rname: 'ref',
      pos: 7,
      mapq: 30,
      cigar: '8M',
      rnext: '=',
      pnext: 37,
      tlen: 39,
      seq: 'TTAGATAA',
      qual: '*',
      tags: { NM: 1 },
    },
  ];

  it('1. should format complete SAM file', () => {
    const samText = formatSAM(header, records);

    expect(samText).toContain('@HD\tVN:1.6\tSO:coordinate');
    expect(samText).toContain('@SQ\tSN:ref\tLN:45');
    expect(samText).toContain('r001\t99\tref');
  });

  it('2. should format read groups', () => {
    const samText = formatSAM(header, records);

    expect(samText).toContain('@RG\tID:group1\tSM:sample1');
  });

  it('3. should format programs', () => {
    const samText = formatSAM(header, records);

    expect(samText).toContain('@PG\tID:bwa\tPN:bwa');
  });

  it('4. should format comments', () => {
    const samText = formatSAM(header, records);

    expect(samText).toContain('@CO\tThis is a comment');
  });

  it('5. should throw TypeError when header is invalid', () => {
    expect(() => formatSAM(null as any, records)).toThrow(TypeError);
  });

  it('6. should throw TypeError when records is not an array', () => {
    expect(() => formatSAM(header, 'not array' as any)).toThrow(TypeError);
  });
});
