import { THRESHOLDS } from "../scoring/rubric/thresholds";
import { REF } from "../scoring/dimensions";

/**
 * Plain-language layer over the metric registry. The registry stays the single source of truth for HOW something is
 * measured; this file only says what it MEANS to a person and, where a documented band exists, what is typical.
 * A metric with no `band` is shown as a measurement without a verdict: we do not invent ranges.
 */
export type Area = "Face shape" | "Eyes" | "Nose" | "Mouth" | "Jaw & chin" | "Profile";
export const AREAS: Area[] = ["Face shape", "Eyes", "Nose", "Mouth", "Jaw & chin", "Profile"];

export interface MetricGuide {
  title: string; area: Area;
  /** One sentence a non-expert can read. */
  what: string;
  /** Typical band (documented reference). Absent => no verdict is given. */
  band?: { low: number; high: number; source: string };
  /** What it means when the value sits below / above the band. */
  below?: string; above?: string;
  /** Scale shown on the range bar (value is clamped into it). */
  scale: [number, number];
}

const G: Record<string, MetricGuide> = {
  fwhr: { title: "Face width vs height", area: "Face shape", what: "How wide the face is compared with its height (brow to chin). Higher = wider, more compact face.", scale: [0.8, 1.4] },
  facial_thirds: { title: "Facial thirds balance", area: "Face shape", what: "How evenly the forehead, mid-face and lower face share the height of the face. 1.00 = three equal parts.", band: { low: 0.85, high: 1, source: "Classical facial thirds: roughly equal parts." }, below: "One third is noticeably larger than another.", scale: [0.3, 1] },
  brow_zygo: { title: "Brow width vs cheekbones", area: "Face shape", what: "The span of your eyebrows compared with the width of your cheekbones.", scale: [0.5, 1] },
  forehead_wh: { title: "Forehead width vs height", area: "Face shape", what: "How broad the forehead is compared with how tall it is (the hairline is estimated, so treat as rough).", scale: [1, 6] },
  btw_bgw: { title: "Temples vs jaw width", area: "Face shape", what: "Width across the temples compared with width across the jaw. Above 1 = temples wider than jaw.", scale: [0.8, 1.6] },

  icd_fw: { title: "Eye spacing", area: "Eyes", what: "Distance between the inner corners of the eyes compared with face width.", band: { ...REF.icd_fw }, below: "Eyes sit relatively close together.", above: "Eyes sit relatively far apart.", scale: [0.15, 0.35] },
  esr: { title: "Pupil spacing", area: "Eyes", what: "Distance between the pupils compared with the width of the cheekbones.", scale: [0.3, 0.55] },
  pfl_bizygo: { title: "Eye width", area: "Eyes", what: "How wide each eye opening is compared with face width.", scale: [0.12, 0.26] },
  ear: { title: "Eye openness", area: "Eyes", what: "Height of the eye opening compared with its width. Higher = rounder, more open eyes.", scale: [0.1, 0.45] },
  ctp: { title: "Eye tilt (canthal tilt)", area: "Eyes", what: "Whether the outer corner of the eye sits higher (positive) or lower (negative) than the inner corner.", scale: [-10, 20] },
  sfa_ia: { title: "Inner eye-corner angle", area: "Eyes", what: "The angle of the opening at the inner corner of the eye.", scale: [10, 50] },
  et: { title: "Eyebrow tilt", area: "Eyes", what: "Whether the tail of the eyebrow rises (positive) or falls (negative) from its inner end.", scale: [-10, 30] },
  ebh: { title: "Brow-to-eye distance", area: "Eyes", what: "The gap between the brow arch and the upper eyelid compared with eye width.", scale: [0.3, 1.4] },
  cbh: { title: "Inner brow height", area: "Eyes", what: "The gap between the inner eye corner and the inner end of the brow, compared with eye width.", scale: [0.2, 1] },

  alar_icd: { title: "Nose width", area: "Nose", what: "Width of the nostrils compared with the distance between the eyes. About 1.0 is the classical match.", band: { low: 0.9, high: THRESHOLDS.alarToIcdMax.value, source: THRESHOLDS.alarToIcdMax.source }, below: "Nose is narrower than the eye spacing.", above: "Nose is wider than the eye spacing.", scale: [0.7, 1.5] },
  nfa: { title: "Nose-bridge angle", area: "Nose", what: "The angle where the forehead meets the nose, seen from the side.", band: { ...REF.nfa }, below: "A deeper, more projected nose bridge.", above: "A flatter transition from forehead to nose.", scale: [90, 160] },
  nasal_lip_angle: { title: "Nose-to-lip angle", area: "Nose", what: "The angle between the nose tip and the upper lip, seen from the side.", band: { ...REF.nasal_lip_angle }, below: "Nose tip points more downward.", above: "Nose tip points more upward.", scale: [60, 150] },
  nw_nh: { title: "Nose width vs height", area: "Nose", what: "Nose width compared with nose height. Estimated from depth in a side photo, so it is rough.", scale: [0.4, 1.4] },

  mouth_fw: { title: "Mouth width", area: "Mouth", what: "Width of the mouth compared with face width.", band: { ...REF.mouth_fw }, below: "A narrower mouth relative to the face.", above: "A wider mouth relative to the face.", scale: [0.25, 0.55] },
  mouth_wh: { title: "Lip fullness", area: "Mouth", what: "Mouth width compared with lip height. Lower = fuller lips relative to width. Changes with expression.", scale: [1.5, 6] },

  bigonial_bizygomatic: { title: "Jaw vs cheekbone width", area: "Jaw & chin", what: "Width of the jaw compared with the width of the cheekbones. Higher = a squarer, wider jaw.", scale: [0.65, 1] },
  jaw_wh: { title: "Jaw width vs height", area: "Jaw & chin", what: "Jaw width compared with the height of the lower face.", scale: [1, 2.6] },
  jfa: { title: "Chin shape (front)", area: "Jaw & chin", what: "The angle formed at the chin by the two sides of the jaw. Smaller = narrower, more pointed chin.", scale: [80, 150] },
  cba: { title: "Chin-base angle", area: "Jaw & chin", what: "The angle at the bottom of the chin between the chin front and the jaw angle, seen from the side.", scale: [50, 130] },
  sca: { title: "Chin crease angle", area: "Jaw & chin", what: "The angle of the crease between the lower lip and the chin, seen from the side.", scale: [90, 180] },
  ramus_mandible: { title: "Jaw height vs length", area: "Jaw & chin", what: "The upright part of the jawbone compared with the horizontal part.", scale: [0.3, 1.6] },
  iba: { title: "Jawline slope", area: "Jaw & chin", what: "How steeply the lower jaw edge slopes, seen from the side. Lower = a flatter jawline.", scale: [5, 50] },
  snb: { title: "Chin position (SNB-style)", area: "Jaw & chin", what: "A photo-based stand-in for the SNB angle: how far forward the chin sits. Not comparable with X-ray SNB.", scale: [50, 110] },
  bua: { title: "Jaw angle", area: "Jaw & chin", what: "The angle at the corner of the jaw between its upright and horizontal parts.", scale: [90, 160] },

  fcg: { title: "Profile convexity", area: "Profile", what: "How curved the profile is from forehead to nose to chin. Near 180° = flat, lower = more convex.", band: { ...REF.fcg }, below: "A more convex (curved-out) profile.", above: "A flatter or concave profile.", scale: [140, 200] },
  ricketts_e_upper: { title: "Upper lip position", area: "Profile", what: "Where the upper lip sits relative to the nose-tip-to-chin line. Negative = behind the line.", scale: [-0.25, 0.25] },
  ricketts_e_lower: { title: "Lower lip position", area: "Profile", what: "Where the lower lip sits relative to the nose-tip-to-chin line. Negative = behind the line.", scale: [-0.25, 0.25] },
  ltp: { title: "Lower-face slope", area: "Profile", what: "Whether the chin sits forward of (positive) or behind (negative) the base of the nose.", scale: [-20, 20] },
  facial_depth: { title: "Face depth", area: "Profile", what: "How far the face projects forward compared with its height.", scale: [0.4, 1.6] },
};
G.bigonial_bizygomatic.band = { low: 0.82, high: 0.9, source: "Jaw ÷ cheekbone width: PMC10335162 reports the reciprocal as 1.128 (men) and 1.174 (women)." };

const FALLBACK = (id: string, name: string, category: string): MetricGuide => ({ title: name, area: category === "Eyes" ? "Eyes" : category === "Nose" ? "Nose" : category === "Mouth" ? "Mouth" : category === "Jaw" ? "Jaw & chin" : category === "Profile" ? "Profile" : "Face shape", what: `Measured value for ${name}.`, scale: [0, 1] });

export const guideFor = (id: string, name = id, category = ""): MetricGuide => G[id] ?? FALLBACK(id, name, category);

export type Verdict = "typical" | "below" | "above" | "none";
export function verdictOf(id: string, value: number): { verdict: Verdict; note?: string } {
  const g = G[id]; if (!g?.band) return { verdict: "none" };
  if (value < g.band.low) return { verdict: "below", note: g.below };
  if (value > g.band.high) return { verdict: "above", note: g.above };
  return { verdict: "typical" };
}
