import type { Vec3 } from "./primitives";

/** 2D similarity/affine transform: x' = a*x + c*y + e ; y' = b*x + d*y + f. z is scaled by `zScale`. */
export interface Affine2D { a: number; b: number; c: number; d: number; e: number; f: number; zScale: number }

export const identityAffine = (): Affine2D => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, zScale: 1 });
export const translation = (tx: number, ty: number): Affine2D => ({ ...identityAffine(), e: tx, f: ty });
export const uniformScale = (s: number): Affine2D => ({ a: s, b: 0, c: 0, d: s, e: 0, f: 0, zScale: s });
export const rotationDeg = (deg: number): Affine2D => { const r = (deg * Math.PI) / 180; const c = Math.cos(r); const s = Math.sin(r); return { a: c, b: s, c: -s, d: c, e: 0, f: 0, zScale: 1 }; };

export function applyAffine(t: Affine2D, p: Vec3): Vec3 { return { x: t.a * p.x + t.c * p.y + t.e, y: t.b * p.x + t.d * p.y + t.f, z: p.z * t.zScale }; }

/** composeAffine(second, first) = apply `first`, then `second`. */
export function composeAffine(second: Affine2D, first: Affine2D): Affine2D {
  return {
    a: second.a * first.a + second.c * first.b, b: second.b * first.a + second.d * first.b,
    c: second.a * first.c + second.c * first.d, d: second.b * first.c + second.d * first.d,
    e: second.a * first.e + second.c * first.f + second.e, f: second.b * first.e + second.d * first.f + second.f,
    zScale: second.zScale * first.zScale,
  };
}

export function invertAffine(t: Affine2D): Affine2D {
  const det = t.a * t.d - t.b * t.c;
  if (Math.abs(det) < 1e-12) throw new Error("Affine transform is not invertible");
  const a = t.d / det; const b = -t.b / det; const c = -t.c / det; const d = t.a / det;
  return { a, b, c, d, e: -(a * t.e + c * t.f), f: -(b * t.e + d * t.f), zScale: 1 / t.zScale };
}

/**
 * Records how the processed image relates to the ORIGINAL image so every landmark
 * and overlay can be mapped back exactly. The original is never modified.
 */
export interface PreprocessingTransform {
  originalSize: { width: number; height: number };
  processedSize: { width: number; height: number };
  /** original-pixel -> processed-pixel (crop, padding, resize composed) */
  originalToProcessed: Affine2D;
}
export const processedToOriginal = (t: PreprocessingTransform): Affine2D => invertAffine(t.originalToProcessed);
