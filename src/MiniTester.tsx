import { useState } from "react";
import { ArrowRight, FlaskConical, Play, RotateCcw } from "lucide-react";
import type { ReferenceEntry } from "./catalog";
import type { Lang } from "./data";
import { executeMiniTest, type TesterResult, type TesterWidth } from "./miniTester";

export function MiniTester({ entry, bits, lang }: { entry: ReferenceEntry; bits: number; lang: Lang }) {
  const t = (fr: string, en: string) => lang === "fr" ? fr : en;
  const widths = ([8, 16, 32, 64] as TesterWidth[]).filter((width) => width <= bits);
  const [left, setLeft] = useState("12");
  const [right, setRight] = useState("5");
  const [width, setWidth] = useState<TesterWidth>(widths.at(-1) ?? 8);
  const [format, setFormat] = useState<"dec" | "hex">("dec");
  const [result, setResult] = useState<TesterResult>();
  const [run, setRun] = useState(0);
  const parse = (value: string) => {
    try { return BigInt(value || "0"); } catch { return 0n; }
  };
  const display = (value: bigint) => format === "hex" ? `0x${value.toString(16).toUpperCase()}` : value.toString();
  const binary = (value: bigint) => value.toString(2).padStart(width, "0").slice(-width).replace(/(.{4})(?=.)/g, "$1 ");
  const reset = () => { setLeft("12"); setRight("5"); setResult(undefined); setRun(0); };
  const dirty = () => setResult(undefined);

  return <section className="panel mini-tester">
    <div className="panel-heading"><div><span className="eyebrow purple">{t("EXPÉRIMENTER", "EXPERIMENT")}</span><h2><FlaskConical size={19} /> {t(`Mini testeur ${entry.name}`, `${entry.name} mini tester`)}</h2></div><button className="pill" onClick={() => setFormat(format === "dec" ? "hex" : "dec")}>{format.toUpperCase()}</button></div>
    <p>{t("Modifiez les entrées, puis observez leur passage dans l’unité fonctionnelle. Les valeurs sont non signées et ramenées à la largeur choisie.", "Edit the inputs, then watch them pass through the functional unit. Values are unsigned and wrapped to the selected width.")}</p>
    <div className="tester-settings">
      <label>Source A<input aria-label={t("Valeur source A", "Source A value")} value={left} inputMode="numeric" onChange={(event) => { setLeft(event.target.value); dirty(); }} /></label>
      <label>Source B<input aria-label={t("Valeur source B", "Source B value")} value={right} inputMode="numeric" onChange={(event) => { setRight(event.target.value); dirty(); }} /></label>
      <label>{t("Largeur", "Width")}<select aria-label={t("Largeur du test", "Test width")} value={width} onChange={(event) => { setWidth(Number(event.target.value) as TesterWidth); dirty(); }}>{widths.map((item) => <option key={item} value={item}>{item} bits</option>)}</select></label>
    </div>
    <div className={`tester-flow ${result ? "executed" : ""}`} key={run}>
      <div className="tester-source"><small>A</small><strong>{display(BigInt.asUintN(width, parse(left)))}</strong><code>{binary(BigInt.asUintN(width, parse(left)))}</code></div>
      <div className="tester-source"><small>B</small><strong>{display(BigInt.asUintN(width, parse(right)))}</strong><code>{binary(BigInt.asUintN(width, parse(right)))}</code></div>
      <ArrowRight />
      <div className="tester-unit"><strong>{entry.name}</strong><small>{t("unité fonctionnelle", "functional unit")}</small></div>
      <ArrowRight />
      <div className="tester-result"><small>{t("Résultat", "Result")}</small><strong>{result ? display(result.value) : "—"}</strong><code>{result ? binary(result.value) : "·".repeat(width)}</code></div>
    </div>
    {result && <div className="tester-analysis">
      <div><small>{t("Opération illustrée", "Illustrated operation")}</small><code>{result.formula[lang]}</code></div>
      <div className="tester-flags"><span> Z {Number(result.flags.zero)}</span><span> N {Number(result.flags.negative)}</span><span> C {Number(result.flags.carry)}</span></div>
      <p>{result.detail[lang]}</p>
      <span className={`model-badge ${result.exact ? "exact" : "family"}`}>{result.exact ? t("Calcul exact pour cette opération simple", "Exact calculation for this simple operation") : t("Modèle pédagogique de la famille", "Teaching model of the family")}</span>
    </div>}
    <div className="tester-actions"><button className="button primary" onClick={() => { setResult(executeMiniTest(entry, parse(left), parse(right), width)); setRun((value) => value + 1); }}><Play size={16} />{t("Tester l’instruction", "Test instruction")}</button><button aria-label={t("Réinitialiser le mini testeur", "Reset mini tester")} onClick={reset}><RotateCcw size={18} /></button></div>
    <p className="field-hint">{t("Z, N et C sont des indicateurs pédagogiques calculés sur le résultat. Seul le manuel lié décrit les vrais indicateurs, exceptions, accès mémoire et effets privilégiés de cette forme.", "Z, N, and C are teaching flags computed from the result. Only the linked manual defines this form’s real flags, exceptions, memory accesses, and privileged effects.")}</p>
  </section>;
}
