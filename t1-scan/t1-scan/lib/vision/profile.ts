import type { Affine2D } from "../geometry/transform";
import { applyAffine } from "../geometry/transform";
import type { Landmark, LandmarkMap, PoseEstimate, SemanticLandmark } from "../types/analysis";

/**
 * Canonical profile orientation: the nose points toward image-LEFT (yaw > 0). A right-facing profile is
 * mirrored about the vertical centre line of the ORIGINAL image, so profile geometry has one handedness
 * regardless of which side the user photographed. The mirror is a real invertible transform, so any
 * construction computed in canonical orientation maps back onto the user's untouched photo.
 */
export interface ProfileNormalization { mirrored: boolean; toCanonical: Affine2D; toOriginal: Affine2D; landmarks: LandmarkMap }

const swapSide = (n: SemanticLandmark): SemanticLandmark => {
  if (n.endsWith("L")) return (n.slice(0, -1) + "R") as SemanticLandmark;
  if (n.endsWith("R")) return (n.slice(0, -1) + "L") as SemanticLandmark;
  return n;
};

export function normalizeProfile(points: LandmarkMap, pose: PoseEstimate, imageWidth: number): ProfileNormalization | null {
  if (pose.classification !== "PROFILE" && pose.classification !== "THREE_QUARTER") return null;
  const mirrored = pose.facing === "right";
  const identity: Affine2D = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, zScale: 1 };
  // x' = W - x. It is its own inverse (an involution), which keeps the round trip exact.
  const mirror: Affine2D = { a: -1, b: 0, c: 0, d: 1, e: imageWidth, f: 0, zScale: 1 };
  const t = mirrored ? mirror : identity;
  const out: LandmarkMap = {};
  for (const [name, p] of Object.entries(points) as [SemanticLandmark, Landmark][]) {
    const q = applyAffine(t, p);
    out[mirrored ? swapSide(name) : name] = { ...p, x: q.x, y: q.y, z: q.z };
  }
  return { mirrored, toCanonical: t, toOriginal: t, landmarks: out };
}
