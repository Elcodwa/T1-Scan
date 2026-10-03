import { distance2D, ratio } from "../geometry/primitives";
import type { MetricDefinition, Formula } from "./types";
import type { SemanticLandmark } from "../types/analysis";
import { chinBaseAngle, eLine, facialConvexity, facialDepth, gonialAngle, inferiorBorderAngle, lowerThirdProfile, nasofrontalAngle, nasolabialAngle, noseWidthHeight, ramusToMandible, softChinAngle, softSnb } from "./profileFormulas";
import { bitemporalToBigonial, browToZygomatic, canthalTilt, canthusBrowHeight, eyeAspectRatio, eyebrowHeight, eyebrowTilt, eyeSeparationRatio, facialThirds, foreheadWidthHeight, innerCanthalAngle, jawFrontalAngle, jawWidthHeight, pflToBizygomatic } from "./frontFormulas";

const REQUIRED_DEFINITION = "No geometric definition has been registered for this metric yet (landmarks, construction, numerator, denominator and normalization are all required).";

const frontalRatio = (numA: SemanticLandmark, numB: SemanticLandmark, denA: SemanticLandmark, denB: SemanticLandmark): Formula => ({ c }) => {
  const a = c[numA]; const b = c[numB]; const d1 = c[denA]; const d2 = c[denB];
  if (!a || !b || !d1 || !d2) return null;
  const value = ratio(distance2D(a, b), distance2D(d1, d2));
  if (value === null) return null;
  return { value, construction: [
    { kind: "line", from: a, to: b, role: "measure" },
    { kind: "line", from: d1, to: d2, role: "reference" },
  ] };
};

const pending = (id: string, name: string, view: "front" | "profile", category: string, unit: MetricDefinition["unit"], extra: Partial<MetricDefinition> = {}): MetricDefinition => ({
  id, name, category, view, unit, requiredLandmarks: [], definition: REQUIRED_DEFINITION, source: "unspecified",
  poseSensitivity: { yaw: 0.5, pitch: 0.5, roll: 0.2 }, perspectiveSensitivity: 0.5, plausibleRange: [-Infinity, Infinity], invarianceTolerance: 0.05, ...extra,
});

/**
 * The single source of truth for measurements. Front metrics are measured in the canonical frontal plane
 * (x,y of canonical space) so out-of-plane head rotation does not foreshorten them.
 */
export const METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    id: "fwhr", name: "Facial width-to-height ratio", category: "Proportions", view: "front", unit: "ratio",
    requiredLandmarks: ["zygionL", "zygionR", "glabella", "menton"],
    formula: frontalRatio("zygionL", "zygionR", "glabella", "menton"),
    definition: "distance(zygionL, zygionR) / distance(glabella, menton), both in the canonical frontal plane. Normalization reference: glabella-menton height.",
    source: "Existing T1-Scan implementation (preserved).",
    note: "Legacy height is glabella→menton. Much of the FWHR literature uses upper-face height (brow→upper lip). Confirm which definition the product intends.",
    poseSensitivity: { yaw: 0.45, pitch: 0.35, roll: 0.05 }, perspectiveSensitivity: 0.6, plausibleRange: [0.6, 2.4], invarianceTolerance: 0.02,
  },
  {
    id: "icd_fw", name: "Intercanthal distance / facial width", category: "Eyes", view: "front", unit: "ratio",
    requiredLandmarks: ["endocanthionL", "endocanthionR", "zygionL", "zygionR"],
    formula: frontalRatio("endocanthionL", "endocanthionR", "zygionL", "zygionR"),
    definition: "distance(endocanthionL, endocanthionR) / distance(zygionL, zygionR) in the canonical frontal plane. Normalization reference: bizygomatic width.",
    source: "Existing T1-Scan implementation (preserved).",
    poseSensitivity: { yaw: 0.35, pitch: 0.15, roll: 0.05 }, perspectiveSensitivity: 0.4, plausibleRange: [0.1, 0.6], invarianceTolerance: 0.01,
  },
  {
    id: "alar_icd", name: "Alar / ICD", category: "Nose", view: "front", unit: "ratio",
    requiredLandmarks: ["alareL", "alareR", "endocanthionL", "endocanthionR"],
    formula: frontalRatio("alareL", "alareR", "endocanthionL", "endocanthionR"),
    definition: "distance(alareL, alareR) / distance(endocanthionL, endocanthionR) in the canonical frontal plane. Normalization reference: intercanthal distance.",
    source: "Product metric “Alar / ICD”; neoclassical canon compares nasal width with intercanthal distance. Mesh alar points approximate the anthropometric alare.",
    poseSensitivity: { yaw: 0.35, pitch: 0.15, roll: 0.05 }, perspectiveSensitivity: 0.4, plausibleRange: [0.5, 2.2], invarianceTolerance: 0.03,
  },
  {
    id: "bigonial_bizygomatic", name: "Bigonial / bizygomatic width", category: "Jaw", view: "front", unit: "ratio",
    requiredLandmarks: ["gonionL", "gonionR", "zygionL", "zygionR"],
    formula: frontalRatio("gonionL", "gonionR", "zygionL", "zygionR"),
    definition: "distance(gonionL, gonionR) / distance(zygionL, zygionR) in the canonical frontal plane. Normalization reference: bizygomatic width.",
    source: "Jaw-to-cheekbone width ratio (PMC10335162 reports its reciprocal, bizygomatic/bigonial, as 1.128 in men and 1.174 in women). Mesh jaw points approximate gonion.",
    poseSensitivity: { yaw: 0.4, pitch: 0.2, roll: 0.05 }, perspectiveSensitivity: 0.4, plausibleRange: [0.55, 1.15], invarianceTolerance: 0.02,
  },
  {
    id: "mouth_fw", name: "Mouth width / facial width", category: "Mouth", view: "front", unit: "ratio",
    requiredLandmarks: ["cheilionL", "cheilionR", "zygionL", "zygionR"],
    formula: frontalRatio("cheilionL", "cheilionR", "zygionL", "zygionR"),
    definition: "distance(cheilionL, cheilionR) / distance(zygionL, zygionR) in the canonical frontal plane. Normalization reference: bizygomatic width.",
    source: "Existing T1-Scan implementation (preserved).",
    poseSensitivity: { yaw: 0.35, pitch: 0.15, roll: 0.05 }, perspectiveSensitivity: 0.4, plausibleRange: [0.15, 0.9], invarianceTolerance: 0.015,
    expressionSensitivity: { smile: 0.8, mouth_open: 0.2 },
  },

  // ---- Remaining front metrics. Acronyms the product did not define are read as stated in `definition`; each is flagged ASSUMPTION so it can be corrected in one place. ----
  {
    id: "facial_thirds", name: "Facial Thirds", category: "Proportions", view: "front", unit: "ratio",
    requiredLandmarks: ["foreheadTop", "glabella", "subnasale", "menton"], formula: facialThirds,
    definition: "Shortest ÷ longest of the three vertical thirds: top of face → glabella, glabella → subnasale, subnasale → menton (canonical frontal plane). 1.00 = three equal thirds.",
    source: "Classical facial thirds (trichion–glabella–subnasale–menton).",
    note: "APPROXIMATION: the face mesh cannot see the hairline, so the top of the mesh's face oval stands in for the trichion. The upper third is usually under-estimated.",
    poseSensitivity: { yaw: 0.2, pitch: 0.5, roll: 0.05 }, perspectiveSensitivity: 0.5, plausibleRange: [0.3, 1], invarianceTolerance: 0.03, expressionSensitivity: { mouth_open: 0.5 }, stabilityReference: 0.8,
  },
  {
    id: "esr", name: "ESR", category: "Eyes", view: "front", unit: "ratio",
    requiredLandmarks: ["pupilL", "pupilR", "zygionL", "zygionR"], formula: eyeSeparationRatio,
    definition: "Interpupillary distance ÷ bizygomatic width (canonical frontal plane).",
    source: "ASSUMPTION: ESR read as eye-separation ratio (IPD / facial width).",
    poseSensitivity: { yaw: 0.35, pitch: 0.15, roll: 0.05 }, perspectiveSensitivity: 0.4, plausibleRange: [0.25, 0.7], invarianceTolerance: 0.015,
  },
  {
    id: "cbh", name: "CBH", category: "Eyes", view: "front", unit: "ratio",
    requiredLandmarks: ["endocanthionL", "endocanthionR", "browInnerL", "browInnerR", "exocanthionL", "exocanthionR"], formula: canthusBrowHeight,
    definition: "Vertical gap from the inner eye corner up to the inner end of the eyebrow, ÷ eye width (endocanthion → exocanthion); average of both eyes.",
    source: "ASSUMPTION: CBH read as canthus-to-brow height.",
    poseSensitivity: { yaw: 0.3, pitch: 0.4, roll: 0.05 }, perspectiveSensitivity: 0.3, plausibleRange: [0.1, 1.6], invarianceTolerance: 0.04, expressionSensitivity: { smile: 0.2 }, stabilityReference: 0.5,
  },
  {
    id: "ctp", name: "CTP", category: "Eyes", view: "front", unit: "degree",
    requiredLandmarks: ["endocanthionL", "exocanthionL", "endocanthionR", "exocanthionR"], formula: canthalTilt,
    definition: "Canthal tilt: angle of the line inner corner → outer corner above the horizontal, averaged over both eyes. Positive = outer corner higher.",
    source: "ASSUMPTION: CTP read as canthal tilt.",
    poseSensitivity: { yaw: 0.2, pitch: 0.1, roll: 0.3 }, perspectiveSensitivity: 0.2, plausibleRange: [-25, 35], invarianceTolerance: 1.5, stabilityReference: 8, expressionSensitivity: { smile: 0.3 },
  },
  {
    id: "et", name: "ET", category: "Eyes", view: "front", unit: "degree",
    requiredLandmarks: ["browInnerL", "browTailL", "browInnerR", "browTailR"], formula: eyebrowTilt,
    definition: "Eyebrow tilt: angle of the line inner brow end → outer brow end above the horizontal, averaged over both brows. Positive = tail higher.",
    source: "ASSUMPTION: ET read as eyebrow tilt.",
    poseSensitivity: { yaw: 0.2, pitch: 0.1, roll: 0.3 }, perspectiveSensitivity: 0.2, plausibleRange: [-30, 50], invarianceTolerance: 2, stabilityReference: 10,
  },
  {
    id: "ear", name: "EAR", category: "Eyes", view: "front", unit: "ratio",
    requiredLandmarks: ["lidUpperL", "lidLowerL", "lidUpperR", "lidLowerR", "exocanthionL", "endocanthionL", "exocanthionR", "endocanthionR"], formula: eyeAspectRatio,
    definition: "Eye aspect ratio: eyelid opening (upper to lower lid centre) ÷ eye width (endocanthion → exocanthion), averaged over both eyes.",
    source: "Eye aspect ratio.",
    poseSensitivity: { yaw: 0.3, pitch: 0.3, roll: 0.05 }, perspectiveSensitivity: 0.3, plausibleRange: [0.05, 0.7], invarianceTolerance: 0.02, stabilityReference: 0.3, expressionSensitivity: { smile: 0.4 },
  },
  {
    id: "ebh", name: "EBH", category: "Eyes", view: "front", unit: "ratio",
    requiredLandmarks: ["lidUpperL", "browPeakL", "lidUpperR", "browPeakR", "exocanthionL", "endocanthionL", "exocanthionR", "endocanthionR"], formula: eyebrowHeight,
    definition: "Eyebrow height: vertical gap from the upper eyelid up to the brow arch, ÷ eye width; average of both eyes.",
    source: "ASSUMPTION: EBH read as eyebrow-to-eye height.",
    poseSensitivity: { yaw: 0.3, pitch: 0.4, roll: 0.05 }, perspectiveSensitivity: 0.3, plausibleRange: [0.1, 2.2], invarianceTolerance: 0.05, stabilityReference: 0.6, expressionSensitivity: { smile: 0.2 },
  },
  {
    id: "brow_zygo", name: "Brow / Zygomatic", category: "Proportions", view: "front", unit: "ratio",
    requiredLandmarks: ["browTailL", "browTailR", "zygionL", "zygionR"], formula: browToZygomatic,
    definition: "Distance between the outer ends of the eyebrows ÷ bizygomatic width.",
    source: "ASSUMPTION: brow width measured end-to-end of the eyebrows.",
    poseSensitivity: { yaw: 0.35, pitch: 0.15, roll: 0.05 }, perspectiveSensitivity: 0.4, plausibleRange: [0.5, 1.2], invarianceTolerance: 0.02,
  },
  {
    id: "jaw_wh", name: "Jaw WH", category: "Jaw", view: "front", unit: "ratio",
    requiredLandmarks: ["gonionL", "gonionR", "subnasale", "menton"], formula: jawWidthHeight,
    definition: "Bigonial width ÷ lower-face height (subnasale → menton).",
    source: "ASSUMPTION: jaw height taken as lower-face height. Mesh jaw points approximate gonion.",
    poseSensitivity: { yaw: 0.4, pitch: 0.4, roll: 0.05 }, perspectiveSensitivity: 0.4, plausibleRange: [0.8, 3.5], invarianceTolerance: 0.05, expressionSensitivity: { mouth_open: 0.5 },
  },
  {
    id: "btw_bgw", name: "BTW / BGW", category: "Jaw", view: "front", unit: "ratio",
    requiredLandmarks: ["templeL", "templeR", "gonionL", "gonionR"], formula: bitemporalToBigonial,
    definition: "Bitemporal width (temple contour points) ÷ bigonial width.",
    source: "Bitemporal / bigonial width ratio. Mesh temple and jaw points approximate the skeletal landmarks.",
    poseSensitivity: { yaw: 0.4, pitch: 0.2, roll: 0.05 }, perspectiveSensitivity: 0.4, plausibleRange: [0.7, 1.8], invarianceTolerance: 0.03,
  },
  {
    id: "forehead_wh", name: "Forehead WH", category: "Forehead", view: "front", unit: "ratio",
    requiredLandmarks: ["templeL", "templeR", "foreheadTop", "glabella"], formula: foreheadWidthHeight,
    definition: "Forehead width (temple to temple) ÷ forehead height (glabella → top of the mesh face oval).",
    source: "APPROXIMATION: the hairline is not visible to the face mesh, so the top of the face oval stands in for it; forehead height is under-estimated for most people.",
    poseSensitivity: { yaw: 0.35, pitch: 0.5, roll: 0.05 }, perspectiveSensitivity: 0.5, plausibleRange: [0.8, 5], invarianceTolerance: 0.1, stabilityReference: 2,
  },
  {
    id: "pfl_bizygo", name: "PFL / Bizygomatic", category: "Eyes", view: "front", unit: "ratio",
    requiredLandmarks: ["exocanthionL", "endocanthionL", "exocanthionR", "endocanthionR", "zygionL", "zygionR"], formula: pflToBizygomatic,
    definition: "Palpebral fissure length (eye width, endocanthion → exocanthion, averaged) ÷ bizygomatic width.",
    source: "Palpebral fissure length relative to face width.",
    poseSensitivity: { yaw: 0.35, pitch: 0.15, roll: 0.05 }, perspectiveSensitivity: 0.4, plausibleRange: [0.1, 0.4], invarianceTolerance: 0.01,
  },
  {
    id: "jfa", name: "JFA", category: "Jaw", view: "front", unit: "degree",
    requiredLandmarks: ["gonionL", "menton", "gonionR"], formula: jawFrontalAngle,
    definition: "Jaw frontal angle: angle at the chin (menton) between the lines to the left and right gonion points. Smaller = narrower, more V-shaped chin.",
    source: "ASSUMPTION: JFA read as the frontal jaw/chin angle. Mesh jaw points approximate gonion.",
    poseSensitivity: { yaw: 0.3, pitch: 0.3, roll: 0.05 }, perspectiveSensitivity: 0.3, plausibleRange: [60, 160], invarianceTolerance: 2, expressionSensitivity: { mouth_open: 0.4 }, stabilityReference: 100,
  },
  {
    id: "sfa_ia", name: "SFA / IA", category: "Eyes", view: "front", unit: "degree",
    requiredLandmarks: ["lidUpperL", "endocanthionL", "lidLowerL", "lidUpperR", "endocanthionR", "lidLowerR"], formula: innerCanthalAngle,
    definition: "Inner-canthus opening angle: angle at the inner eye corner between the upper-lid and lower-lid margins, averaged over both eyes.",
    source: "ASSUMPTION: SFA / IA read as the inner-canthal opening angle of the palpebral fissure.",
    poseSensitivity: { yaw: 0.3, pitch: 0.3, roll: 0.05 }, perspectiveSensitivity: 0.3, plausibleRange: [3, 90], invarianceTolerance: 2, stabilityReference: 25, expressionSensitivity: { smile: 0.3 },
  },
  pending("neck_width", "Neck Width", "front", "Neck", "ratio", { knownBlockers: ["The face mesh stops at the jaw and has no neck points. A neck width needs a body/neck segmentation model."] }),
  {
    id: "mouth_wh", name: "Mouth WH", category: "Mouth", view: "front", unit: "ratio",
    requiredLandmarks: ["cheilionL", "cheilionR", "labialeSuperius", "labialeInferius"],
    formula: ({ c }) => {
      const l = c.cheilionL; const r = c.cheilionR; const up = c.labialeSuperius; const lo = c.labialeInferius; if (!l || !r || !up || !lo) return null;
      const height = distance2D(up, lo); if (height < 1e-9) return null;
      const value = ratio(distance2D(l, r), height); if (value === null) return null;
      return { value, construction: [{ kind: "line", from: l, to: r, role: "measure" }, { kind: "line", from: up, to: lo, role: "reference" }] };
    },
    definition: "Mouth width (cheilion to cheilion) ÷ lip height (labiale superius → labiale inferius).",
    source: "ASSUMPTION: Mouth WH read as mouth width-to-height ratio of the lips.",
    poseSensitivity: { yaw: 0.35, pitch: 0.2, roll: 0.05 }, perspectiveSensitivity: 0.4, plausibleRange: [1.2, 8], invarianceTolerance: 0.15, stabilityReference: 3,
    expressionSensitivity: { smile: 0.7, mouth_open: 0.9 },
  },

  // ---- Profile metrics still awaiting a definition ----

  // ---- Profile metrics with standard soft-tissue definitions (3D midline geometry; yaw-invariant) ----
  {
    id: "nfa", name: "Nasofrontal angle (NFA)", category: "Nose", view: "profile", unit: "degree", space: "image_3d",
    requiredLandmarks: ["glabella", "nasion", "pronasale"], formula: nasofrontalAngle,
    definition: "Angle at nasion between the rays to glabella and to pronasale (nose tip), measured with 3D vectors in the sagittal plane.",
    source: "Standard soft-tissue profile analysis (glabella–nasion–pronasale).",
    poseSensitivity: { yaw: 0, pitch: 0.1, roll: 0.05 }, perspectiveSensitivity: 0.3, plausibleRange: [80, 180], invarianceTolerance: 1,
  },
  {
    id: "nasal_lip_angle", name: "Nasal-lip angle", category: "Nose", view: "profile", unit: "degree", space: "image_3d",
    requiredLandmarks: ["pronasale", "subnasale", "labialeSuperius"], formula: nasolabialAngle,
    definition: "Angle at subnasale between the rays to pronasale and to labiale superius, measured with 3D vectors in the sagittal plane.",
    source: "Standard nasolabial angle; the nose-tip direction approximates the columella tangent because the face mesh has no columella point.",
    poseSensitivity: { yaw: 0, pitch: 0.1, roll: 0.05 }, perspectiveSensitivity: 0.3, plausibleRange: [50, 170], invarianceTolerance: 1,
  },
  {
    id: "fcg", name: "Facial convexity (FCG)", category: "Profile", view: "profile", unit: "degree", space: "image_3d",
    requiredLandmarks: ["glabella", "subnasale", "pogonion"], formula: facialConvexity,
    definition: "Interior angle at subnasale between glabella and pogonion (3D, sagittal plane). Below 180° = convex profile, above 180° = concave.",
    source: "Standard facial convexity angle (G–Sn–Pg). ASSUMPTION: the acronym FCG is read as this angle; confirm.",
    poseSensitivity: { yaw: 0, pitch: 0.1, roll: 0.05 }, perspectiveSensitivity: 0.3, plausibleRange: [140, 220], invarianceTolerance: 1,
  },
  {
    id: "ricketts_e_upper", name: "Ricketts E-line · upper lip", category: "Profile", view: "profile", unit: "normalized", space: "image_3d",
    requiredLandmarks: ["pronasale", "pogonion", "labialeSuperius"], formula: eLine("labialeSuperius"), stabilityReference: 0.3,
    definition: "Signed perpendicular distance of labiale superius from the line pronasale→pogonion, divided by the length of that line. Negative = behind the line.",
    source: "Ricketts E-line (soft tissue). Normalised by E-line length because absolute millimetres cannot be known from a photo.",
    poseSensitivity: { yaw: 0, pitch: 0.1, roll: 0.05 }, perspectiveSensitivity: 0.4, plausibleRange: [-0.4, 0.4], invarianceTolerance: 0.01,
  },
  {
    id: "ricketts_e_lower", name: "Ricketts E-line · lower lip", category: "Profile", view: "profile", unit: "normalized", space: "image_3d",
    requiredLandmarks: ["pronasale", "pogonion", "labialeInferius"], formula: eLine("labialeInferius"), stabilityReference: 0.3,
    definition: "Signed perpendicular distance of labiale inferius from the line pronasale→pogonion, divided by the length of that line. Negative = behind the line.",
    source: "Ricketts E-line (soft tissue). Normalised by E-line length because absolute millimetres cannot be known from a photo.",
    poseSensitivity: { yaw: 0, pitch: 0.1, roll: 0.05 }, perspectiveSensitivity: 0.4, plausibleRange: [-0.4, 0.4], invarianceTolerance: 0.01,
  },
  {
    id: "cba", name: "CBA", category: "Jaw", view: "profile", unit: "degree", space: "image_3d",
    requiredLandmarks: ["pogonion", "menton", "gonionNear"], formula: chinBaseAngle,
    definition: "Chin-base angle: angle at menton, in the profile plane, between the chin front (pogonion) and the near-side jaw angle (gonion).",
    source: "ASSUMPTION: CBA read as the chin-base angle. Mesh jaw points approximate gonion.",
    poseSensitivity: { yaw: 0, pitch: 0.15, roll: 0.05 }, perspectiveSensitivity: 0.3, plausibleRange: [20, 160], invarianceTolerance: 2, stabilityReference: 80,
  },
  {
    id: "sca", name: "SCA", category: "Jaw", view: "profile", unit: "degree", space: "image_3d",
    requiredLandmarks: ["labialeInferius", "sublabiale", "pogonion"], formula: softChinAngle,
    definition: "Soft-tissue chin (mentolabial) angle: angle at the mentolabial sulcus between the lower lip and the chin point.",
    source: "ASSUMPTION: SCA read as the soft-tissue chin / mentolabial angle.",
    poseSensitivity: { yaw: 0, pitch: 0.15, roll: 0.05 }, perspectiveSensitivity: 0.3, plausibleRange: [60, 200], invarianceTolerance: 3, stabilityReference: 120,
  },
  {
    id: "ramus_mandible", name: "Ramus : Mandible", category: "Jaw", view: "profile", unit: "ratio", space: "image_3d",
    requiredLandmarks: ["gonionNear", "earNear", "menton"], formula: ramusToMandible,
    definition: "Ramus height (near-side gonion → ear-region point) ÷ mandibular body length (gonion → menton), measured in the profile plane.",
    source: "APPROXIMATION: the condyle is not visible in a photo; the ear-region point of the face mesh stands in for it.",
    poseSensitivity: { yaw: 0, pitch: 0.15, roll: 0.05 }, perspectiveSensitivity: 0.3, plausibleRange: [0.2, 1.8], invarianceTolerance: 0.05, stabilityReference: 0.7,
  },
  {
    id: "nw_nh", name: "NW : NH", category: "Nose", view: "profile", unit: "ratio", space: "image_3d",
    requiredLandmarks: ["alareNear", "nasion", "subnasale", "glabella", "menton"], formula: noseWidthHeight,
    definition: "Nose width ÷ nose height. Width = twice the camera-side nostril wing's distance from the midline plane; height = nasion → subnasale.",
    source: "ASSUMPTION: NW:NH read as nasal width to height. Width comes from depth, which is the least precise axis, so confidence is usually lower than the front-view Alar / ICD.",
    poseSensitivity: { yaw: 0.1, pitch: 0.2, roll: 0.05 }, perspectiveSensitivity: 0.5, plausibleRange: [0.3, 2], invarianceTolerance: 0.1, stabilityReference: 0.8,
  },
  {
    id: "ltp", name: "LTP", category: "Profile", view: "profile", unit: "degree", space: "image_3d",
    requiredLandmarks: ["subnasale", "pogonion", "glabella", "menton"], formula: lowerThirdProfile,
    definition: "Lower-third profile inclination: angle of the line subnasale → pogonion to the vertical, in the profile plane. Positive = chin forward of subnasale.",
    source: "ASSUMPTION: LTP read as the lower-third profile inclination.",
    poseSensitivity: { yaw: 0, pitch: 0.15, roll: 0.05 }, perspectiveSensitivity: 0.3, plausibleRange: [-35, 35], invarianceTolerance: 1.5, stabilityReference: 8,
  },
  {
    id: "iba", name: "IBA Angle", category: "Jaw", view: "profile", unit: "degree", space: "image_3d",
    requiredLandmarks: ["gonionNear", "menton", "glabella"], formula: inferiorBorderAngle,
    definition: "Inferior border angle: inclination of the lower jaw border (near-side gonion → menton) to the horizontal, in the profile plane.",
    source: "Soft-tissue mandibular plane angle. Mesh jaw points approximate gonion.",
    poseSensitivity: { yaw: 0, pitch: 0.4, roll: 0.1 }, perspectiveSensitivity: 0.3, plausibleRange: [0, 65], invarianceTolerance: 2, stabilityReference: 25,
  },
  {
    id: "snb", name: "SNB Angle", category: "Jaw", view: "profile", unit: "degree", space: "image_3d",
    requiredLandmarks: ["nasion", "earNear", "pogonion", "glabella", "menton"], formula: softSnb,
    definition: "Soft-tissue SNB analogue: angle at nasion between the ear-region point (stands in for sella) and the chin point (stands in for point B), in the profile plane.",
    source: "APPROXIMATION: true SNB needs sella and point B, which are skull landmarks hidden in a photo. This analogue tracks the same idea but its numbers are NOT comparable with cephalometric SNB (~80°).",
    poseSensitivity: { yaw: 0, pitch: 0.4, roll: 0.1 }, perspectiveSensitivity: 0.3, plausibleRange: [40, 130], invarianceTolerance: 2, stabilityReference: 80,
  },
  {
    id: "bua", name: "BUA", category: "Jaw", view: "profile", unit: "degree", space: "image_3d",
    requiredLandmarks: ["gonionNear", "earNear", "menton", "glabella"], formula: gonialAngle,
    definition: "Jaw-angle (gonial) angle: angle at the near-side gonion between the ramus (toward the ear-region point) and the mandibular body (toward menton).",
    source: "ASSUMPTION: BUA read as the gonial / jaw-angle measure. The ear-region point stands in for the condyle.",
    poseSensitivity: { yaw: 0, pitch: 0.25, roll: 0.05 }, perspectiveSensitivity: 0.3, plausibleRange: [70, 170], invarianceTolerance: 2, stabilityReference: 120,
  },
  {
    id: "facial_depth", name: "Facial Depth", category: "Profile", view: "profile", unit: "ratio", space: "image_3d",
    requiredLandmarks: ["earNear", "pronasale", "glabella", "menton"], formula: facialDepth,
    definition: "Facial depth: distance from the ear-region point to the nose tip along the forward axis, ÷ face height (glabella → menton).",
    source: "ASSUMPTION: Facial Depth read as head depth (ear → nose tip) relative to face height.",
    poseSensitivity: { yaw: 0, pitch: 0.3, roll: 0.05 }, perspectiveSensitivity: 0.5, plausibleRange: [0.4, 3], invarianceTolerance: 0.05, stabilityReference: 1.2,
  },
];
