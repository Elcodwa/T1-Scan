import { CONFIDENCE } from "../confidence/constants";
import type { HarmonyScore, MetricResult } from "../types/analysis";
import type { MetricDefinition } from "../metrics/types";

/**
 * Transparent reference-relationship score. It reads only measured metrics that have an explicit
 * reference (ideal ± halfWidth) and weight in the registry, and is weighted by measurement confidence.
 * It describes closeness to defined geometric reference relationships, not attractiveness or worth.
 */
export function computeHarmony(defs: MetricDefinition[], results: MetricResult[]): HarmonyScore {
  const scored = defs.filter((d) => d.reference && d.weight && d.formula);
  if (!scored.length) return { value: null, status: "unavailable", reasons: ["No reference relationships have been defined for this view, so no score is computed."], contributions: [] };
  const byId = new Map(results.map((r) => [r.id, r]));
  let totalWeight = 0; let usableWeight = 0; let num = 0; let den = 0;
  const contributions: HarmonyScore["contributions"] = [];
  for (const d of scored) {
    totalWeight += d.weight!;
    const r = byId.get(d.id);
    if (!r || r.value === null || r.confidence < CONFIDENCE.HARMONY_MIN_METRIC_CONFIDENCE) continue;
    const score = Math.max(0, 1 - Math.abs(r.value - d.reference!.ideal) / d.reference!.halfWidth) * 10;
    usableWeight += d.weight!; num += d.weight! * r.confidence * score; den += d.weight! * r.confidence;
    contributions.push({ id: d.id, weight: d.weight!, confidence: r.confidence, score });
  }
  if (totalWeight === 0 || usableWeight / totalWeight < CONFIDENCE.HARMONY_MIN_WEIGHT_COVERAGE)
    return { value: null, status: "unavailable", reasons: ["Too many reference measurements are unavailable or low-confidence for a trustworthy score."], contributions };
  return { value: num / den, status: "available", reasons: [], contributions };
}
