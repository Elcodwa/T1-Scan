import { clamp } from "../geometry/primitives";
import { composeAffine, translation, uniformScale, type Affine2D } from "../geometry/transform";
import type { Box, RawImage } from "./forensics";

export const PREPROCESS = {
  /** Working-copy long side for first-pass detection. The original is never resized. */
  DETECT_MAX_SIDE: 1280,
  /** Re-detect on a face-aware crop when the face covers less than this fraction of the working width. */
  RECROP_BELOW_FACE_FRACTION: 0.35,
  /** Crop margins as fractions of the face box: wide enough to keep forehead, jaw, ears and neck. */
  MARGIN: { left: 0.6, right: 0.6, top: 0.7, bottom: 0.55 },
  CROP_MAX_SIDE: 1024,
  CROP_MIN_SIDE: 512,
  /** A face is "dominant" when its area is at least this multiple of every other face. */
  DOMINANCE_RATIO: 2.0,
  MAX_INPUT_BYTES: 25 * 1024 * 1024,
  MAX_INPUT_PIXELS: 120_000_000,
} as const;

export function faceCropRect(face: Box, image: { width: number; height: number }): Box {
  const m = PREPROCESS.MARGIN;
  const x0 = clamp(face.x - face.width * m.left, 0, image.width); const x1 = clamp(face.x + face.width * (1 + m.right), 0, image.width);
  const y0 = clamp(face.y - face.height * m.top, 0, image.height); const y1 = clamp(face.y + face.height * (1 + m.bottom), 0, image.height);
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

/** original-pixel -> processed-pixel for "crop then uniform resize so the long side lands in [MIN, MAX]". */
export function cropTransform(rect: Box): { transform: Affine2D; size: { width: number; height: number } } {
  const long = Math.max(rect.width, rect.height);
  const target = clamp(long, PREPROCESS.CROP_MIN_SIDE, PREPROCESS.CROP_MAX_SIDE);
  const s = target / long;
  return { transform: composeAffine(uniformScale(s), translation(-rect.x, -rect.y)), size: { width: Math.max(1, Math.round(rect.width * s)), height: Math.max(1, Math.round(rect.height * s)) } };
}

export function workingScale(image: { width: number; height: number }): number {
  return Math.min(1, PREPROCESS.DETECT_MAX_SIDE / Math.max(image.width, image.height));
}

/** Index of the clearly dominant face, or null when it is ambiguous (the caller must ask the user). */
export function pickDominantFace(boxes: Box[]): number | null {
  if (boxes.length === 0) return null; if (boxes.length === 1) return 0;
  const areas = boxes.map((b) => b.width * b.height); const best = areas.indexOf(Math.max(...areas));
  return areas.every((a, i) => i === best || areas[best] >= PREPROCESS.DOMINANCE_RATIO * a) ? best : null;
}

/** Face box from dense normalised landmarks (0..1) -> pixel box in the given image size. */
export function boxFromLandmarks(dense: { x: number; y: number }[], size: { width: number; height: number }): Box {
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  for (const p of dense) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
  return { x: x0 * size.width, y: y0 * size.height, width: (x1 - x0) * size.width, height: (y1 - y0) * size.height };
}

/**
 * Mild, geometry-preserving exposure correction (percentile levels + gamma toward mid-grey).
 * Point-wise only, so it never moves a pixel and needs no coordinate bookkeeping. Returns a NEW buffer.
 */
export function autoLevels(img: RawImage, opts: { clip?: number; targetMean?: number } = {}): Uint8ClampedArray {
  const clip = opts.clip ?? 0.01; const target = opts.targetMean ?? 118;
  const n = img.width * img.height; const hist = new Uint32Array(256);
  for (let i = 0; i < n; i++) hist[Math.round(img.data[i * 4] * 0.2126 + img.data[i * 4 + 1] * 0.7152 + img.data[i * 4 + 2] * 0.0722)]++;
  let acc = 0; let lo = 0; let hi = 255;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= n * clip) { lo = v; break; } }
  acc = 0; for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= n * clip) { hi = v; break; } }
  if (hi - lo < 16) { lo = Math.max(0, lo - 8); hi = Math.min(255, hi + 8); }
  const stretch = (v: number) => clamp((v - lo) / Math.max(1, hi - lo), 0, 1);
  let mean = 0; for (let i = 0; i < n; i++) mean += stretch((img.data[i * 4] * 0.2126 + img.data[i * 4 + 1] * 0.7152 + img.data[i * 4 + 2] * 0.0722)) ;
  mean = (mean / n) * 255;
  const gamma = clamp(Math.log(target / 255) / Math.log(Math.max(1, mean) / 255), 0.4, 2.5);
  const lut = new Uint8ClampedArray(256); for (let v = 0; v < 256; v++) lut[v] = Math.round(255 * Math.pow(stretch(v), gamma));
  const out = new Uint8ClampedArray(img.data.length);
  for (let i = 0; i < img.data.length; i += 4) { out[i] = lut[img.data[i]]; out[i + 1] = lut[img.data[i + 1]]; out[i + 2] = lut[img.data[i + 2]]; out[i + 3] = img.data[i + 3]; }
  return out;
}
