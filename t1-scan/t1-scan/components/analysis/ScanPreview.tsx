"use client";

import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import type { CSSProperties } from "react";
import styles from "./ScanPreview.module.css";
import { useLanguage } from "@/lib/i18n";


/**
 * ScanPreview
 * Face card + metrics panel. Hovering (or focusing / tapping) a metric:
 *  - lights up the card, sweeps in the gradient track and slides the thumb
 *  - counts the value up in sync with the thumb
 *  - draws the matching measurement lines over the face
 * No dependencies, no Tailwind: styles are scoped with the `sp-` prefix.
 *
 * Overlay lines are exact ports of the source #scan section: viewBox
 * "0 0 100 100" (percentage space over the photo), each line rendered twice —
 * a wide low-opacity halo behind a crisp 0.7 stroke that draws in via
 * stroke-dashoffset (0.75s ease, delays 0.05s + 0.12s per line).
 * Stroke widths are scaled ~1.25x vs the source (0.55/2.1 on its 400px card)
 * so this 320px card keeps the same visual weight, and colors are brightened
 * (#22C55E / #13A85B) for visibility.
 */

interface MetricItem {
  id: string;
  title: string;
  value: number;
  min: number;
  max: number;
  decimals: number;
  suffix: string;
  ticks: string[];
  badge: string;
  /** Stroke color for this metric's overlay lines */
  stroke: string;
  /** SVG path `d` strings drawn over the face, in 0-100 viewBox space */
  lines: string[];
}

/**
 * Default metrics are built inside the component so their labels follow the
 * active language (see `localizedDefaultMetrics`).
 */


interface MetricProps {
  m: MetricItem;
  active: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}

function Metric({ m, active, onActivate, onDeactivate }: MetricProps) {
  const pct = Math.min(100, Math.max(0, ((m.value - m.min) / (m.max - m.min)) * 100));
  const text = m.value.toFixed(m.decimals);

  return (
    <div
      className={`${styles.spMetric}${active ? ` ${styles.isActive}` : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={active}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onBlur={onDeactivate}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
      }}
    >
      <div className={styles.spMetricHead}>
        <span className={styles.spMetricTitle}>{m.title}</span>
        <span className={styles.spReading}>
          <span className={styles.spValue}>
            {text}
            {m.suffix}
          </span>
          <span className={styles.spBadge}>{m.badge}</span>
        </span>
      </div>

      <div className={styles.spTrack}>
        <span className={styles.spFill} />
        <span
          className={styles.spThumb}
          style={{ left: active ? `${pct}%` : "0%" }}
        />
      </div>

      <div className={styles.spTicks}>
        {m.ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}

interface ScanPreviewProps {
  imageSrc?: string | StaticImageData;
  imageAlt?: string;
  score?: number;
  metrics?: MetricItem[];
  className?: string;
}

export default function ScanPreview({
  imageSrc,
  imageAlt,
  score = 9.4,
  metrics,
  className,
}: ScanPreviewProps) {
  const [activeId, setActiveId] = useState<string | null>("ratio");
  const { t } = useLanguage();

  const localizedDefaultMetrics: MetricItem[] = [
    {
      id: "ratio",
      title: t.analysisPreview.ratioTitle,
      value: 0.96,
      min: 0.8,
      max: 1.2,
      decimals: 2,
      suffix: "x",
      ticks: ["0.80x", "1.0x", "1.20x"],
      badge: t.analysisPreview.ratioBadge,
      stroke: "#22C55E",
      lines: [
        "M37.5 51.5 L60.5 51.5",
        "M49 51.5 L49 74",
      ],
    },
    {
      id: "alar",
      title: t.analysisPreview.alarTitle,
      value: 1.4,
      min: -2.5,
      max: 5.0,
      decimals: 1,
      suffix: "°",
      ticks: ["-2.5°", "0°–2.5°", "5.0°"],
      badge: t.analysisPreview.alarBadge,
      stroke: "#13A85B",
      lines: [
        "M32 51 L48.8 68.5 L66 51.5",
        "M30 80 L49.5 96 L70.5 77.5",
      ],
    },
  ];

  const effectiveMetrics = metrics ?? localizedDefaultMetrics;

  return (
    <section
      className={`${styles.spRoot}${className ? ` ${className}` : ""}`}
      aria-label={t.analysisPreview.previewLabel}
    >
      <figure className={styles.spFace}>
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt ?? t.analysisPreview.imageAlt}
            width={320}
            height={320}
            priority
            className="h-full w-full object-cover select-none"
          />
        ) : (
          <div className={styles.spFacePlaceholder} />
        )}
        <svg
          className={styles.spOverlay}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {effectiveMetrics.map((m) => (
            <g
              key={m.id}
              className={`${styles.spLines}${activeId === m.id ? ` ${styles.isActive}` : ""}`}
            >
              {m.lines.map((d, i) => (
                <g key={i} style={{ "--i": i } as CSSProperties}>
                  <path className={styles.spHalo} d={d} stroke={m.stroke} />
                  <path className={styles.spDraw} d={d} stroke={m.stroke} pathLength={100} />
                </g>
              ))}
            </g>
          ))}
        </svg>
      </figure>

      <div className={styles.spPanel}>
        <header className={styles.spHead}>
          <span className={styles.spStatus}>
            <i className={styles.spDot} />
            {t.analysisPreview.status}
          </span>
          <div className={styles.spScore}>
            <strong>{score.toFixed(1)}</strong>
            <span>/10</span>
            <small>{t.analysisPreview.overallHarmony}</small>
          </div>
        </header>

        <div className={styles.spMetrics}>
          {effectiveMetrics.map((m) => (
            <Metric
              key={m.id}
              m={m}
              active={activeId === m.id}
              onActivate={() => setActiveId(m.id)}
              onDeactivate={() => {}}
            />
          ))}
        </div>
      </div>
    </section>
  );
}







