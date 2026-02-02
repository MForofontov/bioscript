// Predefined codon tables. Keys use RNA codons (U).
export type CodonTable = Record<string, string>;

export const standardTable: CodonTable = {
  UUU: 'F',
  UUC: 'F',
  UUA: 'L',
  UUG: 'L',
  UCU: 'S',
  UCC: 'S',
  UCA: 'S',
  UCG: 'S',
  UAU: 'Y',
  UAC: 'Y',
  UAA: '*',
  UAG: '*',
  UGU: 'C',
  UGC: 'C',
  UGA: '*',
  UGG: 'W',
  CUU: 'L',
  CUC: 'L',
  CUA: 'L',
  CUG: 'L',
  CCU: 'P',
  CCC: 'P',
  CCA: 'P',
  CCG: 'P',
  CAU: 'H',
  CAC: 'H',
  CAA: 'Q',
  CAG: 'Q',
  CGU: 'R',
  CGC: 'R',
  CGA: 'R',
  CGG: 'R',
  AUU: 'I',
  AUC: 'I',
  AUA: 'I',
  AUG: 'M',
  ACU: 'T',
  ACC: 'T',
  ACA: 'T',
  ACG: 'T',
  AAU: 'N',
  AAC: 'N',
  AAA: 'K',
  AAG: 'K',
  AGU: 'S',
  AGC: 'S',
  AGA: 'R',
  AGG: 'R',
  GUU: 'V',
  GUC: 'V',
  GUA: 'V',
  GUG: 'V',
  GCU: 'A',
  GCC: 'A',
  GCA: 'A',
  GCG: 'A',
  GAU: 'D',
  GAC: 'D',
  GAA: 'E',
  GAG: 'E',
  GGU: 'G',
  GGC: 'G',
  GGA: 'G',
  GGG: 'G',
};

// Vertebrate mitochondrial (example subset) - full mapping added for compatibility
export const vertebrateMitochondrial: CodonTable = {
  ...standardTable,
  AUA: 'M',
  UGA: 'W',
  AGA: '*',
  AGG: '*',
};

// Add more tables as needed and export a registry

// NCBI genetic code tables (1-33)
// Each table is keyed by its NCBI transl_table number and name
// Source: https://www.ncbi.nlm.nih.gov/Taxonomy/Utils/wprintgc.cgi?mode=c
// All tables use RNA codons (U)
export const yeastMitochondrial: CodonTable = {
  UUU: 'F',
  UUC: 'F',
  UUA: 'L',
  UUG: 'L',
  UCU: 'S',
  UCC: 'S',
  UCA: 'S',
  UCG: 'S',
  UAU: 'Y',
  UAC: 'Y',
  UAA: '*',
  UAG: '*',
  UGU: 'C',
  UGC: 'C',
  UGA: 'W',
  UGG: 'W',
  CUU: 'T',
  CUC: 'T',
  CUA: 'T',
  CUG: 'T',
  CCU: 'P',
  CCC: 'P',
  CCA: 'P',
  CCG: 'P',
  CAU: 'H',
  CAC: 'H',
  CAA: 'Q',
  CAG: 'Q',
  CGU: 'R',
  CGC: 'R',
  CGA: 'R',
  CGG: 'R',
  AUU: 'I',
  AUC: 'I',
  AUA: 'M',
  AUG: 'M',
  ACU: 'T',
  ACC: 'T',
  ACA: 'T',
  ACG: 'T',
  AAU: 'N',
  AAC: 'N',
  AAA: 'K',
  AAG: 'K',
  AGU: 'S',
  AGC: 'S',
  AGA: 'R',
  AGG: 'R',
  GUU: 'V',
  GUC: 'V',
  GUA: 'V',
  GUG: 'V',
  GCU: 'A',
  GCC: 'A',
  GCA: 'A',
  GCG: 'A',
  GAU: 'D',
  GAC: 'D',
  GAA: 'E',
  GAG: 'E',
  GGU: 'G',
  GGC: 'G',
  GGA: 'G',
  GGG: 'G',
};

// Table 4: Mold, Protozoan, Coelenterate Mitochondrial, Mycoplasma/Spiroplasma
export const moldProtozoanMitochondrial: CodonTable = {
  ...standardTable,
  UGA: 'W',
};

// Table 5: Invertebrate Mitochondrial
export const invertebrateMitochondrial: CodonTable = {
  ...standardTable,
  AUA: 'M',
  UGA: 'W',
  AGA: 'S',
  AGG: 'S',
};

// Table 6: Ciliate, Dasycladacean, Hexamita Nuclear
export const ciliateNuclear: CodonTable = {
  ...standardTable,
  UAA: 'Q',
  UAG: 'Q',
};

// Table 9: Echinoderm and Flatworm Mitochondrial
export const echinodermFlatwormMitochondrial: CodonTable = {
  ...standardTable,
  AUA: 'M',
  UGA: 'W',
  AGA: 'S',
  AGG: 'S',
  AAA: 'N',
};

// Table 10: Euplotid Nuclear
export const euplotidNuclear: CodonTable = {
  ...standardTable,
  UGA: 'C',
};

// Table 11: Bacterial, Archaeal, Plant Plastid
export const bacterialArchaealPlastid: CodonTable = {
  ...standardTable,
};

// Table 12: Alternative Yeast Nuclear
export const altYeastNuclear: CodonTable = {
  ...standardTable,
  CUG: 'S',
};

// Table 13: Ascidian Mitochondrial
export const ascidianMitochondrial: CodonTable = {
  ...standardTable,
  AUA: 'M',
  UGA: 'W',
  AGA: 'G',
  AGG: 'G',
};

// Table 14: Alternative Flatworm Mitochondrial
export const altFlatwormMitochondrial: CodonTable = {
  ...echinodermFlatwormMitochondrial,
  UAA: 'Y',
};

// Table 15: Blepharisma Nuclear
export const blepharismaNuclear: CodonTable = {
  ...standardTable,
  UAG: 'Q',
};

// Table 16: Chlorophycean Mitochondrial
export const chlorophyceanMitochondrial: CodonTable = {
  ...standardTable,
  UAG: 'L',
};

// Table 21: Trematode Mitochondrial
export const trematodeMitochondrial: CodonTable = {
  ...echinodermFlatwormMitochondrial,
  ATA: 'M',
};

// Table 22: Scenedesmus obliquus Mitochondrial
export const scenedesmusMitochondrial: CodonTable = {
  ...standardTable,
  TCA: '*',
  UAG: 'L',
};

// Table 23: Thraustochytrium Mitochondrial
export const thraustochytriumMitochondrial: CodonTable = {
  ...bacterialArchaealPlastid,
  TTA: '*',
};

// Table 24: Rhabdopleuridae Mitochondrial
export const rhabdopleuridaeMitochondrial: CodonTable = {
  ...standardTable,
  UGA: 'W',
  AGA: 'S',
  AGG: 'K',
};

// Table 25: Candidate Division SR1 and Gracilibacteria
export const sr1Gracilibacteria: CodonTable = {
  ...standardTable,
  UGA: 'G',
};

// Table 26: Pachysolen tannophilus Nuclear
export const pachysolenNuclear: CodonTable = {
  ...standardTable,
  CUG: 'A',
};

// Table 27: Karyorelict Nuclear
export const karyorelictNuclear: CodonTable = {
  ...standardTable,
  UAA: 'Q',
  UAG: 'Q',
  UGA: '*',
};

// Table 28: Condylostoma Nuclear
export const condylostomaNuclear: CodonTable = {
  ...standardTable,
  UAA: 'Q',
  UAG: 'Q',
  UGA: 'W',
};

// Table 29: Mesodinium Nuclear
export const mesodiniumNuclear: CodonTable = {
  ...standardTable,
  UAA: 'Y',
  UAG: 'Y',
};

// Table 30: Peritrich Nuclear
export const peritrichNuclear: CodonTable = {
  ...standardTable,
  UAA: 'E',
  UAG: 'E',
};

// Table 31: Blastocrithidia Nuclear
export const blastocrithidiaNuclear: CodonTable = {
  ...standardTable,
  UGA: 'W',
  UAA: 'E',
  UAG: 'E',
};

// Table 32: Balanophoraceae Plastid
export const balanophoraceaePlastid: CodonTable = {
  ...standardTable,
  UAG: 'W',
};

// Table 33: Cephalodiscidae Mitochondrial UAA-Tyr
export const cephalodiscidaeMitochondrial: CodonTable = {
  ...rhabdopleuridaeMitochondrial,
  UAA: 'Y',
};

export const tables: Record<string, CodonTable> = {
  // NCBI table numbers as keys
  '1': standardTable,
  '2': vertebrateMitochondrial,
  '3': yeastMitochondrial,
  '4': moldProtozoanMitochondrial,
  '5': invertebrateMitochondrial,
  '6': ciliateNuclear,
  '9': echinodermFlatwormMitochondrial,
  '10': euplotidNuclear,
  '11': bacterialArchaealPlastid,
  '12': altYeastNuclear,
  '13': ascidianMitochondrial,
  '14': altFlatwormMitochondrial,
  '15': blepharismaNuclear,
  '16': chlorophyceanMitochondrial,
  '21': trematodeMitochondrial,
  '22': scenedesmusMitochondrial,
  '23': thraustochytriumMitochondrial,
  '24': rhabdopleuridaeMitochondrial,
  '25': sr1Gracilibacteria,
  '26': pachysolenNuclear,
  '27': karyorelictNuclear,
  '28': condylostomaNuclear,
  '29': mesodiniumNuclear,
  '30': peritrichNuclear,
  '31': blastocrithidiaNuclear,
  '32': balanophoraceaePlastid,
  '33': cephalodiscidaeMitochondrial,
  // Named keys for convenience
  standard: standardTable,
  vertebrate_mitochondrial: vertebrateMitochondrial,
  yeast_mitochondrial: yeastMitochondrial,
  mold_protozoan_mitochondrial: moldProtozoanMitochondrial,
  invertebrate_mitochondrial: invertebrateMitochondrial,
  ciliate_nuclear: ciliateNuclear,
  echinoderm_flatworm_mitochondrial: echinodermFlatwormMitochondrial,
  euplotid_nuclear: euplotidNuclear,
  bacterial_archaeal_plastid: bacterialArchaealPlastid,
  alt_yeast_nuclear: altYeastNuclear,
  ascidian_mitochondrial: ascidianMitochondrial,
  alt_flatworm_mitochondrial: altFlatwormMitochondrial,
  blepharisma_nuclear: blepharismaNuclear,
  chlorophycean_mitochondrial: chlorophyceanMitochondrial,
  trematode_mitochondrial: trematodeMitochondrial,
  scenedesmus_mitochondrial: scenedesmusMitochondrial,
  thraustochytrium_mitochondrial: thraustochytriumMitochondrial,
  rhabdopleuridae_mitochondrial: rhabdopleuridaeMitochondrial,
  sr1_gracilibacteria: sr1Gracilibacteria,
  pachysolen_nuclear: pachysolenNuclear,
  karyorelict_nuclear: karyorelictNuclear,
  condylostoma_nuclear: condylostomaNuclear,
  mesodinium_nuclear: mesodiniumNuclear,
  peritrich_nuclear: peritrichNuclear,
  blastocrithidia_nuclear: blastocrithidiaNuclear,
  balanophoraceae_plastid: balanophoraceaePlastid,
  cephalodiscidae_mitochondrial: cephalodiscidaeMitochondrial,
};

export function getTable(name = 'standard'): CodonTable {
  return tables[name] ?? standardTable;
}
