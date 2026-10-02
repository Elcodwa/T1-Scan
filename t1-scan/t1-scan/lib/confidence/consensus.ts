import { CONFIDENCE, } from "./constants";
import { clamp } from "../geometry/primitives";

/**
 * Agreement between two independent geometry sources for the SAME metric. Returns a confidence delta:
 * positive when sources agree within tolerance, increasingly negative when they disagree.
 * Values are never averaged: incompatible geometry must not be blended.
 */
export function consensusDelta(primary: number, secondary: number, tolerance: number): number {
  const r = Math.abs(primary - secondary) / Math.max(1e-9, tolerance);
  if (r <= 1) return CONFIDENCE.CONSENSUS_BONUS;
  if (r >= 3) return -CONFIDENCE.CONSENSUS_MAX_PENALTY;
  const t = (r - 1) / 2;
  return clamp(CONFIDENCE.CONSENSUS_BONUS * (1 - t) - CONFIDENCE.CONSENSUS_MAX_PENALTY * t, -CONFIDENCE.CONSENSUS_MAX_PENALTY, CONFIDENCE.CONSENSUS_BONUS);
}
