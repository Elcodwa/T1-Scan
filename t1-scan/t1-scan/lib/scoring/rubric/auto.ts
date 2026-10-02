import { SCORING } from "../../confidence/constants";
import type { MetricResult } from "../../types/analysis";
import type { AutoRuleId, Sex } from "../types";
import { THRESHOLDS } from "./thresholds";

export interface AutoOutcome { state: "ideal" | "not_ideal" | "not_assessed"; detail: string; confidence?: number }

const best = (metrics: MetricResult[], id: string): MetricResult | undefined =>
  metrics.filter((m) => m.id === id && m.value !== null && m.confidence >= SCORING.MIN_METRIC_CONFIDENCE).sort((a, b) => b.confidence - a.confidence)[0];

/**
 * A measurement that sits closer to the cut-off than its own uncertainty cannot honestly be called either way,
 * so it is left unassessed (and can be answered by the user instead).
 */
function decide(m: MetricResult, cutoff: number, idealWhenAbove: boolean, fmt: (v: number) => string, label: string): AutoOutcome {
  const v = m.value as number;
  if (m.uncertainty !== null && Math.abs(v - cutoff) < m.uncertainty) return { state: "not_assessed", detail: `${label} ${fmt(v)} is within its ±${fmt(m.uncertainty)} uncertainty of the cut-off ${fmt(cutoff)}: too close to call`, confidence: m.confidence };
  const ideal = idealWhenAbove ? v >= cutoff : v <= cutoff;
  return { state: ideal ? "ideal" : "not_ideal", detail: `${label} ${fmt(v)} (cut-off ${idealWhenAbove ? "≥" : "≤"} ${fmt(cutoff)})`, confidence: m.confidence };
}

const f2 = (v: number) => v.toFixed(2); const f0 = (v: number) => `${v.toFixed(0)}°`;

export function runAutoRule(rule: AutoRuleId, metrics: MetricResult[], sex: Sex | null): AutoOutcome | null {
  const jaw = THRESHOLDS.jawToCheekMaleTypicalMin.value;
  switch (rule) {
    case "mandible_flare": { const m = best(metrics, "bigonial_bizygomatic"); return m ? decide(m, jaw, true, f2, "Jaw/cheekbone width") : null; }
    case "jaw_ratio": { if (!sex) return null; const m = best(metrics, "bigonial_bizygomatic"); return m ? decide(m, jaw, sex === "male", f2, "Jaw/cheekbone width") : null; }
    case "alar_width": { const m = best(metrics, "alar_icd"); return m ? decide(m, THRESHOLDS.alarToIcdMax.value, false, f2, "Alar/ICD") : null; }
    case "radix_projection": { const m = best(metrics, "nfa"); return m ? decide(m, THRESHOLDS.nasofrontalProjectedMax.value, false, f0, "Nasofrontal angle") : null; }
  }
}
