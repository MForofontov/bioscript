/**
 * Reference checks for NCBI genetic code tables (transl_table).
 * Source: https://www.ncbi.nlm.nih.gov/Taxonomy/Utils/wprintgc.cgi
 */

import { getTable, tables } from '../tables';
import { translateSequence } from '../translate';

describe('NCBI genetic code reference deviations', () => {
  it('registers expected NCBI table ids', () => {
    const ids = [
      '1', '2', '3', '4', '5', '6', '9', '10', '11', '12', '13', '14', '15', '16',
      '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33',
    ];
    for (const id of ids) {
      expect(tables[id]).toBeDefined();
      expect(getTable(id)).toBe(tables[id]);
    }
  });

  it('standard: ATG→M, TAA/TAG/TGA→stop, ATA→I', () => {
    expect(translateSequence('ATG', { table: '1', breakOnStop: false })).toBe('M');
    expect(translateSequence('ATA', { table: 'standard', breakOnStop: false })).toBe('I');
    expect(translateSequence('TAA', { table: '1', breakOnStop: false })).toBe('*');
    expect(translateSequence('TAG', { table: '1', breakOnStop: false })).toBe('*');
    expect(translateSequence('TGA', { table: '1', breakOnStop: false })).toBe('*');
  });

  it('vertebrate mitochondrial (2): AUA→M, UGA→W, AGA/AGG→stop', () => {
    expect(translateSequence('ATA', { table: '2', breakOnStop: false })).toBe('M');
    expect(translateSequence('TGA', { table: '2', breakOnStop: false })).toBe('W');
    expect(translateSequence('AGA', { table: '2', breakOnStop: false })).toBe('*');
    expect(translateSequence('AGG', { table: 'vertebrate_mitochondrial', breakOnStop: false })).toBe('*');
  });

  it('yeast mitochondrial (3): CUN→T, AUA→M, UGA→W', () => {
    expect(translateSequence('CTA', { table: '3', breakOnStop: false })).toBe('T');
    expect(translateSequence('ATA', { table: '3', breakOnStop: false })).toBe('M');
    expect(translateSequence('TGA', { table: '3', breakOnStop: false })).toBe('W');
  });

  it('invertebrate mitochondrial (5): AUA→M, UGA→W, AGA/AGG→S', () => {
    expect(translateSequence('ATA', { table: '5', breakOnStop: false })).toBe('M');
    expect(translateSequence('TGA', { table: '5', breakOnStop: false })).toBe('W');
    expect(translateSequence('AGA', { table: '5', breakOnStop: false })).toBe('S');
    expect(translateSequence('AGG', { table: '5', breakOnStop: false })).toBe('S');
  });

  it('echinoderm/flatworm mitochondrial (9): AAA→N, AGA/AGG→S, UGA→W, AUA stays I', () => {
    expect(translateSequence('AAA', { table: '9', breakOnStop: false })).toBe('N');
    expect(translateSequence('AGA', { table: '9', breakOnStop: false })).toBe('S');
    expect(translateSequence('AGG', { table: '9', breakOnStop: false })).toBe('S');
    expect(translateSequence('TGA', { table: '9', breakOnStop: false })).toBe('W');
    expect(translateSequence('ATA', { table: '9', breakOnStop: false })).toBe('I');
  });

  it('trematode mitochondrial (21): table 9 + AUA→M', () => {
    expect(translateSequence('ATA', { table: '21', breakOnStop: false })).toBe('M');
    expect(translateSequence('AAA', { table: '21', breakOnStop: false })).toBe('N');
    expect(translateSequence('TGA', { table: '21', breakOnStop: false })).toBe('W');
  });

  it('scenedesmus (22): UCA→stop and UAG→L for DNA and RNA', () => {
    expect(translateSequence('TCA', { table: '22', breakOnStop: false })).toBe('*');
    expect(translateSequence('UCA', { table: '22', breakOnStop: false })).toBe('*');
    expect(translateSequence('TAG', { table: '22', breakOnStop: false })).toBe('L');
  });

  it('thraustochytrium (23): UUA→stop for DNA and RNA', () => {
    expect(translateSequence('TTA', { table: '23', breakOnStop: false })).toBe('*');
    expect(translateSequence('UUA', { table: '23', breakOnStop: false })).toBe('*');
  });

  it('ciliate nuclear (6): UAA/UAG→Q', () => {
    expect(translateSequence('TAA', { table: '6', breakOnStop: false })).toBe('Q');
    expect(translateSequence('TAG', { table: '6', breakOnStop: false })).toBe('Q');
    expect(translateSequence('TGA', { table: '6', breakOnStop: false })).toBe('*');
  });
});
