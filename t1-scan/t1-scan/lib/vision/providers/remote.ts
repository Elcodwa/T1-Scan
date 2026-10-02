import type { NormalizedPoint } from "../landmarks";
import type { DetectedFace, ImageLike, VisionProvider } from "./types";
import { MediaPipeProvider } from "./mediapipe";

/**
 * Optional second geometry source: a server-side 3D reconstruction model (3DDFA-V3 / DECA) behind /api/reconstruct.
 * It only ever returns landmarks; any failure resolves to null so the analysis falls back to landmarks alone.
 */
export class RemoteReconstructionClient {
  constructor(private endpoint = "/api/reconstruct", private timeoutMs = 20_000) {}
  async reconstruct(image: ImageLike): Promise<NormalizedPoint[] | null> {
    try {
      const blob = await toBlob(image); if (!blob) return null;
      const body = new FormData(); body.append("image", blob, "face.jpg");
      const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), this.timeoutMs);
      const res = await fetch(this.endpoint, { method: "POST", body, signal: ctl.signal }); clearTimeout(timer);
      if (!res.ok) return null;
      const json = (await res.json()) as { landmarks?: NormalizedPoint[] };
      return Array.isArray(json.landmarks) && json.landmarks.length >= 468 ? json.landmarks : null;
    } catch { return null; }
  }
}

async function toBlob(image: ImageLike): Promise<Blob | null> {
  if (image instanceof HTMLCanvasElement) return new Promise((r) => image.toBlob((b) => r(b), "image/jpeg", 0.92));
  if (typeof OffscreenCanvas !== "undefined" && image instanceof OffscreenCanvas) return image.convertToBlob({ type: "image/jpeg", quality: 0.92 });
  return null;
}

/** MediaPipe landmarks as primary; remote 3D reconstruction as an optional independent source for consensus. */
export class HybridProvider implements VisionProvider {
  readonly id = "hybrid(mediapipe+3d)";
  readonly capabilities = { dense3DLandmarks: true, dedicated3DReconstruction: true, runsOnDevice: false };
  constructor(private primary: VisionProvider = new MediaPipeProvider(), private remote = new RemoteReconstructionClient()) {}
  warmup = () => this.primary.warmup();
  detectFaces = (image: ImageLike, opts?: { maxFaces?: number }) => this.primary.detectFaces(image, opts);
  reconstruct3D = (image: ImageLike, _face: DetectedFace) => this.remote.reconstruct(image);
}
