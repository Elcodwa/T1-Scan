import type { LandmarkPoint, PoseResult } from "./types";

export interface FaceDetection {
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
}

export interface FaceGeometry {
  landmarks2D: LandmarkPoint[];
  landmarks3D?: LandmarkPoint[];
  canonicalTransform?: number[];
  confidence: number;
}

/** Keeps product logic independent from MediaPipe or any replacement vision model. */
export interface VisionProvider {
  detectFaces(image: ImageBitmap): Promise<FaceDetection[]>;
  getLandmarks(image: ImageBitmap, face: FaceDetection): Promise<FaceGeometry>;
  getPose(geometry: FaceGeometry): Promise<PoseResult>;
}
