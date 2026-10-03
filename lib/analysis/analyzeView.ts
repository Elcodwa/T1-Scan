import { evaluateMetric } from "../confidence/engine";
import { metricsForView } from "../metrics/registry";
import type { PreprocessingTransform } from "../geometry/transform";
import type { ImageForensics, ImageView, LandmarkMap, LandmarkSet, ViewAnalysis } from "../types/analysis";
import { refineLandmarkConfidence } from "../vision/landmarks";
import { estimatePose } from "../vision/pose";
import { estimateExpression } from "../vision/expression";
import { estimatePerspective } from "../vision/perspective";
import { validateLandmarks } from "../vision/validation";
import { validateProfileLandmarks } from "../vision/profileValidation";
import { CONFIDENCE } from "../confidence/constants";

export interface ViewInput {
  view: ImageView; provider: string;
  landmarks: LandmarkSet | null; secondary?: LandmarkSet | null;
  forensics?: ImageForensics; transform?: PreprocessingTransform;
  imageSize: { width: number; height: number };
  focalLength35mm?: number | null;
  faceCount?: number;
  /** Face boxes (original px, left to right) when more than one face was found. */
  candidates?: { x: number; y: number; width: number; height: number }[];
}

const fail = (input: ViewInput, code: string, message: string, guidance: string, candidates?: ViewInput["candidates"]): ViewAnalysis => ({
  view: input.view, status: "failed", failure: { code, message, guidance, candidates: candidates ? { imageSize: input.imageSize, boxes: candidates } : undefined }, forensics: input.forensics, landmarkIssues: [], landmarks: {}, transform: input.transform, metrics: [], warnings: [], provider: input.provider,
});

/** Pure: landmarks + image facts in, fully-qualified measurements out. No DOM, no model calls. */
export function analyzeView(input: ViewInput): ViewAnalysis {
  const label = input.view === "front" ? "front" : "profile";
  // Multiple faces must be checked first: the pipeline passes landmarks=null when no face is clearly dominant.
  if ((input.faceCount ?? 1) > 1) return fail(input, "multiple_faces", `More than one face was found in the ${label} image.`, "Tap the face you want analyzed.", input.candidates);
  if ((input.faceCount ?? 1) === 0 || !input.landmarks) return fail(input, "no_face", `We couldn't reliably detect a face in the ${label} image.`, input.view === "profile" ? "Try a photo where the full side of the face is visible." : "Try a photo where the face is visible and not covered.");

  const rawPoints: LandmarkMap = input.landmarks.points;
  const initialPose = estimatePose(rawPoints);
  const points = refineLandmarkConfidence(rawPoints, initialPose, input.imageSize);
  // Bilateral checks and expression cues need the face frame, which is only valid while both sides are visible.
  const frameUsable = Math.abs(initialPose.yaw) <= CONFIDENCE.FRAME_VALID_MAX_YAW;
  const issues = input.view === "profile" ? validateProfileLandmarks(points) : validateLandmarks(points);
  const expression = frameUsable ? estimateExpression(points) : { mouthOpen: 0, smile: 0, affected: [] };
  const perspective = estimatePerspective(points, input.imageSize, input.focalLength35mm);
  const warnings: string[] = [...(input.forensics?.notes ?? [])];

  if (initialPose.classification === "UNKNOWN") warnings.push("Head pose could not be established from the landmarks.");
  if (input.view === "front" && (initialPose.classification === "PROFILE" || initialPose.classification === "THREE_QUARTER")) warnings.push("This front photo shows the head turned; frontal metrics are reduced or unavailable.");
  if (input.view === "profile" && (initialPose.classification === "FRONTAL" || initialPose.classification === "SLIGHT_YAW")) warnings.push("This looks like a mostly frontal photo; profile metrics need a side view.");
  if (perspective.severity > 0.3) warnings.push("The camera looks close to the face; perspective distortion may affect proportions.");
  if (expression.affected.length) warnings.push("A facial expression was detected; metrics it affects have reduced confidence.");

  const defs = metricsForView(input.view);
  const metrics = defs.map((d) => evaluateMetric(d, { landmarks: points, pose: initialPose, forensics: input.forensics, expression, perspective, issues, secondary: input.secondary?.points }));
  const measured = metrics.filter((m) => m.value !== null).length;
  const status = measured === 0 ? "partial" : "ok";

  return { view: input.view, status, forensics: input.forensics, pose: initialPose, expression, perspective, landmarkIssues: issues, landmarks: points, transform: input.transform, metrics, warnings, provider: input.provider };
}
