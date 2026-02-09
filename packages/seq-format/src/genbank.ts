/**
 * GenBank format parser and converter.
 * @module genbank
 */

import type { GenBankRecord, GenBankFeature, GenBankQualifier, FastaRecord } from './types';

/**
 * Parse GenBank format text into structured record.
 *
 * @param text - GenBank formatted text.
 * @returns Parsed GenBank record.
 *
 * @throws {TypeError} If text is not a string.
 * @throws {Error} If format is invalid or required fields missing.
 *
 * @example
 * ```typescript
 * const gbText = fs.readFileSync('sequence.gb', 'utf-8');
 * const record = parseGenBank(gbText);
 * console.log(record.locus, record.sequence.length);
 * ```
 *
 * @performance O(n) time complexity where n is input length.
 * Typical files: 1-10KB (genes) parse in <1ms, 100KB-1MB (genomes) in 5-50ms.
 */
export function parseGenBank(text: string): GenBankRecord {
  if (typeof text !== 'string') {
    throw new TypeError(`text must be a string, got ${typeof text}`);
  }

  const lines = text.split('\n');
  const record: Partial<GenBankRecord> = {
    locus: '',
    definition: '',
    accession: '',
    version: '',
    keywords: '',
    source: '',
    organism: '',
    references: [],
    features: [],
    sequence: '',
  };

  let currentSection = '';
  let currentFeature: Partial<GenBankFeature> | null = null;
  let sequenceLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // LOCUS line
    if (line.startsWith('LOCUS')) {
      record.locus = line.substring(12).trim().split(/\s+/)[0];
      currentSection = 'header';
      continue;
    }

    // DEFINITION line
    if (line.startsWith('DEFINITION')) {
      record.definition = line.substring(12).trim();
      let j = i + 1;
      while (j < lines.length && lines[j].startsWith('           ')) {
        record.definition += ' ' + lines[j].trim();
        j++;
      }
      i = j - 1;
      continue;
    }

    // ACCESSION line
    if (line.startsWith('ACCESSION')) {
      record.accession = line.substring(12).trim();
      continue;
    }

    // VERSION line
    if (line.startsWith('VERSION')) {
      record.version = line.substring(12).trim();
      continue;
    }

    // KEYWORDS line
    if (line.startsWith('KEYWORDS')) {
      record.keywords = line.substring(12).trim();
      continue;
    }

    // SOURCE line
    if (line.startsWith('SOURCE')) {
      record.source = line.substring(12).trim();
      continue;
    }

    // ORGANISM line
    if (line.startsWith('  ORGANISM')) {
      record.organism = line.substring(12).trim();
      let j = i + 1;
      while (j < lines.length && lines[j].startsWith('           ')) {
        record.organism += ' ' + lines[j].trim();
        j++;
      }
      i = j - 1;
      continue;
    }

    // REFERENCE section
    if (line.startsWith('REFERENCE')) {
      let refText = line.trim();
      let j = i + 1;
      while (j < lines.length && !lines[j].match(/^[A-Z]/)) {
        if (lines[j].trim()) {
          refText += ' ' + lines[j].trim();
        }
        j++;
      }
      record.references!.push(refText);
      i = j - 1;
      continue;
    }

    // FEATURES section
    if (line.startsWith('FEATURES')) {
      currentSection = 'features';
      continue;
    }

    // ORIGIN section
    if (line.startsWith('ORIGIN')) {
      currentSection = 'origin';
      continue;
    }

    // End of record
    if (line.startsWith('//')) {
      break;
    }

    // Parse features
    if (currentSection === 'features') {
      // New feature (starts at column 5)
      if (line.match(/^\s{5}\S/) && !line.match(/^\s{21}/)) {
        if (currentFeature && currentFeature.type) {
          record.features!.push(currentFeature as GenBankFeature);
        }

        const parts = line.trim().split(/\s+/);
        currentFeature = {
          type: parts[0],
          location: parts.slice(1).join(' '),
          qualifiers: [],
        };
        continue;
      }

      // Feature location continuation
      if (currentFeature && line.match(/^\s{21}/) && !line.includes('/')) {
        currentFeature.location += line.trim();
        continue;
      }

      // Feature qualifier
      if (currentFeature && line.includes('/')) {
        const qualMatch = line.match(/\/([^=]+)=?(.*)$/);
        if (qualMatch) {
          const key = qualMatch[1];
          let value = qualMatch[2]?.replace(/^"(.*)"$/, '$1') || '';
          
          // Handle multi-line qualifier values
          let j = i + 1;
          while (j < lines.length && lines[j].match(/^\s{21}/) && !lines[j].includes('/')) {
            value += ' ' + lines[j].trim().replace(/^"(.*)"$/, '$1');
            j++;
          }
          
          currentFeature.qualifiers!.push({ key, value });
          i = j - 1;
        }
      }
    }

    // Parse sequence
    if (currentSection === 'origin') {
      const seqMatch = line.match(/^\s*\d+\s+([a-z\s]+)$/);
      if (seqMatch) {
        sequenceLines.push(seqMatch[1].replace(/\s+/g, ''));
      }
    }
  }

  // Add last feature
  if (currentFeature && currentFeature.type) {
    record.features!.push(currentFeature as GenBankFeature);
  }

  // Combine sequence
  record.sequence = sequenceLines.join('').toUpperCase();

  // Validate required fields
  if (!record.locus) {
    throw new Error('Invalid GenBank format: missing LOCUS');
  }

  return record as GenBankRecord;
}

/**
 * Convert GenBank record to FASTA format.
 *
 * @param record - GenBank record to convert.
 * @param includeFeatures - Include CDS features as separate FASTA entries (default: false).
 * @returns Array of FASTA records (main sequence + optional features).
 *
 * @throws {TypeError} If record is not an object.
 *
 * @example
 * ```typescript
 * const gbRecord = parseGenBank(gbText);
 * const fastaRecords = genBankToFasta(gbRecord);
 * console.log(fastaRecords[0].id, fastaRecords[0].sequence);
 * ```
 *
 * @example
 * ```typescript
 * // Extract CDS features
 * const records = genBankToFasta(gbRecord, true);
 * records.forEach(rec => {
 *   console.log(`>${rec.id} ${rec.description}\n${rec.sequence}`);
 * });
 * ```
 *
 * @performance O(n + f) where n is sequence length, f is number of features.
 * Typical: <1ms for standard records.
 */
export function genBankToFasta(
  record: GenBankRecord,
  includeFeatures: boolean = false
): FastaRecord[] {
  if (typeof record !== 'object' || record === null) {
    throw new TypeError(`record must be an object, got ${typeof record}`);
  }

  const results: FastaRecord[] = [];

  // Main sequence
  results.push({
    id: record.accession || record.locus,
    description: record.definition || '',
    sequence: record.sequence,
  });

  // Add CDS features if requested
  if (includeFeatures) {
    for (const feature of record.features) {
      if (feature.type === 'CDS' || feature.type === 'gene') {
        // Extract product/gene name
        const productQual = feature.qualifiers.find(q => q.key === 'product');
        const geneQual = feature.qualifiers.find(q => q.key === 'gene');
        const locusTagQual = feature.qualifiers.find(q => q.key === 'locus_tag');

        const id = geneQual?.value || locusTagQual?.value || feature.type;
        const description = productQual?.value || feature.location;

        // Extract sequence from location (simplified - handles single ranges)
        const locationMatch = feature.location.match(/(\d+)\.\.(\d+)/);
        if (locationMatch) {
          const start = parseInt(locationMatch[1]) - 1; // 0-based
          const end = parseInt(locationMatch[2]);
          const featureSeq = record.sequence.substring(start, end);

          if (featureSeq) {
            results.push({
              id,
              description,
              sequence: featureSeq,
            });
          }
        }
      }
    }
  }

  return results;
}

/**
 * Convert FASTA record to minimal GenBank format.
 *
 * @param record - FASTA record to convert.
 * @param options - Optional GenBank metadata.
 * @param options.organism - Organism name.
 * @param options.moleculeType - Molecule type (default: 'DNA').
 * @param options.topology - Topology (default: 'linear').
 * @returns GenBank formatted string.
 *
 * @throws {TypeError} If record is not an object.
 *
 * @example
 * ```typescript
 * const fasta = { id: 'seq1', description: 'My sequence', sequence: 'ATGC' };
 * const genbank = fastaToGenBank(fasta, { organism: 'E. coli' });
 * console.log(genbank);
 * ```
 *
 * @performance O(n) where n is sequence length. Typical: <1ms.
 */
export function fastaToGenBank(
  record: FastaRecord,
  options: {
    organism?: string;
    moleculeType?: string;
    topology?: string;
  } = {}
): string {
  if (typeof record !== 'object' || record === null) {
    throw new TypeError(`record must be an object, got ${typeof record}`);
  }

  const {
    organism = 'Unknown',
    moleculeType = 'DNA',
    topology = 'linear',
  } = options;

  const seqLength = record.sequence.length;
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');

  let gb = '';

  // LOCUS line
  gb += `LOCUS       ${record.id.padEnd(16)} ${seqLength.toString().padStart(11)} bp    ${moleculeType.padEnd(6)} ${topology.padEnd(8)} ${date}\n`;

  // DEFINITION
  gb += `DEFINITION  ${record.description || 'No description'}\n`;

  // ACCESSION
  gb += `ACCESSION   ${record.id}\n`;

  // VERSION
  gb += `VERSION     ${record.id}\n`;

  // KEYWORDS
  gb += `KEYWORDS    .\n`;

  // SOURCE
  gb += `SOURCE      ${organism}\n`;
  gb += `  ORGANISM  ${organism}\n`;
  gb += `            Unclassified.\n`;

  // FEATURES
  gb += `FEATURES             Location/Qualifiers\n`;
  gb += `     source          1..${seqLength}\n`;
  gb += `                     /organism="${organism}"\n`;
  gb += `                     /mol_type="genomic ${moleculeType}"\n`;

  // ORIGIN
  gb += `ORIGIN\n`;

  const seq = record.sequence.toLowerCase();
  for (let i = 0; i < seq.length; i += 60) {
    const chunk = seq.substring(i, i + 60);
    const lineNum = (i + 1).toString().padStart(9);
    
    // Split into 10-char groups
    const groups = chunk.match(/.{1,10}/g) || [];
    const formatted = groups.join(' ');
    
    gb += `${lineNum} ${formatted}\n`;
  }

  gb += '//\n';

  return gb;
}
