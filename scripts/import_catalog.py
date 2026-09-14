#!/usr/bin/env python3
"""Build a static factual index from pinned manufacturer sources (no runtime API).
Usage: python3 scripts/import_catalog.py --sources /tmp/isa-sources
Only identifiers, operand syntax, encodings, feature tags and page locations are
extracted. Manufacturer prose, examples and pseudocode are not republished.
"""
import argparse, hashlib, json, re, subprocess, unicodedata, xml.etree.ElementTree as ET
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--sources', type=Path, required=True)
args = parser.parse_args()
S = args.sources
OUT = ROOT / 'src/generated'
OUT.mkdir(exist_ok=True)
ARM_VERSION = '2025-09_ASL1'
ARM = S / ('ISA_A64_xml_A_profile-' + ARM_VERSION)
URLS = {
 'arm64': 'https://developer.arm.com/documentation/111182/2025-09_ASL1/',
 'avr': 'https://ww1.microchip.com/downloads/en/DeviceDoc/AVR-InstructionSet-Manual-DS40002198.pdf',
 'sparc': 'https://download.gaisler.com/technical_notes/external/sparc_manuals/sparcv8.pdf',
 'power': 'https://files.openpowerfoundation.org/s/AKX2KtLkwCXxEaC/download',
 'riscv': 'https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html',
 'amd64': 'https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html',
}
entries = {a: {} for a in ['amd64','x86','arm64','riscv','sparc','power','avr']}

def clean(s): return re.sub(r'\s+', ' ', s).strip()
def add(arch, name, family, source, **kw):
 name=name.upper()
 if not name or not re.fullmatch(r'[A-Z0-9_.<>]+',name): raise ValueError(f'Invalid mnemonic {name}')
 e=entries[arch].setdefault(name, {'name':name,'families':[], 'forms':[]})
 if family not in e['families']: e['families'].append(family)
 form={'family':family,'source':source, **{k:v for k,v in kw.items() if v}}
 if form not in e['forms']: e['forms'].append(form)

def pdf(name):
 target=S/(name+'.txt'); source=S/(name+'.pdf')
 subprocess.run(['pdftotext','-layout',str(source),str(target)],check=True)
 return unicodedata.normalize('NFKC', target.read_text()).split('\f')

# XED's public ISA data: retain a representative operand description for each
# mnemonic/ISA_SET combination and all families. Not a binary encoder export.
xed_sha=subprocess.check_output(['git','-C',str(S/'xed'),'rev-parse','HEAD'],text=True).strip()
base=S/'xed/datafiles'
deleted=set()
for f in base.rglob('*.txt'):
 deleted.update(re.findall(r'^UDELETE\s*:\s*(\S+)',f.read_text(errors='replace'),re.M))
xed_seen=set()
for f in sorted(base.rglob('*')):
 if not f.is_file() or f.suffix not in ['.txt','.xed']: continue
 content=f.read_text(errors='replace')
 for block in re.finditer(r'^\{\s*\n(.*?)^\}',content,re.M|re.S):
  body=block.group(1)
  pairs=re.findall(r'^([A-Z_]+)\s*:\s*(.*)',body,re.M)
  values=dict(pairs)
  cls=values.get('ICLASS','')
  if not cls or cls in deleted or any(x in cls for x in ['RESERVED','NOP0F','INVALID']):continue
  name=values.get('DISASM',cls).upper()
  name={'CALL_NEAR':'CALL','CALL_FAR':'CALL','RET_NEAR':'RET','RET_FAR':'RETF','JMP_FAR':'JMP','PUSHFD':'PUSHFD','IRETD':'IRETD','PEXTRW_SSE4':'PEXTRW','FDISI8087_NOP':'FDISI','FENI8087_NOP':'FENI','FSETPM287_NOP':'FSETPM'}.get(name,name)
  name=re.sub(r'_LOCK$','',name)
  if not re.fullmatch(r'[A-Z][A-Z0-9_]*',name):continue
  family=values.get('ISA_SET',values.get('EXTENSION','BASE'))
  if not re.fullmatch(r'[A-Za-z0-9_]+',family):continue
  patterns=[]
  for pos,(key,value) in enumerate(pairs):
   if key=='PATTERN':
    operands=next((v for k,v in pairs[pos+1:] if k in ['OPERANDS','PATTERN']), '')
    patterns.append((value,operands))
  if not patterns:continue
  # Any encoding not explicitly restricted out of the selected execution mode.
  for arch in ['amd64','x86']:
   valid=[p for p in patterns if not re.search(r'\b(?:not64|mode16|mode32)\b|MODE!=2|MODE=0|MODE=1',p[0])] if arch=='amd64' else [p for p in patterns if not re.search(r'\b(?:mode64|mode16)\b|MODE=2|MODE=0',p[0])]
   if not valid:continue
   key=(arch,name,family)
   if key in xed_seen:continue
   xed_seen.add(key)
   line=content[:block.start()].count('\n')+2
   source=f'https://github.com/intelxed/xed/blob/{xed_sha}/datafiles/{f.relative_to(base).as_posix()}#L{line}'
   add(arch,name,family,source,operands=valid[0][1],flags=values.get('FLAGS'),classification=values.get('CATEGORY'),privilege=values.get('CPL'),encoding=valid[0][0],format='xed')

# A64: every public index (base, FP/SIMD, SVE, SME), retaining alias identifiers.
arm_forms=0
for index,family,section in [('index.xml','A64','Base-Instructions'),('fpsimdindex.xml','SIMD & FP','SIMD-FP-Instructions'),('sveindex.xml','SVE','SVE-Instructions'),('mortlachindex.xml','SME','SME-Instructions')]:
 for form in ET.parse(ARM/index).getroot().iter('iform'):
  filename=form.get('iformfile')
  if not filename:continue
  node=ET.parse(ARM/filename).getroot()
  names={n.strip().upper() for n in form.get('heading','').split(' (')[0].split(',') if n.strip()}
  if not names: names={v.get('value').upper() for v in node.findall('.//docvar[@key="alias_mnemonic"]') if v.get('value')}
  if not names: names={v.get('value').upper() for v in node.findall('.//docvar[@key="mnemonic"]') if v.get('value')}
  features=sorted({v.get('feature') for v in node.findall('.//arch_variant') if v.get('feature')})
  templates=sorted({clean(''.join(x.itertext())) for x in node.findall('.//asmtemplate')})
  # Official deep links use the heading followed by the brief title, with each
  # non-alphanumeric character represented by '-'. No prose is stored locally.
  brief=clean(''.join(node.find('./desc/brief').itertext())) if node.find('./desc/brief') is not None else ''
  heading=clean(''.join(node.find('./heading').itertext())) if node.find('./heading') is not None else form.get('heading','')
  slug=re.sub(r'[^A-Za-z0-9]', '-',heading+'--'+brief+'-')
  source=URLS['arm64']+section+'/'+slug
  for name in sorted(names):
   if not re.fullmatch(r'[A-Z][A-Z0-9_.<>]*',name):continue
   own=[t for t in templates if re.split(r'\s',t)[0].upper()==name]
   # Symbolic families such as B.cond or CB<cc> retain their source spelling.
   for syntax in own or templates[:1] or [name]:
    add('arm64',name,family,source,syntax=syntax,features=features,format='assembly')
   arm_forms+=1

# Ratified RISC-V extension files only; aliases are explicit and imports reuse
# their owning definitions rather than manufacturing duplicate instructions.
rv_sha=subprocess.check_output(['git','-C',str(S/'riscv-opcodes'),'rev-parse','HEAD'],text=True).strip()
for f in sorted((S/'riscv-opcodes/extensions').glob('rv*')):
 if not f.is_file():continue
 for n,line in enumerate(f.read_text().splitlines(),1):
  line=line.split('#')[0].strip()
  if not line or line.startswith('$import'):continue
  words=line.split(); alias=''
  if words[0]=='$pseudo_op':alias=words[1].split('::')[-1];words=words[2:]
  if words[0].startswith('$'):continue
  name=words[0]; operands=[w for w in words[1:] if '=' not in w]
  bits=[w for w in words[1:] if '=' in w]
  add('riscv',name,f.stem,f'https://github.com/riscv/riscv-opcodes/blob/{rv_sha}/extensions/{f.name}#L{n}',operands=', '.join(operands),encoding=' '.join(bits),alias=alias,format='fields')

# AVR: all 124 numbered descriptions, merging LD/ST addressing variants under
# their actual mnemonics. Extract syntax and constraints, never PDF prose.
avr_pages=pdf('avr'); avr_descriptions=0
for pnum,page in enumerate(avr_pages,1):
 headings=list(re.finditer(r'^6\.\d+\s+([A-Z][A-Z0-9]*(?:\s*\([^\n]*?\))?)\s+[–−-]\s+[^\n]+$',page,re.M))
 for ix,h in enumerate(headings):
  if '...' in h.group():continue
  avr_descriptions+=1
  name=h.group(1).split()[0]
  body=page[h.end():headings[ix+1].start() if ix+1<len(headings) else len(page)]
  syntaxes=[]
  for match in re.finditer(r'^\s*\([ivx]+\)\s+('+name+r'(?:\s+.*?)?)\s{3,}(.*?)\s{3,}PC',body,re.M):
   syntaxes.append((clean(match.group(1)),clean(match.group(2))))
  if not syntaxes:
   # Some instruction sections wrap their syntax onto the following page.
   following=body+'\n'+(avr_pages[pnum] if pnum<len(avr_pages) else '')
   for match in re.finditer(r'^\s*\([ivx]+\)\s+('+name+r'(?:\s+.*?)?)\s{3,}(.*?)\s{3,}PC',following,re.M):syntaxes.append((clean(match.group(1)),clean(match.group(2))))
  for syntax,constraints in syntaxes or [(name,'')]:
   actual=syntax.split()[0]
   add('avr',actual,'AVR',URLS['avr']+f'#page={pnum}',syntax=syntax,constraints=constraints,format='assembly')
for pnum,page in enumerate(avr_pages,1):
 if re.search(r'^6\.111\s+SLEEP\s*$',page,re.M):
  avr_descriptions+=1
  add('avr','SLEEP','AVR',URLS['avr']+f'#page={pnum}',syntax='SLEEP',format='assembly')
# LDD and STD appear as addressing forms in the LD/ST sections, not headings.
for pnum,page in enumerate(avr_pages,1):
 if pnum<24:continue
 for name in ['LDD','STD']:
  for m in re.finditer(r'^\s*\([ivx]+\)\s+('+name+r'\s+.*?)\s{3,}(.*?)\s{3,}PC',page,re.M):
   add('avr',name,'AVR',URLS['avr']+f'#page={pnum}',syntax=clean(m.group(1)),constraints=clean(m.group(2)),format='assembly')

# SPARC V8: appendix B's per-instruction numeric opcode tables and assembly
# syntax. Families Bicc/FBfcc/CBccc/Ticc are expanded to their condition names.
sparc_pages=pdf('sparcv8-real')
for pnum,page in enumerate(sparc_pages,1):
 if 'Suggested Assembly Language Syntax' not in page:continue
 if pnum < next(i for i,p in enumerate(sparc_pages,1) if 'Table B-1' in p and 'LDSB' in p):continue
 # All assembly rows between the heading and the following Description/footer.
 segment=page.split('Suggested Assembly Language Syntax',1)[1]
 segment=re.split(r'Description:|SPARC International, Inc\.',segment)[0]
 for line in segment.splitlines():
  line=line.strip()
  m=re.match(r'^([a-z][a-z0-9]*(?:cc)?)(?:\s{2,}|\s+\[|\s+%)(.*)',line)
  if not m:continue
  name=m.group(1); syntax=clean(line)
  if name in ['where','or','and','reg','address']:continue
  add('sparc',name,'SPARC V8',URLS['sparc']+f'#page={pnum}',syntax=syntax,format='assembly')
# Tables expose hardware opcodes whose assembler mnemonic is shared (LDF→ld).
for pnum,page in enumerate(sparc_pages,1):
 if 'Table B-1' not in page:continue
 for line in page.splitlines():
  cols=re.split(r'\s{2,}',line.strip())
  if len(cols)<2 or not re.match(r'^[A-Z][A-Z0-9a-z]*(?:\s|\(|†|‡|$)',cols[0]):continue
  for name in re.findall(r'\b[A-Z][A-Z0-9]*(?:cc(?:TV)?)?\b',cols[0]):
   if name in ['Opcode','Name','B','SPARC']:continue
   add('sparc',name,'SPARC V8',URLS['sparc']+f'#page={pnum}',format='opcode')
# Expand condition codes using the explicit names in Table F-7.
for pnum,page in enumerate(sparc_pages,1):
 if 'Table F-7' not in page or 'BN' not in page:continue
 for name in re.findall(r'\b(?:FB|CB|B|T)[A-Z0-9]+\b',page):
  if name in ['TV','TADD','TSUB']:continue
  add('sparc',name,'SPARC V8',URLS['sparc']+f'#page={pnum}',format='opcode')

# Power ISA 3.1C appendix H: all listed mnemonics, including record variants,
# with page links and ISA version tags. Descriptive prose is not redistributed.
power_pages=pdf('power'); page_map={}; power_rows=0
for i,page in enumerate(power_pages,1):
 match=re.search(r'\b(\d+) of 1459\b',page)
 if match:page_map[int(match.group(1))]=i
for index,page in enumerate(power_pages,1):
 if 'Table H.1:' not in page:continue
 for line in page.splitlines():
  m=re.search(r'\s([a-z][a-z0-9.\[\]]*)\s+(P\d|PPC|v\d[^\s]*)(.*?)\s+(\d+)\s+',line)
  if not m:continue
  power_rows+=1
  name,version,extra,refpage=m.groups()
  names=[name]
  while any('[' in n for n in names):
   expanded=[]
   for n in names:
    opt=re.search(r'\[([^\]]+)\]',n)
    if opt:expanded.extend([n[:opt.start()]+n[opt.end():], n[:opt.start()]+opt.group(1)+n[opt.end():]])
    else:expanded.append(n)
   names=expanded
  target=page_map.get(int(refpage))
  if not target:raise ValueError(f'Missing Power page {refpage}')
  family='Power '+version
  for n in names:
   # Read only exact assembly signatures from the referenced instruction page.
   syntax=''
   for row in power_pages[target-1].splitlines():
    if re.match(r'^\s*'+re.escape(n)+r'\s+[A-Z][A-Za-z0-9, ()]+\s*$',row):syntax=clean(row);break
   add('power',n,family,URLS['power']+f'#page={target}',syntax=syntax,format='assembly' if syntax else 'opcode')

versions={'amd64':'Intel XED '+xed_sha[:12],'x86':'Intel XED '+xed_sha[:12],'arm64':'A64 '+ARM_VERSION,'riscv':'riscv-opcodes '+rv_sha[:12]+' · ratified','avr':'DS40002198B · 2021','sparc':'SPARC V8 · 1992','power':'Power ISA 3.1C · 2024'}
result={}
for arch,items in entries.items():
 ordered=[]
 for name,e in sorted(items.items()):
  e['families'].sort();ordered.append(e)
 result[arch]={'version':versions[arch],'source':URLS.get(arch,URLS['amd64']),'entries':ordered}
(OUT/'catalog.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')
manifest={'generatedOn':'2026-09-14','xedCommit':xed_sha,'riscvCommit':rv_sha,'armVersion':ARM_VERSION,'avrDescriptions':avr_descriptions,'armIndexedForms':arm_forms,'powerTableRows':power_rows,'counts':{k:len(v) for k,v in entries.items()},'sha256':{name:hashlib.sha256((S/name).read_bytes()).hexdigest() for name in ['arm.tar.gz','avr.pdf','sparcv8-real.pdf','power.pdf']}}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest,indent=2))
