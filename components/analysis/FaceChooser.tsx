"use client";

import type { ViewAnalysis } from "@/lib/types/analysis";

/** Lets the user pick which face to analyze. Boxes are positioned in percent of the ORIGINAL image, so they sit exactly on each face. */
export function FaceChooser({ analysis, src, onChoose }: { analysis: ViewAnalysis; src: string; onChoose: (index: number) => void }) {
  const cand = analysis.failure?.candidates; if (!cand) return null;
  const { imageSize: s, boxes } = cand;
  return (
    <div className="mx-auto max-w-xl rounded-[28px] border border-violet-300/20 bg-violet-400/[.06] p-5 text-center">
      <h2 className="text-lg font-semibold">{analysis.failure?.message}</h2>
      <p className="mt-1 text-sm text-white/55">{analysis.failure?.guidance}</p>
      <div className="relative mx-auto mt-4 overflow-hidden rounded-2xl border border-white/10" style={{ aspectRatio: `${s.width} / ${s.height}`, maxHeight: "60vh" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Choose a face" className="absolute inset-0 h-full w-full object-contain" draggable={false} />
        {boxes.map((b, i) => (
          <button key={i} onClick={() => onChoose(i)} aria-label={`Analyze face ${i + 1}`}
            className="absolute rounded-xl border-2 border-teal-300/80 bg-teal-300/10 transition hover:bg-teal-300/25 focus:outline-none focus:ring-2 focus:ring-violet-300"
            style={{ left: `${(b.x / s.width) * 100}%`, top: `${(b.y / s.height) * 100}%`, width: `${(b.width / s.width) * 100}%`, height: `${(b.height / s.height) * 100}%` }}>
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-teal-300 px-2 py-0.5 text-[10px] font-bold text-[#0b0a16]">{i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
