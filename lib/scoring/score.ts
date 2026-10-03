import { SCORING } from "../confidence/constants";
import { getMetric } from "../metrics/registry";
import type { AnalysisResult, MetricResult } from "../types/analysis";
import { DIMENSIONS } from "./dimensions";
import { scoreRubric } from "./rubric/score";
import { ANGULARITY, DIMORPHISM, TRAITS } from "./rubric/specs";
import type { Answers, DimensionInput, DimensionScore, DimensionSpec, Reference, RubricSpec, ScoreContribution, ScoreSet, Sex, WaitingItem } from "./types";

export function referenceScore(value: number, ref: Reference): number {
  const dist = value < ref.low ? ref.low - value : value > ref.high ? value - ref.high : 0;
  return Math.max(0, SCORING.MAX_SCORE * (1 - dist / ref.falloff));
}

/** Best (highest-confidence) measured result for a metric across the analysed views. */
function lookup(metrics: MetricResult[], id: string): MetricResult | undefined {
  return metrics.filter((m) => m.id === id && m.value !== null).sort((a, b) => b.confidence - a.confidence)[0];
}

interface Pool { contributions: ScoreContribution[]; waiting: WaitingItem[]; totalWeight: number }
function pool(inputs: DimensionInput[], metrics: MetricResult[]): Pool {
  const p: Pool = { contributions: [], waiting: [], totalWeight: 0 };
  for (const input of inputs) {
    p.totalWeight += input.weight;
    const def = getMetric(input.metricId);
    if (!def?.formula) { p.waiting.push({ metricId: input.metricId, label: input.label, reason: "no geometric definition registered yet" }); continue; }
    if (!input.reference) { p.waiting.push({ metricId: input.metricId, label: input.label, reason: "no reference range defined" }); continue; }
    const m = lookup(metrics, input.metricId);
    if (!m || m.value === null) { p.waiting.push({ metricId: input.metricId, label: input.label, reason: "not measurable in the supplied photos" }); continue; }
    if (m.confidence < SCORING.MIN_METRIC_CONFIDENCE) { p.waiting.push({ metricId: input.metricId, label: input.label, reason: "measurement confidence too low" }); continue; }
    p.contributions.push({ metricId: input.metricId, label: input.label, weight: input.weight, confidence: m.confidence, value: m.value, score: referenceScore(m.value, input.reference), reference: input.reference });
  }
  return p;
}

/** Confidence-weighted mean: a low-confidence measurement moves the score less than a reliable one. */
function aggregate(c: ScoreContribution[]): { value: number | null; reliability: number | null } {
  const den = c.reduce((s, x) => s + x.weight * x.confidence, 0);
  if (!c.length || den <= 0) return { value: null, reliability: null };
  return { value: c.reduce((s, x) => s + x.weight * x.confidence * x.score, 0) / den, reliability: den / c.reduce((s, x) => s + x.weight, 0) };
}
const statusFor = (coverage: number) => (coverage >= SCORING.COMPLETE_COVERAGE ? "complete" : coverage >= SCORING.PARTIAL_COVERAGE ? "partial" : "unavailable") as DimensionScore["status"];

export function scoreDimension(spec: DimensionSpec, metrics: MetricResult[]): DimensionScore {
  const base = { id: spec.id, name: spec.name, description: spec.description, notMeasurable: spec.notMeasurable };
  const p = pool(spec.inputs, metrics);
  const measuredWeight = p.contributions.reduce((s, c) => s + c.weight, 0);
  const coverage = p.totalWeight ? measuredWeight / p.totalWeight : 0;
  const status = statusFor(coverage); const agg = aggregate(p.contributions);
  return { ...base, status, value: status === "unavailable" ? null : agg.value, coverage, reliability: agg.reliability, contributions: p.contributions, waitingOn: p.waiting };
}

export interface ScoreContext { sex?: Sex | null; answers?: Answers }

/** All four dimensions on one 0–100 scale. Pure: same analysis + same answers => same scores. */
export function scoreAll(analysis: AnalysisResult["analysis"], ctx: ScoreContext = {}): ScoreSet {
  const metrics = [...(analysis.front?.metrics ?? []), ...(analysis.profile?.metrics ?? [])];
  const sex = ctx.sex ?? null; const answers = ctx.answers ?? {};
  const harmonyRaw = scoreDimension(DIMENSIONS[0], metrics);
  const harmony: DimensionScore = { ...harmonyRaw, value: harmonyRaw.value === null ? null : harmonyRaw.value * 10 };
  const rubric = (spec: RubricSpec) => scoreRubric(spec, metrics, sex, answers);
  return { harmony, traits: rubric(TRAITS), angularity: rubric(ANGULARITY), dimorphism: rubric(DIMORPHISM) };
}
