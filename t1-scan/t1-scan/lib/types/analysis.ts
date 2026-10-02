import type { Vec3 } from "../geometry/primitives";
import type { PreprocessingTransform } from "../geometry/transform";

export type ImageView = "front" | "profile";

/**
 * Semantic landmark names. "L"/"R" always mean IMAGE-left / IMAGE-right (smaller / larger x
 * in a frontal photo), not the subject's anatomical side.
 */
export type SemanticLandmark =
  | "glabella" | "nasion" | "pronasale" | "subnasale"
  | "labialeSuperius" | "stomionSuperius" | "stomionInferius" | "labialeInferius" | "menton"
  | "exocanthionL" | "exocanthionR" | "endocanthionL" | "endocanthionR"
  | "zygionL" | "zygionR" | "gonionL" | "gonionR"
  | "cheilionL" | "cheilionR" | "alareL" | "alareR"
  | "pogonion"    /* most anterior soft-tissue chin point; derived from chin mesh points */
  | "foreheadTop" /* top of the face oval; NOT the hairline */
  | "trichion"    /* true hairline point; never produced by MediaPipe */
  | "templeL" | "templeR"           /* upper face contour at the temples (bitemporal width) */
  | "browInnerL" | "browInnerR"     /* inner (medial) end of each eyebrow */
  | "browPeakL" | "browPeakR"       /* highest point of each eyebrow arch */
  | "browTailL" | "browTailR"       /* outer (lateral) end of each eyebrow */
  | "lidUpperL" | "lidLowerL" | "lidUpperR" | "lidLowerR" /* centre of the upper / lower eyelid margin */
  | "pupilL" | "pupilR"             /* iris centres */
  | "sublabiale"                    /* mentolabial sulcus, just below the lower lip */
  | "gonionNear" | "earNear" | "alareNear" /* near-side (camera-facing) jaw angle, ear-region point and nostril wing; chosen from depth, so a side photo never relies on the hidden side */;

export type LandmarkSource = "mediapipe" | "3d_reconstruction" | "derived";

export interface Landmark {
  /** Position in ORIGINAL image pixels (z in the same pixel scale, +z = away from camera). */
  x: number; y: number; z: number;
  visibility: number; // 0..1, geometric visibility given pose
  confidence: number; // 0..1, overall trust in this landmark
  source: LandmarkSource;
}
export type LandmarkMap = Partial<Record<SemanticLandmark, Landmark>>;
export interface LandmarkSet {
  points: LandmarkMap;
  source: LandmarkSource;
  /** Dense raw points (original-image pixels) for visualisation only; never used by metrics directly. */
  dense?: Vec3[];
}

export type PoseClass = "FRONTAL" | "SLIGHT_YAW" | "THREE_QUARTER" | "PROFILE" | "UNKNOWN";
export interface PoseEstimate {
  yaw: number; pitch: number; roll: number; // degrees; see geometry/primitives for sign convention
  classification: PoseClass;
  /** Image direction the nose points: "left" (yaw>0), "right" (yaw<0), or "camera" when approximately frontal. */
  facing: "left" | "right" | "camera";
  confidence: number;
  method: "landmark_frame" | "unavailable";
}

export interface ImageForensics {
  width: number; height: number; aspectRatio: number; orientation: "portrait" | "landscape" | "square";
  exifOrientation: number | null;
  brightness: number; contrast: number; sharpness: number; noise: number; blockiness: number;
  clippedShadows: number; clippedHighlights: number;
  faceBox: { x: number; y: number; width: number; height: number } | null;
  faceToImageRatio: number | null;
  backgroundComplexity: number | null;
  /** All scores 0..1 where 1 = good. */
  scores: { exposure: number; contrast: number; sharpness: number; noise: number; compression: number; resolution: number; overall: number };
  notes: string[];
}

export type MetricStatus = "reliable" | "usable" | "low_confidence" | "unavailable" | "invalid" | "definition_required";
export type MetricUnit = "ratio" | "degree" | "percent" | "normalized";

/** Drawing primitives in ORIGINAL image pixel coordinates, produced from the same geometry as the value. */
export type ConstructionPrimitive =
  | { kind: "point"; at: { x: number; y: number }; label?: string }
  | { kind: "line"; from: { x: number; y: number }; to: { x: number; y: number }; role: "measure" | "reference" }
  | { kind: "angle"; vertex: { x: number; y: number }; a: { x: number; y: number }; b: { x: number; y: number }; degrees: number };

export interface MetricResult {
  id: string; name: string; category: string; view: "front" | "profile";
  value: number | null;
  unit: MetricUnit;
  confidence: number;
  uncertainty: number | null;
  status: MetricStatus;
  reasons: string[];
  /** Per-factor breakdown so the confidence is auditable. */
  confidenceBreakdown?: Record<string, number>;
  construction: ConstructionPrimitive[];
}

export interface ExpressionEstimate { mouthOpen: number; smile: number; affected: string[] }
export interface PerspectiveEstimate { estimatedDistanceCm: number | null; severity: number; assumedFovDeg: number; basis: "exif_focal_length" | "assumed_fov" }

export interface LandmarkIssue { code: string; message: string; landmarks: SemanticLandmark[] }

export interface ViewAnalysis {
  view: ImageView;
  status: "ok" | "partial" | "failed";
  failure?: { code: string; message: string; guidance: string; /** present for multiple_faces: boxes in ORIGINAL pixels, ordered left to right */ candidates?: { imageSize: { width: number; height: number }; boxes: { x: number; y: number; width: number; height: number }[] } };
  forensics?: ImageForensics;
  pose?: PoseEstimate;
  expression?: ExpressionEstimate;
  perspective?: PerspectiveEstimate;
  landmarkIssues: LandmarkIssue[];
  landmarks: LandmarkMap;
  transform?: PreprocessingTransform;
  metrics: MetricResult[];
  warnings: string[];
  provider: string;
}

export type ProgressStage =
  | "uploading" | "detecting_face" | "estimating_pose" | "extracting_landmarks"
  | "building_3d_geometry" | "calculating_metrics" | "validating_results" | "complete";

import type { ScoreSet } from "../scoring/types";

export interface AnalysisResult {
  analysis: { front?: ViewAnalysis; profile?: ViewAnalysis };
  scores: ScoreSet;
  warnings: string[];
  processing: { durationMs: number; engineVersion: string };
}
