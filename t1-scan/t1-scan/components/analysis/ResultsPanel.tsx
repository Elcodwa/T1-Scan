"use client";

import { ChevronDown, CircleAlert, Lightbulb } from "lucide-react";
import { useMemo, useState } from "react";
import { formatUncertainty, formatValue } from "@/lib/analysis/format";
import { collectFindings, photoQuality, photoTips, TRUST_LABEL, type Finding } from "@/lib/analysis/insights";
import { AREAS, guideFor } from "@/lib/metrics/guide";
import type { MetricResult, ViewAnalysis } from "@/lib/types/analysis";
import { RangeBar, VERDICT_TEXT } from "./RangeBar";

const TRUST_DOT = { solid: "bg-emerald-300", good: "bg-teal-300", approximate: "bg-amber-300" } as const;
const QUALITY_CHIP = { good: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200", fair: "border-amber-300/25 bg-amber-300/10 text-amber-200", limited: "border-rose-300/25 bg-rose-300/10 text-rose-200" } as const;

/** Review step: pick a measurement to see it drawn on the photo. Plain names first; the engineering detail is one tap away. */
export function ResultsPanel({ analysis, activeId, onSelect }: { analysis: ViewAnalysis; activeId?: string; onSelect: (id: string) => void }) {
  const [showRest, setShowRest] = useState(false); const [showTips, setShowTips] = useState(true); const [advanced, setAdvanced] = useState(false);
  const findings = useMemo(() => collectFindings({ [analysis.view]: analysis }), [analysis]);
  const rest = analysis.metrics.filter((m) => m.value === null);
  const quality = photoQuality(analysis); const tips = photoTips(analysis);
  const groups = AREAS.map((area) => ({ area, items: findings.filter((f) => f.area === area) })).filter((g) => g.items.length);

  return (
    <aside className="flex flex-col rounded-[30px] border border-white/10 bg-white/[.045] p-5 sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[.18em] text-violet-200">{analysis.view === "front" ? "FRONT PHOTO" : "SIDE PHOTO"}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{findings.length} of {analysis.metrics.length} measured</h2>
        </div>
        {quality && <span className={`mt-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide ${QUALITY_CHIP[quality.tone]}`}>PHOTO QUALITY · {quality.label.toUpperCase()}</span>}
      </div>
      <p className="mt-2 text-sm leading-6 text-white/50">Tap a measurement to see exactly where it was taken on your photo. Values marked <span className="text-amber-200">approximate</span> are shown with their margin of error rather than hidden.</p>

      {tips.length > 0 && <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/[.05] p-3.5">
        <button onClick={() => setShowTips((v) => !v)} aria-expanded={showTips} className="flex w-full items-center justify-between gap-2 text-left text-xs font-bold text-amber-100"><span className="inline-flex items-center gap-2"><Lightbulb className="h-3.5 w-3.5" />How to get a sharper result</span><ChevronDown className={`h-3.5 w-3.5 transition ${showTips ? "rotate-180" : ""}`} /></button>
        {showTips && <ul className="mt-2 space-y-1.5">{tips.map((t) => <li key={t} className="text-xs leading-5 text-amber-100/80">• {t}</li>)}</ul>}
      </div>}

      <div className="mt-5 max-h-[560px] space-y-5 overflow-y-auto pr-1">
        {groups.map((g) => <section key={g.area}>
          <h3 className="mb-2 text-[10px] font-bold tracking-[.16em] text-white/40">{g.area.toUpperCase()}</h3>
          <div className="space-y-2">{g.items.map((f) => <Row key={f.metric.id} f={f} active={f.metric.id === activeId} advanced={advanced} onSelect={() => onSelect(f.metric.id)} />)}</div>
        </section>)}
        {findings.length === 0 && <p className="rounded-xl border border-white/8 bg-white/[.025] p-4 text-sm text-white/55">Nothing could be measured from this photo. Try one of the tips above.</p>}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        {rest.length > 0 && <button onClick={() => setShowRest((v) => !v)} className="inline-flex items-center gap-1.5 text-xs font-bold text-white/55 transition hover:text-white"><ChevronDown className={`h-3.5 w-3.5 transition ${showRest ? "rotate-180" : ""}`} />Not measured ({rest.length})</button>}
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-white/45"><input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} className="h-3.5 w-3.5 accent-violet-400" />Show technical details</label>
      </div>
      {showRest && <ul className="mt-3 max-h-56 space-y-1.5 overflow-y-auto pr-1">{rest.map((m) => <li key={m.id} className="rounded-xl border border-white/8 bg-white/[.02] px-3 py-2"><p className="text-xs font-semibold text-white/75">{guideFor(m.id, m.name, m.category).title}</p><p className="mt-0.5 text-[11px] leading-4 text-white/40">{plainReason(m)}</p></li>)}</ul>}

      {analysis.pose && advanced && <p className="mt-4 text-[11px] text-white/40">Head pose: yaw {analysis.pose.yaw.toFixed(0)}° · pitch {analysis.pose.pitch.toFixed(0)}° · roll {analysis.pose.roll.toFixed(0)}° · {analysis.pose.classification.replace("_", " ").toLowerCase()} · {analysis.provider}</p>}
      {analysis.warnings.length > 0 && advanced && <div className="mt-3 space-y-1.5">{[...new Set(analysis.warnings)].map((w) => <p key={w} className="flex items-start gap-1.5 text-xs leading-5 text-amber-100/70"><CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />{w}</p>)}</div>}
    </aside>
  );
}

/** Turns the engine's internal reason into a sentence a user can act on. */
export function plainReason(m: MetricResult): string {
  if (m.status === "definition_required") return "Needs a neck-detection model, which isn't part of the face scan yet.";
  if (m.status === "invalid") return "The result looked physically implausible, so it was left out. A straighter, sharper photo usually fixes this.";
  const r = m.reasons[0] ?? "";
  if (/turned too far|only .* turned|side view/i.test(r)) return r;
  if (/Landmark not found/i.test(r)) return "The face scan couldn't find a point this measurement needs.";
  return "This photo doesn't support a trustworthy number for this measurement. A sharper, evenly lit photo may.";
}

function Row({ f, active, advanced, onSelect }: { f: Finding; active: boolean; advanced: boolean; onSelect: () => void }) {
  const m = f.metric; const g = guideFor(m.id, m.name, m.category); const u = formatUncertainty(m); const vt = VERDICT_TEXT[f.verdict];
  return (
    <button onClick={onSelect} aria-pressed={active} className={`w-full rounded-2xl border px-4 py-3 text-left transition ${active ? "border-violet-300/50 bg-violet-400/10" : "border-white/8 bg-white/[.025] hover:border-white/20"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold text-white/90">{g.title}</p>
        <p className="shrink-0 text-base font-extrabold text-white">{formatValue(m)}{(advanced || f.trust === "approximate") && u && <span className="ml-1 text-[11px] font-semibold text-white/40">{u}</span>}</p>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {f.verdict !== "none" && <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wide ${vt.chip}`}>{vt.label.toUpperCase()}</span>}
        <span className="inline-flex items-center gap-1.5 text-[11px] text-white/45"><span className={`h-1.5 w-1.5 rounded-full ${TRUST_DOT[f.trust]}`} />{TRUST_LABEL[f.trust]}{advanced && ` · ${Math.round(m.confidence * 100)}%`}</span>
      </div>
      {active && <div className="mt-3 space-y-2.5">
        <p className="text-xs leading-5 text-white/55">{g.what}{f.note ? ` ${f.note}` : ""}</p>
        <RangeBar value={m.value as number} scale={g.scale} band={g.band} verdict={f.verdict} />
        {g.band && <p className="text-[10px] text-white/35">Shaded = typical range ({g.band.low}–{g.band.high}).</p>}
      </div>}
    </button>
  );
}

