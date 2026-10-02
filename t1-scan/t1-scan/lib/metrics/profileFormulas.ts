import { add, angleAt, cross, distance, dot, normalize, RAD2DEG, scale, sub, type Vec3 } from "../geometry/primitives";
import type { CanonicalPrimitive, Formula } from "./types";

/**
 * Soft-tissue profile constructions. Every point lies on the facial midline (sagittal plane), so all
 * angles/distances are measured with true 3D vectors: rotating the head about the vertical axis (yaw)
 * does not change them, which is what lets a 3/4 or imperfect profile still be measured.
 */

/** Angle at `vertex` between rays to a and b (degrees, 0..180). */
const angleFormula = (a: "glabella" | "pronasale", vertex: "nasion" | "subnasale", b: "pronasale" | "labialeSuperius"): Formula => ({ c }) => {
  const pa = c[a]; const pv = c[vertex]; const pb = c[b]; if (!pa || !pv || !pb) return null;
  const value = angleAt(pa, pv, pb); if (value === null) return null;
  return { value, construction: [
    { kind: "line", from: pv, to: pa, role: "measure" }, { kind: "line", from: pv, to: pb, role: "measure" },
    { kind: "angle", vertex: pv, a: pa, b: pb, degrees: value },
  ] };
};

/** Nasofrontal angle: glabella – nasion – pronasale. */
export const nasofrontalAngle: Formula = angleFormula("glabella", "nasion", "pronasale");
/** Nasolabial angle: pronasale – subnasale – labiale superius (nose-tip direction used as the columella tangent). */
export const nasolabialAngle: Formula = angleFormula("pronasale", "subnasale", "labialeSuperius");

/**
 * Facial convexity (glabella – subnasale – pogonion). Reported as the interior angle on the posterior side of
 * subnasale: < 180° for a convex profile (subnasale in front of the glabella–pogonion line), > 180° for a concave one.
 */
export const facialConvexity: Formula = ({ c, forward }) => {
  const g = c.glabella; const sn = c.subnasale; const pg = c.pogonion; if (!g || !sn || !pg || !forward) return null;
  const theta = angleAt(g, sn, pg); const d = normalize(sub(pg, g)); if (theta === null || !d) return null;
  const outward = normalize(sub(forward, scale(d, dot(forward, d)))); if (!outward) return null;
  const convex = dot(sub(sn, g), outward) > 0;
  const value = convex ? theta : 360 - theta;
  return { value, construction: [
    { kind: "line", from: sn, to: g, role: "measure" }, { kind: "line", from: sn, to: pg, role: "measure" },
    { kind: "line", from: g, to: pg, role: "reference" }, { kind: "angle", vertex: sn, a: g, b: pg, degrees: theta },
  ] };
};

/**
 * Ricketts E-line (pronasale → pogonion). Value = signed distance of the chosen lip from that line divided by the
 * E-line length, so it is scale-free: negative = lip behind the line, positive = in front of it.
 */
export const eLine = (lip: "labialeSuperius" | "labialeInferius"): Formula => ({ c, forward }) => {
  const tip = c.pronasale; const pg = c.pogonion; const p = c[lip]; if (!tip || !pg || !p || !forward) return null;
  const length = distance(tip, pg); const d = normalize(sub(pg, tip)); if (!d || length < 1e-9) return null;
  const outward = normalize(sub(forward, scale(d, dot(forward, d)))); if (!outward) return null;
  const rel = sub(p, tip);
  const foot: Vec3 = add(tip, scale(d, dot(rel, d)));
  return { value: dot(rel, outward) / length, construction: [
    { kind: "line", from: tip, to: pg, role: "measure" }, { kind: "line", from: p, to: foot, role: "reference" }, { kind: "point", at: p },
  ] };
};

/* ------------------------------------------------------------------------------------------------
 * Profile-plane constructions. The midline points are already projected onto the sagittal plane; near-side points
 * (gonion, ear region, nostril wing) are projected onto it here, so each measurement is a true 2D measurement in the
 * profile plane: u = forward (out of the face), v = down the face.
 * ---------------------------------------------------------------------------------------------- */

interface PlaneFrame { to2: (p: Vec3) => { u: number; v: number; w: number }; down: Vec3; fwd: Vec3 }
function planeFrame(c: { glabella?: Vec3; menton?: Vec3 }, forward: Vec3 | null): PlaneFrame | null {
  const g = c.glabella; const m = c.menton; if (!g || !m || !forward) return null;
  const down = normalize(sub(m, g)); if (!down) return null;
  const fwd = normalize(sub(forward, scale(down, dot(forward, down)))); if (!fwd) return null;
  const normal = cross(down, fwd);
  return { down, fwd, to2: (p) => { const r = sub(p, g); return { u: dot(r, fwd), v: dot(r, down), w: dot(r, normal) }; } };
}
const d2 = (a: { u: number; v: number }, b: { u: number; v: number }) => Math.hypot(a.u - b.u, a.v - b.v);
/** Interior angle at `vertex` between rays to a and b in the profile plane (0..180). */
function angle2(a: { u: number; v: number }, vertex: { u: number; v: number }, b: { u: number; v: number }): number | null {
  const ux = a.u - vertex.u; const uy = a.v - vertex.v; const vx = b.u - vertex.u; const vy = b.v - vertex.v;
  const nu = Math.hypot(ux, uy); const nv = Math.hypot(vx, vy); if (nu < 1e-9 || nv < 1e-9) return null;
  return Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy) / (nu * nv)))) * RAD2DEG;
}
const L = (from: Vec3, to: Vec3, role: "measure" | "reference" = "measure"): CanonicalPrimitive => ({ kind: "line", from, to, role });
const arc = (vertex: Vec3, a: Vec3, b: Vec3, degrees: number): CanonicalPrimitive => ({ kind: "angle", vertex, a, b, degrees });

/** Ramus : mandible — ramus height (gonion → ear-region point, the soft-tissue stand-in for the condyle) / mandibular body (gonion → menton). */
export const ramusToMandible: Formula = ({ c, forward }) => {
  const f = planeFrame(c, forward); const go = c.gonionNear; const ear = c.earNear; const me = c.menton; if (!f || !go || !ear || !me) return null;
  const value = d2(f.to2(go), f.to2(ear)) / Math.max(1e-9, d2(f.to2(go), f.to2(me)));
  return { value, construction: [L(go, ear), L(go, me, "reference")] };
};

/** Chin-base angle (CBA): angle at menton between the chin front (pogonion) and the jaw angle (gonion). */
export const chinBaseAngle: Formula = ({ c, forward }) => {
  const f = planeFrame(c, forward); const pg = c.pogonion; const me = c.menton; const go = c.gonionNear; if (!f || !pg || !me || !go) return null;
  const value = angle2(f.to2(pg), f.to2(me), f.to2(go)); if (value === null) return null;
  return { value, construction: [L(me, pg), L(me, go), arc(me, pg, go, value)] };
};

/** Soft-tissue chin / mentolabial angle (SCA): angle at the mentolabial sulcus between the lower lip and the chin point. */
export const softChinAngle: Formula = ({ c, forward }) => {
  const f = planeFrame(c, forward); const lip = c.labialeInferius; const sl = c.sublabiale; const pg = c.pogonion; if (!f || !lip || !sl || !pg) return null;
  const value = angle2(f.to2(lip), f.to2(sl), f.to2(pg)); if (value === null) return null;
  return { value, construction: [L(sl, lip), L(sl, pg), arc(sl, lip, pg, value)] };
};

/** Mandibular plane angle (IBA): inclination of the lower jaw border (gonion → menton) to the horizontal. */
export const inferiorBorderAngle: Formula = ({ c, forward }) => {
  const f = planeFrame(c, forward); const go = c.gonionNear; const me = c.menton; if (!f || !go || !me) return null;
  const a = f.to2(go); const b = f.to2(me); const du = Math.abs(b.u - a.u); if (du < 1e-9 && Math.abs(b.v - a.v) < 1e-9) return null;
  const value = Math.atan2(Math.abs(b.v - a.v), du) * RAD2DEG;
  return { value, construction: [L(go, me)] };
};

/** Gonial angle (BUA): angle at the jaw angle between the ramus (to the ear-region point) and the mandibular body (to menton). */
export const gonialAngle: Formula = ({ c, forward }) => {
  const f = planeFrame(c, forward); const go = c.gonionNear; const ear = c.earNear; const me = c.menton; if (!f || !go || !ear || !me) return null;
  const value = angle2(f.to2(ear), f.to2(go), f.to2(me)); if (value === null) return null;
  return { value, construction: [L(go, ear), L(go, me), arc(go, ear, me, value)] };
};

/** Soft-tissue SNB analogue: angle at nasion between the ear-region point (stands in for sella) and the chin point. */
export const softSnb: Formula = ({ c, forward }) => {
  const f = planeFrame(c, forward); const n = c.nasion; const ear = c.earNear; const pg = c.pogonion; if (!f || !n || !ear || !pg) return null;
  const value = angle2(f.to2(ear), f.to2(n), f.to2(pg)); if (value === null) return null;
  return { value, construction: [L(n, ear), L(n, pg), arc(n, ear, pg, value)] };
};

/** Nose width : nose height. Width = 2 x the camera-side nostril wing's distance from the midline plane; height = nasion → subnasale. */
export const noseWidthHeight: Formula = ({ c, forward }) => {
  const f = planeFrame(c, forward); const al = c.alareNear; const n = c.nasion; const sn = c.subnasale; if (!f || !al || !n || !sn) return null;
  const width = 2 * Math.abs(f.to2(al).w); const height = d2(f.to2(n), f.to2(sn)); if (height < 1e-9) return null;
  return { value: width / height, construction: [L(n, sn), { kind: "point", at: al }] };
};

/** Lower-third profile inclination (LTP): angle of subnasale → pogonion to the vertical; + = chin forward of subnasale. */
export const lowerThirdProfile: Formula = ({ c, forward }) => {
  const f = planeFrame(c, forward); const sn = c.subnasale; const pg = c.pogonion; if (!f || !sn || !pg) return null;
  const a = f.to2(sn); const b = f.to2(pg); const dv = b.v - a.v; if (dv <= 0) return null;
  return { value: Math.atan2(b.u - a.u, dv) * RAD2DEG, construction: [L(sn, pg)] };
};

/** Facial depth: ear-region point → nose tip along the forward axis, / face height (glabella → menton). */
export const facialDepth: Formula = ({ c, forward }) => {
  const f = planeFrame(c, forward); const ear = c.earNear; const tip = c.pronasale; const g = c.glabella; const me = c.menton; if (!f || !ear || !tip || !g || !me) return null;
  const depth = f.to2(tip).u - f.to2(ear).u; const height = d2(f.to2(g), f.to2(me)); if (height < 1e-9 || depth <= 0) return null;
  return { value: depth / height, construction: [L(ear, tip), L(g, me, "reference")] };
};
