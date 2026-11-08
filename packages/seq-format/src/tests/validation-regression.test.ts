import {
  parseBEDLine,
  formatBEDLine,
  parseGFFLine,
  parseVCFLine,
  parseVCFHeader,
  formatVCFLine,
  formatVCF,
  parseSAMLine,
  formatSAMLine,
  parseSAMHeader,
  parseCIGAR,
  parseNewick,
  validateNewick,
} from '../index';

test.each(['1.5', '12junk', 'NaN', 'Infinity', '9007199254740992'])(
  'rejects invalid coordinates %p',
  (value) => {
    expect(() => parseBEDLine(`chr1\t${value}\t100`)).toThrow();
    expect(() => parseGFFLine(`chr1\t.\tgene\t${value}\t100\t.\t+\t.\tID=g`)).toThrow();
    expect(() => parseVCFLine(`chr1\t${value}\t.\tA\tC\t.\tPASS\t.`)).toThrow();
  }
);

test('preserves VCF INFO arrays, string prefixes, and equals signs', () => {
  const line = 'chr1\t1\t.\tA\tC\t10\tPASS\tAF=0.1,0.2;NOTE=12bases=x;DP=12';
  const record = parseVCFLine(line);
  expect(record.info).toEqual({ AF: '0.1,0.2', NOTE: '12bases=x', DP: 12 });
  expect(parseVCFLine(formatVCFLine(record))).toEqual(record);
});

test('VCF quoted metadata handles reordered attributes, escapes, commas, and CRLF', () => {
  const header = parseVCFHeader(
    '##fileformat=VCFv4.2\r\n##INFO=<Description="a, \\"quoted\\" value",Type=String,Number=.,ID=NOTE>\r\n#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tsample\r\n'
  );
  expect(header.info[0]).toEqual({
    id: 'NOTE',
    number: '.',
    type: 'String',
    description: 'a, "quoted" value',
  });
  expect(header.samples).toEqual(['sample']);
  expect(parseVCFHeader(formatVCF(header, []))).toEqual(header);
});

test('SAM preserves colons in tags and headers', () => {
  const line = 'read\t0\tchr1\t1\t60\t2M\t*\t0\t0\tAC\t!!\tXX:Z:a:b:c';
  const record = parseSAMLine(line);
  expect(record.tags.XX).toBe('a:b:c');
  expect(parseSAMLine(formatSAMLine(record))).toEqual(record);
  expect(parseSAMHeader('@RG\tID:g\tDS:a:b:c\n').readGroups[0].DS).toBe('a:b:c');
});

test('SAM headers parse CRLF without retaining carriage returns', () => {
  expect(
    parseSAMHeader('@HD\tVN:1.6\r\n@SQ\tSN:chr1\tLN:100\r\n@RG\tID:g\tDS:a:b\r\n@CO\ta comment\r\n')
  ).toEqual(
    parseSAMHeader('@HD\tVN:1.6\n@SQ\tSN:chr1\tLN:100\n@RG\tID:g\tDS:a:b\n@CO\ta comment\n')
  );
});

test.each(['2Mgarbage', 'garbage2M', '2M0I', '9007199254740992M'])(
  'rejects incomplete CIGAR parsing %p',
  (cigar) => {
    expect(() => parseCIGAR(cigar)).toThrow();
  }
);

test('BED12 round trips and enforces block consistency', () => {
  const record = parseBEDLine('chr1\t10\t30\tx\t500\t+\t10\t30\t0\t2\t5,5,\t0,15,');
  expect(parseBEDLine(formatBEDLine(record))).toEqual(record);
  expect(() => parseBEDLine('chr1\t10\t30\tx\t500\t+\t10\t30\t0\t2\t5\t0,15')).toThrow();
});

test.each(['(A:1junk,B);', '(A:Infinity,B);', '(A:1e999,B);', '(A,B));', 'A,B;', 'A(B;', 'A((B;'])(
  'Newick rejects partial parses and nonfinite lengths: %s',
  (text) => {
    expect(() => parseNewick(text)).toThrow();
    expect(validateNewick(text)).toBe(false);
  }
);
