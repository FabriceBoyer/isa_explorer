# ISA Explorer

[Site en ligne](https://fabriceboyer.github.io/isa_explorer/) · [Dépôt GitHub](https://github.com/FabriceBoyer/isa_explorer)

Un site pédagogique interactif pour comprendre les jeux d’instructions, les registres et l’assembleur. React + TypeScript + Vite, **frontend uniquement**, sans compte ni backend. Interface française et anglaise, thèmes clair/sombre/système, navigation adaptée au mobile et aux claviers.

## Démarrage rapide

Prérequis : Node.js 22 et npm. Docker avec le plugin Compose est facultatif.

```sh
npm ci
npm run dev
```

Ouvrir l’adresse affichée par Vite (habituellement `http://localhost:5173`).

```sh
npm run check       # TypeScript strict
npm test            # Tests du moteur
npm run build       # Production dans dist/
npm run preview     # Prévisualisation de production
npx playwright install --with-deps chromium
npm run test:e2e     # Navigation, édition, exécution, langue, thème, mobile
```

## Ce que vous pouvez explorer

| Profil    | Périmètre                      | Registres généraux     | Simulation          |
| --------- | ------------------------------ | ---------------------- | ------------------- |
| AMD64     | x86-64 / Intel 64, 64 bits     | 16 × 64 bits           | Sous-ensemble       |
| ARM64     | AArch64 / A64, 64 bits         | 31 × 64 bits           | Sous-ensemble       |
| RISC-V    | Introduction RV32I/RV64I       | 32 × XLEN, x0 constant | Sous-ensemble RV64I |
| x86       | IA-32, 32 bits                 | 8 × 32 bits            | Fiches uniquement   |
| SPARC     | V8, 32 bits                    | 32 visibles, fenêtres  | Fiches uniquement   |
| Power ISA | Profil entier 64 bits          | 32 × 64 bits           | Fiches uniquement   |
| AVR       | Famille 8 bits                 | 32 × 8 bits            | Fiches uniquement   |

L’ISA est le contrat logiciel, la microarchitecture est sa réalisation matérielle. AMD64 et Intel 64 appartiennent à la même famille ; « x86 » désigne ici précisément IA-32 pour permettre la comparaison avec le mode 64 bits.

Le catalogue comporte **29 fiches rédigées à la main**, enrichies par un catalogue versionné de plusieurs milliers de mnémoniques avec filtres par famille, recherche et pagination. Toutes les instructions disposent d’une fiche guidée interactive en quatre étapes : besoin, opérandes, exécution et résultat. Chaque page explique à quoi sert le mnémonique, donne un cas d’usage concret avec des valeurs, puis instancie la syntaxe avec des registres et constantes quand le gabarit source le permet. Elle fournit aussi un repère fonctionnel bilingue, un chemin conceptuel des données, les variantes, un tableau d’opérandes, les accès lecture/écriture disponibles, les indicateurs décodés, les capacités requises et un lien vers la définition normative. Une absence de métadonnée est signalée explicitement au lieu d’être interprétée comme une absence d’effet. Le détail des sources, versions, limites et commandes de régénération figure dans [catalog-sources.md](catalog-sources.md). Les instructions arithmétiques sélectionnées ont un mini-modèle interactif. Les schémas de circulation sont conceptuels, pas des modèles de performance.

## Utiliser le laboratoire

1. Choisir AMD64, ARM64 ou RISC-V, puis l’une des sept démonstrations : somme, doublement, échange XOR, Fibonacci, comptage de bits, puissance de deux ou assemblage d’un champ de bits.
2. Entrer `n` entre 0 et 100. Il initialise respectivement RCX, X1 ou x1.
3. Modifier librement l’assembleur dans le sous-ensemble accepté. Chaque modification du code, de l’ISA, de l’algorithme ou de la donnée réinitialise l’historique.
4. Exécuter automatiquement ou instruction par instruction. La flèche marque **la prochaine instruction** ; les registres colorés indiquent les changements du dernier pas.
5. Revenir en arrière, réinitialiser, choisir la vitesse ou basculer DEC/HEX.

### Sous-ensemble exact

| ISA   | Registres disponibles                | Instructions                 |
| ----- | ------------------------------------ | ---------------------------- |
| AMD64 | RAX, RBX, RCX, RDX, RSI, RDI, R8, R9 | MOV, ADD, SUB, XOR, AND, OR, SHL, SHR, CMP, JNZ, JZ |
| ARM64 | X0–X7                                | MOV, ADD, SUB, EOR, AND, ORR, LSL, LSR, CBNZ, CBZ |
| RV64I | x0–x7                                | ADDI, ANDI, ORI, SLLI, SRLI, ADD, SUB, XOR, BNE, BEQ |

Syntaxe Intel pour AMD64 (destination en premier), syntaxe A64 avec immédiats `#`, syntaxe RISC-V avec destination en premier. Les mnémoniques et registres sont insensibles à la casse ; les étiquettes sont sensibles à la casse. Commentaires : `;`. Étiquettes : `loop:`. Décimal et hexadécimal positif `0x…` sont acceptés. Les immédiats arithmétiques et logiques RISC-V vont de −2048 à 2047 ; les décalages immédiats vont de 0 à 63. ADD/SUB immédiat A64 accepte 0–4095. MOV accepte des constantes pédagogiques sans valider leur encodage exact.

```asm
; AMD64 : somme de n à 0 ; RCX est initialisé par le formulaire
MOV RAX, 0
ADD RCX, 1
loop:
SUB RCX, 1
ADD RAX, RCX
CMP RCX, 0
JNZ loop
```

Le compteur démarre à `n+1` pour gérer aussi `n=0`, puis diminue avant chaque addition. Le résultat est `n*(n+1)/2`. Le PC est un **index d’instruction**, pas une adresse en octets. Atteindre la fin du programme termine l’expérience, sans ajouter de faux HALT propre à une ISA.

Les valeurs utilisent `BigInt`, tronqué à 64 bits non signés ; les nombres négatifs apparaissent en complément à deux. Seul ZF est simulé en AMD64. ARM64 ne modifie pas NZCV dans ce sous-ensemble ; RISC-V compare directement ses opérandes et ignore toute écriture de x0. L’affichage binaire montre l’octet bas uniquement. Chaque pas produit un nouvel état indépendant, ce qui rend le retour arrière exact.

### Limites assumées

Pas d’assembleur binaire ni d’émulateur complet : aucune mémoire, pile, syscall, exception, MMU, SIMD, flottants, cache, prédiction ou pipeline matériel. Les exemples mémoire et appels dans les fiches ne sont pas exécutables dans le laboratoire. Un maximum de 256 instructions sources et 2 000 pas protège le navigateur des boucles infinies. Les performances de l’animation ne correspondent jamais aux cycles du processeur. L’algorithme affiché au-dessus du code décrit le modèle sélectionné ; si vous modifiez le code, cette indication reste un repère, pas une décompilation automatique.

## Docker Compose

```sh
docker compose up --build -d --wait
# http://localhost:8080
docker compose ps
docker compose logs web
docker compose down
```

Port configurable : `ISA_PORT=8081 docker compose up --build -d --wait`. Le Dockerfile construit le bundle avec Node 22, puis sert uniquement les fichiers statiques avec nginx. Le conteneur final utilise un système de fichiers en lecture seule et des volumes tmpfs pour ses fichiers temporaires. Aucun service applicatif backend ni volume de données.

Après chaque modification : exécuter les contrôles, puis `docker compose up --build -d --force-recreate --wait` afin de reconstruire et relancer la stack locale.

## GitHub Pages et CI

1. Pousser ce projet dans un dépôt GitHub, branche `main`.
2. Dans **Settings → Pages → Build and deployment**, choisir **GitHub Actions**.
3. Le workflow `Deploy GitHub Pages` teste, construit et publie `dist/` avec les actions officielles. Le job de déploiement utilise l’environnement `github-pages` et des permissions limitées `pages: write` et `id-token: write`.
4. Le workflow `Quality and container` vérifie TypeScript, le moteur, les parcours navigateur, la construction et le démarrage Docker sur les push et pull requests. Dependabot surveille npm, Docker et les actions.

Les URL utilisent le fragment (`#/architecture/amd64/ADD`) et Vite `base: './'` : les liens profonds et le rechargement fonctionnent sous un sous-répertoire GitHub Pages, sans serveur de réécriture ni page 404 détournée. Le déploiement statique fonctionne aussi à la racine d’un domaine.

Pour demander une validation obligatoire avant fusion, activer la protection de `main` et sélectionner les jobs de CI dans les paramètres du dépôt. Aucun secret de déploiement personnel n’est nécessaire. En cas de régression, revenir à un commit connu puis le pousser : le workflow republie la version correspondante.

## Structure et contributions

```text
src/data.ts          Profils, fiches et textes FR/EN, références officielles
src/instructionDocs.ts Classification, opérandes et indicateurs des références
src/engine.ts        Parseur et machine entière, fonctions pures
src/engine.test.ts   Algorithmes, débordements, erreurs, immutabilité, limites
src/main.tsx         Navigation, catalogue, fiches, laboratoire et aide
src/style.css        Mise en page responsive, thèmes, animations
public/favicon.svg   Icône locale
tests/app.spec.ts   Parcours Playwright (dossier tests/)
.github/workflows/   CI et publication Pages
Dockerfile           Construction multi-étape et serveur statique
compose.yaml         Stack locale
```

Ajouter une architecture dans `architectures` avec un identifiant stable, des textes dans les deux langues, la largeur, les registres et une source officielle. Ajouter des fiches `Instruction` avec syntaxe exacte, effets, exemple et réserves. Une architecture nouvelle n’obtient pas automatiquement un moteur : son exécution doit être implémentée et testée séparément. Pour étendre le simulateur, modifier le parseur et l’exécuteur ensemble, puis ajouter des tests de comportement (y compris débordements et opérandes invalides).

Préserver les vues mobiles, la navigation clavier, les noms accessibles et `prefers-reduced-motion`. Le thème et la langue sont les seules préférences enregistrées dans `localStorage`. Le programme et les valeurs ne sont pas persistés et ne sont jamais envoyés à un serveur. Les polices Google Fonts sont chargées si le réseau le permet ; les polices système prennent le relais sinon. Les liens de référence ouvrent des sites tiers. Le site n’utilise aucun analytics.

## Sources et exactitude

Sources consultées le 13 septembre 2026. Les synthèses sont originales et ne remplacent pas les manuels normatifs. Les dates des profils sont des repères de version, pas nécessairement celles du premier produit commercial.

- [Intel SDM : IA-32 et Intel 64](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
- [Arm A64 Instruction Set](https://developer.arm.com/documentation/ddi0602/latest/)
- [RISC-V Unprivileged ISA](https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html)
- [SPARC V8 Architecture Manual](https://download.gaisler.com/technical_notes/external/sparc_manuals/sparcv8.pdf)
- [IBM instruction set reference](https://www.ibm.com/docs/en/aix/7.3.0?topic=reference-instruction-set)
- [Microchip AVR Instruction Set Manual](https://ww1.microchip.com/downloads/en/DeviceDoc/AVR-InstructionSet-Manual-DS40002198.pdf)

Une page d’aide intégrée (`#/help`) explique les notions, le laboratoire, la couverture, les limites, les préférences et les sources.

## English guide

ISA Explorer is a frontend-only educational React/TypeScript/Vite site. It introduces seven architecture profiles, 29 curated instruction tutorials and thousands of versioned instruction references and editable step-by-step simulations for AMD64, A64 and RV64I. See [catalogue coverage and regeneration](catalog-sources.md) for pinned versions and extraction limits. The simulator supports only the subset listed above.

Run `npm ci && npm run dev`. Build with `npm run build`; verify with `npm run check`, `npm test`, and `npm run test:e2e` after installing Chromium with `npx playwright install --with-deps chromium`. Docker: `docker compose up --build -d --wait`, then open `http://localhost:8080`. Change the port using `ISA_PORT`.

Select an ISA and one of seven algorithms: sum, double, XOR swap, Fibonacci, population count, power of two, or bit-field packing. Enter n between zero and 100; RCX, X1 or x1 receives it. Editing code or input resets the run. Step, run, pause, rewind and reset controls expose immutable register snapshots. The PC is an instruction index, values are unsigned 64-bit BigInts, and the bit display shows the low byte. Only AMD64 ZF is modeled. The lab has eight visible registers per ISA, no memory or stack, and a 2,000-step safety limit. See the exact subset table above. Comments start with `;`; labels end in `:`. Instruction references have dedicated hash URLs and official source links.

Browser language is detected on first visit, defaulting to English unless French. Theme follows the OS unless overridden. Preferences are saved locally; programs are not uploaded or persisted. Animations respect reduced-motion preferences. The in-app help page is fully available in English.

For Pages, push to `main` and select **GitHub Actions** in repository Pages settings. Relative assets and hash routing support repository subpaths and direct links. CI tests the engine, browser flows, production build and Docker service. To contribute, extend bilingual content in `src/data.ts`; engine support must be implemented and behavior-tested separately. Consult primary manuals for precise variants, exceptions and extensions.
