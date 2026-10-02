import { CONFIDENCE } from "../confidence/constants";
import { guideFor, verdictOf, type Area, type Verdict } from "../metrics/guide";
import type { ImageView, MetricResult, ViewAnalysis } from "../types/analysis";

/** How much to trust a number, in words a person can act on. */
export type Trust = "solid" | "good" | "approximate";
export const trustOf = (m: Pick<MetricResult, "confidence" | "status">): Trust =>
  m.confidence >= CONFIDENCE.STATUS_RELIABLE ? "solid" : m.confidence >= CONFIDENCE.STATUS_USABLE ? "good" : "approximate";
export const TRUST_LABEL: Record<Trust, string> = { solid: "Solid", good: "Good", approximate: "Approximate" };

export interface Finding { metric: MetricResult; view: ImageView; title: string; area: Area; verdict: Verdict; note?: string; trust: Trust }

/** All measured values across the supplied views, with plain-language labels. One entry per metric (best confidence wins). */
export function collectFindings(analysis: { front?: ViewAnalysis; profile?: ViewAnalysis }): Finding[] {
  const best = new Map<string, Finding>();
  for (const view of ["front", "profile"] as const) {
    for (const m of analysis[view]?.metrics ?? []) {
      if (m.value === null) continue;
      const g = guideFor(m.id, m.name, m.category); const v = verdictOf(m.id, m.value);
      const f: Finding = { metric: m, view, title: g.title, area: g.area, verdict: v.verdict, note: v.note, trust: trustOf(m) };
      const prev = best.get(m.id); if (!prev || prev.metric.confidence < m.confidence) best.set(m.id, f);
    }
  }
  return [...best.values()];
}

export interface Coverage { measured: number; total: number; notMeasured: MetricResult[] }
export function coverage(analysis: { front?: ViewAnalysis; profile?: ViewAnalysis }): Coverage {
  const all = (["front", "profile"] as const).flatMap((v) => analysis[v]?.status === "failed" ? [] : analysis[v]?.metrics ?? []);
  return { measured: all.filter((m) => m.value !== null).length, total: all.length, notMeasured: all.filter((m) => m.value === null) };
}

/** Actionable, photo-level advice (shown once per photo instead of repeated on every metric). */
export function photoTips(a: ViewAnalysis | undefined): string[] {
  if (!a || a.status === "failed") return [];
  const tips: string[] = []; const s = a.forensics?.scores; const view = a.view;
  if (s) {
    if (s.exposure < 0.5) tips.push((a.forensics?.brightness ?? 128) < 135 ? "Retake in brighter, even light — the face is a bit dark." : "Retake with softer light — parts of the face are washed out (avoid flash or direct sun).");
    if (s.resolution < 0.4) tips.push("Move closer or use a higher-resolution original — the face covers very few pixels.");
    if (s.sharpness < 0.4) tips.push("Hold the camera steady and tap to focus on the face — the photo is blurry.");
    if (s.compression < 0.4) tips.push("Use the original file, not a screenshot or a copy sent through a chat app — heavy compression blurs fine details.");
  }
  const yaw = Math.abs(a.pose?.yaw ?? 0);
  if (view === "front" && yaw > CONFIDENCE.POSE_FRONTAL_MAX) tips.push("Face the camera straight on for the front photo.");
  if (view === "profile" && a.pose && yaw < CONFIDENCE.PROFILE_FULL_YAW) tips.push("Turn fully sideways (90°) for the side photo — it gives the most accurate profile angles.");
  if (a.expression?.affected.length) tips.push("Relax your face (neutral mouth, no smile) — expression changes the mouth and eye measurements.");
  return tips;
}

export type PhotoQuality = { label: "Good" | "Fair" | "Limited"; tone: "good" | "fair" | "limited" };
export function photoQuality(a: ViewAnalysis | undefined): PhotoQuality | null {
  if (!a || a.status === "failed" || !a.forensics) return null;
  const o = a.forensics.scores.overall;
  return o >= 0.7 ? { label: "Good", tone: "good" } : o >= 0.45 ? { label: "Fair", tone: "fair" } : { label: "Limited", tone: "limited" };
}
