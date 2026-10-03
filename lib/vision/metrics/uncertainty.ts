import type { LandmarkPoint } from "../types";

/**
 * A sensitivity estimate, not a claim of clinical/statistical ground truth.
 * It perturbs normalized landmarks and reports the dispersion in the metric output.
 */
export function estimateMeasurementUncertainty(
  landmarks: LandmarkPoint[],
  calculate: (points: LandmarkPoint[]) => number | null,
  landmarkSigma: number,
  samples = 64,
) {
  const values: number[] = [];
  for (let sample = 0; sample < samples; sample++) {
    const perturbed = landmarks.map((point) => ({
      x: point.x + gaussian() * landmarkSigma,
      y: point.y + gaussian() * landmarkSigma,
      z: point.z + gaussian() * landmarkSigma,
    }));
    const value = calculate(perturbed);
    if (value !== null && Number.isFinite(value)) values.push(value);
  }
  if (values.length < samples * 0.7) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function gaussian() {
  let a = 0; let b = 0;
  while (!a) a = Math.random();
  while (!b) b = Math.random();
  return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b);
}
