import type { Lang } from "./data";
import type { ReferenceEntry, ReferenceForm } from "./catalog";

export type InstructionClass =
  | "control"
  | "memory"
  | "arithmetic"
  | "logical"
  | "shift"
  | "compare"
  | "atomic"
  | "system"
  | "floating"
  | "vector"
  | "conversion"
  | "data"
  | "other";

type Localized = { fr: string; en: string };
type Guide = {
  kind: InstructionClass;
  label: Localized;
  summary: Localized;
  operation: Localized;
  destination: Localized;
  purpose: Localized;
  example: Localized;
  specific: boolean;
};

const guides: Record<InstructionClass, Omit<Guide, "kind" | "purpose" | "example" | "specific">> = {
  control: {
    label: { fr: "Contrôle du flot", en: "Control flow" },
    summary: { fr: "Modifie potentiellement la prochaine instruction exécutée : branchement, saut, appel ou retour.", en: "May change which instruction executes next: branch, jump, call, or return." },
    operation: { fr: "Évalue la condition ou calcule la cible", en: "Evaluate the condition or compute the target" },
    destination: { fr: "Met à jour le compteur ordinal et parfois un registre de lien", en: "Update the program counter and sometimes a link register" },
  },
  memory: {
    label: { fr: "Accès mémoire", en: "Memory access" },
    summary: { fr: "Transfère une donnée entre registres et mémoire. L’adresse effective, l’alignement et les droits d’accès font partie du comportement.", en: "Transfers data between registers and memory. Effective address, alignment, and access permissions are part of the behavior." },
    operation: { fr: "Calcule l’adresse puis lit ou écrit la mémoire", en: "Compute the address, then read or write memory" },
    destination: { fr: "Écrit un registre ou une zone mémoire", en: "Write a register or memory location" },
  },
  arithmetic: {
    label: { fr: "Arithmétique", en: "Arithmetic" },
    summary: { fr: "Effectue un calcul numérique sur des registres, des constantes ou des éléments vectoriels.", en: "Performs a numeric calculation on registers, constants, or vector elements." },
    operation: { fr: "Applique l’opération arithmétique avec la largeur indiquée", en: "Apply the arithmetic operation at the stated width" },
    destination: { fr: "Écrit le résultat et, selon la forme, les indicateurs", en: "Write the result and, depending on the form, flags" },
  },
  logical: {
    label: { fr: "Logique bit à bit", en: "Bitwise logic" },
    summary: { fr: "Combine ou transforme les bits indépendamment, notamment pour les masques et champs de bits.", en: "Combines or transforms individual bits, commonly for masks and bit fields." },
    operation: { fr: "Applique la fonction booléenne bit par bit", en: "Apply the Boolean function bit by bit" },
    destination: { fr: "Écrit le motif binaire obtenu", en: "Write the resulting bit pattern" },
  },
  shift: {
    label: { fr: "Décalage ou rotation", en: "Shift or rotate" },
    summary: { fr: "Déplace les bits d’une valeur. Le sens, le remplissage et la largeur déterminent les bits conservés.", en: "Moves bits within a value. Direction, fill behavior, and width determine which bits survive." },
    operation: { fr: "Décale ou fait tourner les bits du premier opérande", en: "Shift or rotate the bits of the first operand" },
    destination: { fr: "Écrit la valeur transformée et parfois les retenues", en: "Write the transformed value and sometimes carry information" },
  },
  compare: {
    label: { fr: "Comparaison et test", en: "Compare and test" },
    summary: { fr: "Compare des valeurs ou teste des bits afin de produire des indicateurs, un prédicat ou un résultat booléen.", en: "Compares values or tests bits to produce flags, a predicate, or a Boolean result." },
    operation: { fr: "Calcule la relation sans nécessairement conserver le résultat intermédiaire", en: "Evaluate the relation without necessarily retaining the intermediate result" },
    destination: { fr: "Met à jour les indicateurs, un prédicat ou un registre résultat", en: "Update flags, a predicate, or a result register" },
  },
  atomic: {
    label: { fr: "Synchronisation atomique", en: "Atomic synchronization" },
    summary: { fr: "Combine un accès mémoire et une opération indivisible vis-à-vis des autres agents du système.", en: "Combines a memory access and an operation that is indivisible to other system agents." },
    operation: { fr: "Lit, modifie et/ou compare avec les garanties d’ordre définies", en: "Read, modify, and/or compare with the defined ordering guarantees" },
    destination: { fr: "Écrit la mémoire et souvent l’ancienne valeur ou un statut", en: "Write memory and often the previous value or a status" },
  },
  system: {
    label: { fr: "Système et privilèges", en: "System and privilege" },
    summary: { fr: "Agit sur l’état du processeur, les barrières, exceptions ou registres de contrôle. Son contexte d’exécution est déterminant.", en: "Acts on processor state, barriers, exceptions, or control registers. Execution context is essential." },
    operation: { fr: "Consulte ou modifie l’état architectural du système", en: "Inspect or modify architectural system state" },
    destination: { fr: "Produit un effet système, une exception ou une mise à jour de contrôle", en: "Produce a system effect, exception, or control-state update" },
  },
  floating: {
    label: { fr: "Virgule flottante", en: "Floating point" },
    summary: { fr: "Traite des valeurs flottantes selon un format et un mode d’arrondi définis par la forme.", en: "Processes floating-point values using the format and rounding mode defined by the form." },
    operation: { fr: "Applique l’opération flottante et les règles d’arrondi", en: "Apply the floating-point operation and rounding rules" },
    destination: { fr: "Écrit le résultat et peut signaler des exceptions flottantes", en: "Write the result and may report floating-point exceptions" },
  },
  vector: {
    label: { fr: "SIMD ou vectoriel", en: "SIMD or vector" },
    summary: { fr: "Applique une opération à plusieurs éléments, éventuellement sous le contrôle d’un masque ou prédicat.", en: "Applies an operation to multiple elements, optionally controlled by a mask or predicate." },
    operation: { fr: "Traite les voies actives selon leur type et leur largeur", en: "Process active lanes according to their type and width" },
    destination: { fr: "Écrit les voies destination et gère les voies inactives selon la forme", en: "Write destination lanes and handle inactive lanes as defined by the form" },
  },
  conversion: {
    label: { fr: "Conversion de représentation", en: "Representation conversion" },
    summary: { fr: "Convertit une valeur entre largeurs, types ou représentations, avec extension, troncature ou arrondi éventuel.", en: "Converts a value between widths, types, or representations, possibly extending, truncating, or rounding it." },
    operation: { fr: "Convertit la source selon les types indiqués", en: "Convert the source according to the stated types" },
    destination: { fr: "Écrit la valeur dans sa nouvelle représentation", en: "Write the value in its new representation" },
  },
  data: {
    label: { fr: "Transfert de données", en: "Data transfer" },
    summary: { fr: "Copie, insère, extrait ou réorganise des données entre emplacements architecturaux.", en: "Copies, inserts, extracts, or rearranges data between architectural locations." },
    operation: { fr: "Sélectionne et transporte les bits demandés", en: "Select and transfer the requested bits" },
    destination: { fr: "Écrit la destination sans modifier la source explicite", en: "Write the destination without modifying the explicit source" },
  },
  other: {
    label: { fr: "Opération spécialisée", en: "Specialized operation" },
    summary: { fr: "Le mnémonique appartient à une fonction spécialisée dont la sémantique exacte dépend de la forme et de l’extension indiquées.", en: "The mnemonic belongs to a specialized function whose exact semantics depend on the listed form and extension." },
    operation: { fr: "Exécute l’opération définie par la forme sélectionnée", en: "Execute the operation defined by the selected form" },
    destination: { fr: "Applique les effets architecturaux décrits dans la source", en: "Apply the architectural effects described by the source" },
  },
};

export function classifyInstruction(entry: ReferenceEntry): InstructionClass {
  const name = entry.name.toUpperCase();
  const metadata = `${entry.families.join(" ")} ${entry.forms.map((f) => `${f.classification ?? ""} ${f.features?.join(" ") ?? ""}`).join(" ")}`.toUpperCase();
  if (/^(AMO|CAS|CMPXCHG|LOCK|LL|LR\.|SC\.|SWP|LDADD|LDCLR|LDEOR|LDSET)/.test(name) || /ATOMIC/.test(metadata)) return "atomic";
  if (/^(SYS|CSR|MSR|MRS|FENCE|ECALL|EBREAK|WFI|TLB|INVL|HLT|SLEEP|ERET|RETT|TRAP|SVC)/.test(name) || /SYSTEM|PRIV/.test(metadata)) return "system";
  if (/^(CALL|RET|J[A-Z]|B(?:\.|EQ|NE|LT|LE|GT|GE|R|L$)|CBZ|CBNZ|TBZ|TBNZ)/.test(name) || /BRANCH|COND_BR/.test(metadata)) return "control";
  if (/^(LD|ST|LOAD|STORE|PUSH|POP|LDR|STR|LDS|STS|LPM|SPM)/.test(name) || /GATHER|SCATTER/.test(name)) return "memory";
  if (/^(SH|SL|SR|LSL|LSR|ASR|ROL|ROR|RCL|RCR)/.test(name)) return "shift";
  if (/^(CMP|CMN|TEST|TST|SLT|SEQ|SNE)/.test(name) || /COMPARE/.test(metadata)) return "compare";
  if (/^(AND|OR|XOR|EOR|NOT|BIC|ORN|XNOR)/.test(name) || /LOGICAL/.test(metadata)) return "logical";
  if (/^(CVT|FCVT|SCVTF|UCVTF|XTN|SXTB|SXTH|SXTW|UXTB|UXTH|UXTW)/.test(name) || /CONVERT/.test(metadata)) return "conversion";
  if (/^(FADD|FSUB|FMUL|FDIV|FSQRT|FABS|FNEG|FMA|FNM)/.test(name) || /X87|FLOAT/.test(metadata)) return "floating";
  if (/SIMD|SVE|SME|AVX|SSE|VECTOR/.test(metadata) || /^(V|PTRUE|PFALSE|WHILE)/.test(name)) return "vector";
  if (/^(ADD|ADC|SUB|SBC|MUL|DIV|INC|DEC|NEG|ABS|MAC|MADD|MSUB)/.test(name) || /ARITH/.test(metadata)) return "arithmetic";
  if (/^(MOV|MV|LI|LEA|COPY|INS|EXT|PACK|UNPACK|ZIP|UZP|REV|SWAP)/.test(name) || /DATAXFER/.test(metadata)) return "data";
  return "other";
}

type SemanticRule = {
  matches: (name: string, kind: InstructionClass) => boolean;
  purpose: Localized;
  example: Localized;
};

const semanticRules: SemanticRule[] = [
  { matches: (n) => /^(NOP|HINT)$/.test(n), purpose: { fr: "N’effectue aucun calcul visible ; elle réserve un emplacement d’instruction ou transmet une indication facultative au processeur.", en: "Performs no visible computation; it reserves an instruction slot or provides an optional hint to the processor." }, example: { fr: "On l’utilise pour aligner une cible de branchement ou laisser une place qui pourra être remplacée lors d’un correctif.", en: "Use it to align a branch target or leave a slot that can be replaced by a later patch." } },
  { matches: (n) => /^(ADC|ADCX|ADCS|ADDE|ADDI|ADDIS)$/.test(n), purpose: { fr: "Additionne les opérandes en intégrant une retenue ou une constante selon la variante ; la retenue permet d’enchaîner des mots de machine.", en: "Adds the operands while including a carry or immediate value, depending on the variant; carry allows multiword arithmetic." }, example: { fr: "Pour additionner deux entiers de 128 bits sur une machine 64 bits, ADD traite les 64 bits faibles puis cette instruction propage la retenue aux 64 bits forts.", en: "To add two 128-bit integers on a 64-bit machine, ADD handles the low halves and this instruction propagates carry into the high halves." } },
  { matches: (n, kind) => n.includes("ADD") && kind !== "atomic" && !/(?:FMADD|FNMADD|MADD|FMA)/.test(n), purpose: { fr: "Additionne les valeurs sources et place la somme dans la destination indiquée par la forme.", en: "Adds the source values and places the sum in the destination specified by the form." }, example: { fr: "Avec 12 et 5 en entrée, le résultat arithmétique est 17. Cette opération sert aux compteurs, indices, adresses et sommes partielles.", en: "With inputs 12 and 5, the arithmetic result is 17. This is used for counters, indexes, addresses, and partial sums." } },
  { matches: (n) => /^(SBC|SBB|SUBC)/.test(n), purpose: { fr: "Soustrait la source et la retenue d’emprunt, ce qui propage une soustraction sur plusieurs mots.", en: "Subtracts the source and borrow carry, propagating a subtraction across multiple words." }, example: { fr: "Dans une soustraction 128 bits, une retenue produite par les 64 bits faibles est retranchée avec les 64 bits forts.", en: "In a 128-bit subtraction, a borrow produced by the low 64 bits is subtracted from the high 64 bits." } },
  { matches: (n) => n.includes("SUB"), purpose: { fr: "Soustrait une valeur source d’une autre et écrit la différence dans la destination.", en: "Subtracts one source value from another and writes the difference to the destination." }, example: { fr: "20 − 7 donne 13. Une boucle utilise souvent cette opération pour décrémenter son compteur jusqu’à zéro.", en: "20 − 7 produces 13. Loops commonly use this operation to decrement a counter toward zero." } },
  { matches: (n) => /(?:FMADD|FNMADD|MADD|FMA)/.test(n), purpose: { fr: "Multiplie deux valeurs puis additionne une troisième, souvent avec un seul arrondi pour les variantes flottantes.", en: "Multiplies two values and adds a third, often with a single rounding step for floating-point variants." }, example: { fr: "Pour a × b + c avec 3, 4 et 2, le résultat est 14. C’est une brique centrale des produits scalaires et filtres numériques.", en: "For a × b + c with 3, 4, and 2, the result is 14. It is a core building block for dot products and digital filters." } },
  { matches: (n) => n.includes("MUL"), purpose: { fr: "Multiplie les opérandes ; la variante précise le signe, la largeur et la partie du produit conservée.", en: "Multiplies the operands; the variant specifies signedness, width, and which part of the product is retained." }, example: { fr: "6 × 7 donne 42. Les compilateurs l’emploient pour les dimensions, offsets de tableaux et calculs scientifiques.", en: "6 × 7 produces 42. Compilers use it for dimensions, array offsets, and scientific calculations." } },
  { matches: (n) => n.includes("DIV"), purpose: { fr: "Divise un dividende par un diviseur ; certaines formes produisent aussi un reste ou appliquent une règle d’arrondi.", en: "Divides a dividend by a divisor; some forms also produce a remainder or apply a rounding rule." }, example: { fr: "17 divisé par 5 donne un quotient entier de 3 et un reste de 2. Le manuel précise le comportement pour zéro et les débordements.", en: "17 divided by 5 gives integer quotient 3 and remainder 2. The manual defines zero-divisor and overflow behavior." } },
  { matches: (n) => /^(NEG|FNEG)/.test(n), purpose: { fr: "Change le signe de la valeur source selon sa représentation numérique.", en: "Changes the sign of the source value according to its numeric representation." }, example: { fr: "Appliquée à 7, elle produit −7. Elle sert notamment à inverser un déplacement ou une direction.", en: "Applied to 7, it produces −7. It is commonly used to reverse an offset or direction." } },
  { matches: (n) => /^(ABS|FABS)/.test(n), purpose: { fr: "Produit la valeur absolue en supprimant l’effet du signe.", en: "Produces the absolute value by removing the effect of the sign." }, example: { fr: "−12 devient 12, utile pour calculer une distance ou l’amplitude d’une erreur.", en: "−12 becomes 12, useful when computing a distance or error magnitude." } },
  { matches: (n) => /^(AND|BIC)/.test(n), purpose: { fr: "Effectue un ET bit à bit. Il conserve uniquement les bits présents dans les deux opérandes ; BIC utilise un masque inversé.", en: "Performs bitwise AND. It retains only bits present in both operands; BIC uses an inverted mask." }, example: { fr: "0b10110100 AND 0b00001111 donne 0b00000100 : le masque isole ici les quatre bits faibles.", en: "0b10110100 AND 0b00001111 gives 0b00000100: the mask isolates the low four bits." } },
  { matches: (n) => /^(OR|ORR)/.test(n), purpose: { fr: "Effectue un OU bit à bit et force à 1 tous les bits présents dans au moins une source.", en: "Performs bitwise OR and sets every bit present in at least one source." }, example: { fr: "0b0100 OR 0b0011 donne 0b0111. On l’utilise pour activer des options dans un registre de configuration.", en: "0b0100 OR 0b0011 gives 0b0111. Use it to enable options in a configuration register." } },
  { matches: (n) => /^(XOR|EOR|XORI)/.test(n), purpose: { fr: "Effectue un OU exclusif bit à bit : un bit vaut 1 lorsque les deux sources diffèrent.", en: "Performs bitwise exclusive OR: a bit is 1 when the two sources differ." }, example: { fr: "0b1100 XOR 0b1010 donne 0b0110. Un masque XOR permet de basculer certains bits ou de détecter des différences.", en: "0b1100 XOR 0b1010 gives 0b0110. An XOR mask can toggle selected bits or reveal differences." } },
  { matches: (n) => /^(NOT|MVN)/.test(n), purpose: { fr: "Inverse chaque bit de la source : les 0 deviennent 1 et les 1 deviennent 0.", en: "Inverts every source bit: zeros become ones and ones become zeros." }, example: { fr: "Sur 8 bits, NOT 0b11110000 produit 0b00001111, pratique pour construire le complément d’un masque.", en: "At 8 bits, NOT 0b11110000 produces 0b00001111, useful for building a mask complement." } },
  { matches: (n) => /^(SHL|SAL|LSL|SLL)/.test(n), purpose: { fr: "Décale les bits vers la gauche en introduisant des zéros à droite ; hors débordement, chaque position multiplie un entier par deux.", en: "Shifts bits left and inserts zeros on the right; absent overflow, each position multiplies an integer by two." }, example: { fr: "13 décalé de 2 bits à gauche donne 52 : 0b001101 devient 0b110100.", en: "13 shifted left by 2 bits gives 52: 0b001101 becomes 0b110100." } },
  { matches: (n) => /^(SHR|LSR|SRL)/.test(n), purpose: { fr: "Décale logiquement les bits vers la droite en introduisant des zéros à gauche ; chaque position divise un entier non signé par deux.", en: "Logically shifts bits right and inserts zeros on the left; each position divides an unsigned integer by two." }, example: { fr: "52 décalé de 2 bits à droite donne 13. Les bits sortants sont perdus ou copiés dans un indicateur selon l’ISA.", en: "52 shifted right by 2 bits gives 13. Shifted-out bits are lost or copied to a flag, depending on the ISA." } },
  { matches: (n) => /^(SAR|ASR|SRA)/.test(n), purpose: { fr: "Décale un entier signé vers la droite en recopiant le bit de signe.", en: "Shifts a signed integer right while replicating its sign bit." }, example: { fr: "Sur 8 bits, −8 (11111000) décalé de 1 donne −4 (11111100), contrairement au décalage logique.", en: "At 8 bits, −8 (11111000) shifted by 1 gives −4 (11111100), unlike a logical shift." } },
  { matches: (n) => /^(ROL|ROR|RCL|RCR)/.test(n), purpose: { fr: "Fait tourner les bits : ceux qui sortent d’un côté reviennent de l’autre, éventuellement via la retenue.", en: "Rotates bits: those leaving one side re-enter on the other, optionally through carry." }, example: { fr: "Sur 8 bits, une rotation gauche de 10000001 donne 00000011. Les rotations servent aux mélanges cryptographiques et tables de hachage.", en: "At 8 bits, rotating 10000001 left gives 00000011. Rotates are used in cryptographic mixing and hash functions." } },
  { matches: (n) => /^(CMP|CMN)/.test(n), purpose: { fr: "Compare deux valeurs en calculant une différence ou une somme uniquement pour mettre à jour l’état de condition.", en: "Compares two values by computing a difference or sum solely to update condition state." }, example: { fr: "Comparer un compteur à zéro prépare le branchement suivant sans modifier le compteur lui-même.", en: "Comparing a counter with zero prepares the following branch without changing the counter itself." } },
  { matches: (n) => /^(TEST|TST)/.test(n), purpose: { fr: "Teste des bits avec une opération logique sans conserver le résultat, afin de mettre à jour les conditions.", en: "Tests bits with a logical operation without retaining its result, in order to update conditions." }, example: { fr: "Tester value avec le masque 1 révèle si un entier est pair ou impair tout en conservant value.", en: "Testing value with mask 1 reveals whether an integer is even or odd while preserving value." } },
  { matches: (n) => /^(CLZ|LZCNT)/.test(n), purpose: { fr: "Compte les zéros précédant le premier bit à 1 dans la représentation binaire.", en: "Counts zeros before the first set bit in the binary representation." }, example: { fr: "Sur 8 bits, 00010100 contient trois zéros initiaux. Ce résultat aide à normaliser un nombre ou trouver son ordre de grandeur.", en: "At 8 bits, 00010100 has three leading zeros. This helps normalize a number or determine its magnitude." } },
  { matches: (n) => /^(CTZ|TZCNT)/.test(n), purpose: { fr: "Compte les zéros à partir du bit de poids faible jusqu’au premier bit à 1.", en: "Counts zeros from the least significant bit up to the first set bit." }, example: { fr: "0b101000 possède trois zéros finaux. Cela permet de localiser rapidement le premier bit actif.", en: "0b101000 has three trailing zeros. This quickly locates the first active bit." } },
  { matches: (n) => /^(POPCNT|CNT|CPOP)/.test(n), purpose: { fr: "Compte le nombre de bits à 1 dans une valeur, éventuellement voie par voie.", en: "Counts the number of set bits in a value, optionally per vector lane." }, example: { fr: "0b10110100 contient quatre bits à 1. Cette mesure sert aux bitsets, filtres et distances de Hamming.", en: "0b10110100 contains four set bits. This measure is used for bitsets, filters, and Hamming distance." } },
  { matches: (n) => /^(BSWAP|REV)/.test(n), purpose: { fr: "Réordonne les octets ou les bits d’un mot selon la variante.", en: "Reorders bytes or bits within a word according to the variant." }, example: { fr: "Inverser les octets de 0x12345678 produit 0x78563412, opération courante lors d’un changement d’endianness.", en: "Reversing bytes in 0x12345678 produces 0x78563412, a common endian-conversion operation." } },
  { matches: (n) => /^(MOV|MV|COPY|FMOV)/.test(n), purpose: { fr: "Copie une valeur vers la destination, parfois entre deux classes de registres ou avec une transformation de largeur.", en: "Copies a value to the destination, sometimes between register classes or with a width transformation." }, example: { fr: "Copier 42 d’un registre source vers un registre destination permet de conserver l’original avant un calcul destructif.", en: "Copying 42 from a source register to a destination preserves the original before a destructive calculation." } },
  { matches: (n, kind) => kind !== "atomic" && /^(LD|LDR|LOAD|LDS|LDD|LPM|POP)/.test(n), purpose: { fr: "Lit une valeur depuis la mémoire ou la pile et la place dans un registre destination.", en: "Reads a value from memory or the stack and places it in a destination register." }, example: { fr: "Pour parcourir un tableau, l’adresse base + index désigne un élément qui est chargé dans un registre avant calcul.", en: "When scanning an array, base address plus index selects an element loaded into a register before computation." } },
  { matches: (n) => /^(ST|STR|STORE|STS|STD|SPM|PUSH)/.test(n), purpose: { fr: "Écrit la valeur d’un registre vers la mémoire ou la pile à l’adresse calculée.", en: "Writes a register value to memory or the stack at the computed address." }, example: { fr: "Après avoir calculé un pixel ou un élément de tableau, cette instruction enregistre le résultat à son adresse de destination.", en: "After computing a pixel or array element, this instruction stores the result at its destination address." } },
  { matches: (n) => /^(CALL|BL$|JAL$|JALR$)/.test(n), purpose: { fr: "Appelle une routine en mémorisant une adresse de retour puis en transférant l’exécution vers la cible.", en: "Calls a routine by saving a return address and transferring execution to the target." }, example: { fr: "Un programme appelle parse_number, puis reprend à l’instruction suivante lorsque la routine exécute son retour.", en: "A program calls parse_number, then resumes at the following instruction when the routine returns." } },
  { matches: (n) => /^(RET|JRRA)/.test(n), purpose: { fr: "Revient de la routine courante en restaurant ou utilisant l’adresse de retour enregistrée.", en: "Returns from the current routine using or restoring the saved return address." }, example: { fr: "À la fin de parse_number, le retour rend le contrôle au code qui avait effectué l’appel.", en: "At the end of parse_number, return gives control back to the code that made the call." } },
  { matches: (_n, k) => k === "control", purpose: { fr: "Teste une condition ou calcule une cible puis choisit entre la suite séquentielle et une autre adresse de code.", en: "Tests a condition or computes a target, then chooses between sequential execution and another code address." }, example: { fr: "Dans une boucle, le branchement revient à loop tant que le compteur n’a pas atteint sa valeur de fin.", en: "In a loop, the branch returns to loop until the counter reaches its final value." } },
  { matches: (n) => /^(AES|SHA|SM3|SM4|CRC)/.test(n), purpose: { fr: "Accélère une primitive cryptographique ou un calcul de contrôle d’intégrité défini par l’extension.", en: "Accelerates a cryptographic primitive or integrity-check computation defined by the extension." }, example: { fr: "Une bibliothèque peut traiter une étape AES ou SHA en matériel plutôt qu’avec une longue suite d’opérations scalaires.", en: "A library can process an AES or SHA step in hardware instead of using a long sequence of scalar operations." } },
  { matches: (n) => /^(PTRUE|PFALSE)/.test(n), purpose: { fr: "Initialise un registre de prédicat pour activer ou désactiver des voies vectorielles selon le motif demandé.", en: "Initializes a predicate register to enable or disable vector lanes according to the requested pattern." }, example: { fr: "PTRUE peut activer toutes les voies 32 bits avant une addition SVE prédicatée sur l’ensemble du vecteur.", en: "PTRUE can enable all 32-bit lanes before an SVE addition predicated across the whole vector." } },
  { matches: (_n, k) => k === "atomic", purpose: { fr: "Réalise en une transaction indivisible une lecture, une modification ou une comparaison de mémoire partagée.", en: "Performs a shared-memory read, modification, or comparison as one indivisible transaction." }, example: { fr: "Deux threads peuvent incrémenter un compteur partagé sans perdre une mise à jour provoquée par leur exécution simultanée.", en: "Two threads can increment a shared counter without losing an update caused by concurrent execution." } },
  { matches: (n) => /^(FENCE|DMB|DSB|ISB|SYNC)/.test(n), purpose: { fr: "Impose un ordre ou un point de visibilité entre certains accès mémoire et effets du processeur.", en: "Imposes ordering or a visibility point between selected memory accesses and processor effects." }, example: { fr: "Un producteur publie d’abord les données puis une barrière avant de signaler au consommateur qu’elles sont prêtes.", en: "A producer publishes data, then uses a barrier before signaling to a consumer that it is ready." } },
  { matches: (_n, k) => k === "conversion", purpose: { fr: "Convertit la source vers le type ou la largeur indiquée par le mnémonique et la forme.", en: "Converts the source to the type or width specified by the mnemonic and form." }, example: { fr: "Une conversion peut transformer 42.75 en entier 42 ou étendre un octet signé avant une addition, selon la variante.", en: "A conversion may turn 42.75 into integer 42 or extend a signed byte before addition, depending on the variant." } },
  { matches: (_n, k) => k === "vector", purpose: { fr: "Applique l’opération portée par le mnémonique à plusieurs éléments en parallèle, avec le type et le masque de cette forme.", en: "Applies the mnemonic’s operation to multiple elements in parallel, using this form’s element type and mask." }, example: { fr: "Quatre valeurs 32 bits peuvent être traitées par une seule instruction pour accélérer pixels, signaux ou calcul matriciel.", en: "Four 32-bit values can be processed by one instruction to accelerate pixels, signals, or matrix calculations." } },
  { matches: (_n, k) => k === "floating", purpose: { fr: "Effectue l’opération numérique indiquée sur des valeurs flottantes avec les règles d’arrondi de l’architecture.", en: "Performs the indicated numeric operation on floating-point values using the architecture’s rounding rules." }, example: { fr: "Des coordonnées 1,5 et 2,25 peuvent être combinées pour produire 3,75 lors d’un calcul graphique ou scientifique.", en: "Coordinates 1.5 and 2.25 can be combined to produce 3.75 in graphics or scientific computation." } },
  { matches: (_n, k) => k === "system", purpose: { fr: "Contrôle un aspect de l’état système, des exceptions, de la synchronisation ou de l’exécution privilégiée.", en: "Controls an aspect of system state, exceptions, synchronization, or privileged execution." }, example: { fr: "Un noyau de système d’exploitation l’utilise lors d’un changement de contexte, d’une attente ou d’une mise à jour de contrôle matériel.", en: "An operating-system kernel uses it during a context switch, wait operation, or hardware-control update." } },
  { matches: (_n, k) => k === "data", purpose: guides.data.summary, example: { fr: "Un compilateur l’utilise pour placer une valeur dans le registre attendu par l’opération suivante ou réorganiser un paquet de données.", en: "A compiler uses it to place a value in the register expected by the next operation or rearrange packed data." } },
  { matches: (_n, k) => k === "memory", purpose: guides.memory.summary, example: { fr: "Une structure en mémoire est adressée depuis un registre de base, puis son champ est lu ou mis à jour par cette forme.", en: "A structure in memory is addressed from a base register, then its field is read or updated by this form." } },
  { matches: (_n, k) => k === "arithmetic", purpose: { fr: "Effectue le calcul arithmétique codé par le mnémonique ; ses suffixes déterminent la largeur, le signe et la partie du résultat conservée.", en: "Performs the arithmetic operation encoded by the mnemonic; suffixes determine width, signedness, and which result part is retained." }, example: { fr: "Cette famille sert à faire évoluer une quantité numérique : compteur, adresse, mesure ou résultat intermédiaire. Les opérandes de la forme indiquent où lire et écrire cette quantité.", en: "This family updates a numeric quantity such as a counter, address, measurement, or intermediate result. The form’s operands show where that quantity is read and written." } },
  { matches: (_n, k) => k === "logical", purpose: { fr: "Combine les motifs binaires des sources selon la fonction logique portée par le mnémonique.", en: "Combines source bit patterns using the Boolean function carried by the mnemonic." }, example: { fr: "Avec un registre de configuration, un masque permet de sélectionner, activer, désactiver ou inverser uniquement les bits concernés.", en: "For a configuration register, a mask selects, enables, disables, or toggles only the relevant bits." } },
  { matches: (_n, k) => k === "shift", purpose: { fr: "Déplace ou réinjecte les bits selon le sens et le mode indiqués par le mnémonique.", en: "Moves or recirculates bits according to the direction and mode encoded by the mnemonic." }, example: { fr: "Les décalages ajustent rapidement une puissance de deux, extraient un champ binaire ou alignent une valeur avant combinaison.", en: "Shifts quickly scale by a power of two, extract a bit field, or align a value before combining it." } },
  { matches: (_n, k) => k === "compare", purpose: guides.compare.summary, example: { fr: "Une comparaison entre un index et une limite alimente ensuite un branchement qui poursuit ou termine une boucle.", en: "Comparing an index with a limit feeds a branch that continues or terminates a loop." } },
];

export function instructionGuide(entry: ReferenceEntry): Guide {
  const kind = classifyInstruction(entry);
  const rule = semanticRules.find((candidate) => candidate.matches(entry.name.toUpperCase(), kind));
  return {
    kind,
    ...guides[kind],
    purpose: rule?.purpose ?? {
      fr: `${entry.name} réalise une opération spécialisée de la famille ${entry.families.join(", ")}. Les suffixes du mnémonique précisent généralement le type, la largeur ou le mode.`,
      en: `${entry.name} performs a specialized operation from the ${entry.families.join(", ")} family. Mnemonic suffixes generally specify type, width, or mode.`,
    },
    example: rule?.example ?? {
      fr: `Un logiciel ciblant l’extension ${entry.families[0]} emploie ${entry.name} lorsque cette opération spécialisée évite une séquence d’instructions plus longue. La forme ci-dessous montre les opérandes à fournir.`,
      en: `Software targeting the ${entry.families[0]} extension uses ${entry.name} when this specialized operation replaces a longer instruction sequence. The form below shows the required operands.`,
    },
    specific: Boolean(rule),
  };
}

export function concreteSyntax(form: ReferenceForm): string | undefined {
  if (!form.syntax) return undefined;
  let syntax = form.syntax;
  const replacements: [RegExp, string][] = [
    [/<(?:X|W)d>/gi, (syntax.includes("<Wd>") ? "W0" : "X0")],
    [/<(?:X|W)n>/gi, (syntax.includes("<Wn>") ? "W1" : "X1")],
    [/<(?:X|W)m>/gi, (syntax.includes("<Wm>") ? "W2" : "X2")],
    [/<P(?:N)?d>/gi, "P0"], [/<P(?:N)?g>/gi, "P1"], [/<Zda?>/gi, "Z0"],
    [/<Zn>/gi, "Z1"], [/<Zm>/gi, "Z2"], [/<T>/g, "S"],
    [/<pattern>/gi, "ALL"], [/<label>/gi, "loop"], [/<cond>/gi, "EQ"],
    [/<imm[^>]*>/gi, "#4"], [/<amount>/gi, "#2"], [/<shift>/gi, "LSL"],
    [/\bRd\b/g, "R16"], [/\bRr\b/g, "R17"], [/\bq\b/g, "4"],
    [/\bK\b/g, "5"], [/\bk\b/g, "8"], [/\bb\b/g, "2"], [/\bA\b/g, "3"],
    [/%rs1/g, "%l0"], [/%rs2/g, "%l1"], [/%rd/g, "%l2"],
  ];
  for (const [pattern, replacement] of replacements) syntax = syntax.replace(pattern, replacement);
  syntax = syntax.replace(/\{,\s*([^}]+)\}/g, ", $1").replace(/\s+/g, " ").trim();
  return syntax === form.syntax || /<[^>]+>/.test(syntax) ? undefined : syntax;
}

export type OperandDoc = { token: string; access: string; meaning: Localized };

function operandMeaning(token: string): Localized {
  const upper = token.toUpperCase();
  if (/^(MEM|\[)/.test(upper) || /\[[^\]]+\]/.test(token)) return { fr: "Mémoire ou expression d’adresse", en: "Memory or address expression" };
  if (/^(IMM|#|-?\d|0X)/.test(upper)) return { fr: "Valeur immédiate encodée dans l’instruction", en: "Immediate value encoded in the instruction" };
  if (/^(RELBR|LABEL|TARGET|OFFSET|K$)/.test(upper)) return { fr: "Cible ou déplacement du contrôle", en: "Control-flow target or displacement" };
  if (/^(P|PN)/.test(upper)) return { fr: "Registre de prédicat ou masque", en: "Predicate or mask register" };
  if (/^(Z|V|XMM|YMM|ZMM)/.test(upper)) return { fr: "Registre vectoriel", en: "Vector register" };
  if (/^(REG|R[0-9A-Z]|X\d|W\d|RS|RD|RA|RB|RT)/.test(upper)) return { fr: "Registre processeur", en: "Processor register" };
  return { fr: "Opérande défini par cette forme", en: "Operand defined by this form" };
}

export function extractOperands(form: ReferenceForm): OperandDoc[] {
  if (form.operands) {
    const result: OperandDoc[] = [];
    for (const raw of form.operands.trim().split(/\s+/)) {
      const match = raw.match(/^([^:=]+)(?:=[^:]+)?(?::(rw|r|w|crw|cw))?/i);
      if (!match) continue;
      const token = match[1];
      const accessCode = match[2]?.toLowerCase() ?? "";
      const access = accessCode.includes("r") && accessCode.includes("w") ? "R/W" : accessCode.includes("w") ? "W" : accessCode.includes("r") ? "R" : "—";
      result.push({ token, access, meaning: operandMeaning(token) });
    }
    return result;
  }
  if (!form.syntax) return [];
  const body = form.syntax.trim().replace(/^\S+\s*/, "");
  if (!body || body === form.syntax.trim()) return [];
  return body.split(/,(?![^{}]*})/).map((token) => token.trim()).filter(Boolean).map((token) => ({ token, access: "—", meaning: operandMeaning(token) }));
}

export function flagDetails(flags: string): { name: string; action: Localized }[] {
  const actions: Record<string, Localized> = {
    MOD: { fr: "modifié selon le résultat", en: "modified from the result" },
    TST: { fr: "lu comme entrée", en: "read as an input" },
    "0": { fr: "effacé à 0", en: "cleared to 0" },
    "1": { fr: "forcé à 1", en: "forced to 1" },
    U: { fr: "valeur indéfinie", en: "undefined value" },
  };
  const seen = new Set<string>();
  const result: { name: string; action: Localized }[] = [];
  for (const match of flags.toUpperCase().matchAll(/\b([A-Z]{1,4})-(MOD|TST|0|1|U)\b/g)) {
    const key = `${match[1]}-${match[2]}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ name: match[1], action: actions[match[2]] });
    }
  }
  return result;
}

export const localize = (value: Localized, lang: Lang) => value[lang];
