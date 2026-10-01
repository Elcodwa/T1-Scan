export type SemanticLandmark =
  | "trichion" | "glabella" | "nasion" | "pronasale" | "subnasale"
  | "labialeSuperius" | "labialeInferius" | "stomion" | "menton"
  | "leftExocanthion" | "rightExocanthion" | "leftEndocanthion" | "rightEndocanthion"
  | "leftZygion" | "rightZygion" | "leftGonion" | "rightGonion"
  | "leftCheilion" | "rightCheilion" | "leftAlare" | "rightAlare";

/** Centralized MediaPipe Face Landmarker indices. Keep all metric code semantic. */
export const landmarkMap: Record<SemanticLandmark, number> = {
  trichion: 10, glabella: 9, nasion: 168, pronasale: 1, subnasale: 2,
  labialeSuperius: 13, labialeInferius: 14, stomion: 13, menton: 152,
  leftExocanthion: 33, rightExocanthion: 263, leftEndocanthion: 133, rightEndocanthion: 362,
  leftZygion: 234, rightZygion: 454, leftGonion: 172, rightGonion: 397,
  leftCheilion: 61, rightCheilion: 291, leftAlare: 129, rightAlare: 358,
};
