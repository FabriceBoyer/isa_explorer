import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Cpu,
  Compass,
  FlaskConical,
  BookOpen,
  CircleHelp,
  ArrowUpRight,
  ArrowRight,
  Search,
  Sun,
  Moon,
  Monitor,
  ChevronRight,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  StepBack,
  Layers,
  CircuitBoard,
  Terminal,
  Globe,
  Zap,
  Check,
  Code2,
} from "lucide-react";
import {
  architectures,
  categories,
  type Lang,
  type Architecture,
  type Instruction,
} from "./data";
import {
  initial,
  parse,
  step,
  example,
  type ISA,
  type Machine,
  type Program,
} from "./engine";
import { catalogs, simulatedMnemonics } from "./catalog";
import { ReferenceDetails } from "./ReferenceDetails";
import "./style.css";
function stored(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage may be disabled */
  }
}
function App() {
  const [lang, setLang] = useState<Lang>(() =>
    stored("isa-lang", navigator.language.startsWith("fr") ? "fr" : "en") ===
    "fr"
      ? "fr"
      : "en",
  );
  const [theme, setTheme] = useState(() => stored("isa-theme", "auto"));
  const [route, setRoute] = useState(location.hash.slice(1) || "/");
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);
  useEffect(() => {
    const f = () => {
      setRoute(location.hash.slice(1) || "/");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    save("isa-lang", lang);
  }, [lang]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    save("isa-theme", theme);
  }, [theme]);
  const [section, id, instruction] = route
    .split("?")[0]
    .split("/")
    .filter(Boolean);
  const architecture = architectures.find((a) => a.id === id);
  const nav = [
    ["/", Compass, t("Explorer", "Explore")],
    ["/lab", FlaskConical, t("Laboratoire", "Laboratory")],
    ["/instructions", BookOpen, t("Instructions", "Instructions")],
    ["/help", CircleHelp, t("Guide & aide", "Guide & help")],
  ] as const;
  return (
    <div className="app">
      <aside className="sidebar">
        <a href="#/" className="brand">
          <span className="brand-icon">
            <Cpu size={23} />
          </span>
          <span>
            isa<span className="brand-light">explorer</span>
            <small>INSIDE THE MACHINE</small>
          </span>
        </a>
        <div className="sidebar-label">
          {t("VOTRE ESPACE D’EXPLORATION", "YOUR EXPLORATION SPACE")}
        </div>
        <nav>
          {nav.map(([href, Icon, label]) => (
            <a
              key={href}
              href={"#" + href}
              className={
                (
                  href === "/"
                    ? !section || section === "architecture"
                    : route.startsWith(href)
                )
                  ? "active"
                  : ""
              }
            >
              <Icon size={19} />
              {label}
              {href === "/" && <span className="nav-count">{architectures.length}</span>}
            </a>
          ))}
        </nav>
        <div className="sidebar-label arch-label">ARCHITECTURES</div>
        <div className="side-architectures">
          {architectures.map((a) => (
            <a key={a.id} href={"#/architecture/" + a.id}>
              <i style={{ background: a.color }} />
              {a.name}
              <small>{a.bits}-bit</small>
            </a>
          ))}
        </div>
        <a href="#/lab" className="side-note">
          <div>
            <Zap size={17} />
            <strong>{t("Apprendre en faisant", "Learn by doing")}</strong>
          </div>
          <p>
            {t(
              "Une instruction. Un déclic. Entrez dans le processeur.",
              "One instruction. One discovery. Step inside the processor.",
            )}
          </p>
          <span>
            {t("Ouvrir le laboratoire", "Open the laboratory")}{" "}
            <ArrowRight size={15} />
          </span>
        </a>
        <div className="sidebar-bottom">
          <span className="online" />
          {t("100 % dans votre navigateur", "100% in your browser")}
        </div>
      </aside>
      <div className="workspace">
        <header>
          <div className="breadcrumb">
            ISA Explorer <ChevronRight size={14} />
            <span>
              {section === "lab"
                ? t("Laboratoire", "Laboratory")
                : section === "help"
                  ? t("Guide & aide", "Guide & help")
                  : section === "instructions"
                    ? t("Instructions", "Instructions")
                    : architecture?.name ||
                      t("Explorer les architectures", "Explore architectures")}
            </span>
          </div>
          <div className="preferences">
            <button
              onClick={() => setLang(lang === "fr" ? "en" : "fr")}
              aria-label={t("Changer de langue", "Change language")}
            >
              <Globe size={16} />
              {lang.toUpperCase()}
            </button>
            <div className="theme-switch">
              {(["auto", "light", "dark"] as const).map((v, i) => {
                const Icon = [Monitor, Sun, Moon][i];
                return (
                  <button
                    key={v}
                    className={theme === v ? "selected" : ""}
                    onClick={() => setTheme(v)}
                    aria-label={t("Thème ", "Theme ") + v}
                    title={v}
                  >
                    <Icon size={15} />
                  </button>
                );
              })}
            </div>
          </div>
        </header>
        <main>
          {!section ? (
            <Explorer lang={lang} />
          ) : section === "architecture" && architecture ? (
            instruction ? (
              <InstructionPage
                key={architecture.id + instruction}
                a={architecture}
                item={architecture.instructions.find(
                  (i) => encodeURIComponent(i.name) === instruction,
                )}
                lang={lang}
              />
            ) : (
              <ArchitecturePage a={architecture} lang={lang} />
            )
          ) : section === "lab" ? (
            <Lab lang={lang} />
          ) : section === "instructions" ? (
            <InstructionIndex lang={lang} />
          ) : section === "help" ? (
            <Help lang={lang} />
          ) : (
            <div>
              <h1>404</h1>
              <a href="#/">{t("Retour à l’explorateur", "Back to explorer")}</a>
            </div>
          )}
        </main>
        <footer>
          <span>
            <Cpu size={14} /> ISA Explorer
          </span>
          <span>
            {t(
              "Comprendre la machine, une instruction à la fois.",
              "Understand the machine, one instruction at a time.",
            )}
          </span>
          <a href="#/help">
            {t("Sources & méthode", "Sources & methodology")}{" "}
            <ArrowUpRight size={13} />
          </a>
        </footer>
      </div>
    </div>
  );
}
function Explorer({ lang }: { lang: Lang }) {
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const filtered = architectures.filter(
    (a) =>
      (filter === "all" || a.family === filter || String(a.bits) === filter) &&
      `${a.name} ${a.subtitle} ${a.use[lang]}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span />{" "}
            {t(
              "LA MACHINE N’AURA PLUS DE SECRETS",
              "MAKE SENSE OF THE MACHINE",
            )}
          </div>
          <h1>
            {t("De l’instruction", "From instruction")}
            <br />
            {t("à la compréhension.", "to understanding.")}
          </h1>
          <p>
            {t(
              "Explorez les architectures processeur. Manipulez les registres. Voyez votre code prendre vie, pas à pas.",
              "Explore processor architectures. Get hands-on with registers. Watch your code come to life, step by step.",
            )}
          </p>
          <div className="hero-buttons">
            <a className="button primary" href="#/lab">
              <Play size={16} fill="currentColor" />
              {t("Lancer une simulation", "Start a simulation")}
              <ArrowRight size={17} />
            </a>
            <a href="#/help" className="hero-link">
              {t("Comment ça marche", "How it works")}
              <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="hero-tags">
            <span>
              <Check size={13} />
              {t("Interactif", "Interactive")}
            </span>
            <span>
              <Check size={13} />
              {t("Open source", "Open source")}
            </span>
            <span>
              <Check size={13} />
              {t("Aucune installation", "No installation")}
            </span>
          </div>
        </div>
        <div className="chip-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="trace trace-one" />
          <div className="trace trace-two" />
          <div className="floating-code code-one">
            <span>MOV</span> RAX, 42
          </div>
          <div className="floating-code code-two">
            <span>ADD</span> RAX, RBX
          </div>
          <div className="processor">
            <div className="chip-pin top" />
            <div className="chip-pin bottom" />
            <div className="chip-pin left" />
            <div className="chip-pin right" />
            <Cpu size={49} />
            <strong>CPU</strong>
            <small>FETCH · DECODE · EXECUTE</small>
          </div>
          <div className="floating-register">
            <span>RAX</span>
            <b>00101010</b>
            <i />
          </div>
          <div className="art-caption">
            <span />
            {t("L’invisible devient visible", "Making the invisible visible")}
          </div>
        </div>
      </section>
      <div className="stats">
        <div>
          <Layers />
          <strong>{architectures.length}</strong>
          <span>
            {t("architectures à explorer", "architectures to explore")}
          </span>
        </div>
        <div>
          <Code2 />
          <strong>
            {architectures.reduce((s, a) => s + a.instructions.length, 0)}
          </strong>
          <span>{t("instructions référencées", "indexed instructions")}</span>
        </div>
        <div>
          <FlaskConical />
          <strong>3</strong>
          <span>{t("ISA à simuler", "ISAs to simulate")}</span>
        </div>
        <div>
          <Globe />
          <strong>FR / EN</strong>
          <span>{t("apprenez à votre rythme", "learn at your own pace")}</span>
        </div>
      </div>
      <section className="catalog">
        <div className="section-heading">
          <div>
            <div className="eyebrow purple">
              {t("LE MONDE DES ARCHITECTURES", "THE WORLD OF ARCHITECTURES")}
            </div>
            <h2>
              {t(
                "Choisissez votre terrain d’exploration",
                "Choose your next exploration",
              )}
            </h2>
            <p>
              {t(
                "Des ordinateurs du quotidien aux satellites : chaque architecture a son histoire.",
                "From everyday computers to satellites: every architecture has a story.",
              )}
            </p>
          </div>
          <span className="subtle">
            {filtered.length} {t("architectures", "architectures")}
          </span>
        </div>
        <div className="toolbar">
          <div className="filters">
            {[
              ["all", t("Toutes", "All")],
              ["RISC", "RISC"],
              ["CISC", "CISC"],
              ["64", "64-bit"],
              ["32", "32-bit"],
              ["8", "8-bit"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={filter === value ? "selected" : ""}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="search">
            <Search size={17} />
            <input
              aria-label={t(
                "Rechercher une architecture",
                "Search architectures",
              )}
              placeholder={t(
                "Rechercher une architecture…",
                "Search architectures…",
              )}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd>/</kbd>
          </label>
        </div>
        <div className="architecture-grid">
          {filtered.map((a, i) => (
            <a
              className="architecture-card"
              key={a.id}
              style={
                {
                  "--accent": a.color,
                  "--delay": `${i * 40}ms`,
                } as React.CSSProperties
              }
              href={"#/architecture/" + a.id}
            >
              <div className="card-top">
                <span className="arch-icon">
                  <Cpu size={25} />
                </span>
                <span className="pill">{a.family}</span>
                <span className="pill neutral">{a.bits}-bit</span>
                <ArrowUpRight className="card-arrow" size={20} />
              </div>
              <h3>{a.name}</h3>
              <div className="arch-subtitle">{a.subtitle}</div>
              <p>{a.description[lang]}</p>
              <div className="card-meta">
                <span>
                  <CircuitBoard size={14} />
                  {a.registers} {t("registres", "registers")}
                </span>
                <span>
                  {a.instructions.length} {t("fiches", "references")}
                </span>
              </div>
              <div className="card-bottom">
                <span>{a.use[lang]}</span>
                <ArrowRight size={16} />
              </div>
            </a>
          ))}
        </div>
        {!filtered.length && (
          <div className="empty">
            {t(
              "Aucune architecture trouvée. Essayez un autre filtre.",
              "No architectures found. Try a different filter.",
            )}
          </div>
        )}
      </section>
      <section className="learning-banner">
        <span className="banner-icon">
          <Terminal size={27} />
        </span>
        <div>
          <h3>
            {t(
              "Et si vous deveniez le processeur ?",
              "What if you became the processor?",
            )}
          </h3>
          <p>
            {t(
              "Modifiez un algorithme, avancez d’une instruction et observez chaque registre évoluer.",
              "Edit an algorithm, step through an instruction and watch each register change.",
            )}
          </p>
        </div>
        <a href="#/lab" className="button secondary">
          {t("À vous de jouer", "Your turn to explore")}
          <ArrowRight size={17} />
        </a>
      </section>
    </>
  );
}
function ArchitecturePage({ a, lang }: { a: Architecture; lang: Lang }) {
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);
  return (
    <>
      <a className="back" href="#/">
        ← {t("Toutes les architectures", "All architectures")}
      </a>
      <div className="page-title">
        <span className="arch-icon" style={{ color: a.color }}>
          <Cpu size={30} />
        </span>
        <div>
          <div className="eyebrow purple">{a.subtitle}</div>
          <h1>{a.name}</h1>
        </div>
        <span className="pill">
          {a.family} · {a.bits}-bit
        </span>
      </div>
      <p className="lead">{a.description[lang]}</p>
      <div className="detail-grid">
        <section className="panel">
          <h2>{t("Dans le processeur", "Inside the processor")}</h2>
          <p>{a.detail[lang]}</p>
          <div className="specs">
            <div>
              <small>{t("Registres généraux", "General registers")}</small>
              <strong>{a.registers}</strong>
            </div>
            <div>
              <small>{t("Repère historique", "Historical milestone")}</small>
              <strong>{a.year}</strong>
            </div>
            <div>
              <small>{t("Usage", "Use")}</small>
              <strong>{a.use[lang]}</strong>
            </div>
          </div>
          <a
            target="_blank"
            rel="noreferrer"
            className="text-link"
            href={a.source}
          >
            {t(
              "Lire la documentation officielle",
              "Read the official documentation",
            )}
            <ArrowUpRight size={16} />
          </a>
          {["amd64", "arm64", "riscv"].includes(a.id) && (
            <a href={"#/lab?isa=" + a.id} className="button primary">
              {t("Expérimenter dans le laboratoire", "Experiment in the lab")}
              <Play size={15} />
            </a>
          )}
        </section>
        <section className="panel">
          <h2>{t("Le chemin d’une instruction", "The instruction journey")}</h2>
          <Cycle lang={lang} />
          <p>
            {t(
              "Le compteur ordinal choisit l’instruction. Le décodeur identifie l’opération et ses opérandes. L’unité de calcul lit les registres, calcule et écrit le résultat. Ce schéma conceptuel ne représente ni les cycles ni les performances d’un cœur réel.",
              "The program counter selects an instruction. The decoder identifies the operation and operands. The execution unit reads registers, computes and writes back. This conceptual diagram does not represent the cycles or performance of a real core.",
            )}
          </p>
        </section>
      </div>
      <h2>{t("Les instructions, expliquées", "Instructions, explained")}</h2>
      <p className="subtle">
        {t(
          "Catalogue des instructions et extensions de la version indiquée. Les fiches guidées et les formes de référence sont distinguées.",
          "Instruction and extension catalogue for the named version. Guided references and source forms are distinguished.",
        )}
      </p>
      <InstructionTable key={a.id} a={a} lang={lang} />
    </>
  );
}
function Cycle({ lang }: { lang: Lang }) {
  const [stage, setStage] = useState(0);
  return (
    <div>
      <div className="cycle">
        {["FETCH", "DECODE", "EXECUTE", "WRITE"].map((s, i) => (
          <button
            key={s}
            onClick={() => setStage(i)}
            className={stage === i ? "on" : ""}
          >
            <span>0{i + 1}</span>
            {s}
          </button>
        ))}
      </div>
      <div className="cycle-explanation">
        {
          (lang === "fr"
            ? [
                "PC → mémoire d’instructions : chercher l’instruction à exécuter.",
                "Instruction → contrôle : identifier l’opération et les registres sources.",
                "Registres → ALU : effectuer le calcul sur les opérandes.",
                "ALU → registre destination : conserver le résultat et avancer le PC.",
              ]
            : [
                "PC → instruction memory: fetch the next instruction.",
                "Instruction → control: identify the operation and source registers.",
                "Registers → ALU: compute using the operands.",
                "ALU → destination register: store the result and advance the PC.",
              ])[stage]
        }
      </div>
      <button className="text-link" onClick={() => setStage((stage + 1) % 4)}>
        {lang === "fr" ? "Étape suivante" : "Next stage"}
        <ArrowRight size={15} />
      </button>
    </div>
  );
}
function InstructionTable({ a, lang }: { a: Architecture; lang: Lang }) {
  const t = (fr: string, en: string) => lang === "fr" ? fr : en;
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("all");
  const [guided, setGuided] = useState(false);
  const [page, setPage] = useState(0);
  const families = [...new Set(a.instructions.flatMap(i => i.reference?.families || []))].sort();
  const filtered = a.instructions.filter(i => (!guided || i.guided) &&
    (family === "all" || i.reference?.families.includes(family)) &&
    `${i.name} ${i.title[lang]} ${i.reference?.families.join(' ') || ''}`.toLowerCase().includes(query.toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / 30));
  const current = Math.min(page, pages - 1);
  return <div className="instruction-browser">
    <p className="subtle">{catalogs[a.id]?.version} · {filtered.length} {t("instructions", "instructions")}</p>
    <div className="instruction-filters">
      <label className="search"><Search size={16}/><input aria-label={t("Rechercher une instruction ","Search instructions ")+a.name} value={query} onChange={e => {setQuery(e.target.value);setPage(0);}} placeholder={t("Mnémonique, extension…","Mnemonic, extension…")}/></label>
      <select aria-label={t("Extension ","Extension ")+a.name} value={family} onChange={e=>{setFamily(e.target.value);setPage(0);}}><option value="all">{t("Toutes les familles / extensions","All families / extensions")}</option>{families.map(f=><option key={f}>{f}</option>)}</select>
      <label className="guided-filter"><input type="checkbox" checked={guided} onChange={e=>{setGuided(e.target.checked);setPage(0);}}/>{t("Fiches guidées","Guided references")}</label>
    </div>
    <div className="instruction-table">
      {filtered.slice(current * 30, (current + 1) * 30).map(i=><a key={i.name} href={`#/architecture/${a.id}/${encodeURIComponent(i.name)}`}>
        <code>{i.name}</code><span>{i.title[lang]}<small>{i.syntax}</small></span>
        <span className="pill neutral">{i.guided?t("Guidée","Guided"):t("Référence","Reference")}</span><ArrowUpRight size={17}/>
      </a>)}
      {!filtered.length && <div className="empty">{t("Aucune instruction ne correspond à ces filtres.","No instruction matches these filters.")}</div>}
    </div>
    {pages>1&&<div className="pagination"><button className="button secondary" disabled={current===0} onClick={()=>setPage(current-1)}>{t("Précédent","Previous")}</button><span>{current+1} / {pages}</span><button className="button secondary" disabled={current===pages-1} onClick={()=>setPage(current+1)}>{t("Suivant","Next")}</button></div>}
  </div>;
}
function InstructionIndex({ lang }: { lang: Lang }) {
  const [q, setQ] = useState("");
  const [archFilter, setArchFilter] = useState("all");
  return (
    <>
      <div className="eyebrow purple">
        {lang === "fr" ? "LA BIBLIOTHÈQUE" : "THE LIBRARY"}
      </div>
      <h1>
        {lang === "fr" ? "L’assembleur, déchiffré." : "Assembly, decoded."}
      </h1>
      <p className="lead">
        {lang === "fr"
          ? "Recherchez parmi les catalogues versionnés : jeux de base, extensions et fiches guidées."
          : "Search versioned catalogues: base instruction sets, extensions and guided references."}
      </p>
      <label className="search wide">
        <Search size={18} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            lang === "fr"
              ? "Rechercher MOV, addition, ARM64…"
              : "Search MOV, addition, ARM64…"
          }
        />
      </label>
      <select aria-label={lang === "fr" ? "Architecture du catalogue" : "Catalogue architecture"} value={archFilter} onChange={e=>setArchFilter(e.target.value)}><option value="all">{lang === "fr" ? "Toutes les architectures" : "All architectures"}</option>{architectures.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>
      {architectures.filter(a=>archFilter === "all" || a.id === archFilter)
        .map((a) => ({
          ...a,
          instructions: a.instructions.filter((i) =>
            `${a.name} ${i.name} ${i.title[lang]}`
              .toLowerCase()
              .includes(q.toLowerCase()),
          ),
        }))
        .filter((a) => a.instructions.length)
        .map((a) => (
          <section key={a.id}>
            <h2>{a.name}</h2>
            <InstructionTable key={a.id} a={a} lang={lang} />
          </section>
        ))}
    </>
  );
}
function InstructionPage({
  a,
  item,
  lang,
}: {
  a: Architecture;
  item: Instruction | undefined;
  lang: Lang;
}) {
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const [left, setLeft] = useState(7);
  const [right, setRight] = useState(5);
  const [done, setDone] = useState(false);
  if (!item)
    return <h1>{t("Instruction introuvable", "Instruction not found")}</h1>;
  if (!item.guided && item.reference) return <>
    <a className="back" href={"#/architecture/" + a.id}>← {a.name}</a>
    <div className="eyebrow purple">{a.name} · {t("Catalogue des instructions", "Instruction catalogue")}</div>
    <h1><code>{item.name}</code></h1>
    <ReferenceDetails key={a.id+item.name} arch={a.id} entry={item.reference} lang={lang}/>
  </>;
  const arithmetic = ["ADD", "SUB", "XOR", "EOR"].includes(item.name);
  const raw =
    item.name === "SUB"
      ? left - right
      : ["XOR", "EOR"].includes(item.name)
        ? left ^ right
        : left + right;
  const result = BigInt.asUintN(a.bits, BigInt(raw)).toString();
  return (
    <>
      <a className="back" href={"#/architecture/" + a.id}>
        ← {a.name}
      </a>
      <div className="eyebrow purple">
        {categories[item.kind][lang]} · {a.name}
      </div>
      <h1>
        <code>{item.name}</code>{" "}
        <span className="title-light">{item.title[lang]}</span>
      </h1>
      <p className="lead">{item.description[lang]}</p>
      <div className="detail-grid">
        <section className="panel">
          <h2>{t("Syntaxe & opération", "Syntax & operation")}</h2>
          <pre>{item.syntax}</pre>
          <div className="formula">{item.effect}</div>
          <h3>{t("Registres et indicateurs", "Registers and flags")}</h3>
          <p>{item.flags[lang]}</p>
          <h3>{t("Précisions à connaître", "Things to know")}</h3>
          <p>{item.note[lang]}</p>
        </section>
        <section className="panel">
          <h2>{t("Exemple commenté", "Worked example")}</h2>
          <pre>{item.example}</pre>
          <div className="result">
            <Check size={17} />
            {item.result}
          </div>
          <p>
            {t(
              "Cet exemple illustre la forme présentée. Les accès mémoire supposent une adresse valide ; les appels supposent un contexte d’exécution correctement initialisé.",
              "This example illustrates the displayed form. Memory accesses assume a valid address; calls assume an appropriately initialized execution context.",
            )}
          </p>
          <a
            href={
              a.source
            }
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            {t(
              "Référence officielle · formes et exceptions",
              "Official reference · forms and exceptions",
            )}
            <ArrowUpRight size={16} />
          </a>
        </section>
      </div>
      {item.reference && <details className="reference-expander"><summary>{t("Toutes les formes et extensions référencées", "All referenced forms and extensions")}</summary><ReferenceDetails key={a.id+item.name} arch={a.id} entry={item.reference} lang={lang}/></details>}
      {arithmetic && (
        <section className="panel">
          <h2>{t("Faites circuler les données", "Make the data flow")}</h2>
          <p>
            {t(
              "Modèle de l’opération sur deux petites valeurs ; l’encodage et les indicateurs ne sont pas simulés ici.",
              "Operation model using two small values; encoding and flags are not simulated here.",
            )}
          </p>
          <div className={"operation " + (done ? "executed" : "")}>
            <label>
              {t("Source A", "Source A")}
              <input
                type="number"
                min="0"
                max="255"
                value={left}
                onChange={(e) => {
                  setLeft(Math.max(0, Math.min(255, Number(e.target.value))));
                  setDone(false);
                }}
              />
            </label>
            <span>{t("et", "and")}</span>
            <label>
              {t("Source B", "Source B")}
              <input
                type="number"
                min="0"
                max="255"
                value={right}
                onChange={(e) => {
                  setRight(Math.max(0, Math.min(255, Number(e.target.value))));
                  setDone(false);
                }}
              />
            </label>
            <ArrowRight />
            <div className="alu">
              {item.name}
              <small>ALU</small>
            </div>
            <ArrowRight />
            <div className="destination">
              <small>{t("Destination", "Destination")}</small>
              <strong>{done ? result : "—"}</strong>
            </div>
          </div>
          <button className="button primary" onClick={() => setDone(true)}>
            <Play size={16} />
            {t("Exécuter l’opération", "Execute operation")}
          </button>
        </section>
      )}
    </>
  );
}
function Lab({ lang }: { lang: Lang }) {
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const requested = new URLSearchParams(location.hash.split("?")[1] || "").get(
    "isa",
  );
  const [isa, setIsa] = useState<ISA>(
    ["amd64", "arm64", "riscv"].includes(requested || "")
      ? (requested as ISA)
      : "amd64",
  );
  const [kind, setKind] = useState("sum");
  const [input, setInput] = useState("5");
  const [code, setCode] = useState(() => example(isa, "sum"));
  const [history, setHistory] = useState<Machine[]>(() => [initial(isa)]);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(700);
  const [hex, setHex] = useState(false);
  const state = history[history.length - 1];
  let program: Program | undefined;
  try {
    program = parse(code, isa);
  } catch {
    /* show errors when loading */
  }
  const finished = !!program && state.pc >= program.lines.length;
  function reset(nextCode = code, nextIsa = isa, nextInput = input) {
    setRunning(false);
    try {
      parse(nextCode, nextIsa);
      setHistory([initial(nextIsa, nextInput)]);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function advance() {
    try {
      const p = parse(code, isa);
      const next = step(state, p, isa);
      if (next === state) {
        setRunning(false);
        return;
      }
      setHistory((h) => [...h, next]);
      if (next.pc >= p.lines.length) setRunning(false);
    } catch (e) {
      setError((e as Error).message);
      setRunning(false);
    }
  }
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(advance, speed);
    return () => clearTimeout(timer);
  });
  function changeISA(value: ISA) {
    const next = example(value, kind);
    setIsa(value);
    setCode(next);
    reset(next, value);
  }
  return (
    <>
      <div className="eyebrow purple">
        {t("LE LABORATOIRE INTERACTIF", "THE INTERACTIVE LAB")}
      </div>
      <h1>{t("Prenez les commandes.", "Take the controls.")}</h1>
      <p className="lead">
        {t(
          "Une instruction à la fois. Chaque changement devient visible.",
          "One instruction at a time. Every change becomes visible.",
        )}
      </p>
      <div className="lab-settings">
        <label>
          Architecture
          <select
            value={isa}
            onChange={(e) => changeISA(e.target.value as ISA)}
          >
            <option value="amd64">AMD64</option>
            <option value="arm64">ARM64</option>
            <option value="riscv">RISC-V RV64I</option>
          </select>
        </label>
        <label>
          {t("Algorithme", "Algorithm")}
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              const c = example(isa, e.target.value);
              setCode(c);
              reset(c);
            }}
          >
            <option value="sum">
              {t("Somme de 1 à n", "Sum from 1 to n")}
            </option>
            <option value="double">
              {t("Doubler une valeur", "Double a value")}
            </option>
            <option value="swap">
              {t("Échanger par XOR", "Swap with XOR")}
            </option>
          </select>
        </label>
        <label>
          {t("Donnée initiale n (0–100)", "Initial value n (0–100)")}
          <input
            value={input}
            type="number"
            min="0"
            max="100"
            onChange={(e) => {
              setInput(e.target.value);
              reset(code, isa, e.target.value);
            }}
          />
        </label>
        <label>
          {t("Vitesse", "Speed")}
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            <option value={1200}>0.5×</option>
            <option value={700}>1×</option>
            <option value={250}>3×</option>
          </select>
        </label>
      </div>
      <div className="pseudocode">
        <Code2 size={17} />
        <code>
          {kind === "sum"
            ? "total = 0; for (i = n; i >= 0; i--) total += i;"
            : kind === "double"
              ? "result = n + n;"
              : "a = n; b = 10; a ^= b; b ^= a; a ^= b;"}
        </code>
      </div>
      <div className="lab-grid">
        <section className="panel code-panel">
          <div className="panel-heading">
            <h2>
              <Terminal size={18} />
              {t("Programme assembleur", "Assembly program")}
            </h2>
            <span className="pill neutral">{t("Modifiable", "Editable")}</span>
          </div>
          <div className="editor-wrap">
            <div className="line-numbers">
              {code.split("\n").map((_, i) => (
                <span
                  className={
                    program?.lines[state.pc]?.source === i ? "current" : ""
                  }
                  key={i}
                >
                  {program?.lines[state.pc]?.source === i ? "▶" : i + 1}
                </span>
              ))}
            </div>
            <textarea
              aria-label={t("Code assembleur", "Assembly code")}
              spellCheck={false}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                reset(e.target.value);
              }}
            />
          </div>
          <div className="controls">
            <button
              className="button primary"
              disabled={finished || !!error}
              onClick={() => setRunning(!running)}
            >
              {running ? <Pause size={16} /> : <Play size={16} />}{" "}
              {running ? t("Pause", "Pause") : t("Exécuter", "Run")}
            </button>
            <button
              title={t("Instruction suivante", "Next instruction")}
              aria-label={t("Instruction suivante", "Next instruction")}
              disabled={running || finished || !!error}
              onClick={advance}
            >
              <SkipForward size={20} />
            </button>
            <button
              title={t("Retour arrière", "Step back")}
              aria-label={t("Retour arrière", "Step back")}
              disabled={history.length === 1}
              onClick={() => {
                setRunning(false);
                setHistory((h) => h.slice(0, -1));
              }}
            >
              <StepBack size={20} />
            </button>
            <button
              title={t("Réinitialiser", "Reset")}
              aria-label={t("Réinitialiser", "Reset")}
              onClick={() => reset()}
            >
              <RotateCcw size={19} />
            </button>
          </div>
          <div
            role="status"
            className={"execution-status " + (error ? "error" : "")}
          >
            {error
              ? t(
                  "Programme invalide ou limite atteinte : ",
                  "Invalid program or limit reached: ",
                ) + error
              : finished
                ? t("Exécution terminée", "Execution complete")
                : t("Prochaine instruction : ", "Next instruction: ") +
                  (program?.lines[state.pc]?.text || "—")}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <Cpu size={19} />
              {t("État du processeur", "Processor state")}
            </h2>
            <button className="pill" onClick={() => setHex(!hex)}>
              {hex ? "HEX" : "DEC"}
            </button>
          </div>
          <div className="register-grid">
            {Object.entries(state.registers).map(([name, value]) => (
              <div
                className={
                  "register " + (state.changed.includes(name) ? "changed" : "")
                }
                key={name}
              >
                <small>{name}</small>
                <strong>
                  {hex
                    ? "0x" + value.toString(16).toUpperCase()
                    : value.toString()}
                </strong>
                <span>{value.toString(2).padStart(8, "0").slice(-8)}</span>
              </div>
            ))}
          </div>
          <div className="machine-meta">
            <span>
              PC <b>{state.pc}</b>
            </span>
            <span>
              {t("Instructions", "Instructions")} <b>{state.ticks}</b>
            </span>
            {isa === "amd64" && (
              <span>
                ZF <b>{Number(state.zero)}</b>
              </span>
            )}
          </div>
          <p className="subtle small">
            {t(
              "PC = index d’instruction (pas une adresse machine). Bits affichés : octet bas. Valeurs non signées sur 64 bits.",
              "PC = instruction index (not a machine address). Bits shown: low byte. Unsigned 64-bit values.",
            )}
          </p>
          <div className="data-flow" key={state.ticks}>
            <span>{t("Lecture", "Read")}</span>
            <ArrowRight />
            <span className="alu">ALU</span>
            <ArrowRight />
            <span>{state.changed.join(", ") || t("Contrôle", "Control")}</span>
          </div>
          <div className="last-instruction">
            <small>
              {t("Dernière instruction exécutée", "Last executed instruction")}
            </small>
            <code>{state.last || "—"}</code>
          </div>
        </section>
      </div>
      <section className="panel">
        <h2>
          {t("Comprendre cette expérience", "Understand this experiment")}
        </h2>
        <p>
          {kind === "sum"
            ? t(
                "Le compteur démarre à n + 1, puis diminue avant chaque addition. L’accumulateur reçoit n, n − 1, …, 0. Le résultat vaut n × (n + 1) / 2. Le saut revient à loop tant que le compteur n’est pas nul.",
                "The counter starts at n + 1, then decreases before each addition. The accumulator receives n, n − 1, …, 0. The result is n × (n + 1) / 2. The branch returns to loop while the counter is nonzero.",
              )
            : kind === "double"
              ? t(
                  "La même valeur est utilisée comme deux opérandes de l’addition. La destination contient 2 × n.",
                  "The same value is used as both addition operands. The destination holds 2 × n.",
                )
              : t(
                  "Trois XOR échangent deux registres distincts sans registre temporaire : (a XOR b) XOR b = a. Les valeurs de départ sont n et 10.",
                  "Three XORs swap two distinct registers without a temporary register: (a XOR b) XOR b = a. The initial values are n and 10.",
                )}
        </p>
        <p>
          {t(
            "Sous-ensemble pédagogique : 8 registres visibles, calcul entier, étiquettes et branchements ; aucun accès mémoire, pile, encodage machine, cache ou timing réel. Seul ZF est simulé pour AMD64. MOV accepte des constantes pédagogiques sans valider leur encodage. Commentaires avec « ; ». Arrêt de sécurité après 2 000 instructions.",
            "Educational subset: eight visible registers, integer arithmetic, labels and branches; no memory access, stack, machine encoding, cache or real timing. Only ZF is modeled for AMD64. MOV accepts educational constants without validating their encoding. Use “;” for comments. Safety stop after 2,000 instructions.",
          )}
        </p>
        <div className="supported">
          {architectures
            .find((a) => a.id === isa)
            ?.instructions.filter(i => simulatedMnemonics[isa]?.includes(i.name)).map((i) => (
              <a
                className="pill"
                key={i.name}
                href={`#/architecture/${isa}/${i.name}`}
              >
                {i.name}
                <ArrowUpRight size={12} />
              </a>
            ))}
        </div>
      </section>
    </>
  );
}
function Help({ lang }: { lang: Lang }) {
  const t = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const topics = [
    [
      t("Commencer en trois étapes", "Get started in three steps"),
      t(
        "Choisissez une architecture, ouvrez une fiche pour découvrir ses registres, puis lancez le laboratoire. Commencez par « Doubler une valeur » : deux instructions suffisent en AMD64.",
        "Choose an architecture, open a reference to discover its registers, then launch the lab. Start with “Double a value”: AMD64 needs just two instructions.",
      ),
    ],
    [
      t("ISA ou microarchitecture ?", "ISA or microarchitecture?"),
      t(
        "L’ISA est le contrat visible par le logiciel : instructions, registres et comportement mémoire. La microarchitecture est sa réalisation : pipeline, caches, prédiction et unités de calcul. Deux processeurs peuvent exécuter la même ISA avec des performances très différentes. AMD64 et Intel 64 désignent la même famille x86-64.",
        "The ISA is the contract visible to software: instructions, registers and memory behavior. Microarchitecture is its implementation: pipelines, caches, prediction and execution units. Two processors can execute the same ISA with very different performance. AMD64 and Intel 64 name the same x86-64 family.",
      ),
    ],
    [
      t("Registres, mémoire et pile", "Registers, memory and stack"),
      t(
        "Un registre est un petit stockage directement accessible au processeur. La mémoire est adressée : une instruction load copie une donnée mémoire dans un registre, store fait l’inverse. Le pointeur de pile repère une zone mémoire utilisée par les appels et les variables locales. Le laboratoire modélise uniquement les registres : les exemples mémoire des fiches ne sont pas exécutables dans celui-ci.",
        "A register is small storage directly accessible to the processor. Memory is addressed: a load copies memory data into a register; a store does the reverse. The stack pointer tracks memory used by calls and local variables. The lab models registers only: memory examples in references cannot run there.",
      ),
    ],
    [
      t("Lire et modifier le laboratoire", "Read and edit the lab"),
      t(
        "Choisissez une ISA et un algorithme, puis saisissez n entre 0 et 100. Le registre RCX, X1 ou x1 reçoit n. Modifiez le texte assembleur : chaque modification réinitialise l’exécution. La flèche indique l’instruction suivante ; les registres colorés ont changé lors du dernier pas. Exécuter avance automatiquement ; le bouton pas à pas exécute une instruction ; retour arrière restaure l’état précédent. HEX/DEC change l’affichage.",
        "Choose an ISA and algorithm, then enter n between zero and 100. RCX, X1 or x1 receives n. Edit the assembly text: each change resets execution. The arrow marks the next instruction; colored registers changed during the last step. Run advances automatically; step executes one instruction; back restores the previous state. HEX/DEC switches the display.",
      ),
    ],
    [
      t("Syntaxe acceptée et erreurs", "Accepted syntax and errors"),
      t(
        "AMD64 utilise la syntaxe Intel, destination en premier. A64 utilise X0–X7 et des immédiats préfixés par #. RISC-V utilise x0–x7 et place la destination en premier. Les étiquettes finissent par « : », les commentaires commencent par « ; ». Seules les instructions listées sous le laboratoire sont acceptées. ADDI est limité à un immédiat signé de 12 bits. Une erreur désactive l’exécution jusqu’à correction.",
        "AMD64 uses Intel syntax, destination first. A64 uses X0–X7 and # prefixed immediates. RISC-V uses x0–x7 with the destination first. Labels end in “:”, comments start with “;”. Only instructions listed beneath the lab are supported. ADDI requires a signed 12-bit immediate. An error disables execution until corrected.",
      ),
    ],
    [
      t("Bits, indicateurs et débordements", "Bits, flags and overflow"),
      t(
        "Le laboratoire utilise BigInt et conserve les 64 bits de poids faible : 2⁶⁴ − 1 + 1 donne zéro. ZF en AMD64 indique un résultat nul ; CMP le modifie sans écrire de registre. Un nombre négatif apparaît en complément à deux non signé. Le petit aperçu binaire montre uniquement les 8 bits de poids faible. RISC-V x0 reste toujours nul.",
        "The lab uses BigInt and retains the low 64 bits: 2⁶⁴ − 1 + 1 becomes zero. AMD64 ZF indicates a zero result; CMP updates it without writing a register. Negative numbers appear as unsigned two’s complement. The binary preview shows only the low eight bits. RISC-V x0 always remains zero.",
      ),
    ],
    [
      t("Couverture et limites", "Coverage and limitations"),
      t(
        "Les sept profils donnent accès à des catalogues versionnés : Intel XED, Arm A64 2025-09 ASL1, RISC-V ratifié, SPARC V8, Power ISA 3.1C et AVR DS40002198B. Les références indexent les mnémoniques et renvoient à leurs définitions ; les fiches guidées ajoutent des explications et des exemples. Le simulateur exécute trois sous-ensembles entiers 64 bits : AMD64, A64 et RV64I. Il ne simule ni mémoire, exceptions, privilèges, flottants, SIMD, pipelines réels ni instructions binaires. Les autres architectures disposent de fiches mais pas de moteur. Les liens officiels font autorité pour les formes, extensions et exceptions.",
        "The seven profiles provide versioned catalogues: Intel XED, Arm A64 2025-09 ASL1, ratified RISC-V, SPARC V8, Power ISA 3.1C and AVR DS40002198B. References index mnemonics and link to their definitions; guided references add explanations and examples. The simulator executes three 64-bit integer subsets: AMD64, A64 and RV64I. It does not model memory, exceptions, privileges, floating point, SIMD, real pipelines or binary instructions. Other architectures have references but no execution engine. Official links are authoritative for forms, extensions and exceptions.",
      ),
    ],
    [
      t("Langue, thème et accessibilité", "Language, theme and accessibility"),
      t(
        "La langue française ou anglaise est détectée au premier chargement. Le thème suit le système en mode automatique. Les contrôles de l’en-tête permettent de modifier ces choix, enregistrés localement. L’interface est utilisable au clavier et réduit ses animations selon le réglage système. Aucun compte, backend, cookie analytique ou envoi du code saisi.",
        "French or English is detected on first load. Automatic theme follows your system. Header controls override these choices, saved locally. The interface is keyboard accessible and reduces animations according to your system preference. No account, backend, analytics cookie or upload of your code.",
      ),
    ],
  ];
  return (
    <>
      <div className="eyebrow purple">
        {t("LE GUIDE DE L’EXPLORATEUR", "THE EXPLORER’S GUIDE")}
      </div>
      <h1>
        {t(
          "Un petit guide. De grandes découvertes.",
          "A little guidance. Big discoveries.",
        )}
      </h1>
      <p className="lead">
        {t(
          "Tout ce qu’il faut pour comprendre, expérimenter et aller plus loin.",
          "Everything you need to understand, experiment and go further.",
        )}
      </p>
      <div className="help-grid">
        {topics.map(([title, body], i) => (
          <section className="panel" key={title}>
            <span className="help-number">0{i + 1}</span>
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ))}
      </div>
      <section className="panel">
        <h2>{t("Sources primaires", "Primary sources")}</h2>
        <p>
          {t(
            "Fiches guidées originales et index techniques issus des sources officielles. Sources consultées le 14 septembre 2026 ; les versions et périmètres sont indiqués dans les catalogues.",
            "Original guided references and technical indexes from official sources. Sources consulted on September 14, 2026; versions and scopes are shown in the catalogues.",
          )}
        </p>
        <div className="sources">
          {architectures.map((a) => (
            <a href={a.source} key={a.id} target="_blank" rel="noreferrer">
              {a.name}
              <ArrowUpRight size={16} />
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
