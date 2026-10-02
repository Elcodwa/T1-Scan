import { vec, type Vec3 } from "../geometry/primitives";
import { buildHeadFrame, toCanonicalPoints, type CanonicalFrame, type CanonicalPoints } from "../vision/canonical";
import { projectMidlineToSagittalPlane, sagittalForward } from "../vision/sagittal";
import type { LandmarkMap, SemanticLandmark } from "../types/analysis";
import type { FormulaResult, MetricDefinition } from "./types";

export interface RawMetric extends FormulaResult { frame: CanonicalFrame | null }

function rawPoints(landmarks: LandmarkMap): CanonicalPoints {
  const out: CanonicalPoints = {};
  for (const [name, p] of Object.entries(landmarks) as [SemanticLandmark, Vec3][]) out[name] = vec(p.x, p.y, p.z);
  return out;
}

/** Runs landmarks -> (frame) -> formula. The only place a formula is invoked. */
export function computeRaw(def: MetricDefinition, landmarks: LandmarkMap): RawMetric | null {
  if (!def.formula) return null;
  if (def.space === "image_3d") {
    // Midline points are constrained to the sagittal plane (lateral offset is zero by anatomy) to drop depth noise.
    const c = { ...rawPoints(landmarks), ...(projectMidlineToSagittalPlane(landmarks) ?? {}) };
    const r = def.formula({ c, frame: null, forward: sagittalForward(landmarks) });
    return r ? { ...r, frame: null } : null;
  }
  const frame = buildHeadFrame(landmarks);
  if (!frame) return null;
  const r = def.formula({ c: toCanonicalPoints(landmarks, frame), frame, forward: null });
  return r ? { ...r, frame } : null;
}
