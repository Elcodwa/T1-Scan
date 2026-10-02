"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import { formatUncertainty, formatValue, STATUS_STYLE } from "@/lib/analysis/format";
import type { MetricResult, ViewAnalysis } from "@/lib/types/analysis";

type Pt = { x: number; y: number };
/** Arc between the two rays of an angle, in the image plane; the label sits just outside along the bisector. */
function arcFor(v: Pt, a: Pt, b: Pt): { d: string; labelAt: Pt } | null {
  const la = Math.hypot(a.x - v.x, a.y - v.y); const lb = Math.hypot(b.x - v.x, b.y - v.y);
  if (la < 1e-6 || lb < 1e-6) return null;
  const ua = { x: (a.x - v.x) / la, y: (a.y - v.y) / la }; const ub = { x: (b.x - v.x) / lb, y: (b.y - v.y) / lb };
  const r = Math.min(la, lb) * 0.5; const sweep = ua.x * ub.y - ua.y * ub.x > 0 ? 1 : 0;
  const bis = { x: ua.x + ub.x, y: ua.y + ub.y }; const bl = Math.hypot(bis.x, bis.y) || 1;
  const away = { x: -bis.x / bl, y: -bis.y / bl }; // outside the wedge, so the label never sits on the lines
  return { d: `M${v.x + ua.x * r} ${v.y + ua.y * r} A${r} ${r} 0 0 ${sweep} ${v.x + ub.x * r} ${v.y + ub.y * r}`, labelAt: { x: v.x + away.x * r * 1.8, y: v.y + away.y * r * 1.8 } };
}

const SEG = 0.55; // seconds per animation phase; phases are sequenced: points -> lines -> label -> value -> confidence

/**
 * Draws ONLY geometry produced by the metric engine, in ORIGINAL-image pixel coordinates.
 * The SVG viewBox equals the original image size and the photo is object-contain, so the overlay
 * cannot drift regardless of crop, rotation, scale or padding used during preprocessing.
 */
export function MeasurementOverlay({ src, analysis, metric }: { src: string; analysis: ViewAnalysis; metric?: MetricResult }) {
  const size = analysis.transform?.originalSize ?? { width: 1000, height: 1000 };
  const unit = size.width / 1000; // all stroke/text sizes derive from image width, so they look identical at any resolution
  const stroke = metric ? STATUS_STYLE[metric.status].stroke : "#8b7bea";
  const lines = metric?.construction.filter((c) => c.kind === "line") ?? [];
  const points = useMemo(() => {
    const seen = new Map<string, Pt>();
    metric?.construction.forEach((c) => { if (c.kind === "line") { seen.set(`${c.from.x},${c.from.y}`, c.from); seen.set(`${c.to.x},${c.to.y}`, c.to); } if (c.kind === "point") seen.set(`${c.at.x},${c.at.y}`, c.at); });
    return [...seen.values()];
  }, [metric]);
  const angle = metric?.construction.find((c) => c.kind === "angle");
  const arc = angle && angle.kind === "angle" ? arcFor(angle.vertex, angle.a, angle.b) : null;
  const measure = lines.find((l) => l.kind === "line" && l.role === "measure");
  const labelAt: Pt | null = arc ? arc.labelAt : measure && measure.kind === "line" ? { x: (measure.from.x + measure.to.x) / 2, y: (measure.from.y + measure.to.y) / 2 } : null;
  const uncertainty = metric ? formatUncertainty(metric) : null;

  return (
    <div className="relative mx-auto w-full overflow-hidden rounded-[30px] border border-white/10 bg-[#100f20] shadow-2xl shadow-black/25" style={{ aspectRatio: `${size.width} / ${size.height}`, maxHeight: "78vh" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Analyzed photo" className="absolute inset-0 h-full w-full object-contain" draggable={false} />
      <svg viewBox={`0 0 ${size.width} ${size.height}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <AnimatePresence mode="wait">
          {metric && (
            <motion.g key={metric.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
              {points.map((p, i) => <motion.circle key={i} cx={p.x} cy={p.y} r={4.5 * unit} fill={stroke} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.06, duration: 0.25 }} style={{ transformBox: "fill-box", transformOrigin: "center" }} />)}
              {lines.map((l, i) => l.kind === "line" && (
                <motion.path key={i} d={`M${l.from.x} ${l.from.y} L${l.to.x} ${l.to.y}`} stroke={stroke} strokeWidth={(l.role === "measure" ? 2.6 : 1.8) * unit} strokeDasharray={l.role === "reference" ? `${7 * unit} ${6 * unit}` : undefined} strokeLinecap="round" fill="none" opacity={l.role === "reference" ? 0.7 : 1}
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: SEG + i * 0.25, duration: SEG, ease: [0.16, 1, 0.3, 1] }} />
              ))}
              {arc && <motion.path d={arc.d} stroke={stroke} strokeWidth={2.4 * unit} fill="none" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: SEG * 2, duration: SEG }} />}
              {labelAt && (
                <motion.g initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: SEG * 3, duration: 0.3 }}>
                  <rect x={labelAt.x - 92 * unit} y={labelAt.y - 66 * unit} width={184 * unit} height={50 * unit} rx={10 * unit} fill="rgba(11,10,22,.82)" stroke={stroke} strokeOpacity=".5" strokeWidth={1.2 * unit} />
                  <text x={labelAt.x} y={labelAt.y - 48 * unit} textAnchor="middle" fontSize={11 * unit} fill="rgba(255,255,255,.6)" fontWeight="700" letterSpacing={1.2 * unit}>{metric.name.toUpperCase().slice(0, 26)}</text>
                  <motion.text x={labelAt.x} y={labelAt.y - 26 * unit} textAnchor="middle" fontSize={19 * unit} fill="#fff" fontWeight="800" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: SEG * 4, duration: 0.3 }}>
                    {formatValue(metric)}{uncertainty ? ` ${uncertainty}` : ""}
                  </motion.text>
                  <motion.rect x={labelAt.x - 76 * unit} y={labelAt.y - 21 * unit} height={3 * unit} rx={1.5 * unit} fill={stroke} initial={{ width: 0 }} animate={{ width: 152 * unit * metric.confidence }} transition={{ delay: SEG * 5, duration: 0.5 }} />
                </motion.g>
              )}
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
    </div>
  );
}
