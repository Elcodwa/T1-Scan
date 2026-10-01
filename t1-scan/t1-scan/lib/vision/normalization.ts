import type { LandmarkPoint } from "./types";

export type NormalizationMethod = "translation" | "scale" | "roll" | "canonical3D" | "profilePlane";

export interface MetricNormalization {
  methods: NormalizationMethod[];
  poseSensitive: boolean;
}

export function distance(a: LandmarkPoint, b: LandmarkPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/**
 * Removes translation, face scale and roll in coordinates—not in the source image.
 * It intentionally does not invent an inverse camera projection for yaw/perspective.
 */
export function normalizeLandmarks(points: LandmarkPoint[], leftEyeIndex = 33, rightEyeIndex = 263): LandmarkPoint[] {
  const leftEye = points[leftEyeIndex];
  const rightEye = points[rightEyeIndex];
  if (!leftEye || !rightEye) return points;
  const origin = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };
  const scale = Math.max(0.00001, Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y));
  const roll = -Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
  const cosine = Math.cos(roll); const sine = Math.sin(roll);
  return points.map((point) => {
    const x = (point.x - origin.x) / scale; const y = (point.y - origin.y) / scale;
    return { x: x * cosine - y * sine, y: x * sine + y * cosine, z: point.z / scale };
  });
}
