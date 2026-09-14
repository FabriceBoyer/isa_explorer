import { describe, expect, it } from 'vitest';
import { architectures } from './data';
import { catalogs, simulatedMnemonics } from './catalog';
import manifest from './generated/manifest.json';

it('removes LEON and retains seven independent profiles',()=>{
 expect(architectures.map(a=>a.id)).toEqual(['amd64','arm64','riscv','x86','sparc','power','avr']);
});
describe.each(Object.keys(catalogs))('%s catalogue integrity',id=>{
 it('has unique mnemonics and a reference for every imported form',()=>{
  const entries=catalogs[id].entries;
  expect(entries.length).toBe(manifest.counts[id as keyof typeof manifest.counts]);
  expect(new Set(entries.map(e=>e.name)).size).toBe(entries.length);
  for(const entry of entries){
   expect(entry.forms.length).toBeGreaterThan(0);
   for(const form of entry.forms){
    expect(new URL(form.source).protocol).toBe('https:');
    expect(entry.families).toContain(form.family);
   }
  }
 });
});
it('contains every AVR mnemonic including SLEEP and displacement addressing',()=>{
 const names=catalogs.avr.entries.map(i=>i.name);
 expect(names).toHaveLength(119);
 for(const name of ['ADC','SLEEP','LDD','STD','RETI','DES','FMULSU','XCH'])expect(names).toContain(name);
 expect(catalogs.avr.entries.find(i=>i.name==='LDD')?.forms.some(f=>f.syntax==='LDD Rd, Y+q')).toBe(true);
});
it('distinguishes 32-bit x86 instructions from long mode',()=>{
 for(const name of ['AAA','AAS','PUSHAD','POPAD']){
  expect(catalogs.x86.entries.some(i=>i.name===name)).toBe(true);
  expect(catalogs.amd64.entries.some(i=>i.name===name)).toBe(false);
 }
 expect(catalogs.amd64.entries.some(i=>i.name==='VADDPD')).toBe(true);
});
it('covers vector, privileged, floating and record variants',()=>{
 for(const [arch,names] of Object.entries({arm64:['LD1','PTRUE','SMSTART'],riscv:['VADD.VV','MRET','LR.W'],power:['MFFS','ADD.','XVADDDP'],sparc:['RETT','FADDQ','TNE']}))
  for(const name of names)expect(catalogs[arch].entries.some(e=>e.name===name),`${arch}: ${name}`).toBe(true);
});
it('never turns metadata into executable instructions',()=>{
 expect(simulatedMnemonics.amd64).toHaveLength(11);
 expect(simulatedMnemonics.arm64).toHaveLength(10);
 expect(simulatedMnemonics.riscv).toHaveLength(10);
 expect(simulatedMnemonics.avr).toBeUndefined();
});
it('preserves the guided references and their examples',()=>{
 const guided=architectures.flatMap(a=>a.instructions.filter(i=>i.guided));
 expect(guided).toHaveLength(29);
 expect(guided.every(i=>i.example && i.description.fr && i.description.en)).toBe(true);
});
