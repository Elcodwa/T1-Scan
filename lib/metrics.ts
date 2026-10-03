export type Metric = {
  name: string;
  min: number;
  max: number;
  ideal: number;
  value: number;
  unit: string;
  dec: number;
  minLabel: string;
  midLabel: string;
  maxLabel: string;
  /** SVG path overlays drawn on the photo, in 0-100 viewBox coordinates */
  lines: string[];
};

export type MetricResult = {
  score: number;
  pos: number;
  label: string;
  fg: string;
  bg: string;
};

// Two representative metrics from the full analysis, shown on the marketing
// preview. The complete product measures many more facial ratios.
export const metrics: Metric[] = [
  {
    name: "Average facial ratio",
    min: 0.8,
    max: 1.2,
    ideal: 1.0,
    value: 0.96,
    unit: "x",
    dec: 2,
    minLabel: "0.80x",
    midLabel: "1.0x",
    maxLabel: "1.20x",
    lines: [
      "M37.5 51.5 L60.5 51.5", // pupil to pupil
      "M49 51.5 L49 74", // vertical down to the upper lip
    ],
  },
  {
    name: "Alar-jaw deviation",
    min: -2.5,
    max: 5.0,
    ideal: 1.25,
    value: 1.4,
    unit: "°",
    dec: 1,
    minLabel: "-2.5°",
    midLabel: "0°–2.5°",
    maxLabel: "5.0°",
    lines: [
      "M32 51 L48.8 68.5 L66 51.5", // upper V — eyes to nasal base
      "M30 80 L49.5 96 L70.5 77.5", // lower V — jaw to chin
    ],
  },
];

export function evaluateMetric(m: Metric): MetricResult {
  const half = (m.max - m.min) / 2;
  const d = Math.min(Math.abs(m.value - m.ideal) / half, 1);
  const score = Math.round((10 - 5 * d) * 10) / 10;
  const pos = ((m.value - m.min) / (m.max - m.min)) * 100;

  let label: string;
  let fg: string;
  let bg: string;

  if (score >= 9.8) {
    label = "Ideal";
    fg = "#0F8A4C";
    bg = "#E3F7EC";
  } else if (score >= 9.0) {
    label = "Excellent";
    fg = "#23A55A";
    bg = "#E9F9EF";
  } else if (score >= 8.0) {
    label = "Good";
    fg = "#6E9E1F";
    bg = "#F1F8E0";
  } else if (score >= 6.5) {
    label = "Average";
    fg = "#C08A0E";
    bg = "#FBF3DC";
  } else {
    label = "Needs work";
    fg = "#D05A1A";
    bg = "#FBE9DD";
  }

  return { score, pos, label, fg, bg };
}

export function overallScore(list: Metric[]): number {
  return (
    list.reduce((sum, m) => sum + evaluateMetric(m).score, 0) / list.length
  );
}
