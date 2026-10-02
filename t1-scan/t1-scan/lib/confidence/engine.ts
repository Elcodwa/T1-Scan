import { clamp } from "../geometry/primitives";
import { computeRaw } from "../metrics/compute";
import type { CanonicalPrimitive, MetricDefinition } from "../metrics/types";
import type { ConstructionPrimitive, ExpressionEstimate, ImageForensics, LandmarkIssue, LandmarkMap, MetricResult, MetricStatus, PerspectiveEstimate, PoseEstimate, SemanticLandmark } from "../types/analysis";
import { CONFIDENCE, CONFIDENCE_EXTRA } from "./constants";
import { consensusDelta } from "./consensus";
import { estimateUncertainty } from "./uncertainty";
import { distance } from "../geometry/primitives";
import type { CanonicalFrame } from "../vision/canonical";
import { equivalentFaceWidth } from "../vision/forensics";

export interface EngineInput {
  landmarks: LandmarkMap; pose: PoseEstimate; forensics?: ImageForensics;
  expression: ExpressionEstimate; perspective: PerspectiveEstimate; issues: LandmarkIssue[];
  /** Optional independent geometry source (e.g. 3D reconstruction) for consensus. */
  secondary?: LandmarkMap;
}

const FRAME_LANDMARKS: SemanticLandmark[] = ["exocanthionL", "exocanthionR", "menton", "zygionL", "zygionR"];

const base = (def: MetricDefinition) => ({ id: def.id, name: def.name, category: def.category, view: def.view, unit: def.unit, construction: [] as ConstructionPrimitive[] });

function unavailable(def: MetricDefinition, status: MetricStatus, reasons: string[], confidence = 0): MetricResult {
  return { ...base(def), value: null, confidence, uncertainty: null, status, reasons };
}

function mapConstruction(items: CanonicalPrimitive[], frame: CanonicalFrame | null): ConstructionPrimitive[] {
  // image_3d metrics are already in original-pixel coordinates; head_frame metrics are mapped back through the frame.
  const px = (p: { x: number; y: number; z: number }) => { const q = frame ? frame.toImage(p) : p; return { x: q.x, y: q.y }; };
  return items.map((it): ConstructionPrimitive => it.kind === "point" ? { kind: "point", at: px(it.at) }
    : it.kind === "line" ? { kind: "line", from: px(it.from), to: px(it.to), role: it.role }
    : { kind: "angle", vertex: px(it.vertex), a: px(it.a), b: px(it.b), degrees: it.degrees });
}

const residual = (angle: number, full: number, sensitivity: number) => 1 - sensitivity * Math.min(1, (Math.abs(angle) / full) ** 2);

export function evaluateMetric(def: MetricDefinition, input: EngineInput): MetricResult {
  if (!def.formula) return unavailable(def, "definition_required", [def.definition, ...(def.knownBlockers ?? [])]);
  const { landmarks, pose, forensics, expression, perspective, issues } = input;

  const missing = def.requiredLandmarks.filter((n) => !landmarks[n]);
  if (missing.length) return unavailable(def, "unavailable", missing.map((m) => `Landmark not found: ${m}`));
  const frameLandmarks = def.space === "image_3d" ? [] : FRAME_LANDMARKS; // profile metrics never need the (hidden) far-side face frame
  const flagged = issues.filter((i) => i.landmarks.some((l) => def.requiredLandmarks.includes(l) || frameLandmarks.includes(l)) && i.code !== "frame_unavailable");
  if (flagged.length) return unavailable(def, "invalid", flagged.map((f) => f.message));
  if (def.view === "front" && Math.abs(pose.yaw) > CONFIDENCE.FRAME_VALID_MAX_YAW) return unavailable(def, "unavailable", ["The head is turned too far for a frontal measurement."]);

  if (def.view === "profile" && Math.abs(pose.yaw) < CONFIDENCE.PROFILE_MIN_YAW) return unavailable(def, "unavailable", [`The head is turned only ${Math.abs(pose.yaw).toFixed(0)}°; this measurement needs a side view.`]);

  const raw = computeRaw(def, landmarks);
  if (!raw) return unavailable(def, "unavailable", ["The geometry for this metric could not be constructed."]);
  const [lo, hi] = def.plausibleRange;
  if (!Number.isFinite(raw.value) || raw.value < lo || raw.value > hi) return { ...base(def), value: null, confidence: 0, uncertainty: null, status: "invalid", reasons: ["The computed value is outside the anatomically plausible range, so it is withheld."] };

  const reasons: string[] = [];
  const note = (factor: number, msg: string) => { if (factor < 0.85) reasons.push(msg); };

  const critical = [...new Set([...def.requiredLandmarks, ...frameLandmarks])].map((n) => landmarks[n]?.confidence).filter((v): v is number => v !== undefined);
  const fLandmark = Math.min(...critical);
  note(fLandmark, "One or more required landmarks are uncertain (edge clipping or turned-away side).");

  const fQuality = forensics ? CONFIDENCE_EXTRA.QUALITY_FLOOR + (1 - CONFIDENCE_EXTRA.QUALITY_FLOOR) * forensics.scores.overall : 0.7;
  // Photo-level notes (exposure, blur, resolution) are reported once per view, not repeated on every metric.

  // Profile metrics improve as the head turns toward a true side view; frontal metrics degrade with residual yaw.
  const fYaw = def.view === "profile"
    ? CONFIDENCE.PROFILE_YAW_FLOOR + (1 - CONFIDENCE.PROFILE_YAW_FLOOR) * clamp((Math.abs(pose.yaw) - CONFIDENCE.PROFILE_MIN_YAW) / (CONFIDENCE.PROFILE_FULL_YAW - CONFIDENCE.PROFILE_MIN_YAW), 0, 1)
    : residual(pose.yaw, CONFIDENCE.POSE_RESIDUAL_FULL_YAW_DEG, def.poseSensitivity.yaw);
  const fPose = fYaw * residual(pose.pitch, CONFIDENCE.POSE_RESIDUAL_FULL_PITCH_DEG, def.poseSensitivity.pitch) * residual(pose.roll, CONFIDENCE.POSE_RESIDUAL_FULL_ROLL_DEG, def.poseSensitivity.roll);
  note(fPose, "Head rotation limits how well this metric can be corrected.");

  let fExpression = 1;
  const es = def.expressionSensitivity;
  if (es) for (const e of expression.affected as (keyof typeof es)[]) if (es[e]) fExpression *= 1 - CONFIDENCE.EXPRESSION_PENALTY * (es[e] as number);
  note(fExpression, "Facial expression likely affects this metric.");

  const fPerspective = 1 - def.perspectiveSensitivity * (1 - CONFIDENCE.PERSPECTIVE_FLOOR) * Math.min(1, perspective.severity / CONFIDENCE.PERSPECTIVE_FULL_SEVERITY);
  note(fPerspective, "Camera perspective may distort this measurement (close or wide-angle capture).");

  // Landmark jitter sigma scales with face size in pixels and is inflated when the face is soft.
  const zl = landmarks.zygionL; const zr = landmarks.zygionR;
  // Size the face by its (pose-independent) box when known; a turned head's bizygomatic distance is foreshortened.
  const facePx = forensics?.faceBox ? equivalentFaceWidth(forensics.faceBox) : zl && zr ? distance(zl, zr) : 0;
  const blur = forensics ? 1 - forensics.scores.sharpness : 0;
  const sigma = Math.hypot(facePx * CONFIDENCE.JITTER_FACE_FRACTION * (1 + CONFIDENCE.JITTER_BLUR_GAIN * blur), CONFIDENCE.JITTER_MIN_PX);
  const unc = estimateUncertainty(def, landmarks, sigma, frameLandmarks);
  const relUnc = unc ? unc.std / Math.max(1e-9, Math.abs(raw.value), def.stabilityReference ?? 0) : 1;
  const fStability = unc ? CONFIDENCE.STABILITY_FLOOR + (1 - CONFIDENCE.STABILITY_FLOOR) * (1 - clamp(relUnc / CONFIDENCE.MAX_RELATIVE_UNCERTAINTY, 0, 1)) : 0.3;
  note(fStability, "Small landmark movements change this value noticeably.");

  const W = CONFIDENCE.FACTOR_WEIGHT; const soft = (f: number, w: number) => Math.pow(Math.max(0, f), w);
  let confidence = soft(fLandmark, W.landmarks) * soft(fQuality, W.imageQuality) * soft(fPose, W.pose) * soft(fExpression, W.expression) * soft(fPerspective, W.perspective) * soft(fStability, W.stability);
  const breakdown: Record<string, number> = { landmarks: fLandmark, imageQuality: fQuality, pose: fPose, expression: fExpression, perspective: fPerspective, stability: fStability };

  if (input.secondary) {
    const other = computeRaw(def, input.secondary);
    if (other) {
      const delta = consensusDelta(raw.value, other.value, def.invarianceTolerance * 2);
      confidence += delta; breakdown.consensus = delta;
      if (delta < 0) reasons.push("Independent geometry sources disagree on this value.");
    }
  }
  confidence = clamp(confidence, 0, 1);

  const status: MetricStatus = confidence >= CONFIDENCE.STATUS_RELIABLE ? "reliable" : confidence >= CONFIDENCE.STATUS_USABLE ? "usable" : confidence >= CONFIDENCE.STATUS_LOW ? "low_confidence" : "unavailable";
  if (status === "unavailable") return { ...base(def), value: null, confidence, uncertainty: null, status, reasons: [...new Set([...reasons, "This photo does not support a trustworthy number for this measurement."])], confidenceBreakdown: breakdown };

  return {
    ...base(def), value: raw.value, confidence, uncertainty: unc ? unc.std : null, status,
    reasons: [...new Set(reasons)], confidenceBreakdown: breakdown, construction: mapConstruction(raw.construction, raw.frame),
  };
}
