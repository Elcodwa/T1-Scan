import { boxFromLandmarks } from "../preprocess";
import type { DetectedFace, ImageLike, VisionProvider } from "./types";

// Pinned. For production, self-host both assets under /public/models and set these to local URLs.
const WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

type Landmarker = { detect(image: ImageLike): { faceLandmarks?: { x: number; y: number; z: number }[][] } };
let shared: Promise<Landmarker> | undefined;

function load(): Promise<Landmarker> {
  if (!shared) {
    shared = (async () => {
      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks(WASM_ROOT);
      const create = (delegate: "GPU" | "CPU") => FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate }, runningMode: "IMAGE", numFaces: 4,
        minFaceDetectionConfidence: 0.4, minFacePresenceConfidence: 0.4, minTrackingConfidence: 0.4,
      });
      try { return (await create("GPU")) as unknown as Landmarker; } catch { return (await create("CPU")) as unknown as Landmarker; } // CPU fallback
    })();
    shared.catch(() => { shared = undefined; }); // a failed load must be retryable
  }
  return shared;
}

export class MediaPipeProvider implements VisionProvider {
  readonly id = "mediapipe";
  readonly capabilities = { dense3DLandmarks: true, dedicated3DReconstruction: false, runsOnDevice: true };
  warmup = async () => { await load(); };
  async detectFaces(image: ImageLike, opts: { maxFaces?: number } = {}): Promise<DetectedFace[]> {
    const lm = await load();
    const size = { width: (image as { width: number }).width, height: (image as { height: number }).height };
    const faces = lm.detect(image).faceLandmarks ?? [];
    return faces.slice(0, opts.maxFaces ?? 4).map((dense) => ({ dense: dense.map(({ x, y, z }) => ({ x, y, z })), box: boxFromLandmarks(dense, size), detectionScore: 1 }));
  }
}
