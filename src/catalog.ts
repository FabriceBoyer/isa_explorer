import rawCatalog from './generated/catalog.json';
import type { Architecture, Instruction } from './data';

export type ReferenceForm = {
  family: string;
  source: string;
  format: string;
  syntax?: string;
  operands?: string;
  encoding?: string;
  flags?: string;
  constraints?: string;
  features?: string[];
  alias?: string;
  classification?: string;
  privilege?: string;
};
export type ReferenceEntry = { name: string; families: string[]; forms: ReferenceForm[] };
export type Catalog = { version: string; source: string; entries: ReferenceEntry[] };
export const catalogs = rawCatalog as Record<string, Catalog>;

/** The catalogue is broader than the execution engine. Never infer support from it. */
export const simulatedMnemonics: Record<string, string[]> = {
  amd64: ['MOV', 'ADD', 'SUB', 'XOR', 'AND', 'OR', 'SHL', 'SHR', 'CMP', 'JNZ', 'JZ'],
  arm64: ['MOV', 'ADD', 'SUB', 'EOR', 'AND', 'ORR', 'LSL', 'LSR', 'CBNZ', 'CBZ'],
  riscv: ['ADDI', 'ANDI', 'ORI', 'SLLI', 'SRLI', 'ADD', 'SUB', 'XOR', 'BNE', 'BEQ'],
};

export function attachCatalog(architectures: Architecture[]) {
  for (const a of architectures) {
    const tutorials = new Map(a.instructions.map(i => [i.name, i]));
    for (const entry of catalogs[a.id]?.entries ?? []) {
      const tutorial = tutorials.get(entry.name);
      if (tutorial) { tutorial.reference = entry; continue; }
      const item: Instruction = {
        name: entry.name,
        kind: 'reference',
        guided: true,
        title: { fr: entry.families.join(' · '), en: entry.families.join(' · ') },
        syntax: entry.forms.find(f => f.syntax)?.syntax || entry.name,
        effect: '', description: {fr:'',en:''}, flags: {fr:'',en:''},
        example: '', result: '', note: {fr:'',en:''}, reference: entry,
      };
      tutorials.set(item.name, item);
    }
    a.instructions = [...tutorials.values()].sort((x, y) => x.name.localeCompare(y.name, 'en'));
  }
}
