import { landmarkMap, type SemanticLandmark } from "./landmarkMap";
import type { LandmarkPoint } from "../types";

export function resolveLandmark(landmarks: LandmarkPoint[], name: SemanticLandmark): LandmarkPoint | null {
  return landmarks[landmarkMap[name]] ?? null;
}
