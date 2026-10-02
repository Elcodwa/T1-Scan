import { add, applyMat3, cross, distance, dot, midpoint, normalize, scale, sub, transposeMat3, vec, type Mat3, type Vec3 } from "../geometry/primitives";
import type { LandmarkMap, SemanticLandmark } from "../types/analysis";

/**
 * Face-intrinsic coordinate frame. Because it is built only from the face's own bilateral landmarks,
 * canonical coordinates are invariant to translation, uniform scale, in-plane roll AND out-of-plane
 * yaw/pitch (to the extent the provider's z is accurate). It is NOT a camera model: perspective
 * foreshortening is estimated separately and only reduces confidence.
 *
 * Canonical axes: +x = subject's image-right direction, +y = down the face, +z = into the head.
 * Unit = distance between outer eye corners (so values are dimensionless).
 */
export interface CanonicalFrame {
  origin: Vec3; rotation: Mat3; /* columns are head axes in image space */ scale: number;
  toCanonical(p: Vec3): Vec3;
  /** Exact inverse; x,y of the result are ORIGINAL image pixel coordinates. */
  toImage(p: Vec3): Vec3;
}

export function buildHeadFrame(points: LandmarkMap): CanonicalFrame | null {
  const exoL = points.exocanthionL; const exoR = points.exocanthionR; const menton = points.menton;
  if (!exoL || !exoR || !menton) return null;
  const eyeMid = midpoint(exoL, exoR);
  const eyeAxis = normalize(sub(exoR, exoL));
  if (!eyeAxis) return null;
  const zy = points.zygionL && points.zygionR ? normalize(sub(points.zygionR, points.zygionL)) : null;
  const ex = normalize(zy ? add(eyeAxis, zy) : eyeAxis);
  if (!ex) return null;
  const down = sub(menton, eyeMid);
  const ey = normalize(sub(down, scale(ex, dot(down, ex))));
  if (!ey) return null;
  const ez = cross(ex, ey);
  const s = distance(exoL, exoR);
  if (s < 1e-6) return null;
  const rotation: Mat3 = [ex.x, ey.x, ez.x, ex.y, ey.y, ez.y, ex.z, ey.z, ez.z];
  const inverse = transposeMat3(rotation);
  const origin = eyeMid;
  return {
    origin, rotation, scale: s,
    toCanonical: (p) => scale(applyMat3(inverse, sub(p, origin)), 1 / s),
    toImage: (p) => add(applyMat3(rotation, scale(p, s)), origin),
  };
}

export type CanonicalPoints = Partial<Record<SemanticLandmark, Vec3>>;
export function toCanonicalPoints(points: LandmarkMap, frame: CanonicalFrame): CanonicalPoints {
  const out: CanonicalPoints = {};
  for (const [name, p] of Object.entries(points) as [SemanticLandmark, Vec3][]) out[name] = frame.toCanonical(vec(p.x, p.y, p.z));
  return out;
}
