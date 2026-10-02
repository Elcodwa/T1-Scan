"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ChevronDown, CircleAlert, Download, FileText, Lightbulb, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { collectFindings, coverage, photoQuality, photoTips, TRUST_LABEL, type Finding } from "@/lib/analysis/insights";
import { formatUncertainty, formatValue } from "@/lib/analysis/format";
import { AREAS, guideFor, type Area } from "@/lib/metrics/guide";
import { scoreAll } from "@/lib/scoring/score";
import { buildReport } from "@/lib/report/buildReport";
import { renderAnnotatedJpeg } from "@/lib/report/annotate";
import { downloadPdf, reportFilename } from "@/lib/report/download";
import type { Answer, Answers, DimensionId, DimensionScore, Sex } from "@/lib/scoring/types";
import { Checklist } from "./Checklist";
import { plainReason } from "./ResultsPanel";
import { RangeBar, VERDICT_TEXT } from "./RangeBar";
import type { AnalysisResult, ImageView, MetricResult } from "@/lib/types/analysis";

const ORDER: DimensionId[] = ["harmony", "traits", "angularity", "dimorphism"];
export interface AssessmentState { sex: Sex | null; answers: Answers; onSex: (s: Sex) => void; onAnswer: (id: string, a: Answer | undefined) => void }

const SCORE_COPY: Record<DimensionId, { title: string; plain: string }> = {
  harmony: { title: "Harmony", plain: "How balanced your proportions are compared with commonly cited reference ranges." },
  traits: { title: "Traits", plain: "How many of the listed facial features match their ideal." },
  angularity: { title: "Angularity", plain: "How defined and structured the jaw, cheekbones and brow area are." },
  dimorphism: { title: "Dimorphism", plain: "How strongly features match the typical pattern of the chosen reference set." },
};
const STATE = {
  complete: { label: "Full result", chip: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200", bar: "#6ee7b7" },
  partial: { label: "Partial result", chip: "border-amber-300/25 bg-amber-300/10 text-amber-200", bar: "#fcd34d" },
  unavailable: { label: "Needs more info", chip: "border-white/10 bg-white/[.04] text-white/50", bar: "#64748b" },
} as const;
const QUALITY_CHIP = { good: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200", fair: "border-amber-300/25 bg-amber-300/10 text-amber-200", limited: "border-rose-300/25 bg-rose-300/10 text-rose-200" } as const;
const TRUST_DOT = { solid: "bg-emerald-300", good: "bg-teal-300", approximate: "bg-amber-300" } as const;

/** Final step. Order of importance: what you got → what stands out → every measurement → optional extras → report. */
export function FinalResults({ result, photos, assessment, onBack }: { result: AnalysisResult; photos: Partial<Record<ImageView, string>>; assessment: AssessmentState; onBack: () => void }) {
  const { sex, answers, onSex, onAnswer } = assessment;
  const scores = useMemo(() => scoreAll(result.analysis, { sex, answers }), [result.analysis, sex, answers]);
  const findings = useMemo(() => collectFindings(result.analysis), [result.analysis]);
  const cov = useMemo(() => coverage(result.analysis), [result.analysis]);
  const [includePhotos, setIncludePhotos] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState<string>();
  const [showExtras, setShowExtras] = useState(false);

  const download = async () => {
    setBusy(true); setError(undefined);
    try {
      const images: Partial<Record<ImageView, Uint8Array>> = {};
      if (includePhotos) for (const v of ["front", "profile"] as const) { const a = result.analysis[v]; const url = photos[v]; if (a && a.status !== "failed" && url) { const jpg = await renderAnnotatedJpeg(url, a); if (jpg) images[v] = jpg; } }
      downloadPdf(buildReport({ result: { ...result, scores }, images }), reportFilename());
    } catch { setError("The report could not be generated. Please try again."); } finally { setBusy(false); }
  };

  const withVerdict = findings.filter((f) => f.verdict !== "none");
  const inRange = withVerdict.filter((f) => f.verdict === "typical"); const outRange = withVerdict.filter((f) => f.verdict !== "typical");
  const tips = [...new Set((["front", "profile"] as const).flatMap((v) => photoTips(result.analysis[v])))];

  return (
    <div className="mx-auto mt-10 max-w-5xl">
      <div className="text-center">
        <p className="text-[10px] font-bold tracking-[.18em] text-violet-200">YOUR RESULTS</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Here&apos;s what we measured</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/55"><span className="font-semibold text-white/80">{cov.measured} of {cov.total}</span> measurements came out of your photos. These describe facial geometry against reference ranges — not attractiveness or worth.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">{(["front", "profile"] as const).map((v) => { const q = photoQuality(result.analysis[v]); return q ? <span key={v} className={`rounded-full border px-3 py-1 text-[10px] font-bold tracking-wide ${QUALITY_CHIP[q.tone]}`}>{v === "front" ? "FRONT" : "SIDE"} PHOTO · {q.label.toUpperCase()}</span> : null; })}</div>
      </div>

      {tips.length > 0 && <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-amber-300/20 bg-amber-300/[.05] p-4">
        <p className="flex items-center gap-2 text-xs font-bold text-amber-100"><Lightbulb className="h-3.5 w-3.5" />For a sharper result next time</p>
        <ul className="mt-2 space-y-1">{tips.map((t) => <li key={t} className="text-xs leading-5 text-amber-100/80">• {t}</li>)}</ul>
      </div>}

      {/* 1 — scores */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <div role="radiogroup" aria-label="Reference set" className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[.03] p-1">
          <span className="px-3 text-[10px] font-bold tracking-[.14em] text-white/40">SCORE FOR</span>
          {(["male", "female"] as const).map((v) => <button key={v} role="radio" aria-checked={sex === v} onClick={() => onSex(v)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${sex === v ? "bg-white text-[#18152c]" : "text-white/55 hover:text-white"}`}>{v === "male" ? "Men’s ideals" : "Women’s ideals"}</button>)}
        </div>
        <p className="max-w-md text-center text-[11px] leading-4 text-white/35">Angularity, Dimorphism and Traits need you to pick a set. It&apos;s your choice — never guessed from your photo.</p>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{ORDER.map((id, i) => <ScoreCard key={id} id={id} score={scores[id]} index={i} needsPick={!sex} onOpenExtras={() => setShowExtras(true)} />)}</div>

      {/* 2 — what stands out */}
      {withVerdict.length > 0 && <section className="mt-10">
        <h3 className="text-xl font-semibold">What stands out</h3>
        <p className="mt-1 text-sm text-white/50">Measurements that have a commonly cited typical range. Being outside a range is a difference, not a flaw.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[...outRange, ...inRange].map((f) => <FindingCard key={f.metric.id} f={f} />)}
        </div>
      </section>}

      {/* 3 — everything, grouped */}
      <Explorer findings={findings} notMeasured={cov.notMeasured} />

      {/* 4 — optional */}
      <div id="optional-answers" className="mt-8 rounded-[28px] border border-white/10 bg-white/[.03]">
        <button onClick={() => setShowExtras((v) => !v)} aria-expanded={showExtras} className="flex w-full items-center justify-between gap-3 px-6 py-5 text-left">
          <span><span className="block text-sm font-semibold">Optional: add what a photo can&apos;t measure</span><span className="mt-0.5 block text-xs text-white/45">Answer a few yes/no questions to complete Traits, Angularity and Dimorphism. Skip anything you like.</span></span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-white/50 transition ${showExtras ? "rotate-180" : ""}`} />
        </button>
        {showExtras && <div className="px-2 pb-2 sm:px-3"><Checklist scores={scores} sex={sex} answers={answers} onAnswer={onAnswer} /></div>}
      </div>

      {/* 5 — report */}
      <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[.045] p-6 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-violet-300/25 bg-violet-400/10 text-violet-200"><FileText className="h-5 w-5" /></span>
            <div><h3 className="text-lg font-semibold">Save your report</h3><p className="mt-1 max-w-md text-sm leading-6 text-white/50">A PDF with every measurement, how sure we are about each, and how the scores were built.</p></div>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <button onClick={download} disabled={busy} className="inline-flex min-w-[210px] items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-[#18152c] transition hover:bg-violet-100 disabled:cursor-wait disabled:opacity-60">{busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Building report</> : <><Download className="h-4 w-4" /> Download PDF</>}</button>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-white/55"><input type="checkbox" checked={includePhotos} onChange={(e) => setIncludePhotos(e.target.checked)} className="h-3.5 w-3.5 accent-violet-400" />Include my photos with measurement overlays</label>
          </div>
        </div>
        {error && <p role="alert" className="mt-4 flex items-center gap-2 text-sm text-rose-200"><CircleAlert className="h-4 w-4" />{error}</p>}
        <p className="mt-4 text-[11px] leading-5 text-white/35">The report is generated on this device. Measurements describe facial geometry against reference relationships; they do not determine attractiveness, health or worth.</p>
      </div>

      <div className="mt-6 flex justify-center"><button onClick={onBack} className="inline-flex items-center gap-2 text-xs font-bold text-white/55 transition hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Back to my photos</button></div>
    </div>
  );
}

function ScoreCard({ id, score, index, needsPick, onOpenExtras }: { id: DimensionId; score: DimensionScore; index: number; needsPick: boolean; onOpenExtras: () => void }) {
  const [open, setOpen] = useState(false); const st = STATE[score.status]; const copy = SCORE_COPY[id];
  const waitingForSet = Boolean(score.rubric?.needsSex && score.rubric.total === 0);
  const needsAnswers = Boolean(score.rubric) && !waitingForSet && score.value === null;
  const detail = score.rubric
    ? waitingForSet ? "Pick a score set above to see this" : `${score.rubric.assessed} of ${score.rubric.total} features assessed`
    : `${Math.round(score.coverage * 100)}% of its measurements were available`;
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="rounded-[28px] border border-white/10 bg-white/[.045] p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white/85">{copy.title}</p>
          <p className={`mt-1.5 font-extrabold tracking-tight ${score.value === null ? "text-xl text-white/35" : "text-5xl text-white"}`}>{score.value === null ? (waitingForSet && needsPick ? "Pick a set" : needsAnswers ? "Almost there" : "Not enough data") : <>{Math.round(score.value)}<span className="ml-1 text-lg font-semibold text-white/35">/ 100</span></>}</p>
        </div>
        <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-bold ${st.chip}`}>{st.label}</span>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/8"><motion.div className="h-full rounded-full" style={{ background: st.bar }} initial={{ width: 0 }} animate={{ width: `${Math.max(2, Math.round(score.coverage * 100))}%` }} transition={{ delay: 0.2 + index * 0.06, duration: 0.6 }} /></div>
      <p className="mt-2 text-xs text-white/45">{detail}</p>
      <p className="mt-3 text-sm leading-6 text-white/55">{copy.plain}</p>
      {needsAnswers && <button onClick={() => { onOpenExtras(); document.getElementById("optional-answers")?.scrollIntoView({ behavior: "smooth", block: "center" }); }} className="mt-3 text-xs font-bold text-violet-200 transition hover:text-white">Answer a few questions to unlock this →</button>}
      {score.contributions.length > 0 && <>
        <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-white/55 transition hover:text-white"><ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />What this is based on</button>
        {open && <div className="mt-3 space-y-1.5">{score.contributions.map((c) => <div key={c.metricId} className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[.025] px-3 py-2 text-[11px]"><span className="font-semibold text-white/80">{c.label}</span><span className="text-white/45">{c.value.toFixed(c.value < 5 ? 2 : 0)} · {Math.round(c.score * 10)}/100</span></div>)}</div>}
      </>}
    </motion.div>
  );
}

function FindingCard({ f }: { f: Finding }) {
  const m = f.metric; const g = guideFor(m.id, m.name, m.category); const vt = VERDICT_TEXT[f.verdict];
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="truncate text-sm font-semibold text-white/90">{f.title}</p><p className="text-[10px] tracking-wide text-white/35">{f.area.toUpperCase()}</p></div>
        <p className="shrink-0 text-xl font-extrabold">{formatValue(m)}</p>
      </div>
      <div className="mt-3"><RangeBar value={m.value as number} scale={g.scale} band={g.band} verdict={f.verdict} /></div>
      <div className="mt-2.5 flex items-center justify-between gap-2"><span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wide ${vt.chip}`}>{vt.label.toUpperCase()}</span>{f.trust === "approximate" && <span className="text-[10px] font-semibold text-amber-200/80">approximate</span>}</div>
      {f.note && <p className="mt-2 text-xs leading-5 text-white/50">{f.note}</p>}
    </div>
  );
}

function Explorer({ findings, notMeasured }: { findings: Finding[]; notMeasured: MetricResult[] }) {
  const areas = AREAS.filter((a) => findings.some((f) => f.area === a)); const [area, setArea] = useState<Area | undefined>(); const [tech, setTech] = useState(false); const [openId, setOpenId] = useState<string>();
  const current = area && areas.includes(area) ? area : areas[0];
  if (!current) return null;
  const rows = findings.filter((f) => f.area === current);
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h3 className="text-xl font-semibold">All measurements</h3><p className="mt-1 text-sm text-white/50">Browse by area. Tap a row to see what it means.</p></div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-white/50"><input type="checkbox" checked={tech} onChange={(e) => setTech(e.target.checked)} className="h-3.5 w-3.5 accent-violet-400" />Show technical details</label>
      </div>
      <div role="tablist" className="mt-4 flex flex-wrap gap-2">{areas.map((a) => <button key={a} role="tab" aria-selected={a === current} onClick={() => setArea(a)} className={`rounded-full border px-4 py-1.5 text-xs font-bold tracking-wide transition ${a === current ? "border-violet-300/50 bg-violet-400/15 text-white" : "border-white/10 text-white/50 hover:text-white"}`}>{a.toUpperCase()}<span className="ml-2 text-white/40">{findings.filter((f) => f.area === a).length}</span></button>)}</div>
      <div className="mt-4 space-y-2">
        {rows.map((f) => { const m = f.metric; const g = guideFor(m.id, m.name, m.category); const open = openId === m.id; const vt = VERDICT_TEXT[f.verdict]; const u = formatUncertainty(m);
          return <div key={m.id} className="rounded-2xl border border-white/8 bg-white/[.03]">
            <button onClick={() => setOpenId(open ? undefined : m.id)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
              <span className="min-w-0"><span className="block truncate text-sm font-semibold text-white/90">{f.title}</span><span className="mt-0.5 flex items-center gap-2 text-[11px] text-white/45"><span className={`h-1.5 w-1.5 rounded-full ${TRUST_DOT[f.trust]}`} />{TRUST_LABEL[f.trust]}{f.verdict !== "none" && <span className={`rounded-full border px-1.5 py-px text-[9px] font-bold ${vt.chip}`}>{vt.label}</span>}</span></span>
              <span className="shrink-0 text-right"><span className="text-base font-extrabold text-white">{formatValue(m)}</span>{(tech || f.trust === "approximate") && u && <span className="ml-1 text-[11px] text-white/40">{u}</span>}</span>
            </button>
            {open && <div className="space-y-3 border-t border-white/8 px-4 py-3">
              <p className="text-xs leading-5 text-white/60">{g.what}{f.note ? ` ${f.note}` : ""}</p>
              <RangeBar value={m.value as number} scale={g.scale} band={g.band} verdict={f.verdict} />
              {g.band && <p className="text-[10px] text-white/35">Shaded = typical range ({g.band.low}–{g.band.high}). {g.band.source}</p>}
              {tech && <div className="space-y-1 rounded-xl bg-black/20 p-3 text-[11px] leading-4 text-white/45"><p>Measured on the {f.view === "front" ? "front" : "side"} photo · confidence {Math.round(m.confidence * 100)}%{u ? ` · margin ${u}` : ""}</p>{m.confidenceBreakdown && <p>{Object.entries(m.confidenceBreakdown).map(([k, v]) => `${k} ${Math.round(v * 100)}%`).join(" · ")}</p>}{m.reasons.length > 0 && <p>{m.reasons.join(" ")}</p>}</div>}
            </div>}
          </div>; })}
      </div>
      {notMeasured.length > 0 && <details className="mt-4 text-xs text-white/45"><summary className="cursor-pointer font-bold text-white/55">Not measured ({notMeasured.length})</summary><ul className="mt-2 space-y-1.5">{notMeasured.map((m) => <li key={`${m.view}-${m.id}`} className="rounded-xl border border-white/8 bg-white/[.02] px-3 py-2"><span className="font-semibold text-white/70">{guideFor(m.id, m.name, m.category).title}</span> <span className="text-white/35">· {m.view === "front" ? "front" : "side"}</span><span className="mt-0.5 block text-[11px] leading-4 text-white/40">{plainReason(m)}</span></li>)}</ul></details>}
    </section>
  );
}
