"use client";

import type { Verdict } from "@/lib/metrics/guide";

const TONE: Record<Verdict, string> = { typical: "#6ee7b7", below: "#fcd34d", above: "#fcd34d", none: "#a5b4fc" };

/** A value on a scale with the typical band shaded. Purely visual: the number is always printed next to it. */
export function RangeBar({ value, scale, band, verdict }: { value: number; scale: [number, number]; band?: { low: number; high: number }; verdict: Verdict }) {
  const [lo, hi] = scale; const pos = (v: number) => `${Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100))}%`;
  return (
    <div className="relative h-2 w-full rounded-full bg-white/10" role="img" aria-label={band ? `Value ${value.toFixed(2)}; typical range ${band.low} to ${band.high}` : `Value ${value.toFixed(2)}`}>
      {band && <div className="absolute inset-y-0 rounded-full bg-emerald-300/25" style={{ left: pos(band.low), width: `calc(${pos(band.high)} - ${pos(band.low)})` }} />}
      <div className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0b0a16]" style={{ left: pos(value), background: TONE[verdict] }} />
    </div>
  );
}

export const VERDICT_TEXT: Record<Verdict, { label: string; chip: string }> = {
  typical: { label: "In typical range", chip: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200" },
  below: { label: "Below typical", chip: "border-amber-300/25 bg-amber-300/10 text-amber-200" },
  above: { label: "Above typical", chip: "border-amber-300/25 bg-amber-300/10 text-amber-200" },
  none: { label: "Measured", chip: "border-white/12 bg-white/[.04] text-white/55" },
};
