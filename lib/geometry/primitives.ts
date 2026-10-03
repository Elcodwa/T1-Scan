/**
 * Pure geometry primitives. Every measurement in T1-Scan is built from these;
 * no component or metric may re-implement distance/angle maths.
 * Coordinate convention: x right, y DOWN, z away from the camera (image space).
 */
export interface Vec3 { x: number; y: number; z: number }
export type Mat3 = readonly [number, number, number, number, number, number, number, number, number]; // row-major

export const EPS = 1e-9;
export const RAD2DEG = 180 / Math.PI;
export const DEG2RAD = Math.PI / 180;

export const vec = (x: number, y: number, z = 0): Vec3 => ({ x, y, z });
export const add = (a: Vec3, b: Vec3): Vec3 => vec(a.x + b.x, a.y + b.y, a.z + b.z);
export const sub = (a: Vec3, b: Vec3): Vec3 => vec(a.x - b.x, a.y - b.y, a.z - b.z);
export const scale = (a: Vec3, s: number): Vec3 => vec(a.x * s, a.y * s, a.z * s);
export const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross = (a: Vec3, b: Vec3): Vec3 => vec(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
export const norm = (a: Vec3): number => Math.sqrt(dot(a, a));
export const normalize = (a: Vec3): Vec3 | null => { const n = norm(a); return n < EPS ? null : scale(a, 1 / n); };
export const vector = (from: Vec3, to: Vec3): Vec3 => sub(to, from);
export const distance = (a: Vec3, b: Vec3): number => norm(sub(a, b));
export const distance2D = (a: Vec3, b: Vec3): number => Math.hypot(a.x - b.x, a.y - b.y);
export const midpoint = (a: Vec3, b: Vec3): Vec3 => scale(add(a, b), 0.5);
export const lerp = (a: Vec3, b: Vec3, t: number): Vec3 => add(scale(a, 1 - t), scale(b, t));
export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Unsigned angle between two vectors in degrees, 0..180. Null for degenerate input. */
export function angle(u: Vec3, v: Vec3): number | null {
  const nu = norm(u); const nv = norm(v);
  if (nu < EPS || nv < EPS) return null;
  return Math.acos(clamp(dot(u, v) / (nu * nv), -1, 1)) * RAD2DEG;
}

/** Angle at `vertex` between rays to a and b, degrees. */
export function angleAt(a: Vec3, vertex: Vec3, b: Vec3): number | null {
  return angle(sub(a, vertex), sub(b, vertex));
}

/** Signed in-plane (x,y) angle from u to v in degrees, range (-180,180]. Positive = clockwise on screen (y down). */
export function signedAngle(u: Vec3, v: Vec3): number | null {
  if (Math.hypot(u.x, u.y) < EPS || Math.hypot(v.x, v.y) < EPS) return null;
  return Math.atan2(u.x * v.y - u.y * v.x, u.x * v.x + u.y * v.y) * RAD2DEG;
}

export interface Line { point: Vec3; dir: Vec3 }
export const line = (a: Vec3, b: Vec3): Line | null => { const d = normalize(sub(b, a)); return d ? { point: a, dir: d } : null; };

/** Intersection of two lines in the x/y plane. Null when parallel. */
export function intersection(l1: Line, l2: Line): Vec3 | null {
  const det = l1.dir.x * l2.dir.y - l1.dir.y * l2.dir.x;
  if (Math.abs(det) < EPS) return null;
  const dx = l2.point.x - l1.point.x; const dy = l2.point.y - l1.point.y;
  const t = (dx * l2.dir.y - dy * l2.dir.x) / det;
  return add(l1.point, scale(l1.dir, t));
}

export function projectPointToLine(p: Vec3, l: Line): Vec3 {
  return add(l.point, scale(l.dir, dot(sub(p, l.point), l.dir)));
}

export interface Plane { point: Vec3; normal: Vec3 }
export function projectPointToPlane(p: Vec3, plane: Plane): Vec3 {
  const n = normalize(plane.normal);
  if (!n) return p;
  return sub(p, scale(n, dot(sub(p, plane.point), n)));
}

/** Signed perpendicular distance from p to the 2D line. */
export function signedDistanceToLine2D(p: Vec3, l: Line): number {
  const v = sub(p, l.point);
  return l.dir.x * v.y - l.dir.y * v.x;
}

export function polygonArea(points: Vec3[]): number {
  let s = 0;
  for (let i = 0; i < points.length; i++) { const a = points[i]; const b = points[(i + 1) % points.length]; s += a.x * b.y - b.x * a.y; }
  return Math.abs(s) / 2;
}

/** Safe ratio; null if denominator is (near) zero or result is not finite. */
export function ratio(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || Math.abs(denominator) < EPS) return null;
  const r = numerator / denominator;
  return Number.isFinite(r) ? r : null;
}

/** distance(a,b) / reference, where the reference is chosen PER METRIC by the caller. */
export function normalizedDistance(a: Vec3, b: Vec3, reference: number): number | null { return ratio(distance(a, b), reference); }

/* ---- 3x3 rotation helpers (row-major) ---- */
export const IDENTITY3: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
export function mulMat3(a: Mat3, b: Mat3): Mat3 {
  const o: number[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o.push(a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]);
  return o as unknown as Mat3;
}
export const transposeMat3 = (m: Mat3): Mat3 => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
export const applyMat3 = (m: Mat3, p: Vec3): Vec3 => vec(m[0] * p.x + m[1] * p.y + m[2] * p.z, m[3] * p.x + m[4] * p.y + m[5] * p.z, m[6] * p.x + m[7] * p.y + m[8] * p.z);
export const rotX = (deg: number): Mat3 => { const c = Math.cos(deg * DEG2RAD); const s = Math.sin(deg * DEG2RAD); return [1, 0, 0, 0, c, -s, 0, s, c]; };
export const rotY = (deg: number): Mat3 => { const c = Math.cos(deg * DEG2RAD); const s = Math.sin(deg * DEG2RAD); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
export const rotZ = (deg: number): Mat3 => { const c = Math.cos(deg * DEG2RAD); const s = Math.sin(deg * DEG2RAD); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
/** Head rotation convention used everywhere: R = Rz(roll) · Rx(pitch) · Ry(yaw). */
export const eulerToMat3 = (yaw: number, pitch: number, roll: number): Mat3 => mulMat3(rotZ(roll), mulMat3(rotX(pitch), rotY(yaw)));
export function mat3ToEuler(m: Mat3): { yaw: number; pitch: number; roll: number } {
  return {
    pitch: Math.asin(clamp(m[7], -1, 1)) * RAD2DEG,
    yaw: Math.atan2(-m[6], m[8]) * RAD2DEG,
    roll: Math.atan2(-m[1], m[4]) * RAD2DEG,
  };
}
