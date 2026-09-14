# Sources du catalogue / Catalogue sources

Le catalogue contient 8 087 mnémoniques par profil (un même nom peut apparaître dans plusieurs ISA), issus des versions ci-dessous. Chaque entrée reçoit une fiche guidée bilingue ; 29 fiches conservent en plus un contenu original rédigé à la main. Le moteur reste limité au sous-ensemble documenté dans le README. Les index ne garantissent pas toutes les formes binaires, toutes les extensions historiques ou futures, ni leur disponibilité sur un processeur donné.

| Profil | Entrées importées | Source et périmètre |
| --- | ---: | --- |
| AMD64 | 1906 | Intel XED, formes compatibles avec le mode 64 bits |
| x86 | 1750 | Intel XED, formes compatibles avec le mode 32 bits |
| ARM64 | 1668 | Arm A64 XML 2025-09_ASL1 : base, SIMD/FP, SVE, SME et alias |
| RISC-V | 1045 | riscv-opcodes : fichiers ratifiés rv*, pseudo-opérations incluses |
| SPARC V8 | 200 | Manuel V8, annexes B et F : opcodes, syntaxe assembleur et conditions |
| Power ISA | 1399 | Manuel 3.1C, index H et variantes optionnelles des mnémoniques |
| AVR | 119 | DS40002198B : 124 descriptions, variantes LD/ST regroupées |

Les références pointent vers les définitions officielles, avec page PDF ou ligne Git quand possible. XED expose une forme représentative par famille : ses champs d'opérandes ne sont pas une ligne d'assembleur. Les champs RISC-V décrivent les encodages. SPARC distingue certains noms d'opcodes matériels de leur syntaxe assembleur. L'index Power fournit surtout le mnémonique, sa version et la page du manuel. Les pages expliquent ces conventions en français et en anglais.

## Reproduction

Prérequis : Python 3.12+, Git et Poppler (`pdftotext`).

```sh
python3 scripts/fetch_catalog.py
python3 scripts/import_catalog.py --sources .cache/isa-sources
npm test
npm run build
```

`src/generated/manifest.json` conserve les commits XED/RISC-V, les versions, les nombres d'entrées et les SHA-256 des manuels. Le téléchargement vérifie ces empreintes. Les fichiers sources restent dans `.cache`, ignoré par Git et Docker. Le site utilise uniquement le JSON généré et ne télécharge aucun catalogue à l'exécution.

## Attribution

- [Intel XED](https://github.com/intelxed/xed), licence Apache 2.0 : [texte](public/licenses/intel-xed.txt).
- [riscv-opcodes](https://github.com/riscv/riscv-opcodes), licence BSD 3-Clause : [texte](public/licenses/riscv-opcodes.txt).
- [Arm A64](https://developer.arm.com/documentation/111182/2025-09_ASL1/), métadonnées factuelles et syntaxes ; les manuels et pseudocodes restent chez Arm.
- [Microchip AVR](https://ww1.microchip.com/downloads/en/DeviceDoc/AVR-InstructionSet-Manual-DS40002198.pdf).
- [SPARC V8](https://download.gaisler.com/technical_notes/external/sparc_manuals/sparcv8.pdf).
- [OpenPOWER ISA 3.1C](https://files.openpowerfoundation.org/s/AKX2KtLkwCXxEaC/download).

Les manuels complets et leur prose ne sont pas redistribués. Les descriptions pédagogiques et explications de l'interface sont originales. Consultez toujours le manuel de la version et du processeur visés pour les exceptions, privilèges et contraintes exactes.

The imported catalogue is versioned reference metadata, not an exhaustive executable ISA implementation. Counts are per architecture; guided tutorials and simulator support are separate. Pinned sources and checksums make regeneration reproducible. Manufacturer prose and complete manuals are not redistributed.
