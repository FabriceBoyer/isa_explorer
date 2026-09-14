import { useState } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, CircleAlert, Cpu, Database, GitBranch } from "lucide-react";
import { catalogs, type ReferenceEntry, type ReferenceForm } from "./catalog";
import type { Lang } from "./data";
import { extractOperands, flagDetails, instructionGuide, localize, type InstructionClass } from "./instructionDocs";

const icons: Record<InstructionClass, typeof Cpu> = {
  control: GitBranch, memory: Database, atomic: Database, conversion: ArrowRight,
  data: ArrowRight, arithmetic: Cpu, logical: Cpu, shift: Cpu, compare: Cpu,
  system: Cpu, floating: Cpu, vector: Cpu, other: Cpu,
};

export function ReferenceDetails({ arch, entry, lang }: { arch: string; entry: ReferenceEntry; lang: Lang }) {
  const t = (fr: string, en: string) => lang === "fr" ? fr : en;
  const [family, setFamily] = useState("all");
  const forms = entry.forms.filter((form) => family === "all" || form.family === family);
  const catalog = catalogs[arch];
  const guide = instructionGuide(entry);
  const Icon = icons[guide.kind];
  const syntaxCount = entry.forms.filter((form) => form.syntax).length;
  const flagCount = entry.forms.filter((form) => form.flags).length;
  const featureCount = new Set(entry.forms.flatMap((form) => form.features ?? [])).size;

  return <section className="reference-details">
    <div className="panel reference-intro">
      <div className="panel-heading"><h2><BookOpen size={20} />{t("Référence technique", "Technical reference")}</h2><span className="pill neutral">{catalog.version}</span></div>
      <div className="instruction-purpose">
        <span className={`purpose-icon ${guide.kind}`}><Icon size={22} /></span>
        <div><span className="eyebrow purple">{localize(guide.label, lang)}</span><p>{localize(guide.summary, lang)}</p></div>
      </div>
      <div className="reference-stats" aria-label={t("Couverture de la fiche", "Reference coverage")}>
        <span><strong>{entry.forms.length}</strong>{t("formes", "forms")}</span>
        <span><strong>{entry.families.length}</strong>{t("familles", "families")}</span>
        <span><strong>{syntaxCount}</strong>{t("syntaxes", "syntaxes")}</span>
        <span><strong>{flagCount}</strong>{t("formes avec indicateurs", "forms with flags")}</span>
        {featureCount > 0 && <span><strong>{featureCount}</strong>{t("capacités requises", "required features")}</span>}
      </div>
      <div className="instruction-flow" aria-label={t("Chemin conceptuel des données", "Conceptual data path")}>
        <span>{t("Lire les sources", "Read sources")}</span><ArrowRight size={16} />
        <span>{localize(guide.operation, lang)}</span><ArrowRight size={16} />
        <span>{localize(guide.destination, lang)}</span>
      </div>
      <p className="source-scope"><CircleAlert size={16} />{t(
        "Ce repère fonctionnel aide à lire le mnémonique ; la forme choisie et le manuel officiel définissent la sémantique normative, les exceptions et la disponibilité matérielle.",
        "This functional guide helps interpret the mnemonic; the selected form and official manual define normative semantics, exceptions, and hardware availability.",
      )}</p>
      <div className="supported">{entry.families.map((item) => <span key={item} className="pill">{item}</span>)}</div>
      <a className="text-link" href={catalog.source} target="_blank" rel="noreferrer">{t("Manuel de l’architecture", "Architecture manual")}<ArrowUpRight size={16} /></a>
    </div>

    <div className="reference-heading">
      <h2>{forms.length} {t("formes référencées", "referenced forms")}</h2>
      {entry.families.length > 1 && <label>{t("Famille / extension", "Family / extension")}<select value={family} onChange={(event) => setFamily(event.target.value)}><option value="all">{t("Toutes", "All")}</option>{entry.families.map((item) => <option key={item}>{item}</option>)}</select></label>}
    </div>
    {forms.map((form, index) => <ReferenceFormCard key={form.source + form.syntax + index} form={form} name={entry.name} lang={lang} />)}
    <NotationGuide arch={arch} lang={lang} />
  </section>;
}

function ReferenceFormCard({ form, name, lang }: { form: ReferenceForm; name: string; lang: Lang }) {
  const t = (fr: string, en: string) => lang === "fr" ? fr : en;
  const operands = extractOperands(form);
  const flags = form.flags ? flagDetails(form.flags) : [];
  const hasAccess = operands.some((operand) => operand.access !== "—");
  return <article className="panel reference-form">
    <div className="panel-heading"><div><span className="form-label">{t("Forme", "Form")} · {form.format.toUpperCase()}</span><h3>{form.syntax || name}</h3></div><span className="pill">{form.family}</span></div>
    <p className="form-context">{t(`Cette variante de ${name} appartient à la famille ${form.family}.`, `This ${name} variant belongs to the ${form.family} family.`)}{form.alias && <> {t("Le manuel la définit comme alias de", "The manual defines it as an alias of")} <code>{form.alias}</code>.</>}</p>
    {form.syntax && <><h4>{t("Gabarit assembleur", "Assembly template")}</h4><pre>{form.syntax}</pre><p className="field-hint">{t("Remplacez les paramètres génériques par des registres, constantes ou conditions valides pour cette forme.", "Replace generic parameters with registers, constants, or conditions valid for this form.")}</p></>}
    {operands.length > 0 ? <>
      <h4>{t("Interaction avec les opérandes", "Operand interaction")}</h4>
      <div className="operand-table-wrap"><table className="operand-table"><thead><tr><th>{t("Opérande", "Operand")}</th><th>{t("Accès", "Access")}</th><th>{t("Interprétation", "Interpretation")}</th></tr></thead><tbody>{operands.map((operand, index) => <tr key={`${operand.token}-${index}`}><td><code>{operand.token}</code></td><td>{operand.access}</td><td>{operand.meaning[lang]}</td></tr>)}</tbody></table></div>
      <p className="field-hint">{hasAccess ? t("R = lu, W = écrit, R/W = lu puis modifié.", "R = read, W = written, R/W = read then modified.") : t("L’index ne précise pas ici les accès lecture/écriture ; vérifiez la définition liée.", "The index does not state read/write access here; check the linked definition.")}</p>
    </> : <Missing>{t("L’index ne fournit pas de liste d’opérandes pour cette forme.", "The index does not provide an operand list for this form.")}</Missing>}
    {form.features && form.features.length > 0 && <><h4>{t("Capacités architecturales requises", "Required architectural features")}</h4><div className="supported">{form.features.map((feature) => <span className="pill neutral" key={feature}>{feature}</span>)}</div></>}
    <h4>{t("Indicateurs et état", "Flags and state")}</h4>
    {flags.length > 0 ? <div className="flag-list">{flags.map((flag) => <span key={`${flag.name}-${flag.action.en}`}><code>{flag.name}</code> {flag.action[lang]}</span>)}</div> : form.flags ? <pre className="metadata-code">{form.flags}</pre> : <Missing>{t("Aucun effet sur les indicateurs n’est exposé par cet index. Cela ne signifie pas que l’instruction n’en modifie aucun.", "This index exposes no flag effects. That does not mean the instruction modifies none.")}</Missing>}
    {form.constraints && <p><strong>{t("Contraintes : ", "Constraints: ")}</strong>{form.constraints}</p>}
    {form.classification && <p>{t("Catégorie source : ", "Source category: ")}<code>{form.classification}</code>{form.privilege && <> · {form.privilege === "3" ? t("CPL 3 (espace utilisateur)", "CPL 3 (user space)") : `CPL ${form.privilege}`}</>}</p>}
    {form.encoding && <details><summary>{t("Voir les contraintes d’encodage", "Show encoding constraints")}</summary><pre className="metadata-code">{form.encoding}</pre></details>}
    <a href={form.source} target="_blank" rel="noreferrer" className="text-link">{t("Ouvrir la définition normative", "Open the normative definition")}<ArrowUpRight size={16} /></a>
  </article>;
}

function Missing({ children }: { children: React.ReactNode }) {
  return <p className="metadata-missing"><CircleAlert size={15} />{children}</p>;
}

function NotationGuide({ arch, lang }: { arch: string; lang: Lang }) {
  const t = (fr: string, en: string) => lang === "fr" ? fr : en;
  const text = arch === "amd64" || arch === "x86"
    ? t("XED décrit des formes d’encodage. MEM désigne la mémoire, REG un registre, IMM une constante et RELBR une cible relative. SUPP et IMPL signalent des opérandes implicites.", "XED describes encoding forms. MEM denotes memory, REG a register, IMM a constant, and RELBR a relative target. SUPP and IMPL mark implicit operands.")
    : arch === "riscv" ? t("rd est généralement la destination ; rs1 et rs2 sont des sources, imm une constante et shamt un nombre de décalages. Les fichiers rv32/rv64 limitent la largeur.", "rd is generally the destination; rs1 and rs2 are sources, imm is a constant, and shamt is a shift count. rv32/rv64 files restrict width.")
      : arch === "arm64" ? t("W/X désignent les registres entiers 32/64 bits, V les registres SIMD, Z les vecteurs SVE, P les prédicats et ZA les accumulateurs SME. FEAT_* indique une capacité requise.", "W/X denote 32/64-bit integer registers, V SIMD registers, Z SVE vectors, P predicates, and ZA SME accumulators. FEAT_* marks a required capability.")
        : arch === "avr" ? t("Rd et Rr sont destination et source. X, Y et Z sont des pointeurs 16 bits ; K/k sont des constantes, b un numéro de bit et A une adresse d’E/S.", "Rd and Rr are destination and source. X, Y, and Z are 16-bit pointers; K/k are constants, b is a bit number, and A is an I/O address.")
          : arch === "sparc" ? t("Les noms d’opcodes matériels et les syntaxes assembleur peuvent différer. Le suffixe cc met à jour les codes de condition. Les branchements SPARC V8 ont un delay slot.", "Hardware opcode names and assembly syntax may differ. The cc suffix updates condition codes. SPARC V8 branches have a delay slot.")
            : t("Les repères P1/PPC et v2/v3 indiquent la version dans l’annexe H. Un suffixe point demande généralement l’enregistrement dans les codes de condition.", "P1/PPC and v2/v3 markers identify the version in appendix H. A dot suffix generally requests recording in condition codes.");
  return <div className="panel notation-guide"><h3><Cpu size={18} /> {t("Lire les notations de cette architecture", "Read this architecture’s notation")}</h3><p>{text}</p></div>;
}
