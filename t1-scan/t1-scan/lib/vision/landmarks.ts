import { applyAffine, processedToOriginal, type PreprocessingTransform } from "../geometry/transform";
import { CONFIDENCE } from "../confidence/constants";
import { clamp } from "../geometry/primitives";
import { dot, vec } from "../geometry/primitives";
import { sagittalForward } from "./sagittal";
import type { Landmark, LandmarkMap, LandmarkSet, LandmarkSource, PoseEstimate, SemanticLandmark } from "../types/analysis";

/** MediaPipe Face Landmarker (478-pt topology) indices. "L"/"R" = image-left/right. */
export const MEDIAPIPE_INDEX: Partial<Record<SemanticLandmark, number>> = {
  glabella: 9, nasion: 168, pronasale: 1, subnasale: 2,
  labialeSuperius: 0, stomionSuperius: 13, stomionInferius: 14, labialeInferius: 17, menton: 152,
  exocanthionL: 33, exocanthionR: 263, endocanthionL: 133, endocanthionR: 362,
  zygionL: 234, zygionR: 454, gonionL: 172, gonionR: 397,
  cheilionL: 61, cheilionR: 291, alareL: 129, alareR: 358,
  foreheadTop: 10,
  // Extra points used by the expanded metric set (MediaPipe 478-pt topology; "L"/"R" = image-left/right).
  templeL: 21, templeR: 251,
  browInnerL: 55, browInnerR: 285, browPeakL: 105, browPeakR: 334, browTailL: 70, browTailR: 300,
  lidUpperL: 159, lidLowerL: 145, lidUpperR: 386, lidLowerR: 374,
  pupilL: 468, pupilR: 473,
  sublabiale: 18,
  // trichion intentionally absent: the face mesh does not model the hairline.
};

export const LANDMARK_SIDE: Partial<Record<SemanticLandmark, "L" | "R">> = {
  exocanthionL: "L", endocanthionL: "L", zygionL: "L", gonionL: "L", cheilionL: "L", alareL: "L",
  exocanthionR: "R", endocanthionR: "R", zygionR: "R", gonionR: "R", cheilionR: "R", alareR: "R",
  templeL: "L", browInnerL: "L", browPeakL: "L", browTailL: "L", lidUpperL: "L", lidLowerL: "L", pupilL: "L",
  templeR: "R", browInnerR: "R", browPeakR: "R", browTailR: "R", lidUpperR: "R", lidLowerR: "R", pupilR: "R",
};

/** Midline chin vertices of the 478-pt mesh, from below the lower lip to the chin bottom (152 = menton). */
export const CHIN_MIDLINE_INDICES = [200, 199, 175] as const;

export interface NormalizedPoint { x: number; y: number; z: number }

/**
 * Converts provider output (normalised 0..1 over the PROCESSED image; z in units of processed width)
 * into ORIGINAL-image pixel space. This is where the old pipeline went wrong: distances were measured in
 * normalised coordinates, which stretches x and y differently on any non-square photo.
 */
export function landmarkSetFromNormalized(
  dense: NormalizedPoint[], transform: PreprocessingTransform, source: LandmarkSource,
): LandmarkSet {
  const back = processedToOriginal(transform);
  const { width: pw, height: ph } = transform.processedSize;
  const pixels = dense.map((p) => applyAffine(back, { x: p.x * pw, y: p.y * ph, z: p.z * pw }));
  const points: LandmarkMap = {};
  for (const [name, index] of Object.entries(MEDIAPIPE_INDEX) as [SemanticLandmark, number][]) {
    const p = pixels[index];
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) continue;
    points[name] = { ...p, visibility: 1, confidence: CONFIDENCE.MEDIAPIPE_LANDMARK_PRIOR, source };
  }
  derivePogonion(points, pixels);
  deriveNearSide(points);
  return { points, source, dense: pixels };
}

/** Lower per-landmark confidence for edge clipping and far-side self-occlusion. Returns a new map. */
export function refineLandmarkConfidence(
  points: LandmarkMap, pose: PoseEstimate, imageSize: { width: number; height: number },
): LandmarkMap {
  const out: LandmarkMap = {};
  const mx = imageSize.width * CONFIDENCE.EDGE_MARGIN_FRACTION; const my = imageSize.height * CONFIDENCE.EDGE_MARGIN_FRACTION;
  for (const [name, p] of Object.entries(points) as [SemanticLandmark, Landmark][]) {
    let confidence = p.confidence; let visibility = 1;
    // Truly outside the frame => clipped. Merely close to the edge => graduated penalty (a tight side crop is still measurable).
    const outside = p.x < 0 || p.y < 0 || p.x > imageSize.width || p.y > imageSize.height;
    const inset = Math.min(p.x, p.y, imageSize.width - p.x, imageSize.height - p.y);
    const marginPx = Math.min(mx, my);
    if (outside) confidence = Math.min(confidence, CONFIDENCE.EDGE_CONFIDENCE);
    else if (inset < marginPx) confidence = Math.min(confidence, CONFIDENCE.EDGE_CONFIDENCE + (CONFIDENCE.EDGE_NEAR_CONFIDENCE - CONFIDENCE.EDGE_CONFIDENCE) * Math.max(0, inset / marginPx));
    const side = LANDMARK_SIDE[name];
    if (side && pose.classification !== "UNKNOWN") {
      // yaw > 0 turns the nose toward image-left, so image-LEFT features recede (see primitives.ts convention).
      const farSide = (pose.yaw > 0 && side === "L") || (pose.yaw < 0 && side === "R");
      if (farSide) {
        const t = clamp((Math.abs(pose.yaw) - CONFIDENCE.FAR_SIDE_START_DEG) / (CONFIDENCE.FAR_SIDE_FULL_DEG - CONFIDENCE.FAR_SIDE_START_DEG), 0, 1);
        visibility = 1 - t * (1 - CONFIDENCE.FAR_SIDE_FLOOR);
        confidence *= visibility;
      }
    }
    out[name] = { ...p, confidence, visibility };
  }
  return out;
}


/**
 * Pogonion = the most anterior of the chin's midline vertices, measured along the face's own forward axis.
 * It is picked from the data rather than assumed to be one fixed index, and is marked as derived (lower trust).
 */
export function derivePogonion(points: LandmarkMap, dense: { x: number; y: number; z: number }[]): void {
  const forward = sagittalForward(points); const menton = points.menton;
  if (!forward || !menton) return;
  let best: { x: number; y: number; z: number } | null = null; let bestScore = -Infinity;
  for (const i of CHIN_MIDLINE_INDICES) {
    const p = dense[i]; if (!p || !Number.isFinite(p.x + p.y + p.z)) continue;
    const score = dot(vec(p.x, p.y, p.z), forward);
    if (score > bestScore) { bestScore = score; best = p; }
  }
  if (best) points.pogonion = { x: best.x, y: best.y, z: best.z, visibility: 1, confidence: Math.min(menton.confidence, CONFIDENCE.MEDIAPIPE_LANDMARK_PRIOR) * CONFIDENCE.DERIVED_LANDMARK_FACTOR, source: "derived" };
}


/**
 * Side photos only show one side of the face. The camera-facing side is the one with the smaller depth (z), so the
 * jaw angle, ear-region point and nostril wing of THAT side become "Near" landmarks and profile metrics never depend on
 * the hidden side. The ear-region point (mesh cheek/ear contour) is the soft-tissue stand-in for the condyle/porion.
 */
export function deriveNearSide(points: LandmarkMap): void {
  const zl = points.zygionL; const zr = points.zygionR; if (!zl || !zr) return;
  const side = zl.z <= zr.z ? "L" : "R";
  const copy = (from: SemanticLandmark, to: SemanticLandmark) => { const p = points[from]; if (p) points[to] = { ...p, source: "derived" }; };
  copy(side === "L" ? "gonionL" : "gonionR", "gonionNear");
  copy(side === "L" ? "zygionL" : "zygionR", "earNear");
  copy(side === "L" ? "alareL" : "alareR", "alareNear");
}
