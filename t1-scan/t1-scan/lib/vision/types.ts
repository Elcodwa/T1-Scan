export type ImageView = "front" | "profile";
export type AnalysisLevel = "FULL_ANALYSIS" | "PARTIAL_ANALYSIS" | "LIMITED_ANALYSIS" | "UNRELIABLE";
export type ViewClassification = "FRONTAL" | "SLIGHTLY_ROTATED" | "THREE_QUARTER" | "LEFT_PROFILE" | "RIGHT_PROFILE" | "UNKNOWN";
export type MetricStatus = "reliable" | "low_confidence" | "unreliable" | "definition_required";

export interface ImageForensics {
  width: number;
  height: number;
  aspectRatio: number;
  sharpness: number;
  brightness: number;
  contrast: number;
  noiseEstimate: number;
  imageQualityScore: number;
  orientationCorrected: boolean;
}

export interface ImageQualityResult {
  valid: boolean;
  faceDetected: boolean;
  faceCount: number;
  sharpnessScore: number;
  brightnessScore: number;
  contrastScore: number;
  occlusionScore: number;
  poseScore: number;
  overallConfidence: number;
  warnings: string[];
  forensics: ImageForensics;
  analysisLevel: AnalysisLevel;
}

export interface PoseResult {
  roll: number;
  pitch: number;
  yaw: number;
  acceptable: boolean;
  confidence: number;
  source: "landmarks" | "transformation_matrix" | "fused";
  classification: ViewClassification;
  message?: string;
}

export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}

export interface MeasurementResult {
  metricId: string;
  displayName: string;
  value: number | null;
  formattedValue: string;
  unit: "ratio" | "percentage" | "degrees" | "index";
  confidence: number;
  uncertainty: number | null;
  status: MetricStatus;
  warnings: string[];
}

export interface VisionAnalysis {
  quality: ImageQualityResult;
  pose: PoseResult;
  landmarks: LandmarkPoint[];
  transformationMatrix?: number[];
  measurements: MeasurementResult[];
}
