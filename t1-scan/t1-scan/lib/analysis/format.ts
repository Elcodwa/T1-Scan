import type { MetricResult, MetricStatus, ProgressStage } from "../types/analysis";

export function formatValue(m: Pick<MetricResult, "value" | "unit">): string {
  if (m.value === null) return "—";
  switch (m.unit) {
    case "degree": return `${m.value.toFixed(1)}°`;
    case "percent": return `${m.value.toFixed(1)}%`;
    case "ratio": return m.value.toFixed(2);
    default: return m.value.toFixed(3);
  }
}
export function formatUncertainty(m: Pick<MetricResult, "uncertainty" | "unit">): string | null {
  if (m.uncertainty === null) return null;
  return `±${m.unit === "degree" ? m.uncertainty.toFixed(1) : m.unit === "percent" ? m.uncertainty.toFixed(1) : m.uncertainty.toFixed(2)}`;
}

export const STATUS_STYLE: Record<MetricStatus, { label: string; text: string; chip: string; stroke: string }> = {
  reliable: { label: "SOLID", text: "text-emerald-200", chip: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200", stroke: "#6ee7b7" },
  usable: { label: "GOOD", text: "text-teal-200", chip: "border-teal-300/25 bg-teal-300/10 text-teal-200", stroke: "#5eead4" },
  low_confidence: { label: "APPROXIMATE", text: "text-amber-200", chip: "border-amber-300/25 bg-amber-300/10 text-amber-200", stroke: "#fcd34d" },
  unavailable: { label: "NOT MEASURED", text: "text-white/45", chip: "border-white/10 bg-white/[.04] text-white/50", stroke: "#94a3b8" },
  invalid: { label: "CHECK PHOTO", text: "text-rose-200", chip: "border-rose-300/25 bg-rose-300/10 text-rose-200", stroke: "#fda4af" },
  definition_required: { label: "NOT SUPPORTED", text: "text-white/35", chip: "border-white/8 bg-white/[.025] text-white/40", stroke: "#94a3b8" },
};

export const STAGE_LABEL: Record<ProgressStage, string> = {
  uploading: "Preparing image", detecting_face: "Finding the face", estimating_pose: "Estimating head pose", extracting_landmarks: "Extracting landmarks",
  building_3d_geometry: "Building 3D geometry", calculating_metrics: "Calculating measurements", validating_results: "Validating results", complete: "Done",
};
export const STAGE_ORDER: ProgressStage[] = ["uploading", "detecting_face", "estimating_pose", "extracting_landmarks", "building_3d_geometry", "calculating_metrics", "validating_results", "complete"];
