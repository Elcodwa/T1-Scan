"use client";

import { Check, CircleAlert, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Answer, Answers, DimensionId, ScoreSet, Sex } from "@/lib/scoring/types";

const TABS: DimensionId[] = ["traits", "angularity", "dimorphism"];

/**
 * Lists every feature of a rubric with its ideal. Features the engine can measure are decided by the measurement;
 * the rest are answered by the user and are labelled self-reported everywhere (including the PDF).
 */
export function Checklist({ scores, sex, onAnswer }: { scores: ScoreSet; sex: Sex | null; answers: Answers; onAnswer: (id: string, a: Answer | undefined) => void }) {
  const [tab, setTab] = useState<DimensionId>("traits");
  const s = scores[tab]; const r = s.rubric;
  return (
    <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[.045] p-6 sm:p-7">
      <p className="text-[10px] font-bold tracking-[.18em] text-violet-200">COMPLETE YOUR ASSESSMENT</p>
      <h3 className="mt-2 text-xl font-semibold">Features a photo can&apos;t measure</h3>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-white/50">Geometry the app can measure is scored automatically. For the rest, mark whether each feature matches the ideal. Your answers are labelled <span className="text-white/70">self-reported</span> in the results and the PDF, and you can skip any of them.</p>
      <div role="tablist" className="mt-5 flex flex-wrap gap-2">
        {TABS.map((id) => { const d = scores[id].rubric; return <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`rounded-full border px-4 py-1.5 text-xs font-bold tracking-wide transition ${tab === id ? "border-violet-300/50 bg-violet-400/15 text-white" : "border-white/10 text-white/50 hover:text-white"}`}>{scores[id].name.toUpperCase()}{d && d.total > 0 ? <span className="ml-2 text-white/40">{d.assessed}/{d.total}</span> : null}</button>; })}
      </div>

      {r?.needsSex && !sex && <p className="mt-5 flex items-start gap-2 rounded-xl border border-amber-300/20 bg-amber-300/[.06] px-4 py-3 text-sm text-amber-100/85"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />Choose a reference set above. {s.name} defines its ideals separately for men and women.</p>}
      {r && r.criteria.length > 0 && <div className="mt-5 space-y-5">
        {r.groups.map((g) => (
          <section key={g.name}>
            <div className="flex items-baseline justify-between"><h4 className="text-sm font-semibold text-white/85">{g.name}</h4><span className="text-[11px] text-white/40">{g.points} of {g.total} ideal{g.assessed < g.total ? ` · ${g.total - g.assessed} unanswered` : ""}</span></div>
            <div className="mt-2 space-y-1.5">
              {r.criteria.filter((c) => c.group === g.name).map((c) => {
                const needsSet = c.ideal.startsWith("Choose a reference set");
                return (
                  <div key={c.id} className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/[.025] px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0"><p className="text-sm font-semibold text-white/85">{c.label}</p><p className="text-[11px] leading-4 text-white/40">Ideal: {c.ideal}</p>{c.detail && <p className="mt-0.5 text-[11px] leading-4 text-white/35">{c.detail}</p>}</div>
                    {c.basis === "measured" ? <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide ${c.state === "ideal" ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200" : "border-white/12 bg-white/[.04] text-white/55"}`}>MEASURED · {c.state === "ideal" ? "IDEAL" : "NOT IDEAL"}</span>
                      : needsSet ? <span className="shrink-0 text-[11px] text-white/35">choose a reference set</span>
                      : <div className="flex shrink-0 gap-1.5" role="group" aria-label={`${c.label}: ideal or not`}>
                          <Toggle active={c.state === "ideal"} tone="good" onClick={() => onAnswer(c.id, c.state === "ideal" ? undefined : "ideal")}><Check className="h-3.5 w-3.5" />Ideal</Toggle>
                          <Toggle active={c.state === "not_ideal"} tone="neutral" onClick={() => onAnswer(c.id, c.state === "not_ideal" ? undefined : "not_ideal")}><X className="h-3.5 w-3.5" />Not ideal</Toggle>
                        </div>}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>}
      {r && r.notes.map((n) => <p key={n} className="mt-4 text-[11px] leading-4 text-white/35">{n}</p>)}
      {r && r.sources.length > 0 && <details className="mt-3 text-[11px] text-white/35"><summary className="cursor-pointer font-semibold text-white/50">Sources</summary><ul className="mt-1.5 list-disc space-y-1 pl-4">{r.sources.map((x) => <li key={x}>{x}</li>)}</ul></details>}
    </div>
  );
}

function Toggle({ active, tone, onClick, children }: { active: boolean; tone: "good" | "neutral"; onClick: () => void; children: ReactNode }) {
  const on = tone === "good" ? "border-emerald-300/40 bg-emerald-300/15 text-emerald-100" : "border-white/30 bg-white/12 text-white";
  return <button onClick={onClick} aria-pressed={active} className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${active ? on : "border-white/10 text-white/50 hover:border-white/25 hover:text-white"}`}>{children}</button>;
}
