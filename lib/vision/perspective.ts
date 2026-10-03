import { distance } from "../geometry/primitives";
import { CONFIDENCE } from "../confidence/constants";
import type { LandmarkMap, PerspectiveEstimate } from "../types/analysis";

/**
 * Estimates how strongly camera perspective can distort this face: severity = face depth / camera distance.
 * Camera distance comes from face pixel width, the focal length (EXIF 35mm-equivalent if present, else an
 * assumed FOV) and an average real face width. This is an estimate used to REDUCE confidence; it does not
 * pretend to undo perspective.
 */
export function estimatePerspective(
  points: LandmarkMap, imageSize: { width: number; height: number }, focalLength35mm?: number | null,
): PerspectiveEstimate {
  const zl = points.zygionL; const zr = points.zygionR;
  const longSide = Math.max(imageSize.width, imageSize.height);
  const basis = focalLength35mm && focalLength35mm > 0 ? "exif_focal_length" as const : "assumed_fov" as const;
  const hfov = basis === "exif_focal_length" ? 2 * Math.atan(18 / focalLength35mm!) : (CONFIDENCE.ASSUMED_HFOV_DEG * Math.PI) / 180;
  if (!zl || !zr) return { estimatedDistanceCm: null, severity: 1, assumedFovDeg: (hfov * 180) / Math.PI, basis };
  const focalPx = longSide / 2 / Math.tan(hfov / 2);
  const facePx = distance(zl, zr);
  if (facePx < 1) return { estimatedDistanceCm: null, severity: 1, assumedFovDeg: (hfov * 180) / Math.PI, basis };
  const distanceCm = (focalPx * CONFIDENCE.REFERENCE_FACE_WIDTH_CM) / facePx;
  return { estimatedDistanceCm: distanceCm, severity: Math.min(CONFIDENCE.REFERENCE_FACE_DEPTH_CM / distanceCm, basis === "assumed_fov" ? CONFIDENCE.PERSPECTIVE_ASSUMED_CAP : Infinity), assumedFovDeg: (hfov * 180) / Math.PI, basis };
}
