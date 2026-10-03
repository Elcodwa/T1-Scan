import { resolveLandmark } from "../landmarks/landmarkResolver";
import { distance, normalizeLandmarks, type MetricNormalization } from "../normalization";
import type { LandmarkPoint, MeasurementResult } from "../types";
import { estimateMeasurementUncertainty } from "./uncertainty";

type MetricDefinition = {
  id: string;
  displayName: string;
  unit: MeasurementResult["unit"];
  normalization: MetricNormalization;
  calculate?: (landmarks: LandmarkPoint[]) => number | null;
};

function ratio(a: LandmarkPoint | null, b: LandmarkPoint | null, c: LandmarkPoint | null, d: LandmarkPoint | null) {
  if (!a || !b || !c || !d) return null;
  return distance(a, b) / Math.max(0.00001, distance(c, d));
}

/** Only metrics with transparent landmark formulas are enabled. Abbreviations remain explicit. */
export const measurementRegistry: MetricDefinition[] = [
  {
    id: "fwhr", displayName: "Facial width-to-height ratio", unit: "ratio",
    normalization: { methods: ["translation", "scale", "roll"], poseSensitive: true },
    calculate: (points) => ratio(resolveLandmark(points, "leftZygion"), resolveLandmark(points, "rightZygion"), resolveLandmark(points, "glabella"), resolveLandmark(points, "menton")),
  },
  {
    id: "eye_spacing_to_face_width", displayName: "Intercanthal distance / facial width", unit: "ratio",
    normalization: { methods: ["translation", "scale", "roll"], poseSensitive: false },
    calculate: (points) => ratio(resolveLandmark(points, "leftEndocanthion"), resolveLandmark(points, "rightEndocanthion"), resolveLandmark(points, "leftZygion"), resolveLandmark(points, "rightZygion")),
  },
  {
    id: "mouth_to_face_width", displayName: "Mouth width / facial width", unit: "ratio",
    normalization: { methods: ["translation", "scale", "roll"], poseSensitive: false },
    calculate: (points) => ratio(resolveLandmark(points, "leftCheilion"), resolveLandmark(points, "rightCheilion"), resolveLandmark(points, "leftZygion"), resolveLandmark(points, "rightZygion")),
  },
  { id: "facial_thirds", displayName: "Facial Thirds", unit: "ratio", normalization: { methods: ["translation", "scale", "roll"], poseSensitive: true } },
  { id: "esr", displayName: "ESR", unit: "percentage", normalization: { methods: ["translation", "scale", "roll"], poseSensitive: true } },
  { id: "nfa", displayName: "NFA", unit: "degrees", normalization: { methods: ["canonical3D", "profilePlane"], poseSensitive: true } },
  { id: "ricketts_e_line", displayName: "Ricketts E-Line", unit: "index", normalization: { methods: ["canonical3D", "profilePlane"], poseSensitive: true } },
];

export function calculateMeasurements(rawLandmarks: LandmarkPoint[], confidence: number): MeasurementResult[] {
  const landmarks = normalizeLandmarks(rawLandmarks);
  return measurementRegistry.map((metric) => {
    if (!metric.calculate) return { metricId: metric.id, displayName: metric.displayName, value: null, formattedValue: "Definition required", unit: metric.unit, confidence: 0, uncertainty: null, status: "definition_required", warnings: ["This reference label needs an explicit geometric definition before it can be calculated."] };
    const value = metric.calculate(landmarks);
    if (value === null || !Number.isFinite(value)) return { metricId: metric.id, displayName: metric.displayName, value: null, formattedValue: "Not reliably measurable", unit: metric.unit, confidence: 0, uncertainty: null, status: "unreliable", warnings: ["Required landmarks are unavailable."] };
    const metricConfidence = Number((confidence * (metric.normalization.poseSensitive ? 0.88 : 0.96)).toFixed(2));
    const uncertainty = estimateMeasurementUncertainty(landmarks, metric.calculate, Math.max(0.001, (1 - metricConfidence) * 0.018));
    return { metricId: metric.id, displayName: metric.displayName, value, formattedValue: `${value.toFixed(2)}×`, unit: metric.unit, confidence: metricConfidence, uncertainty: uncertainty === null ? null : Number(uncertainty.toFixed(3)), status: metricConfidence >= 0.72 ? "reliable" : "low_confidence", warnings: metricConfidence >= 0.72 ? [] : ["Pose or image quality limits this estimate."] };
  });
}
