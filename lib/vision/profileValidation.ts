import type { LandmarkIssue, LandmarkMap, SemanticLandmark } from "../types/analysis";
import { heightAlong } from "./sagittal";
import { vec } from "../geometry/primitives";

/** Top-to-bottom order of midline landmarks. Any inversion means the model mislocated something. */
const ORDER: SemanticLandmark[] = ["glabella", "nasion", "pronasale", "subnasale", "labialeSuperius", "labialeInferius", "pogonion", "menton"];

export function validateProfileLandmarks(points: LandmarkMap): LandmarkIssue[] {
  const present = ORDER.filter((n) => points[n]);
  const h = present.map((n) => heightAlong(points, vec(points[n]!.x, points[n]!.y, points[n]!.z)));
  if (h.some((v) => v === null)) return [{ code: "profile_axis_unavailable", message: "Glabella and chin are needed to establish the vertical axis of the profile.", landmarks: ["glabella", "menton"] }];
  const issues: LandmarkIssue[] = [];
  for (let i = 1; i < present.length; i++) {
    if ((h[i] as number) < (h[i - 1] as number) - 1e-6) issues.push({ code: "profile_order", message: `Profile landmarks are out of order (${present[i]} sits above ${present[i - 1]}).`, landmarks: [present[i], present[i - 1]] });
  }
  return issues;
}
