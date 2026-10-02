import { cross, dot, normalize, scale, sub, vec, type Vec3 } from "../geometry/primitives";
import type { LandmarkMap, SemanticLandmark } from "../types/analysis";

const at = (p: { x: number; y: number; z: number } | undefined): Vec3 | null => (p ? vec(p.x, p.y, p.z) : null);

/** Unit vector pointing DOWN the face (glabella -> menton) in 3D. Midline landmarks all lie in the sagittal plane. */
export function sagittalDown(points: LandmarkMap): Vec3 | null {
  const g = at(points.glabella); const m = at(points.menton);
  return g && m ? normalize(sub(m, g)) : null;
}

/**
 * Unit vector pointing FORWARD (out of the face, toward where the nose points) within the sagittal plane:
 * the nasion->nose-tip direction with its vertical component removed. Angles between midline landmarks
 * measured with true 3D vectors do not depend on yaw, so this works for 3/4 and profile photos alike.
 */
export function sagittalForward(points: LandmarkMap): Vec3 | null {
  const down = sagittalDown(points); const n = at(points.nasion); const t = at(points.pronasale);
  if (!down || !n || !t) return null;
  const w = sub(t, n);
  return normalize(sub(w, scale(down, dot(w, down))));
}

/** Position of p along the face's vertical axis, measured from the glabella. */
export function heightAlong(points: LandmarkMap, p: Vec3): number | null {
  const down = sagittalDown(points); const g = at(points.glabella);
  return down && g ? dot(sub(p, g), down) : null;
}

/** Landmarks that lie on the facial midline by anatomy (lateral offset is zero), so depth noise on them is pure error. */
export const MIDLINE_LANDMARKS: SemanticLandmark[] = ["glabella", "nasion", "pronasale", "subnasale", "labialeSuperius", "stomionSuperius", "stomionInferius", "labialeInferius", "pogonion", "menton", "sublabiale"];

/**
 * Projects the midline landmarks onto the sagittal plane spanned by the face's vertical and forward axes.
 * The plane contains glabella, nasion, nose tip and menton by construction; subnasale, lips and chin lose only the
 * component the anatomy says must be zero. Returns null when the plane cannot be established.
 */
export function projectMidlineToSagittalPlane(points: LandmarkMap): Partial<Record<SemanticLandmark, Vec3>> | null {
  const down = sagittalDown(points); const forward = sagittalForward(points); const g = at(points.glabella);
  if (!down || !forward || !g) return null;
  const normal = normalize(cross(down, forward)); if (!normal) return null;
  const out: Partial<Record<SemanticLandmark, Vec3>> = {};
  for (const name of MIDLINE_LANDMARKS) {
    const p = at(points[name]); if (!p) continue;
    out[name] = sub(p, scale(normal, dot(sub(p, g), normal)));
  }
  return out;
}
