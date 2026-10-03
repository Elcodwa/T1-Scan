import type { ImageQualityResult, ImageView, LandmarkPoint, PoseResult, VisionAnalysis } from "./types";
import { inspectImage } from "./quality";
import { calculateMeasurements } from "./metrics/measurementRegistry";

const WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let detector: Promise<any> | undefined;

async function getDetector() {
  if (!detector) {
    detector = (async () => {
      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
      return FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL },
        runningMode: "IMAGE",
        numFaces: 2,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        minFaceDetectionConfidence: 0.6,
        minFacePresenceConfidence: 0.6,
      });
    })();
  }
  return detector;
}

function estimatePose(points: LandmarkPoint[], matrix: number[] | undefined, view: ImageView): PoseResult {
  const leftEye = points[33]; const rightEye = points[263]; const nose = points[1];
  if (!leftEye || !rightEye || !nose) return { roll: 0, pitch: 0, yaw: 0, acceptable: false, confidence: 0, source: "landmarks", classification: "UNKNOWN", message: "Landmarks are incomplete." };
  const landmarkRoll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180 / Math.PI;
  const leftDistance = Math.hypot(nose.x - leftEye.x, nose.y - leftEye.y);
  const rightDistance = Math.hypot(nose.x - rightEye.x, nose.y - rightEye.y);
  const landmarkYaw = ((rightDistance - leftDistance) / Math.max(0.0001, leftDistance + rightDistance)) * 90;
  const matrixYaw = matrix?.length === 16 ? Math.atan2(-matrix[8], Math.hypot(matrix[0], matrix[4])) * 180 / Math.PI : undefined;
  const matrixPitch = matrix?.length === 16 ? Math.atan2(matrix[9], matrix[10]) * 180 / Math.PI : undefined;
  const matrixRoll = matrix?.length === 16 ? Math.atan2(matrix[4], matrix[0]) * 180 / Math.PI : undefined;
  const roll = matrixRoll === undefined ? landmarkRoll : (matrixRoll + landmarkRoll) / 2;
  const yaw = matrixYaw === undefined ? landmarkYaw : (matrixYaw + landmarkYaw) / 2;
  const pitch = matrixPitch ?? 0;
  const absRoll = Math.abs(roll);
  const absYaw = Math.abs(yaw);
  const classification = absYaw <= 11 ? "FRONTAL" : absYaw <= 32 ? "SLIGHTLY_ROTATED" : absYaw <= 62 ? "THREE_QUARTER" : yaw < 0 ? "LEFT_PROFILE" : "RIGHT_PROFILE";
  const acceptable = view === "front" ? absRoll <= 18 && absYaw <= 40 : classification === "LEFT_PROFILE" || classification === "RIGHT_PROFILE" || classification === "THREE_QUARTER";
  return {
    roll: Number(roll.toFixed(1)), pitch: Number(pitch.toFixed(1)), yaw: Number(yaw.toFixed(1)), acceptable,
    confidence: matrix ? 0.86 : 0.68, source: matrix ? "fused" : "landmarks", classification,
    message: acceptable ? undefined : view === "front" ? "This image can support a reduced measurement set; a more frontal capture improves symmetry and width metrics." : "A clearer side profile will improve profile-plane measurements.",
  };
}

export async function analyzeFace(file: File, view: ImageView): Promise<VisionAnalysis> {
  const preflight = await inspectImage(file);
  const image = await createImageBitmap(file);
  const landmarker = await getDetector();
  const result = landmarker.detect(image);
  image.close();
  const faceCount = result.faceLandmarks?.length ?? 0;
  const landmarks = (result.faceLandmarks?.[0] ?? []).map((point: LandmarkPoint) => ({ x: point.x, y: point.y, z: point.z }));
  const transformationMatrix = result.facialTransformationMatrixes?.[0]?.data ? Array.from(result.facialTransformationMatrixes[0].data) as number[] : undefined;
  const pose = faceCount === 1 ? estimatePose(landmarks, transformationMatrix, view) : { roll: 0, pitch: 0, yaw: 0, acceptable: false, confidence: 0, source: "landmarks" as const, classification: "UNKNOWN" as const, message: faceCount > 1 ? "Please upload an image containing one face." : "No face detected." };
  const warnings = [...preflight.warnings];
  if (faceCount !== 1) warnings.unshift(pose.message ?? "A single face is required.");
  if (faceCount === 1 && !pose.acceptable) warnings.unshift(pose.message ?? "Pose needs adjustment.");
  const quality: ImageQualityResult = {
    ...preflight, faceDetected: faceCount > 0, faceCount, poseScore: Math.round(pose.confidence * (pose.acceptable ? 100 : 55)),
    overallConfidence: faceCount === 1 ? Math.min(98, Math.round(preflight.overallConfidence * 0.72 + pose.confidence * 28)) : Math.round(preflight.overallConfidence * 0.35),
    valid: faceCount === 1 && preflight.analysisLevel !== "UNRELIABLE", warnings,
  };
  const metricConfidence = Math.min(0.98, quality.overallConfidence / 100 * pose.confidence);
  return { quality, pose, landmarks, transformationMatrix, measurements: faceCount === 1 ? calculateMeasurements(landmarks, metricConfidence) : [] };
}
