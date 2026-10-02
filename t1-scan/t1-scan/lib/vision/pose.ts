import { mat3ToEuler } from "../geometry/primitives";
import { CONFIDENCE } from "../confidence/constants";
import type { LandmarkMap, PoseClass, PoseEstimate } from "../types/analysis";
import { buildHeadFrame } from "./canonical";

const UNKNOWN: PoseEstimate = { yaw: 0, pitch: 0, roll: 0, classification: "UNKNOWN", facing: "camera", confidence: 0, method: "unavailable" };

/**
 * Head pose from the geometry of the landmarks themselves (never from a user selection or a filename).
 * Yaw is unbiased for a bilaterally symmetric face. Pitch/roll are relative to the subject's own
 * eyes->menton axis, so pitch carries the subject's anatomical offset; it is used for penalties only.
 */
export function estimatePose(points: LandmarkMap): PoseEstimate {
  const frame = buildHeadFrame(points);
  if (!frame) return UNKNOWN;
  const { yaw, pitch, roll } = mat3ToEuler(frame.rotation);
  const a = Math.abs(yaw);
  const classification: PoseClass =
    a < CONFIDENCE.POSE_FRONTAL_MAX ? "FRONTAL" : a < CONFIDENCE.POSE_SLIGHT_MAX ? "SLIGHT_YAW" : a < CONFIDENCE.POSE_THREE_QUARTER_MAX ? "THREE_QUARTER" : "PROFILE";
  const facing = classification === "FRONTAL" ? "camera" : yaw > 0 ? "left" : "right";
  const confidence = a <= CONFIDENCE.FRAME_VALID_MAX_YAW ? 1 - 0.5 * (a / CONFIDENCE.FRAME_VALID_MAX_YAW) : 0.3;
  return { yaw, pitch, roll, classification, facing, confidence, method: "landmark_frame" };
}
