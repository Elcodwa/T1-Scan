import type { Box } from "../forensics";
import type { NormalizedPoint } from "../landmarks";

/** What the engine receives. Pixel data stays inside the provider; only landmarks cross the boundary. */
export type ImageLike = ImageBitmap | HTMLCanvasElement | OffscreenCanvas;

export interface DetectedFace {
  /** Pixel box in the image passed to the provider. */
  box: Box;
  /** Dense landmarks normalised 0..1 over that image; z in units of image width. */
  dense: NormalizedPoint[];
  detectionScore: number;
}

export interface ProviderCapabilities { dense3DLandmarks: boolean; dedicated3DReconstruction: boolean; runsOnDevice: boolean }

/**
 * A geometry source. The measurement engine never imports a concrete model; swapping or adding a provider
 * (3DDFA-V3, DECA, ...) requires no change to geometry, metrics or confidence code.
 */
export interface VisionProvider {
  readonly id: string;
  readonly capabilities: ProviderCapabilities;
  /** Load and cache models once; safe to call repeatedly. */
  warmup(): Promise<void>;
  detectFaces(image: ImageLike, opts?: { maxFaces?: number }): Promise<DetectedFace[]>;
  /** Optional second, independent geometry source for the face found in `image`. Null when unavailable. */
  reconstruct3D?(image: ImageLike, face: DetectedFace): Promise<NormalizedPoint[] | null>;
}
