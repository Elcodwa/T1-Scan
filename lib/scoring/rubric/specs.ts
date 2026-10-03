import type { CriterionSpec, GroupSpec, RubricSpec } from "../types";

/**
 * The three rubrics. Angularity and Traits (MISC) are transcribed from the product's scoring documents:
 * one point per ideal feature, N = total features. Dimorphism is built from the cited literature.
 * Editing a rubric = editing this file; the engine, UI and PDF read it.
 */
const c = (id: string, label: string, ideal: CriterionSpec["ideal"], extra: Partial<CriterionSpec> = {}): CriterionSpec => ({ id, label, ideal, ...extra });
const M: ["male"] = ["male"]; const F: ["female"] = ["female"];

export const ANGULARITY: RubricSpec = {
  id: "angularity", name: "Angularity", needsSex: true,
  description: "Deep-set gaze, jaw definition, cheekbone sharpness, chin shape and overall facial angularity.",
  sources: ["Product scoring document “ANGULARITY” (men: 18 features, women: 14 features)."],
  notes: ["A perfect score is shown as 99, following the product document."],
  groups: [
    { name: "Mandible visibility (front)", criteria: [
      c("ang_mandible_flare", "Mandible flare", "Broad mandible flare", { sexes: M, auto: "mandible_flare" }),
      c("ang_mandible_fat", "Lower-face fat masking", "No lower-face fat masking") ] },
    { name: "Facial 3D-ness", criteria: [
      c("ang_3d_midface", "Midface projection", "Strong midface projection"),
      c("ang_3d_anterior", "Anterior depth", "Sharp anterior depth"),
      c("ang_3d_orbital", "Orbital support", "Good orbital support") ] },
    { name: "Gonion sharpness", criteria: [
      c("ang_gonion_angle", "Gonial angle", { male: "Well-defined gonial angle or jawline", female: "Well-defined gonial angle" }),
      c("ang_gonion_visible", "Jawline visibility", "Visible jawline", { sexes: F }) ] },
    { name: "Facial depth", criteria: [c("ang_depth", "Forward projection", "Strong maxilla + mandible forward projection")] },
    { name: "Mandible & ramus visibility", criteria: [
      c("ang_ramus_tall", "Ramus height", "Tall ramus", { sexes: M }),
      c("ang_ramus_contour", "Rear-jaw contour", "Sharp rear-jaw contour clearly visible from front", { sexes: M }) ] },
    { name: "Ogee curve", criteria: [
      c("ang_ogee_curve", "Midface curve", "Defined midface curve", { sexes: M }),
      c("ang_ogee_cheek", "High cheekbone projection", "Strong high cheekbone projection", { sexes: M }) ] },
    { name: "Cheekbone visibility", criteria: [
      c("ang_cheek_lateral", "Lateral projection", "Strong lateral projection"),
      c("ang_cheek_second", "Cheek definition", { male: "Hollow cheeks", female: "Strong high cheekbone projection" }) ] },
    { name: "Chin angularity", criteria: [
      c("ang_chin_shape", "Chin shape", { male: "Squared chin pad", female: "Heart chin" }),
      c("ang_chin_pogonion", "Pogonion definition", "Sharp pogonion definition") ] },
    { name: "Lower-midface fat", criteria: [
      c("ang_fat_buccal", "Buccal fat", "Minimal buccal fat"),
      c("ang_fat_lines", "Line sharpness", "Sharp lines"),
      c("ang_fat_jaw", "Jaw contour", "Lean jaw contour") ] },
  ],
};

const g = (name: string, criteria: CriterionSpec[]): GroupSpec => ({ name, criteria });
export const TRAITS: RubricSpec = {
  id: "traits", name: "Traits", needsSex: false,
  description: "Skin, hair, eyes, nose, jawline, lips and brow structure — each feature scored individually (41 features).",
  sources: ["Product scoring document “MISC” (41 features)."],
  notes: ["A perfect score is shown as 99, following the product document.", "Items in the Colouring group describe a product-defined ideal; they can be removed from this file."],
  groups: [
    g("Skin", [
      c("misc_skin_clearness", "Skin clearness (acne + blemishes)", "No acne or blemishes"),
      c("misc_skin_hyperpigmentation", "Hyperpigmentation", "None"),
      c("misc_skin_moles", "Moles", "None"),
      c("misc_skin_acne_scarring", "Acne scarring", "None"),
      c("misc_skin_folds", "Facial folds + wrinkles", "None") ]),
    g("Eye area", [
      c("misc_eye_upper_eyelid", "Upper eyelid", "No UEE"),
      c("misc_eye_lower_eyelid", "Lower eyelid shape", "Straight / slightly curved"),
      c("misc_eye_sclera_show", "Sclera show", "None"),
      c("misc_eye_eyelashes", "Eyelashes", "Thick, dense, dark"),
      c("misc_eye_eyebrows", "Eyebrows", "Thick, dense, long, dark"),
      c("misc_eye_periorbital", "Periorbital darkening (dark circles)", "None"),
      c("misc_eye_under_circles", "Under-eye circles", "None"),
      c("misc_eye_lee", "LEE", "None"),
      c("misc_eye_colour", "Eye colour", "Light colour (green / blue / etc., basically light)"),
      c("misc_eye_medial_canthus", "Medial canthus", "Downturned, long, not thin"),
      c("misc_eye_sclera_colour", "Sclera colour", "White, with no yellowness or redness"),
      c("misc_eye_unibrow", "Unibrow", "None") ]),
    g("Colouring", [
      c("misc_col_skin", "Skin colour", "Tanned, dark Fitzpatrick II to low Fitzpatrick IV"),
      c("misc_col_lip", "Lip colour", "Reddish pink"),
      c("misc_col_lash", "Eyelash visibility", "Contrasting + visible"),
      c("misc_col_eye", "Eye colour", "Light eye colour"),
      c("misc_col_hair", "Hair colour", "Dark colour (black, dark brown, brown)"),
      c("misc_col_brow", "Eyebrow colour", "Dark colour"),
      c("misc_col_sclera", "Sclera whiteness", "White, with no yellowness or redness") ]),
    g("Overall lower third", [
      c("misc_low_gonions", "Gonions", { male: "Flared", female: "Not flared" }),
      c("misc_low_chin_shape", "Chin shape", { male: "Square", female: "Heart shaped" }),
      c("misc_low_chin_width", "Chin width", { male: "Wide", female: "Medium (not too narrow, but not wide)" }),
      c("misc_low_ramus", "Ramus length", { male: "Tall", female: "Medium" }),
      c("misc_low_mandible", "Mandible length", "Long & straight") ]),
    g("Lips", [
      c("misc_lip_width", "Lip width", "Wide"),
      c("misc_lip_philtrum_length", "Philtrum length", "Short"),
      c("misc_lip_philtrum_ridges", "Philtrum ridges", "Defined"),
      c("misc_lip_fullness", "Lip fullness", "Full"),
      c("misc_lip_health", "Lip health", "No cracking"),
      c("misc_lip_commissures", "Commissures", "Slight upturn"),
      c("misc_lip_cupids_bow", "Cupid’s bow", "Prominent") ]),
    g("Nose", [
      c("misc_nose_alar", "Alar width", "Not wide", { auto: "alar_width" }),
      c("misc_nose_bulbosity", "Nose bulbosity", "Low bulbousness"),
      c("misc_nose_nostril_show", "Nostril show", "Minimal"),
      c("misc_nose_dorsum", "Dorsum", "Straight"),
      c("misc_nose_radix", "Radix projection", "Projected, visible nasofrontal angle", { auto: "radix_projection" }) ]),
  ],
};

export const DIMORPHISM: RubricSpec = {
  id: "dimorphism", name: "Dimorphism", needsSex: true,
  description: "Structural and coloring markers that differ on average between men and women. “Ideal” means the marker typical of the chosen reference set.",
  sources: [
    "Aesthetic-face dimorphism, 100 facial points (PMC10335162): bizygomatic/bigonial 1.128 in men vs 1.174 in women.",
    "Sexual dimorphism in 3D facial morphology across populations (PMC7966798, PMC8371176, PMC12984368).",
    "Russell (2009), Perception 38: eye/lip-to-skin contrast is higher in women; brow contrast is lower in women.",
  ],
  notes: [
    "Facial width-to-height ratio is deliberately not used: meta-analytic dimorphism is very small (d ≈ 0.11) and many studies find none.",
    "Only the jaw-to-cheekbone ratio has a published numeric basis; the other markers are described in the literature without cut-offs, so they are answered by the user.",
  ],
  groups: [
    g("Structure", [
      c("dim_jaw_ratio", "Jaw width vs cheekbone width", { male: "Wide jaw relative to the cheekbones (bigonial ÷ bizygomatic ≥ 0.87)", female: "Tapered: jaw narrower than the cheekbones (< 0.87)" }, { auto: "jaw_ratio" }),
      c("dim_lower_face", "Lower face height", { male: "Long lower face", female: "Short lower face relative to the upper face" }),
      c("dim_brow_ridge", "Brow ridge / forehead", { male: "Prominent brow ridge and lower-forehead projection", female: "Smooth brow with a more vertical forehead" }),
      c("dim_eye_set", "Eye set", { male: "Deep-set eyes close to the brows", female: "Larger, open eyes with room beneath the brow" }),
      c("dim_nose", "Nose", { male: "Larger nose with a broader radix", female: "Smaller nose, narrower nostrils, slightly upturned tip" }),
      c("dim_chin_jaw", "Chin and mandible", { male: "Wide, projecting chin and mandible", female: "Smaller, tapered chin" }),
      c("dim_cheeks", "Cheeks", { male: "Flatter cheeks", female: "Full, forward cheeks below the eyes" }),
      c("dim_lips", "Lips", { male: "Thinner lower lip with a protrusive upper lip", female: "Full lips" }) ]),
    g("Coloring and contrast", [
      c("dim_contrast", "Eye and lip contrast against skin", { male: "Lower contrast between eyes/lips and surrounding skin", female: "Higher contrast between eyes/lips and surrounding skin" }),
      c("dim_brow", "Brow density", { male: "Thick, low, dense brows (high brow contrast)", female: "Thinner, higher brows (lower brow contrast)" }) ]),
  ],
};

export const RUBRICS: RubricSpec[] = [TRAITS, ANGULARITY, DIMORPHISM];
