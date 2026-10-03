import type { DimensionSpec, Reference } from "./types";

/**
 * The ONLY place score weights and reference ranges live. Edit here to change what a dimension means.
 * Ranges are commonly cited population/clinical bands, used as defaults — they are reference relationships,
 * not a verdict on any face. A metric without a reference here is shown in the report but not scored.
 */
export const REF = {
  icd_fw: { low: 0.22, high: 0.27, falloff: 0.06, source: "Anthropometric norms: intercanthal ≈ 32 mm over bizygomatic ≈ 128–135 mm (Farkas)." },
  mouth_fw: { low: 0.36, high: 0.43, falloff: 0.1, source: "Anthropometric norms: mouth width ≈ 50–53 mm over bizygomatic ≈ 128–135 mm." },
  nfa: { low: 115, high: 130, falloff: 20, source: "Commonly cited nasofrontal angle range, 115–130°." },
  nasal_lip_angle: { low: 90, high: 110, falloff: 25, source: "Commonly cited nasolabial angle range, 90–110°." },
  alar_icd: { low: 0.9, high: 1.05, falloff: 0.25, source: "Neoclassical canon: nasal width ≈ intercanthal distance, with a 5% tolerance." },
  facial_thirds: { low: 0.85, high: 1, falloff: 0.35, source: "Classical facial thirds: forehead, mid-face and lower face of roughly equal height (hairline estimated from the mesh)." },
  fcg: { low: 165, high: 175, falloff: 15, source: "Facial convexity (G–Sn–Pg) mean ≈ 168° (Legan–Burstone: 12° ± 4°); band widened to 165–175°." },
} satisfies Record<string, Reference>;

export const DIMENSIONS: DimensionSpec[] = [
  {
    id: "harmony", name: "Harmony",
    description: "Proportional balance: how closely measured ratios and angles sit within defined reference bands.",
    notMeasurable: ["Facial fifths need the ear edges, and the hairline is only estimated, so thirds are approximate."],
    inputs: [
      { metricId: "icd_fw", label: "Intercanthal / facial width", weight: 2, reference: REF.icd_fw },
      { metricId: "mouth_fw", label: "Mouth / facial width", weight: 2, reference: REF.mouth_fw },
      { metricId: "nfa", label: "Nasofrontal angle", weight: 2, reference: REF.nfa },
      { metricId: "nasal_lip_angle", label: "Nasal-lip angle", weight: 2, reference: REF.nasal_lip_angle },
      { metricId: "fcg", label: "Facial convexity", weight: 2, reference: REF.fcg },
      { metricId: "alar_icd", label: "Nose width / eye spacing", weight: 1, reference: REF.alar_icd },
      { metricId: "facial_thirds", label: "Facial thirds balance", weight: 1, reference: REF.facial_thirds },
    ],
  },
];
