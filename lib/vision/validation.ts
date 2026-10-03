import type { LandmarkIssue, LandmarkMap } from "../types/analysis";
import { buildHeadFrame, toCanonicalPoints } from "./canonical";

/**
 * Anatomical consistency checks in canonical space. Returns issues; the caller marks
 * the named landmarks as unreliable instead of silently measuring them.
 */
export function validateLandmarks(points: LandmarkMap): LandmarkIssue[] {
  const frame = buildHeadFrame(points);
  if (!frame) return [{ code: "frame_unavailable", message: "Eye corners and chin are required to build a face frame.", landmarks: ["exocanthionL", "exocanthionR", "menton"] }];
  const c = toCanonicalPoints(points, frame);
  const issues: LandmarkIssue[] = [];
  const need = (...names: (keyof typeof c)[]) => names.every((n) => c[n]);

  if (need("exocanthionL", "endocanthionL", "endocanthionR", "exocanthionR") && !(c.exocanthionL!.x < c.endocanthionL!.x && c.endocanthionL!.x < c.endocanthionR!.x && c.endocanthionR!.x < c.exocanthionR!.x))
    issues.push({ code: "eye_order", message: "Eye corners are not in anatomical order.", landmarks: ["exocanthionL", "endocanthionL", "endocanthionR", "exocanthionR"] });
  if (need("cheilionL", "cheilionR") && !(c.cheilionL!.x < c.cheilionR!.x))
    issues.push({ code: "mouth_corners_crossed", message: "Mouth corners cross.", landmarks: ["cheilionL", "cheilionR"] });
  if (need("nasion", "pronasale", "labialeSuperius", "menton") && !(c.nasion!.y < c.pronasale!.y && c.pronasale!.y < c.labialeSuperius!.y && c.labialeSuperius!.y < c.menton!.y))
    issues.push({ code: "midline_order", message: "Nose, lip and chin are not in vertical order along the midline.", landmarks: ["nasion", "pronasale", "labialeSuperius", "menton"] });
  if (need("stomionSuperius", "stomionInferius") && c.stomionInferius!.y < c.stomionSuperius!.y - 1e-6)
    issues.push({ code: "lips_inverted", message: "Upper and lower lip are inverted.", landmarks: ["stomionSuperius", "stomionInferius"] });
  if (need("zygionL", "zygionR", "exocanthionL", "exocanthionR") && !(c.zygionL!.x < c.exocanthionL!.x && c.zygionR!.x > c.exocanthionR!.x))
    issues.push({ code: "zygion_inside_eyes", message: "Cheek landmarks fall inside the eye corners.", landmarks: ["zygionL", "zygionR"] });
  if (need("zygionL", "zygionR", "pronasale")) {
    const mid = (c.zygionL!.x + c.zygionR!.x) / 2; const half = (c.zygionR!.x - c.zygionL!.x) / 2;
    if (half <= 0 || Math.abs(c.pronasale!.x - mid) > 0.35 * 2 * half)
      issues.push({ code: "midline_implausible", message: "The nose is implausibly far from the facial midline.", landmarks: ["pronasale", "zygionL", "zygionR"] });
  }
  return issues;
}
