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
};

const guides: Record<InstructionClass, Omit<Guide, "kind">> = {
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

export function instructionGuide(entry: ReferenceEntry): Guide {
  const kind = classifyInstruction(entry);
  return { kind, ...guides[kind] };
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
