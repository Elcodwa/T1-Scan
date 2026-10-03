import { CONFIDENCE, CONFIDENCE_EXTRA } from "./constants";
import { gaussian, hashString, mulberry32 } from "./rng";
import type { LandmarkMap, SemanticLandmark } from "../types/analysis";
import type { MetricDefinition } from "../metrics/types";
import { computeRaw } from "../metrics/compute";

export interface UncertaintyEstimate { mean: number; std: number; min: number; max: number; samples: number }

/**
 * Sensitivity analysis: jitter the landmarks the metric (and the face frame) depends on by a pixel-scale
 * sigma, recompute the whole chain (frame -> canonical -> formula), and report the dispersion.
 * A metric that swings wildly under tiny landmark movement gets a low stability factor.
 */
export function estimateUncertainty(
  def: MetricDefinition, landmarks: LandmarkMap, sigmaPx: number, extraLandmarks: SemanticLandmark[],
): UncertaintyEstimate | null {
  const rand = mulberry32(CONFIDENCE.UNCERTAINTY_SEED ^ hashString(def.id));
  const names = new Set<SemanticLandmark>([...def.requiredLandmarks, ...extraLandmarks]);
  const values: number[] = [];
  for (let i = 0; i < CONFIDENCE.UNCERTAINTY_SAMPLES; i++) {
    const perturbed: LandmarkMap = { ...landmarks };
    for (const name of names) {
      const p = landmarks[name]; if (!p) continue;
      perturbed[name] = { ...p, x: p.x + gaussian(rand) * sigmaPx, y: p.y + gaussian(rand) * sigmaPx, z: p.z + gaussian(rand) * sigmaPx * CONFIDENCE_EXTRA.JITTER_Z_MULTIPLIER };
    }
    const r = computeRaw(def, perturbed);
    if (r && Number.isFinite(r.value)) values.push(r.value);
  }
  if (values.length < CONFIDENCE.UNCERTAINTY_SAMPLES * 0.7) return null;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return { mean, std: Math.sqrt(variance), min: Math.min(...values), max: Math.max(...values), samples: values.length };
}
