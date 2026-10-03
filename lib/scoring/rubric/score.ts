import { SCORING } from "../../confidence/constants";
import type { MetricResult } from "../../types/analysis";
import type { Answers, CriterionResult, CriterionSpec, DimensionScore, RubricSpec, ScoreStatus, Sex } from "../types";
import { runAutoRule } from "./auto";

/** The product's perfect score is displayed as 99 (see the Angularity scoring document). */
export const PERFECT_DISPLAY = 99;

const idealText = (c: CriterionSpec, sex: Sex | null): string | null => (typeof c.ideal === "string" ? c.ideal : sex ? c.ideal[sex] : null);
const applies = (c: CriterionSpec, sex: Sex | null) => !c.sexes || (sex !== null && c.sexes.includes(sex));
const statusFor = (coverage: number): ScoreStatus => (coverage >= SCORING.COMPLETE_COVERAGE ? "complete" : coverage >= SCORING.PARTIAL_COVERAGE ? "partial" : "unavailable");

/**
 * Binary rubric scoring exactly as specified: +1 for each ideal feature, divided by the number of features, × 100.
 * Features that could not be assessed are left out of the denominator (and reported as coverage) instead of being
 * counted as failures; with every feature assessed this is identical to points / N × 100.
 */
export function scoreRubric(spec: RubricSpec, metrics: MetricResult[], sex: Sex | null, answers: Answers): DimensionScore {
  const base = { id: spec.id, name: spec.name, description: spec.description, contributions: [], waitingOn: [], notMeasurable: [] as string[] };
  const detailBase = { sex, needsSex: spec.needsSex, sources: spec.sources, notes: spec.notes };
  if (spec.needsSex && !sex) return { ...base, status: "unavailable", value: null, coverage: 0, reliability: null, rubric: { ...detailBase, points: 0, assessed: 0, total: 0, measured: 0, selfReported: 0, groups: [], criteria: [] } };

  const criteria: CriterionResult[] = []; const groups: { name: string; points: number; assessed: number; total: number }[] = [];
  for (const group of spec.groups) {
    const g = { name: group.name, points: 0, assessed: 0, total: 0 };
    for (const c of group.criteria.filter((x) => applies(x, sex))) {
      const text = idealText(c, sex); const r: CriterionResult = { id: c.id, group: group.name, label: c.label, ideal: text ?? "Choose a reference set to see this ideal", state: "not_assessed", basis: "none", auto: Boolean(c.auto) };
      const auto = c.auto ? runAutoRule(c.auto, metrics, sex) : null;
      if (auto && auto.state !== "not_assessed") { r.state = auto.state; r.basis = "measured"; r.detail = auto.detail; r.confidence = auto.confidence; }
      else {
        if (auto) r.detail = auto.detail;
        const a = answers[c.id];
        if (text !== null && a) { r.state = a; r.basis = "self_reported"; }
      }
      g.total++; if (r.state !== "not_assessed") g.assessed++; if (r.state === "ideal") g.points++;
      criteria.push(r);
    }
    if (g.total > 0) groups.push(g); // groups that do not apply to this reference set are omitted
  }
  const total = criteria.length; const assessed = criteria.filter((r) => r.state !== "not_assessed").length; const points = criteria.filter((r) => r.state === "ideal").length;
  const coverage = total ? assessed / total : 0; const status = statusFor(coverage);
  const measured = criteria.filter((r) => r.basis === "measured").length; const selfReported = criteria.filter((r) => r.basis === "self_reported").length;
  const value = status === "unavailable" || !assessed ? null : Math.min(PERFECT_DISPLAY, Math.round((100 * points) / assessed));
  const confs = criteria.filter((r) => r.confidence !== undefined).map((r) => r.confidence as number);
  const reliability = confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : null;
  return { ...base, status, value, coverage, reliability, rubric: { ...detailBase, points, assessed, total, measured, selfReported, groups, criteria } };
}
