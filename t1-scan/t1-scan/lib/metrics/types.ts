import type { CanonicalFrame, CanonicalPoints } from "../vision/canonical";
import type { Vec3 } from "../geometry/primitives";
import type { MetricUnit, SemanticLandmark } from "../types/analysis";

export type CanonicalPrimitive =
  | { kind: "point"; at: Vec3 }
  | { kind: "line"; from: Vec3; to: Vec3; role: "measure" | "reference" }
  | { kind: "angle"; vertex: Vec3; a: Vec3; b: Vec3; degrees: number };

/** head_frame: canonical frontal-plane coordinates (frame set). image_3d: raw 3D landmark positions in original-pixel units (frame null). */
export type MetricSpace = "head_frame" | "image_3d";
export interface MetricContext { c: CanonicalPoints; frame: CanonicalFrame | null; /** unit vector pointing out of the face in the sagittal plane (image_3d only) */ forward: Vec3 | null }
export interface FormulaResult { value: number; construction: CanonicalPrimitive[] }
export type Formula = (ctx: MetricContext) => FormulaResult | null;

export interface ExpressionSensitivity { smile?: number; mouth_open?: number }

export interface MetricDefinition {
  id: string; name: string; category: string; view: "front" | "profile";
  unit: MetricUnit;
  /** Default head_frame. Profile metrics use image_3d so far-side (hidden) landmarks are never needed. */
  space?: MetricSpace;
  /** Typical magnitude of the quantity; stops values near zero (e.g. signed offsets) from looking unstable by relative-error alone. */
  stabilityReference?: number;
  /** Landmarks the formula reads. Missing/invalid ones make the metric unavailable. */
  requiredLandmarks: SemanticLandmark[];
  /** Undefined => "definition_required": the app has no established geometric definition yet. */
  formula?: Formula;
  /** Human-readable construction incl. numerator, denominator and normalization reference. */
  definition: string;
  source: string;
  note?: string;
  /** Extra reason shown when unavailable (e.g. hairline). */
  knownBlockers?: string[];
  /** 0..1: how strongly residual yaw / pitch / roll after 3D frontalisation degrade this metric. */
  poseSensitivity: { yaw: number; pitch: number; roll: number };
  perspectiveSensitivity: number;
  expressionSensitivity?: ExpressionSensitivity;
  /** Values outside are flagged "invalid" rather than shown. */
  plausibleRange: [number, number];
  /** Max |difference| tolerated by invariance regression tests (scale/translation/roll on identical landmarks). */
  invarianceTolerance: number;
}
