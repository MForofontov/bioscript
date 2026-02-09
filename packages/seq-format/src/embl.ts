/**
 * EMBL format parser.
 * @module embl
 */

import type { EMBLRecord, GenBankFeature, FastaRecord } from './types';

/**
 * Parse EMBL format text into structured record.
 *
 * @param text - EMBL formatted text.
 * @returns Parsed EMBL record.
 *
 * @throws {TypeError} If text is not a string.
 * @throws {Error} If format is invalid or required fields missing.
 *
 * @example
 * ```typescript
 * const emblText = fs.readFileSync('sequence.embl', 'utf-8');
 * const record = parseEMBL(emblText);
 * console.log(record.id, record.sequence.length);
 * ```
 *
 * @performance O(n) time complexity. Typical files: 1-10KB in <1ms.
 */
export function parseEMBL(text: string): EMBLRecord {
  if (typeof text !== 'string') {
    throw new TypeError(`text must be a string, got ${typeof text}`);
  }

  const lines = text.split('\n');
  const record: Partial<EMBLRecord> = {
    id: '',
    accession: '',
    version: '',
    description: '',
    keywords: '',
    organism: '',
    references: [],
    features: [],
    sequence: '',
  };

  let currentSection = '';
  let currentFeature: Partial<GenBankFeature> | null = null;
  const sequenceLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const key = line.substring(0, 2);
    const content = line.substring(5).trim();

    switch (key) {
      case 'ID':
        // ID   X56734; SV 1; linear; mRNA; STD; PLN; 1859 BP.
        record.id = content.split(';')[0].trim();
        currentSection = 'header';
        break;

      case 'AC':
        // AC   X56734;
        record.accession = content.replace(/;$/, '');
        break;

      case 'SV':
        // SV   X56734.1
        record.version = content;
        break;

      case 'DE':
        // DE   Trifolium repens mRNA for non-cyanogenic beta-glucosidase
        if (record.description) {
          record.description += ' ' + content;
        } else {
          record.description = content;
        }
        break;

      case 'KW':
        // KW   beta-glucosidase.
        if (record.keywords) {
          record.keywords += ' ' + content;
        } else {
          record.keywords = content;
        }
        break;

      case 'OS':
        // OS   Trifolium repens (white clover)
        record.organism = content;
        break;

      case 'RN':
      case 'RP':
      case 'RX':
      case 'RA':
      case 'RT':
      case 'RL': {
        // Reference lines - collect as single string
        let refText = line.trim();
        let j = i + 1;
        while (j < lines.length && lines[j].substring(0, 2).match(/^R[NPXATL]/)) {
          refText += ' ' + lines[j].trim();
          j++;
        }
        record.references!.push(refText);
        i = j - 1;
        break;
      }

      case 'FH':
        // FH   Key             Location/Qualifiers
        currentSection = 'features';
        break;

      case 'FT': {
        // FT   source          1..1859
        const ftContent = line.substring(5);

        // New feature (starts with non-space at position 5)
        if (ftContent.match(/^\S/)) {
          if (currentFeature && currentFeature.type) {
            record.features!.push(currentFeature as GenBankFeature);
          }

          const parts = ftContent.trim().split(/\s+/);
          currentFeature = {
            type: parts[0],
            location: parts.slice(1).join(' '),
            qualifiers: [],
          };
        }
        // Qualifier (starts with /)
        else if (currentFeature && ftContent.includes('/')) {
          const qualMatch = ftContent.match(/\/([^=]+)=?(.*)$/);
          if (qualMatch) {
            const qualKey = qualMatch[1];
            let value = qualMatch[2]?.replace(/^"(.*)"$/, '$1') || '';

            // Handle multi-line qualifier values
            let qualJ = i + 1;
            while (
              qualJ < lines.length &&
              lines[qualJ].substring(0, 2) === 'FT' &&
              !lines[qualJ].includes('/') &&
              lines[qualJ].substring(5).match(/^\s{15}/)
            ) {
              value +=
                ' ' +
                lines[qualJ]
                  .substring(20)
                  .trim()
                  .replace(/^"(.*)"$/, '$1');
              qualJ++;
            }

            currentFeature.qualifiers!.push({ key: qualKey, value });
            i = qualJ - 1;
          }
        }
        // Location continuation
        else if (currentFeature && ftContent.trim()) {
          currentFeature.location += ftContent.trim();
        }
        break;
      }

      case 'SQ':
        // SQ   Sequence 1859 BP; 609 A; 314 C; 355 G; 581 T; 0 other;
        currentSection = 'sequence';
        break;

      case '  ':
        if (currentSection === 'sequence') {
          // Sequence line:   acaagatgcc attgtccccc ggcctcctgc tgctgctgct ctccggggcc acggccaccg
          const seqMatch = line.match(/^\s+([a-z\s]+)/);
          if (seqMatch) {
            sequenceLines.push(seqMatch[1].replace(/\s+/g, ''));
          }
        }
        break;

      case '//':
        // End of record
        break;
    }
  }

  // Add last feature
  if (currentFeature && currentFeature.type) {
    record.features!.push(currentFeature as GenBankFeature);
  }

  // Combine sequence
  record.sequence = sequenceLines.join('').toUpperCase();

  // Validate required fields
  if (!record.id) {
    throw new Error('Invalid EMBL format: missing ID');
  }

  return record as EMBLRecord;
}

/**
 * Convert EMBL record to FASTA format.
 *
 * @param record - EMBL record to convert.
 * @returns FASTA record.
 *
 * @throws {TypeError} If record is not an object.
 *
 * @example
 * ```typescript
 * const emblRecord = parseEMBL(emblText);
 * const fasta = emblToFasta(emblRecord);
 * console.log(`>${fasta.id} ${fasta.description}\n${fasta.sequence}`);
 * ```
 *
 * @performance O(1) time complexity (object transformation). <1ms.
 */
export function emblToFasta(record: EMBLRecord): FastaRecord {
  if (typeof record !== 'object' || record === null) {
    throw new TypeError(`record must be an object, got ${typeof record}`);
  }

  return {
    id: record.accession || record.id,
    description: record.description || '',
    sequence: record.sequence,
  };
}
