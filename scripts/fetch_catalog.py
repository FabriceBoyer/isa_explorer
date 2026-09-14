#!/usr/bin/env python3
"""Fetch the pinned inputs documented in catalog-sources.md and verify digests."""
import argparse, hashlib, json, subprocess, tarfile, urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(); parser.add_argument('--sources',type=Path,default=root/'.cache/isa-sources'); args=parser.parse_args()
target=args.sources; target.mkdir(parents=True,exist_ok=True)
manifest=json.loads((root/'src/generated/manifest.json').read_text())
files={
 'arm.tar.gz':'https://developer.arm.com/-/cdn-downloads/permalink/Exploration-Tools-A64-ISA/ISA_A64/ISA_A64_xml_A_profile-2025-09_ASL1.tar.gz',
 'avr.pdf':'https://ww1.microchip.com/downloads/en/DeviceDoc/AVR-InstructionSet-Manual-DS40002198.pdf',
 'sparcv8-real.pdf':'https://download.gaisler.com/technical_notes/external/sparc_manuals/sparcv8.pdf',
 'power.pdf':'https://files.openpowerfoundation.org/s/AKX2KtLkwCXxEaC/download',
}
for name,url in files.items():
 path=target/name
 if not path.exists():
  request=urllib.request.Request(url,headers={'User-Agent':'ISA-Explorer-catalog-builder'})
  with urllib.request.urlopen(request,timeout=120) as response:path.write_bytes(response.read())
 if hashlib.sha256(path.read_bytes()).hexdigest()!=manifest['sha256'][name]:raise SystemExit(f'Source changed: {name}. Review the upstream revision before updating the manifest.')
 print('Verified',name)
with tarfile.open(target/'arm.tar.gz') as archive:archive.extractall(target,filter='data')
for name,url,sha in [('xed','https://github.com/intelxed/xed.git',manifest['xedCommit']),('riscv-opcodes','https://github.com/riscv/riscv-opcodes.git',manifest['riscvCommit'])]:
 repo=target/name
 if not (repo/'.git').exists():
  subprocess.run(['git','init',str(repo)],check=True)
  subprocess.run(['git','-C',str(repo),'fetch','--depth','1',url,sha],check=True)
  subprocess.run(['git','-C',str(repo),'checkout','--detach','FETCH_HEAD'],check=True)
 actual=subprocess.check_output(['git','-C',str(repo),'rev-parse','HEAD'],text=True).strip()
 if actual!=sha:raise SystemExit(f'Unexpected revision in {repo}; expected {sha}')
 print('Verified',name,sha)
