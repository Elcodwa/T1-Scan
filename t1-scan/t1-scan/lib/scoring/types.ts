export type DimensionId = "harmony" | "angularity" | "dimorphism" | "traits";

/** Which reference set (ideal definitions) a rubric uses. Chosen by the user; never inferred from the face. */
export type Sex = "male" | "female";
export type Answer = "ideal" | "not_ideal";
export type Answers = Partial<Record<string, Answer>>;
export type AutoRuleId = "mandible_flare" | "jaw_ratio" | "alar_width" | "radix_projection";

export interface CriterionSpec {
  id: string; label: string;
  /** What "ideal" means; may differ by reference set. */
  ideal: string | Record<Sex, string>;
  /** Applies only to these reference sets (default: both). */
  sexes?: Sex[];
  /** Computed from a measurement when possible; otherwise answered by the user. */
  auto?: AutoRuleId;
}
export interface GroupSpec { name: string; criteria: CriterionSpec[] }
export interface RubricSpec {
  id: Exclude<DimensionId, "harmony">; name: string; description: string;
  /** True when the ideals depend on the reference set, so the dimension cannot be scored without one. */
  needsSex: boolean; groups: GroupSpec[]; sources: string[]; notes: string[];
}

export type CriterionState = "ideal" | "not_ideal" | "not_assessed";
export interface CriterionResult {
  id: string; group: string; label: string; ideal: string; state: CriterionState;
  basis: "measured" | "self_reported" | "none"; auto: boolean;
  detail?: string; confidence?: number;
}
export interface RubricDetail {
  sex: Sex | null; points: number; assessed: number; total: number; measured: number; selfReported: number;
  groups: { name: string; points: number; assessed: number; total: number }[];
  criteria: CriterionResult[]; needsSex: boolean; sources: string[]; notes: string[];
}

/** Score is MAX inside [low, high] and falls linearly to 0 at `falloff` beyond either edge. */
export interface Reference { low: number; high: number; falloff: number; source: string }

export interface DimensionInput {
  metricId: string; label: string; weight: number;
  /** Absent => the metric cannot be scored yet (needs a reference range). */
  reference?: Reference;
}
export interface DimensionSpec {
  id: DimensionId; name: string; description: string;
  inputs: DimensionInput[];
  /** Things this dimension covers on the product page that geometry cannot measure. */
  notMeasurable: string[];
}

export interface ScoreContribution { metricId: string; label: string; weight: number; confidence: number; value: number; score: number; reference: Reference }
export interface WaitingItem { metricId: string; label: string; reason: string }
export type ScoreStatus = "complete" | "partial" | "unavailable";
export interface DimensionScore {
  id: DimensionId; name: string; description: string;
  status: ScoreStatus; value: number | null;
  /** 0..1 share of this dimension's inputs that were actually measured (or answered) and scored. */
  coverage: number;
  /** Weighted mean confidence of the contributing measurements. */
  reliability: number | null;
  contributions: ScoreContribution[]; waitingOn: WaitingItem[]; notMeasurable: string[];
  /** Present for rubric-scored dimensions (Traits, Angularity, Dimorphism). */
  rubric?: RubricDetail;
}
export type ScoreSet = Record<DimensionId, DimensionScore>;
