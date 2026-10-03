"use client";

import { useState } from "react";
import { evaluateMetric, metrics, overallScore } from "@/lib/metrics";
import { FacePlaceholder } from "@/components/analysis/FacePlaceholder";
import { MetricCard } from "@/components/analysis/MetricCard";

export function AnalysisDemo({ photo }: { photo?: string }) {
  // Metric 0 is active by default so lines are visible on arrival,
  // clicking selects a metric persistently, hovering previews a metric.
  const [selected, setSelected] = useState<number>(0);
  const [hovered, setHovered] = useState<number | null>(null);

  const activeIndex = hovered !== null ? hovered : selected;
  const overall = overallScore(metrics);

  const handleToggle = (i: number) => {
    setSelected((prev) => (prev === i ? -1 : i));
  };

  return (
    <div className="flex flex-col items-stretch gap-5 lg:flex-row">
      {/* Photo tile */}
      <div className="relative aspect-square w-full flex-none overflow-hidden rounded-3xl bg-photo-gradient shadow-photo lg:w-[420px]">
        <FacePlaceholder src={photo} />

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          {metrics.map((m, i) => {
            const result = evaluateMetric(m);
            const active = activeIndex === i;
            return (
              <g
                key={m.name}
                className="transition-opacity duration-300"
                style={{ opacity: active ? 1 : 0 }}
              >
                {/* Glow halo behind the lines */}
                {m.lines.map((d, j) => (
                  <path
                    key={`halo-${j}`}
                    d={d}
                    fill="none"
                    stroke={result.fg}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.18"
                  />
                ))}
                {/* Animated measuring lines */}
                {m.lines.map((d, j) => (
                  <path
                    key={`line-${j}`}
                    d={d}
                    fill="none"
                    stroke={result.fg}
                    strokeWidth="0.65"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={100}
                    strokeDasharray="100"
                    strokeDashoffset={active ? 0 : 100}
                    style={{
                      transition: `stroke-dashoffset 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${
                        0.08 * j + 0.04
                      }s`,
                    }}
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Metrics panel */}
      <div className="flex flex-1 flex-col gap-[18px] rounded-3xl bg-panel-gradient p-6 lg:p-[26px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/70 px-3.5 py-[7px] text-[12.5px] font-semibold tracking-wide text-violet-700">
            <span className="h-2 w-2 rounded-full bg-[#22C55E] shadow-[0_0_0_4px_rgba(34,197,94,0.18)]" />
            Analysis complete
          </span>

          <div className="text-right text-ink-soft">
            <div className="text-[30px] font-extrabold leading-none">
              {overall.toFixed(1)}
              <span className="text-[15px] font-semibold text-ink-muted"> /10</span>
            </div>
            <div className="text-[12px] font-semibold tracking-wide text-ink-muted">
              Overall harmony
            </div>
          </div>
        </div>

        {metrics.map((m, i) => (
          <MetricCard
            key={m.name}
            metric={m}
            active={activeIndex === i}
            onEnter={() => setHovered(i)}
            onLeave={() => setHovered(null)}
            onToggle={() => handleToggle(i)}
          />
        ))}
      </div>
    </div>
  );
}
