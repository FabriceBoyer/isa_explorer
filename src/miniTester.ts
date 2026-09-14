import type { ReferenceEntry } from "./catalog";
import { classifyInstruction } from "./instructionDocs";

export type TesterWidth = 8 | 16 | 32 | 64;
export type TesterResult = {
  value: bigint;
  formula: { fr: string; en: string };
  detail: { fr: string; en: string };
  exact: boolean;
  flags: { zero: boolean; negative: boolean; carry: boolean };
};

const wraps = (value: bigint, width: TesterWidth) => BigInt.asUintN(width, value);

export function executeMiniTest(
  entry: ReferenceEntry,
  left: bigint,
  right: bigint,
  width: TesterWidth,
): TesterResult {
  const name = entry.name.toUpperCase();
  const kind = classifyInstruction(entry);
  const mask = (1n << BigInt(width)) - 1n;
  const a = left & mask;
  const b = right & mask;
  let raw = a;
  let exact = true;
  let formula = `${entry.name}(A, B)`;
  let detail = {
    fr: "Le résultat montre un modèle pédagogique de la famille ; la définition liée reste nécessaire pour les effets exacts.",
    en: "The result shows a teaching model of the family; consult the linked definition for exact effects.",
  };

  if (kind === "atomic") {
    raw = name.includes("ADD") ? a + b : name.includes("XOR") || name.includes("EOR") ? a ^ b : b;
    formula = name.includes("ADD") ? "mémoire ← A + B" : "mémoire ← opération_atomique(A, B)";
    exact = false;
    detail = { fr: "A représente l’ancienne valeur partagée et B l’opérande. Le vrai processeur garantit l’indivisibilité et peut renvoyer l’ancienne valeur.", en: "A represents the old shared value and B the operand. Real hardware guarantees atomicity and may return the old value." };
  } else if (/(?:FMADD|FNMADD|MADD|FMA)/.test(name)) {
    raw = a * b + 1n;
    formula = "A × B + C (C = 1)";
    exact = false;
    detail = { fr: "Le troisième opérande C vaut 1 dans cette démonstration. Les types flottants, voies et arrondis ne sont pas reproduits.", en: "The third operand C is 1 in this demonstration. Floating types, lanes, and rounding are not reproduced." };
  } else if (name.includes("ADD")) {
    raw = a + b;
    formula = "A + B";
    exact = kind === "arithmetic" && !/^(ADC|ADDE)/.test(name);
    detail = { fr: "Addition entière ramenée à la largeur choisie. Les variantes avec retenue, saturation ou voies utilisent un modèle simplifié.", en: "Integer addition wrapped to the selected width. Carry, saturating, and lane variants use a simplified model." };
  } else if (name.includes("SUB")) {
    raw = a - b;
    formula = "A − B";
    exact = kind === "arithmetic" && !/^(SBC|SBB)/.test(name);
    detail = { fr: "Soustraction entière modulo la largeur choisie ; emprunt, saturation et voies ne sont pas entièrement modélisés.", en: "Integer subtraction modulo the selected width; borrow, saturation, and lanes are not fully modeled." };
  } else if (name.includes("MUL")) {
    raw = a * b;
    formula = "A × B";
    exact = kind === "arithmetic";
    detail = { fr: "Le testeur conserve la partie basse du produit. Certaines formes produisent la partie haute, un résultat signé ou plusieurs voies.", en: "The tester retains the low product bits. Some forms produce high bits, a signed result, or multiple lanes." };
  } else if (name.includes("DIV")) {
    raw = b === 0n ? 0n : a / b;
    formula = b === 0n ? "division par zéro" : "A ÷ B";
    exact = kind === "arithmetic" && b !== 0n;
    detail = b === 0n
      ? { fr: "B vaut zéro : le testeur affiche 0, mais le matériel peut lever une exception ou produire une valeur définie par l’ISA.", en: "B is zero: the tester displays 0, but hardware may raise an exception or produce an ISA-defined value." }
      : { fr: "Quotient entier non signé. Les variantes signées, flottantes et vectorielles ont des règles supplémentaires.", en: "Unsigned integer quotient. Signed, floating, and vector variants have additional rules." };
  } else if (/^(AND|BIC)/.test(name)) {
    raw = name.startsWith("BIC") ? a & ~b : a & b;
    formula = name.startsWith("BIC") ? "A AND NOT B" : "A AND B";
    detail = { fr: "Le calcul est appliqué bit par bit sur la largeur choisie.", en: "The operation is applied bit by bit at the selected width." };
  } else if (/^(OR|ORR)/.test(name)) {
    raw = a | b;
    formula = "A OR B";
    detail = { fr: "Chaque bit présent dans A ou B est activé dans le résultat.", en: "Every bit present in A or B is set in the result." };
  } else if (/^(XOR|EOR)/.test(name)) {
    raw = a ^ b;
    formula = "A XOR B";
    detail = { fr: "Chaque bit différent entre A et B devient 1.", en: "Every bit that differs between A and B becomes 1." };
  } else if (/^(NOT|MVN)/.test(name)) {
    raw = ~a;
    formula = "NOT A";
    detail = { fr: "Tous les bits de A sont inversés dans la largeur choisie.", en: "Every bit of A is inverted within the selected width." };
  } else if (/^(SHL|SAL|LSL|SLL)/.test(name)) {
    raw = a << (b % BigInt(width));
    formula = `A << ${b % BigInt(width)}`;
    detail = { fr: "B fournit le nombre de positions ; les bits sortant de la largeur sont éliminés.", en: "B supplies the shift count; bits leaving the selected width are discarded." };
  } else if (/^(SHR|LSR|SRL)/.test(name)) {
    raw = a >> (b % BigInt(width));
    formula = `A >> ${b % BigInt(width)}`;
    detail = { fr: "Décalage logique non signé : des zéros entrent à gauche.", en: "Unsigned logical shift: zeros enter from the left." };
  } else if (/^(SAR|ASR|SRA)/.test(name)) {
    raw = BigInt.asIntN(width, a) >> (b % BigInt(width));
    formula = `signed(A) >> ${b % BigInt(width)}`;
    detail = { fr: "Le bit de signe est recopié à gauche pendant le décalage.", en: "The sign bit is replicated on the left during the shift." };
  } else if (/^(ROL|ROR)/.test(name)) {
    const count = b % BigInt(width);
    raw = name.startsWith("ROL")
      ? (a << count) | (a >> (BigInt(width) - count || BigInt(width)))
      : (a >> count) | (a << (BigInt(width) - count || BigInt(width)));
    formula = `${name.startsWith("ROL") ? "rotate_left" : "rotate_right"}(A, ${count})`;
    detail = { fr: "Les bits sortants sont réinjectés à l’autre extrémité du mot.", en: "Bits shifted out are reinserted at the opposite end of the word." };
  } else if (/^(NEG|FNEG)/.test(name)) {
    raw = -a;
    formula = "−A";
    detail = { fr: "Négation en complément à deux dans la largeur sélectionnée.", en: "Two’s-complement negation at the selected width." };
  } else if (/^(ABS|FABS)/.test(name)) {
    const signed = BigInt.asIntN(width, a);
    raw = signed < 0n ? -signed : signed;
    formula = "abs(signed(A))";
    detail = { fr: "A est interprété comme entier signé avant le calcul de sa valeur absolue.", en: "A is interpreted as signed before computing its absolute value." };
  } else if (/^(POPCNT|CNT|CPOP)/.test(name)) {
    raw = BigInt(a.toString(2).replace(/0/g, "").length);
    formula = "nombre de bits à 1 dans A";
    detail = { fr: "Le résultat est le poids de Hamming de A.", en: "The result is the Hamming weight of A." };
  } else if (/^(CLZ|LZCNT)/.test(name)) {
    raw = a === 0n ? BigInt(width) : BigInt(width - a.toString(2).length);
    formula = "zéros initiaux de A";
    detail = { fr: "Compte depuis le bit de poids fort jusqu’au premier 1.", en: "Counts from the most significant bit to the first one." };
  } else if (/^(CTZ|TZCNT)/.test(name)) {
    raw = a === 0n ? BigInt(width) : BigInt(a.toString(2).match(/0*$/)?.[0].length ?? 0);
    formula = "zéros finaux de A";
    detail = { fr: "Compte depuis le bit de poids faible jusqu’au premier 1.", en: "Counts from the least significant bit to the first one." };
  } else if (/^(CMP|CMN|TEST|TST)/.test(name) || kind === "compare") {
    raw = /^(TEST|TST)/.test(name) ? a & b : a - b;
    formula = /^(TEST|TST)/.test(name) ? "flags ← A AND B" : "flags ← A − B";
    detail = { fr: "Les opérandes restent inchangés ; le résultat intermédiaire sert uniquement à illustrer les conditions.", en: "Operands remain unchanged; the intermediate result only illustrates conditions." };
  } else if (kind === "control") {
    raw = a === b ? 1n : 0n;
    formula = "branche prise si A = B";
    exact = false;
    detail = { fr: "1 signifie « branche prise », 0 « continuer ». La condition réelle dépend du mnémonique et des indicateurs de l’ISA.", en: "1 means branch taken, 0 means continue. The real condition depends on the mnemonic and ISA flags." };
  } else if (kind === "memory") {
    raw = a + b;
    formula = "adresse effective ← A + B";
    exact = false;
    detail = { fr: "A représente une base et B un déplacement. Aucune mémoire réelle n’est lue ou écrite.", en: "A represents a base and B an offset. No real memory is read or written." };
  } else if (kind === "data" || kind === "conversion") {
    raw = a;
    formula = "destination ← A";
    exact = false;
    detail = { fr: "Le modèle montre le transfert de A. Les permutations, extensions et conversions particulières restent décrites par la forme.", en: "The model shows A being transferred. Specific permutations, extensions, and conversions remain defined by the form." };
  } else if (kind === "vector" || kind === "floating") {
    raw = a + b;
    formula = "une voie : A op B";
    exact = false;
    detail = { fr: "A et B représentent une seule voie. Le type des éléments, le prédicat, l’arrondi et les autres voies ne sont pas simulés.", en: "A and B represent one lane. Element type, predicate, rounding, and other lanes are not simulated." };
  } else {
    exact = false;
    formula = `${entry.name} : A → état architectural`;
  }

  const value = wraps(raw, width);
  return {
    value,
    formula: { fr: formula, en: formula },
    detail,
    exact,
    flags: {
      zero: value === 0n,
      negative: Boolean(value & (1n << BigInt(width - 1))),
      carry: raw > mask || raw < 0n,
    },
  };
}
