import { distance } from "../geometry/primitives";
import { CONFIDENCE } from "../confidence/constants";
import type { ExpressionEstimate, LandmarkMap } from "../types/analysis";
import { buildHeadFrame, toCanonicalPoints } from "./canonical";

/** Geometry-only expression cues. Never rejects the image; the engine downgrades affected metrics instead. */
export function estimateExpression(points: LandmarkMap): ExpressionEstimate {
  const frame = buildHeadFrame(points);
  const none: ExpressionEstimate = { mouthOpen: 0, smile: 0, affected: [] };
  if (!frame) return none;
  const c = toCanonicalPoints(points, frame);
  if (!c.nasion || !c.menton || !c.stomionSuperius || !c.stomionInferius) return none;
  const faceHeight = distance(c.nasion, c.menton);
  if (faceHeight < 1e-9) return none;
  const mouthOpen = Math.max(0, c.stomionInferius.y - c.stomionSuperius.y) / faceHeight;
  let smile = 0;
  if (c.cheilionL && c.cheilionR) smile = ((c.stomionSuperius.y + c.stomionInferius.y) / 2 - (c.cheilionL.y + c.cheilionR.y) / 2) / faceHeight;
  const affected: string[] = [];
  if (mouthOpen > CONFIDENCE.MOUTH_OPEN_THRESHOLD) affected.push("mouth_open");
  if (smile > CONFIDENCE.SMILE_THRESHOLD) affected.push("smile");
  return { mouthOpen, smile, affected };
}
