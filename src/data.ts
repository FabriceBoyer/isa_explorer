export type Lang = "fr" | "en";
export type Text = { fr: string; en: string };
export const bi = (fr: string, en: string): Text => ({ fr, en });
export type Architecture = {
  id: string;
  name: string;
  subtitle: string;
  bits: number;
  family: string;
  year: string;
  color: string;
  registers: string;
  use: Text;
  description: Text;
  detail: Text;
  source: string;
  instructions: Instruction[];
};
export type Instruction = {
  name: string;
  kind: "data" | "math" | "logic" | "flow";
  title: Text;
  syntax: string;
  effect: string;
  description: Text;
  flags: Text;
  example: string;
  result: string;
  note: Text;
};
const intel =
  "https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html";
const arm = "https://developer.arm.com/documentation/ddi0602/latest/";
const rv = "https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html";
const noFlags = bi(
  "Les indicateurs arithmétiques ne sont pas modifiés.",
  "Arithmetic flags are unchanged.",
);
const arithmetic = bi(
  "Le résultat est tronqué à la largeur du registre. Consultez le manuel pour les variantes et les exceptions.",
  "The result is truncated to the register width. See the manual for variants and exceptions.",
);
function ins(
  name: string,
  kind: Instruction["kind"],
  title: Text,
  syntax: string,
  effect: string,
  description: Text,
  flags: Text,
  example: string,
  result: string,
  note = arithmetic,
): Instruction {
  return {
    name,
    kind,
    title,
    syntax,
    effect,
    description,
    flags,
    example,
    result,
    note,
  };
}
function x86(reg: string, other: string): Instruction[] {
  return [
    ins(
      "MOV",
      "data",
      bi("Transférer une valeur", "Move a value"),
      `MOV ${reg}, ${other}`,
      "destination ← source",
      bi(
        "Copie une valeur immédiate, un registre ou une valeur mémoire vers la destination. La source reste intacte. Les deux opérandes ne peuvent pas être tous deux en mémoire.",
        "Copies an immediate, register or memory value into the destination. The source remains unchanged. Both operands cannot be memory operands.",
      ),
      noFlags,
      `MOV ${reg}, 7\nMOV ${other}, ${reg}`,
      `${reg} = 7 · ${other} = 7`,
      bi(
        "Syntaxe Intel : destination en premier. En mode 64 bits, écrire EAX remet à zéro la moitié haute de RAX.",
        "Intel syntax: destination first. In 64-bit mode, writing EAX clears the upper half of RAX.",
      ),
    ),
    ins(
      "ADD",
      "math",
      bi("Additionner", "Add"),
      `ADD ${reg}, ${other}`,
      "destination ← destination + source",
      bi(
        "Lit les deux opérandes, additionne leurs valeurs et remplace la destination par le résultat. La retenue non signée et le débordement signé sont deux notions distinctes.",
        "Reads both operands, adds their values and replaces the destination with the result. Unsigned carry and signed overflow are distinct concepts.",
      ),
      bi(
        "CF, OF, SF, ZF, AF et PF sont mis à jour.",
        "Updates CF, OF, SF, ZF, AF and PF.",
      ),
      `MOV ${reg}, 7\nMOV ${other}, 5\nADD ${reg}, ${other}`,
      `${reg} = 12 · ZF = 0`,
    ),
    ins(
      "SUB",
      "math",
      bi("Soustraire", "Subtract"),
      `SUB ${reg}, ${other}`,
      "destination ← destination − source",
      bi(
        "Soustrait la source de la destination. Les bits conservés représentent le résultat modulo 2 à la puissance de la largeur du registre.",
        "Subtracts the source from the destination. The retained bits represent the result modulo two to the power of the register width.",
      ),
      bi(
        "CF indique un emprunt ; ZF indique zéro. OF, SF, AF et PF sont aussi modifiés.",
        "CF indicates borrow; ZF indicates zero. OF, SF, AF and PF also change.",
      ),
      `MOV ${reg}, 7\nSUB ${reg}, 7`,
      `${reg} = 0 · ZF = 1`,
    ),
    ins(
      "XOR",
      "logic",
      bi("Ou exclusif bit à bit", "Bitwise exclusive OR"),
      `XOR ${reg}, ${other}`,
      "destination ← destination ⊕ source",
      bi(
        "Chaque bit vaut 1 si les deux bits d’entrée sont différents. Appliquer XOR à un registre avec lui-même le remet à zéro.",
        "Each result bit is one when the two input bits differ. XORing a register with itself clears it.",
      ),
      bi(
        "CF et OF sont effacés ; SF, ZF et PF reflètent le résultat ; AF est indéfini.",
        "Clears CF and OF; SF, ZF and PF reflect the result; AF is undefined.",
      ),
      `MOV ${reg}, 10\nXOR ${reg}, 6`,
      `${reg} = 12 (1010 ⊕ 0110 = 1100)`,
    ),
    ins(
      "CMP",
      "flow",
      bi("Comparer sans écrire", "Compare without storing"),
      `CMP ${reg}, ${other}`,
      "flags ← destination − source",
      bi(
        "Effectue une soustraction pour mettre à jour les indicateurs sans modifier les opérandes. Un saut conditionnel utilise ensuite ces indicateurs.",
        "Performs a subtraction to update flags without changing the operands. A conditional branch then uses those flags.",
      ),
      bi(
        "Même effet sur les indicateurs que SUB.",
        "Same flag effects as SUB.",
      ),
      `MOV ${reg}, 5\nCMP ${reg}, 5`,
      `${reg} = 5 · ZF = 1`,
    ),
    ins(
      "JNZ",
      "flow",
      bi("Sauter si différent de zéro", "Jump if not zero"),
      "JNZ loop",
      "PC ← target if ZF = 0",
      bi(
        "Reprend l’exécution à une étiquette lorsque ZF vaut zéro. Sinon, passe à l’instruction suivante. JNE est un autre nom du même saut.",
        "Continues execution at a label when ZF is zero. Otherwise, proceeds to the next instruction. JNE is another name for the same branch.",
      ),
      noFlags,
      `MOV ${reg}, 2\nloop:\nSUB ${reg}, 1\nJNZ loop`,
      `${reg} = 0`,
      bi(
        "La cible est encodée comme déplacement relatif. Le laboratoire résout les étiquettes en indices d’instructions.",
        "The target is encoded as a relative displacement. The lab resolves labels to instruction indices.",
      ),
    ),
  ];
}
const armInstructions = [
  ins(
    "MOV",
    "data",
    bi("Charger une valeur", "Move a value"),
    "MOV X0, #7",
    "Xd ← source",
    bi(
      "Transfère une valeur vers un registre. MOV est un alias : son encodage réel dépend de la source et de la constante.",
      "Moves a value into a register. MOV is an alias: its actual encoding depends on the source and constant.",
    ),
    noFlags,
    "MOV X0, #7",
    "X0 = 7",
    bi(
      "MOV immédiat peut être un alias de MOVZ, MOVN ou ORR. Toutes les constantes ne tiennent pas dans une seule instruction.",
      "Immediate MOV may alias MOVZ, MOVN or ORR. Not every constant fits in one instruction.",
    ),
  ),
  ins(
    "ADD",
    "math",
    bi("Additionner trois opérandes", "Add with three operands"),
    "ADD X0, X1, X2",
    "Xd ← Xn + Xm",
    bi(
      "Lit deux registres sources et écrit dans un registre destination indépendant. Les sources sont conservées sauf si elles sont aussi la destination.",
      "Reads two source registers and writes to an independent destination. Sources are preserved unless also used as the destination.",
    ),
    bi(
      "ADD conserve NZCV ; ADDS les met à jour.",
      "ADD preserves NZCV; ADDS updates them.",
    ),
    "MOV X1, #7\nMOV X2, #5\nADD X0, X1, X2",
    "X0 = 12",
  ),
  ins(
    "SUB",
    "math",
    bi("Soustraire", "Subtract"),
    "SUB X0, X1, #1",
    "Xd ← Xn − operand",
    bi(
      "Soustrait un registre ou une constante de la première source. La variante SUBS permet aussi de tester le résultat.",
      "Subtracts a register or constant from the first source. SUBS also tests the result.",
    ),
    bi(
      "SUB conserve NZCV ; SUBS les met à jour.",
      "SUB preserves NZCV; SUBS updates them.",
    ),
    "MOV X1, #7\nSUB X0, X1, #1",
    "X0 = 6",
  ),
  ins(
    "EOR",
    "logic",
    bi("Ou exclusif", "Exclusive OR"),
    "EOR X0, X1, X2",
    "Xd ← Xn ⊕ Xm",
    bi(
      "Compare les bits des deux sources : un bit différent produit 1. Utile pour les masques et les permutations.",
      "Compares source bits: differing bits produce one. Useful for masks and swaps.",
    ),
    noFlags,
    "MOV X1, #10\nMOV X2, #6\nEOR X0, X1, X2",
    "X0 = 12",
  ),
  ins(
    "CBNZ",
    "flow",
    bi("Sauter si le registre est non nul", "Compare and branch on nonzero"),
    "CBNZ X1, loop",
    "PC ← target if X1 ≠ 0",
    bi(
      "Teste directement un registre et saute s’il est non nul. Aucun CMP préalable n’est nécessaire.",
      "Tests a register directly and branches when nonzero. No preceding CMP is required.",
    ),
    noFlags,
    "MOV X1, #2\nloop:\nSUB X1, X1, #1\nCBNZ X1, loop",
    "X1 = 0",
    bi(
      "Branchement PC-relatif limité en portée. La variante CBZ teste zéro.",
      "PC-relative branch with limited range. CBZ tests for zero.",
    ),
  ),
];
const rvInstructions = [
  ins(
    "ADDI",
    "math",
    bi("Additionner une constante", "Add an immediate"),
    "ADDI x1, x0, 7",
    "rd ← rs1 + sign_extend(imm12)",
    bi(
      "Additionne un immédiat signé de 12 bits à un registre. x0 contient toujours zéro : ADDI permet donc aussi de charger une petite constante.",
      "Adds a signed 12-bit immediate to a register. x0 always holds zero, so ADDI also loads small constants.",
    ),
    bi(
      "RISC-V ne possède pas de registre global d’indicateurs arithmétiques.",
      "RISC-V has no global arithmetic condition-code register.",
    ),
    "ADDI x1, x0, 7",
    "x1 = 7",
    bi(
      "Immédiat entre −2048 et 2047. Écrire x0 est sans effet.",
      "Immediate range: −2048 to 2047. Writes to x0 are discarded.",
    ),
  ),
  ins(
    "ADD",
    "math",
    bi("Additionner", "Add"),
    "ADD x3, x1, x2",
    "rd ← rs1 + rs2",
    bi(
      "Additionne deux registres sans exception sur débordement entier. Les bits au-delà de XLEN sont perdus.",
      "Adds two registers without an integer overflow exception. Bits beyond XLEN are discarded.",
    ),
    noFlags,
    "ADDI x1, x0, 7\nADDI x2, x0, 5\nADD x3, x1, x2",
    "x3 = 12",
  ),
  ins(
    "SUB",
    "math",
    bi("Soustraire", "Subtract"),
    "SUB x3, x1, x2",
    "rd ← rs1 − rs2",
    bi(
      "Soustrait la deuxième source de la première. Pour soustraire une petite constante, utiliser ADDI avec un immédiat négatif.",
      "Subtracts the second source from the first. To subtract a small constant, use ADDI with a negative immediate.",
    ),
    noFlags,
    "ADDI x1, x0, 7\nADDI x2, x0, 5\nSUB x3, x1, x2",
    "x3 = 2",
  ),
  ins(
    "XOR",
    "logic",
    bi("Ou exclusif", "Exclusive OR"),
    "XOR x3, x1, x2",
    "rd ← rs1 ⊕ rs2",
    bi(
      "Calcule le ou exclusif de chaque paire de bits sources. XORI est la variante avec immédiat.",
      "Computes exclusive OR for every pair of source bits. XORI is the immediate variant.",
    ),
    noFlags,
    "ADDI x1, x0, 10\nADDI x2, x0, 6\nXOR x3, x1, x2",
    "x3 = 12",
  ),
  ins(
    "BNE",
    "flow",
    bi("Sauter si différents", "Branch if not equal"),
    "BNE x1, x0, loop",
    "PC ← target if rs1 ≠ rs2",
    bi(
      "Compare deux registres puis branche s’ils sont différents. Le test ne dépend pas d’une instruction précédente.",
      "Compares two registers and branches if they differ. The test does not depend on a previous instruction.",
    ),
    noFlags,
    "ADDI x1, x0, 2\nloop:\nADDI x1, x1, -1\nBNE x1, x0, loop",
    "x1 = 0",
    bi(
      "Le déplacement signé est multiple de 2 octets. Le laboratoire utilise des étiquettes.",
      "The signed offset is a multiple of two bytes. The lab uses labels.",
    ),
  ),
];
rvInstructions.forEach((i) => {
  i.flags = bi(
    "RISC-V ne possède pas de registre global d’indicateurs arithmétiques.",
    "RISC-V has no global arithmetic condition-code register.",
  );
});
const sparcInstructions = [
  ins(
    "ADD",
    "math",
    bi("Additionner", "Add"),
    "add %l0, %l1, %l2",
    "rd ← rs1 + operand",
    bi(
      "SPARC place la destination en dernier. Les registres locaux appartiennent à la fenêtre de registres courante.",
      "SPARC places the destination last. Local registers belong to the current register window.",
    ),
    bi(
      "ADD conserve les codes de condition ; ADDcc les actualise.",
      "ADD preserves condition codes; ADDcc updates them.",
    ),
    "mov 7, %l0\nmov 5, %l1\nadd %l0, %l1, %l2",
    "%l2 = 12",
  ),
  ins(
    "LD",
    "data",
    bi("Lire la mémoire", "Load memory"),
    "ld [%l0], %l1",
    "rd ← memory[address]",
    bi(
      "Charge un mot de 32 bits depuis une adresse alignée sur 4 octets. Le registre source désigne une adresse, pas la donnée.",
      "Loads a 32-bit word from a four-byte-aligned address. The source register identifies an address, not the data.",
    ),
    noFlags,
    "! memory[0x100] = 42\nmov 0x100, %l0\nld [%l0], %l1",
    "%l1 = 42",
  ),
  ins(
    "SAVE",
    "flow",
    bi("Changer de fenêtre", "Change register window"),
    "save %sp, -96, %sp",
    "new_window.rd ← old_window.rs1 + operand",
    bi(
      "Effectue une addition tout en changeant de fenêtre. Les registres de sortie de l’appelant deviennent les registres d’entrée de l’appelé.",
      "Adds while changing register windows. Caller output registers become callee input registers.",
    ),
    noFlags,
    "save %sp, -96, %sp",
    "%o0 (caller) → %i0 (callee)",
    bi(
      "Une fenêtre indisponible peut provoquer un trap de débordement. Cette instruction ne réalise pas elle-même l’appel.",
      "An unavailable window can cause a window-overflow trap. This instruction does not itself perform a call.",
    ),
  ),
];
export const architectures: Architecture[] = [
  {
    id: "amd64",
    name: "AMD64",
    subtitle: "x86-64 · Intel 64",
    bits: 64,
    family: "CISC",
    year: "2003",
    color: "#8973fa",
    registers: "16 × 64",
    use: bi("Ordinateurs & serveurs", "Desktops & servers"),
    description: bi(
      "L’architecture au cœur de vos ordinateurs. Une histoire de compatibilité, une puissance moderne.",
      "The architecture inside your computer. A legacy of compatibility, built for modern computing.",
    ),
    detail: bi(
      "Extension 64 bits de x86 conçue par AMD. 16 registres généraux RAX–R15, RIP pour le compteur ordinal et RFLAGS pour les indicateurs. Les cœurs modernes décodent généralement les instructions en micro-opérations : une ISA ne décrit pas le pipeline physique.",
      "AMD’s 64-bit extension to x86. Sixteen general registers RAX–R15, RIP as program counter and RFLAGS for flags. Modern cores generally decode instructions into micro-operations: an ISA does not specify the physical pipeline.",
    ),
    source: intel,
    instructions: x86("RAX", "RBX"),
  },
  {
    id: "arm64",
    name: "ARM64",
    subtitle: "AArch64 · A64",
    bits: 64,
    family: "RISC",
    year: "2011",
    color: "#39b7b0",
    registers: "31 × 64",
    use: bi("Mobile & Apple Silicon", "Mobile & Apple Silicon"),
    description: bi(
      "Des smartphones aux centres de données. Explorez une architecture à instructions de taille fixe.",
      "From smartphones to data centers. Explore an architecture with fixed-width instructions.",
    ),
    detail: bi(
      "A64 utilise des instructions de 32 bits. X0–X30 sont les registres généraux ; W0–W30 en sont les vues 32 bits. SP est le pointeur de pile. Selon l’encodage, le numéro 31 désigne SP ou le registre zéro. NZCV contient les codes de condition.",
      "A64 uses 32-bit instructions. X0–X30 are general registers; W0–W30 are their 32-bit views. SP is the stack pointer. Depending on the encoding, register number 31 denotes SP or the zero register. NZCV contains condition codes.",
    ),
    source: arm,
    instructions: armInstructions,
  },
  {
    id: "riscv",
    name: "RISC-V",
    subtitle: "RV32I · RV64I",
    bits: 64,
    family: "RISC",
    year: "2010",
    color: "#ebaa4b",
    registers: "32 × XLEN",
    use: bi("Recherche & systèmes embarqués", "Research & embedded systems"),
    description: bi(
      "Une ISA ouverte et modulaire. Un excellent point de départ pour comprendre l’assembleur.",
      "An open, modular ISA. A great starting point for understanding assembly.",
    ),
    detail: bi(
      "La base entière utilise x0–x31 ; x0 est toujours nul. XLEN vaut 32 ou 64 suivant la variante. Pas d’indicateurs globaux : les branchements comparent leurs opérandes. Les extensions M, A, F, D et C ajoutent notamment multiplication, atomiques, flottants et instructions compressées.",
      "The integer base uses x0–x31; x0 is always zero. XLEN is 32 or 64 depending on the variant. There are no global flags: branches compare their operands. M, A, F, D and C extensions add multiplication, atomics, floating point and compressed instructions.",
    ),
    source: rv,
    instructions: rvInstructions,
  },
  {
    id: "x86",
    name: "x86",
    subtitle: "IA-32 · i386",
    bits: 32,
    family: "CISC",
    year: "1985",
    color: "#679bef",
    registers: "8 × 32",
    use: bi("PC historiques & compatibilité", "Legacy PCs & compatibility"),
    description: bi(
      "Découvrez les fondations du PC : registres partagés, indicateurs et instructions de taille variable.",
      "Discover the foundations of the PC: shared registers, flags and variable-length instructions.",
    ),
    detail: bi(
      "Cette fiche couvre IA-32, l’évolution 32 bits de la famille x86 née en 1978. EAX, EBX, ECX, EDX, ESI, EDI, EBP et ESP sont les huit registres généraux. AX et AL sont des vues partielles de EAX ; EIP suit l’exécution.",
      "This profile covers IA-32, the 32-bit evolution of the x86 family introduced in 1978. EAX, EBX, ECX, EDX, ESI, EDI, EBP and ESP are the eight general registers. AX and AL are partial views of EAX; EIP tracks execution.",
    ),
    source: intel,
    instructions: x86("EAX", "EBX"),
  },
  {
    id: "sparc",
    name: "SPARC",
    subtitle: "SPARC V8",
    bits: 32,
    family: "RISC",
    year: "1990",
    color: "#ed809b",
    registers: "32 visible",
    use: bi("Stations de travail & serveurs", "Workstations & servers"),
    description: bi(
      "Une autre approche des appels de fonction : les fenêtres de registres.",
      "A different approach to function calls: register windows.",
    ),
    detail: bi(
      "SPARC V8 expose 8 registres globaux, 8 d’entrée, 8 locaux et 8 de sortie. %g0 vaut zéro. SAVE et RESTORE changent de fenêtre. Les branchements ont un delay slot ; V9 est l’évolution 64 bits, non couverte par cette fiche.",
      "SPARC V8 exposes eight global, eight input, eight local and eight output registers. %g0 is zero. SAVE and RESTORE change windows. Branches have a delay slot; V9 is the 64-bit evolution, outside this profile.",
    ),
    source: "https://www.gaisler.com/doc/sparcv8.pdf",
    instructions: sparcInstructions,
  },
  {
    id: "leon",
    name: "LEON",
    subtitle: "LEON3 · SPARC V8",
    bits: 32,
    family: "RISC",
    year: "2004",
    color: "#a185ec",
    registers: "32 visible",
    use: bi("Spatial & systèmes critiques", "Space & critical systems"),
    description: bi(
      "L’architecture SPARC prend son envol. Découvrez une implémentation conçue pour l’embarqué.",
      "SPARC takes flight. Discover an implementation designed for embedded systems.",
    ),
    detail: bi(
      "LEON3 est un cœur processeur implémentant SPARC V8, pas une ISA indépendante. Son pipeline à sept étages et ses caches relèvent de la microarchitecture. Les variantes FT ajoutent des mécanismes de tolérance aux fautes.",
      "LEON3 is a processor core implementing SPARC V8, not an independent ISA. Its seven-stage pipeline and caches are microarchitectural features. FT variants add fault-tolerance mechanisms.",
    ),
    source: "https://www.gaisler.com/products/leon3",
    instructions: sparcInstructions,
  },
  {
    id: "power",
    name: "Power ISA",
    subtitle: "PowerPC · POWER",
    bits: 64,
    family: "RISC",
    year: "2006",
    color: "#52b997",
    registers: "32 × 64",
    use: bi(
      "Serveurs & calcul intensif",
      "Servers & high-performance computing",
    ),
    description: bi(
      "Registres de condition, calcul intensif et longue histoire de systèmes puissants.",
      "Condition registers, high-performance computing and a long history of powerful systems.",
    ),
    detail: bi(
      "Power ISA réunit l’héritage POWER et PowerPC. La variante 64 bits possède 32 GPR, un registre de lien LR, un compteur CTR et un registre de condition CR divisé en huit champs. La disponibilité des extensions dépend du processeur.",
      "Power ISA unifies the POWER and PowerPC heritage. The 64-bit variant has 32 GPRs, a link register LR, a count register CTR and a condition register CR divided into eight fields. Extension availability depends on the processor.",
    ),
    source:
      "https://www.ibm.com/docs/en/aix/7.3.0?topic=reference-instruction-set",
    instructions: [
      ins(
        "ADD",
        "math",
        bi("Additionner", "Add"),
        "add r3, r4, r5",
        "r3 ← r4 + r5",
        bi(
          "Additionne deux registres. Le suffixe point permet d’enregistrer le signe et le résultat nul dans CR0.",
          "Adds two registers. The dot suffix records the sign and zero result in CR0.",
        ),
        bi(
          "add conserve CR ; add. met à jour CR0.",
          "add preserves CR; add. updates CR0.",
        ),
        "li r4, 7\nli r5, 5\nadd r3, r4, r5",
        "r3 = 12",
      ),
      ins(
        "BLR",
        "flow",
        bi("Revenir à l’appelant", "Return to caller"),
        "blr",
        "PC ← LR & ~3",
        bi(
          "Alias de branchement via le registre de lien. Un appel avec bl enregistre l’adresse de retour dans LR.",
          "Branch-through-link-register alias. A call using bl records the return address in LR.",
        ),
        noFlags,
        "blr",
        "PC ← LR",
        bi(
          "LR doit contenir une adresse de retour valide et être préservé lors des appels imbriqués.",
          "LR must hold a valid return address and be preserved across nested calls.",
        ),
      ),
    ],
  },
  {
    id: "avr",
    name: "AVR",
    subtitle: "8-bit · microcontrollers",
    bits: 8,
    family: "RISC",
    year: "1996",
    color: "#e28c51",
    registers: "32 × 8",
    use: bi("Microcontrôleurs & Arduino", "Microcontrollers & Arduino"),
    description: bi(
      "De petits registres pour de grandes idées. Comprenez les machines au plus près des bits.",
      "Small registers, big ideas. Understand machines one bit at a time.",
    ),
    detail: bi(
      "AVR possède 32 registres de 8 bits. Les paires R27:R26, R29:R28 et R31:R30 forment les pointeurs X, Y et Z. La mémoire de programme et celle des données sont séparées. Le registre SREG contient les indicateurs.",
      "AVR has 32 eight-bit registers. R27:R26, R29:R28 and R31:R30 form X, Y and Z pointers. Program and data memory are separate. SREG holds flags.",
    ),
    source:
      "https://ww1.microchip.com/downloads/en/DeviceDoc/AVR-InstructionSet-Manual-DS40002198.pdf",
    instructions: [
      ins(
        "LDI",
        "data",
        bi("Charger un immédiat", "Load an immediate"),
        "LDI R16, 7",
        "Rd ← K",
        bi(
          "Charge une constante de 8 bits dans un registre parmi R16–R31. R0–R15 ne sont pas des destinations valides.",
          "Loads an eight-bit constant into R16–R31. R0–R15 are not valid destinations.",
        ),
        noFlags,
        "LDI R16, 7",
        "R16 = 7",
      ),
      ins(
        "ADD",
        "math",
        bi("Additionner sur 8 bits", "Add eight-bit values"),
        "ADD R16, R17",
        "Rd ← (Rd + Rr) mod 256",
        bi(
          "Additionne deux octets. Une somme supérieure à 255 produit une retenue ; ADC permet de la propager dans un calcul multi-octets.",
          "Adds two bytes. A sum greater than 255 produces a carry; ADC propagates it for multi-byte calculations.",
        ),
        bi(
          "H, S, V, N, Z et C sont mis à jour.",
          "Updates H, S, V, N, Z and C.",
        ),
        "LDI R16, 250\nLDI R17, 10\nADD R16, R17",
        "R16 = 4 · C = 1",
      ),
    ],
  },
];
export const categories = {
  data: bi("Transfert", "Data transfer"),
  math: bi("Arithmétique", "Arithmetic"),
  logic: bi("Logique", "Logic"),
  flow: bi("Contrôle", "Control flow"),
};
