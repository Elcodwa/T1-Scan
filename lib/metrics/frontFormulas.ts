import { distance2D, ratio, RAD2DEG, type Vec3 } from "../geometry/primitives";
import type { SemanticLandmark } from "../types/analysis";
import type { CanonicalPrimitive, Formula } from "./types";

/**
 * Frontal-plane constructions. All points arrive in the canonical head frame (x right, y DOWN, unit = outer-eye
 * distance), so out-of-plane rotation has already been removed and every value is scale-free.
 * Only x/y are used: z from a single photo is too noisy to improve a frontal measurement.
 */

type C = Partial<Record<SemanticLandmark, Vec3>>;
const get = (c: C, ...names: SemanticLandmark[]): Vec3[] | null => { const out: Vec3[] = []; for (const n of names) { const p = c[n]; if (!p) return null; out.push(p); } return out; };
const line = (from: Vec3, to: Vec3, role: "measure" | "reference" = "measure"): CanonicalPrimitive => ({ kind: "line", from, to, role });
const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
const deg = (rad: number) => rad * RAD2DEG;

/** Interior angle at `vertex` between the rays to a and b, using x/y only (degrees). */
function angle2D(a: Vec3, vertex: Vec3, b: Vec3): number | null {
  const ux = a.x - vertex.x; const uy = a.y - vertex.y; const vx = b.x - vertex.x; const vy = b.y - vertex.y;
  const nu = Math.hypot(ux, uy); const nv = Math.hypot(vx, vy); if (nu < 1e-9 || nv < 1e-9) return null;
  return deg(Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy) / (nu * nv)))));
}

/** Facial thirds balance = shortest third / longest third (1 = perfectly equal thirds). */
export const facialThirds: Formula = ({ c }) => {
  const p = get(c, "foreheadTop", "glabella", "subnasale", "menton"); if (!p) return null;
  const [top, g, sn, me] = p;
  const upper = g.y - top.y; const mid = sn.y - g.y; const lower = me.y - sn.y;
  if (upper <= 0 || mid <= 0 || lower <= 0) return null;
  const value = ratio(Math.min(upper, mid, lower), Math.max(upper, mid, lower)); if (value === null) return null;
  return { value, construction: [line(top, g), line(g, sn), line(sn, me)] };
};

/** Eye separation ratio: interpupillary distance / bizygomatic width. */
export const eyeSeparationRatio: Formula = ({ c }) => {
  const p = get(c, "pupilL", "pupilR", "zygionL", "zygionR"); if (!p) return null;
  const value = ratio(distance2D(p[0], p[1]), distance2D(p[2], p[3])); if (value === null) return null;
  return { value, construction: [line(p[0], p[1]), line(p[2], p[3], "reference")] };
};

/** Mean of a per-eye quantity; both eyes are required so one bad side cannot masquerade as the pair. */
const perEye = (fn: (c: C, side: "L" | "R") => { v: number; k: CanonicalPrimitive[] } | null): Formula => ({ c }) => {
  const l = fn(c, "L"); const r = fn(c, "R"); if (!l || !r) return null;
  return { value: mean([l.v, r.v]), construction: [...l.k, ...r.k] };
};

/** Canthal tilt (CTP): angle of endocanthion→exocanthion above the horizontal; + = outer corner higher. */
export const canthalTilt: Formula = perEye((c, s) => {
  const p = get(c, `endocanthion${s}`, `exocanthion${s}`); if (!p) return null;
  const [en, ex] = p; const dx = Math.abs(ex.x - en.x); if (dx < 1e-9) return null;
  return { v: deg(Math.atan2(en.y - ex.y, dx)), k: [line(en, ex)] };
});

/** Eyebrow tilt (ET): angle of inner brow end → outer brow end above the horizontal; + = tail higher. */
export const eyebrowTilt: Formula = perEye((c, s) => {
  const p = get(c, `browInner${s}`, `browTail${s}`); if (!p) return null;
  const [inner, tail] = p; const dx = Math.abs(tail.x - inner.x); if (dx < 1e-9) return null;
  return { v: deg(Math.atan2(inner.y - tail.y, dx)), k: [line(inner, tail)] };
});

/** Eye aspect ratio (EAR): eyelid opening / eye width. */
export const eyeAspectRatio: Formula = perEye((c, s) => {
  const p = get(c, `lidUpper${s}`, `lidLower${s}`, `exocanthion${s}`, `endocanthion${s}`); if (!p) return null;
  const v = ratio(distance2D(p[0], p[1]), distance2D(p[2], p[3])); if (v === null) return null;
  return { v, k: [line(p[0], p[1]), line(p[2], p[3], "reference")] };
});

/** Canthus–brow height (CBH): vertical gap from inner eye corner up to the inner brow end, / eye width. */
export const canthusBrowHeight: Formula = perEye((c, s) => {
  const p = get(c, `endocanthion${s}`, `browInner${s}`, `exocanthion${s}`); if (!p) return null;
  const gap = p[0].y - p[1].y; if (gap <= 0) return null;
  const v = ratio(gap, distance2D(p[0], p[2])); if (v === null) return null;
  return { v, k: [line(p[0], p[1]), line(p[0], p[2], "reference")] };
});

/** Eyebrow height (EBH): vertical gap from the brow arch down to the upper eyelid, / eye width. */
export const eyebrowHeight: Formula = perEye((c, s) => {
  const p = get(c, `lidUpper${s}`, `browPeak${s}`, `exocanthion${s}`, `endocanthion${s}`); if (!p) return null;
  const gap = p[0].y - p[1].y; if (gap <= 0) return null;
  const v = ratio(gap, distance2D(p[2], p[3])); if (v === null) return null;
  return { v, k: [line(p[0], p[1]), line(p[2], p[3], "reference")] };
});

/** Palpebral fissure length (PFL): eye width (endocanthion→exocanthion), averaged, / bizygomatic width. */
export const pflToBizygomatic: Formula = ({ c }) => {
  const p = get(c, "exocanthionL", "endocanthionL", "exocanthionR", "endocanthionR", "zygionL", "zygionR"); if (!p) return null;
  const value = ratio(mean([distance2D(p[0], p[1]), distance2D(p[2], p[3])]), distance2D(p[4], p[5])); if (value === null) return null;
  return { value, construction: [line(p[0], p[1]), line(p[2], p[3]), line(p[4], p[5], "reference")] };
};

/** Brow span (outer brow ends) / bizygomatic width. */
export const browToZygomatic: Formula = ({ c }) => {
  const p = get(c, "browTailL", "browTailR", "zygionL", "zygionR"); if (!p) return null;
  const value = ratio(distance2D(p[0], p[1]), distance2D(p[2], p[3])); if (value === null) return null;
  return { value, construction: [line(p[0], p[1]), line(p[2], p[3], "reference")] };
};

/** Jaw width / height: bigonial width over lower-face height (subnasale → menton). */
export const jawWidthHeight: Formula = ({ c }) => {
  const p = get(c, "gonionL", "gonionR", "subnasale", "menton"); if (!p) return null;
  const value = ratio(distance2D(p[0], p[1]), distance2D(p[2], p[3])); if (value === null) return null;
  return { value, construction: [line(p[0], p[1]), line(p[2], p[3], "reference")] };
};

/** Bitemporal / bigonial width. */
export const bitemporalToBigonial: Formula = ({ c }) => {
  const p = get(c, "templeL", "templeR", "gonionL", "gonionR"); if (!p) return null;
  const value = ratio(distance2D(p[0], p[1]), distance2D(p[2], p[3])); if (value === null) return null;
  return { value, construction: [line(p[0], p[1]), line(p[2], p[3], "reference")] };
};

/** Forehead width / height: temple-to-temple width over the glabella → top-of-face height. */
export const foreheadWidthHeight: Formula = ({ c }) => {
  const p = get(c, "templeL", "templeR", "foreheadTop", "glabella"); if (!p) return null;
  if (p[3].y - p[2].y <= 0) return null;
  const value = ratio(distance2D(p[0], p[1]), distance2D(p[2], p[3])); if (value === null) return null;
  return { value, construction: [line(p[0], p[1]), line(p[2], p[3], "reference")] };
};

/** Jaw frontal angle (JFA): angle at the chin (menton) between the two jaw lines to the gonion points. */
export const jawFrontalAngle: Formula = ({ c }) => {
  const p = get(c, "gonionL", "menton", "gonionR"); if (!p) return null;
  const value = angle2D(p[0], p[1], p[2]); if (value === null) return null;
  return { value, construction: [line(p[1], p[0]), line(p[1], p[2]), { kind: "angle", vertex: p[1], a: p[0], b: p[2], degrees: value }] };
};

/** Inner-canthus opening angle (SFA / IA): angle at the inner eye corner between the upper and lower lid margins. */
export const innerCanthalAngle: Formula = perEye((c, s) => {
  const p = get(c, `lidUpper${s}`, `endocanthion${s}`, `lidLower${s}`); if (!p) return null;
  const v = angle2D(p[0], p[1], p[2]); if (v === null) return null;
  return { v, k: [line(p[1], p[0]), line(p[1], p[2])] };
});
