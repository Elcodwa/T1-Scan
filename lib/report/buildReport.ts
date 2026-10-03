import { formatUncertainty, formatValue } from "../analysis/format";
import { ENGINE_VERSION } from "../confidence/constants";
import type { DimensionScore } from "../scoring/types";
import type { AnalysisResult, ImageView, MetricResult, MetricStatus, ViewAnalysis } from "../types/analysis";
import { A4, PdfDoc, PdfPage, textWidth, wrapText, type RGB } from "./pdf";

const C = {
  ink: [0.09, 0.09, 0.13] as RGB, muted: [0.4, 0.4, 0.46] as RGB, faint: [0.62, 0.62, 0.68] as RGB, rule: [0.86, 0.86, 0.9] as RGB,
  brand: [0.36, 0.3, 0.84] as RGB, panel: [0.96, 0.96, 0.98] as RGB, white: [1, 1, 1] as RGB,
  good: [0.1, 0.55, 0.38] as RGB, ok: [0.08, 0.5, 0.55] as RGB, warn: [0.72, 0.45, 0.04] as RGB, bad: [0.75, 0.2, 0.25] as RGB,
};
const STATUS_RGB: Record<MetricStatus, RGB> = { reliable: C.good, usable: C.ok, low_confidence: C.warn, unavailable: C.muted, invalid: C.bad, definition_required: C.faint };
const STATUS_TEXT: Record<MetricStatus, string> = { reliable: "Reliable", usable: "Usable", low_confidence: "Approximate", unavailable: "Not measured", invalid: "Invalid", definition_required: "Not supported" };

const M = 40; const CW = A4.width - M * 2; const TOP = A4.height - M; const BOTTOM = M + 18;

export interface ReportInput {
  result: AnalysisResult;
  /** Optional annotated JPEGs per view (photo + measurement overlay). Omitted => no photos in the PDF. */
  images?: Partial<Record<ImageView, Uint8Array>>;
  generatedAt?: Date;
}

class Flow {
  page!: PdfPage; y = TOP;
  constructor(readonly doc: PdfDoc) { this.newPage(); }
  newPage() { this.page = this.doc.addPage(); this.y = TOP; }
  ensure(h: number) { if (this.y - h < BOTTOM) this.newPage(); }
  gap(h: number) { this.y -= h; }
  h1(s: string) { this.ensure(34); this.page.text(M, this.y - 20, s, { size: 20, bold: true, color: C.ink }); this.y -= 30; }
  h2(s: string) { this.ensure(40); this.gap(8); this.page.text(M, this.y - 13, s, { size: 13, bold: true, color: C.brand }); this.page.line(M, this.y - 19, M + CW, this.y - 19, { color: C.rule }); this.y -= 28; }
  h3(s: string) { this.ensure(22); this.page.text(M, this.y - 10, s, { size: 10.5, bold: true, color: C.ink }); this.y -= 18; }
  para(s: string, o: { size?: number; color?: RGB; bold?: boolean; width?: number; x?: number } = {}) {
    const size = o.size ?? 9; const lead = size * 1.4; const width = o.width ?? CW;
    for (const line of wrapText(s, width, size, o.bold)) { this.ensure(lead); this.page.text(o.x ?? M, this.y - size, line, { size, bold: o.bold, color: o.color ?? C.ink }); this.y -= lead; }
  }
  table(cols: { header: string; width: number; align?: "left" | "right" }[], rows: { cells: string[]; colors?: (RGB | undefined)[]; boldCol?: number }[], size = 8) {
    const lead = size * 1.35; const pad = 4; const x0 = M;
    const header = () => {
      this.ensure(lead + pad * 2 + 2);
      this.page.rect(x0, this.y - lead - pad * 2, CW, lead + pad * 2, { fill: C.panel });
      let x = x0; cols.forEach((c) => { this.page.text(c.align === "right" ? x + c.width - pad - textWidth(c.header, size - 0.5, true) : x + pad, this.y - pad - size, c.header, { size: size - 0.5, bold: true, color: C.muted }); x += c.width; });
      this.y -= lead + pad * 2;
    };
    header();
    for (const row of rows) {
      const wrapped = row.cells.map((cell, i) => wrapText(cell, cols[i].width - pad * 2, size, row.boldCol === i));
      const h = Math.max(...wrapped.map((w) => w.length)) * lead + pad * 2;
      if (this.y - h < BOTTOM) { this.newPage(); header(); }
      let x = x0;
      wrapped.forEach((lines, i) => {
        lines.forEach((l, li) => { const w = textWidth(l, size, row.boldCol === i); this.page.text(cols[i].align === "right" ? x + cols[i].width - pad - w : x + pad, this.y - pad - size - li * lead, l, { size, bold: row.boldCol === i, color: row.colors?.[i] ?? C.ink }); });
        x += cols[i].width;
      });
      this.y -= h; this.page.line(x0, this.y, x0 + CW, this.y, { color: C.rule, width: 0.4 });
    }
    this.gap(8);
  }
}

const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${Math.round(v * 100)}%`);
const bandText = (r: { low: number; high: number }) => `${r.low}–${r.high}`;

function scoreCards(f: Flow, scores: AnalysisResult["scores"]) {
  const order = ["harmony", "traits", "angularity", "dimorphism"] as const; const gap = 12; const w = (CW - gap) / 2; const h = 112;
  for (let r = 0; r < 2; r++) {
    f.ensure(h + gap);
    for (let c = 0; c < 2; c++) {
      const s: DimensionScore = scores[order[r * 2 + c]]; const x = M + c * (w + gap); const top = f.y;
      f.page.rect(x, top - h, w, h, { fill: C.panel, stroke: C.rule });
      f.page.text(x + 14, top - 22, s.name.toUpperCase(), { size: 9, bold: true, color: C.muted });
      const label = s.value === null ? "Unavailable" : `${Math.round(s.value)} / 100`;
      f.page.text(x + 14, top - 52, label, { size: s.value === null ? 17 : 26, bold: true, color: s.value === null ? C.faint : C.ink });
      const rb = s.rubric; const status = rb?.needsSex && rb.total === 0 ? "Reference set not chosen" : s.status === "complete" ? "Complete" : s.status === "partial" ? `Partial — ${pct(s.coverage)} of features assessed` : `Not enough assessed (${pct(s.coverage)})`;
      f.page.text(x + 14, top - 68, status, { size: 8.5, bold: true, color: s.status === "complete" ? C.good : s.status === "partial" ? C.warn : C.muted });
      f.page.rect(x + 14, top - 80, w - 28, 4, { fill: C.rule }); f.page.rect(x + 14, top - 80, (w - 28) * Math.max(0.02, s.coverage), 4, { fill: s.status === "unavailable" ? C.faint : C.brand });
      const detail = rb ? (rb.needsSex && rb.total === 0 ? "Choose a men’s or women’s reference set to score this." : `${rb.assessed} of ${rb.total} features: ${rb.measured} measured, ${rb.selfReported} self-reported.`) : s.value !== null ? `Measurement reliability ${pct(s.reliability)}.` : s.waitingOn.length ? `Waiting on: ${[...new Set(s.waitingOn.map((x) => x.label))].slice(0, 4).join(", ")}${s.waitingOn.length > 4 ? "…" : ""}` : s.description;
      wrapText(detail, w - 28, 7.5).slice(0, 2).forEach((l, i) => f.page.text(x + 14, top - 94 - i * 10, l, { size: 7.5, color: C.muted }));
    }
    f.y -= h + gap;
  }
}

function viewSection(f: Flow, a: ViewAnalysis, title: string, image: Uint8Array | undefined) {
  f.newPage(); f.h1(title);
  if (a.status === "failed") { f.para(a.failure?.message ?? "This photo could not be analyzed.", { size: 11, bold: true, color: C.bad }); f.para(a.failure?.guidance ?? "", { size: 10, color: C.muted }); return; }

  let imgW = 0;
  const top = f.y;
  if (image) {
    const jpg = f.doc.addJpeg(image); const maxW = 220; const maxH = 270; const s = Math.min(maxW / jpg.width, maxH / jpg.height);
    imgW = jpg.width * s; const imgH = jpg.height * s; f.page.rect(M - 1, top - imgH - 1, imgW + 2, imgH + 2, { stroke: C.rule });
    f.page.image(jpg.name, M, top - imgH, imgW, imgH); f.y = Math.min(f.y, top - imgH);
  }
  const x = M + (image ? imgW + 18 : 0); const w = CW - (image ? imgW + 18 : 0);
  let ty = top;
  const line = (label: string, value: string) => { f.page.text(x, ty - 9, label, { size: 8.5, color: C.muted }); f.page.text(x + 150, ty - 9, value, { size: 8.5, bold: true, color: C.ink }); ty -= 14; };
  if (a.pose) { line("Orientation", `${a.pose.classification.replace("_", " ").toLowerCase()}${a.pose.facing !== "camera" ? `, facing ${a.pose.facing}` : ""}`); line("Yaw / pitch / roll", `${a.pose.yaw.toFixed(0)}° / ${a.pose.pitch.toFixed(0)}° / ${a.pose.roll.toFixed(0)}°`); }
  line("Geometry source", a.provider);
  const fo = a.forensics;
  if (fo) {
    line("Image size", `${fo.width} × ${fo.height} px`); if (fo.faceToImageRatio !== null) line("Face share of image", pct(fo.faceToImageRatio));
    for (const [k, label] of [["exposure", "Exposure"], ["sharpness", "Sharpness"], ["noise", "Noise (higher = cleaner)"], ["compression", "Compression (higher = cleaner)"], ["resolution", "Face resolution"], ["overall", "Overall image quality"]] as const) line(label, pct(fo.scores[k]));
  }
  if (a.perspective?.estimatedDistanceCm) line("Est. camera distance", `~${Math.round(a.perspective.estimatedDistanceCm)} cm (${a.perspective.basis === "exif_focal_length" ? "from EXIF" : "assumed lens"})`);
  if (a.warnings.length) {
    ty -= 4; f.page.text(x, ty - 9, "Notes", { size: 8.5, bold: true, color: C.warn }); ty -= 13;
    for (const wv of [...new Set(a.warnings)]) for (const l of wrapText(`• ${wv}`, w, 8)) { f.page.text(x, ty - 8, l, { size: 8, color: C.ink }); ty -= 11; }
  }
  f.y = Math.min(f.y, ty) - 10;

  const measured = a.metrics.filter((m) => m.value !== null); const rest = a.metrics.filter((m) => m.value === null);
  f.h2(`Measurements (${measured.length})`);
  if (!measured.length) f.para("No measurement in this photo met the reliability bar. See the notes above.", { color: C.muted });
  else f.table(
    [{ header: "#", width: 22 }, { header: "Metric", width: 150 }, { header: "Value", width: 78, align: "right" }, { header: "Conf.", width: 44, align: "right" }, { header: "Status", width: 82 }, { header: "Note", width: CW - 376 }],
    measured.map((m, i) => ({ cells: [String(i + 1), m.name, `${formatValue(m)} ${formatUncertainty(m) ?? ""}`.trim(), pct(m.confidence), STATUS_TEXT[m.status], m.reasons[0] ?? ""], colors: [C.muted, undefined, undefined, undefined, STATUS_RGB[m.status], C.muted], boldCol: 1 })),
  );
  const withheld = rest.filter((m) => m.status !== "definition_required"); const pending = rest.filter((m) => m.status === "definition_required");
  if (withheld.length) { f.h3("Withheld"); f.table([{ header: "Metric", width: 170 }, { header: "Status", width: 90 }, { header: "Reason", width: CW - 260 }], withheld.map((m) => ({ cells: [m.name, STATUS_TEXT[m.status], m.reasons[0] ?? ""], colors: [undefined, STATUS_RGB[m.status], C.muted] }))); }
  if (pending.length) { f.h3(`Not yet defined (${pending.length})`); f.para(pending.map((m) => m.name).join(" · "), { size: 8, color: C.muted }); f.para("These have no registered geometric definition, so they are intentionally not computed or scored.", { size: 8, color: C.faint }); }
}

const BASIS_TEXT = { measured: "Measured", self_reported: "Self-reported", none: "Not assessed" } as const;

function scoreSection(f: Flow, scores: AnalysisResult["scores"]) {
  f.newPage(); f.h1("How the scores were built");
  f.para("Harmony compares measured values with documented reference bands, weighted by measurement confidence. Traits, Angularity and Dimorphism use the product rubrics: +1 for each feature that matches its ideal, divided by the number of features assessed, × 100. A perfect score is shown as 99. Features that were neither measured nor answered are left out and shown as coverage. The reference bands are editable defaults, not a verdict on any face.", { color: C.muted });
  for (const id of ["harmony", "traits", "angularity", "dimorphism"] as const) {
    const s = scores[id]; const rb = s.rubric;
    f.h2(`${s.name}${s.value !== null ? ` — ${Math.round(s.value)} / 100` : " — unavailable"}`);
    f.para(s.description, { size: 8.5, color: C.muted });
    if (rb) {
      if (rb.needsSex && rb.total === 0) { f.para("No reference set was chosen, so this score was not computed.", { size: 8.5, color: C.warn }); continue; }
      f.para(`Reference set: ${rb.sex === "male" ? "men’s ideals" : rb.sex === "female" ? "women’s ideals" : "not chosen"} · ${rb.points} ideal of ${rb.assessed} assessed (${rb.total} features) · ${rb.measured} measured, ${rb.selfReported} self-reported.`, { size: 8.5, bold: true });
      for (const g of rb.groups) {
        f.h3(`${g.name} — ${g.points} of ${g.assessed} ideal${g.assessed < g.total ? ` (${g.total - g.assessed} unassessed)` : ""}`);
        f.table([{ header: "Feature", width: 150 }, { header: "Ideal", width: 190 }, { header: "Result", width: 62 }, { header: "Basis", width: CW - 402 }],
          rb.criteria.filter((c) => c.group === g.name).map((c) => ({
            cells: [c.label, c.ideal, c.state === "ideal" ? "Ideal" : c.state === "not_ideal" ? "Not ideal" : "—", `${BASIS_TEXT[c.basis]}${c.detail ? ` — ${c.detail}` : ""}`],
            colors: [undefined, C.muted, c.state === "ideal" ? C.good : c.state === "not_ideal" ? C.muted : C.faint, C.muted], boldCol: 0,
          })));
      }
      for (const n of rb.notes) f.para(n, { size: 8, color: C.faint });
      for (const src of rb.sources) f.para(`Source: ${src}`, { size: 7.5, color: C.faint });
      continue;
    }
    if (s.contributions.length) f.table([{ header: "Metric", width: 150 }, { header: "Value", width: 56, align: "right" }, { header: "Ref. band", width: 66, align: "right" }, { header: "Score /10", width: 50, align: "right" }, { header: "Weight", width: 40, align: "right" }, { header: "Conf.", width: 40, align: "right" }, { header: "Reference source", width: CW - 402 }], s.contributions.map((c) => ({ cells: [c.label, c.value.toFixed(c.value < 5 ? 3 : 1), bandText(c.reference), c.score.toFixed(1), String(c.weight), pct(c.confidence), c.reference.source], colors: [undefined, undefined, undefined, undefined, undefined, undefined, C.muted] })));
    if (s.waitingOn.length) f.para(`Not scored: ${s.waitingOn.map((w) => `${w.label} (${w.reason})`).join("; ")}.`, { size: 8, color: C.warn });
    for (const n of s.notMeasurable) f.para(n, { size: 8, color: C.faint });
  }
}

function methodology(f: Flow) {
  f.h2("Method and limits");
  for (const t of [
    "Geometry only. Every value comes from facial landmarks located in your photo and deterministic mathematics. No language model estimates any measurement.",
    "Pose, scale and position are corrected. Ratios are measured in a face-intrinsic frame, so photo size, face position, in-plane tilt and moderate head rotation do not change them. Side-view angles use 3D vectors in the sagittal plane.",
    "Confidence is per measurement. It combines landmark quality, image quality, residual head rotation, expression, camera perspective and how much the value changes when landmarks move by a realistic error. The ± figure is that spread.",
    "Self-reported answers are the user\u2019s own and are labelled as such; measured features cannot be overridden.",
    "Withheld means unmeasurable, not zero. When a landmark is hidden, cropped, mislocated or too uncertain, the value is withheld instead of estimated.",
    "These are measurements of facial geometry compared with reference relationships. They do not determine attractiveness, health, personality or worth.",
    "Your photos were processed in memory for this analysis and are not stored by T1-Scan.",
  ]) f.para(`• ${t}`, { size: 8.5, color: C.ink });
}

export function buildReport(input: ReportInput): Uint8Array {
  const { result } = input; const created = input.generatedAt ?? new Date();
  const doc = new PdfDoc({ title: "T1-Scan facial geometry report", subject: "Facial geometry analysis", created });
  const f = new Flow(doc);

  f.page.rect(0, A4.height - 78, A4.width, 78, { fill: C.brand });
  f.page.text(M, A4.height - 44, "T1-Scan", { size: 24, bold: true, color: C.white });
  f.page.text(M, A4.height - 62, "Facial geometry report", { size: 11, color: [0.9, 0.9, 1] });
  f.page.text(A4.width - M - textWidth(created.toISOString().slice(0, 10), 10), A4.height - 44, created.toISOString().slice(0, 10), { size: 10, color: C.white });
  f.y = A4.height - 100;

  f.h2("Summary scores");
  scoreCards(f, result.scores);
  f.para("Scores are shown only when enough of their inputs could be measured. “Partial” means the score rests on a subset of its inputs; coverage shows how much. Unavailable dimensions list what they are waiting on.", { size: 8, color: C.muted });

  const views: [ImageView, string][] = [["front", "Front view"], ["profile", "Side view"]];
  f.gap(10); f.h2("Analysis at a glance");
  f.table([{ header: "View", width: 90 }, { header: "Measured", width: 70, align: "right" }, { header: "Withheld", width: 70, align: "right" }, { header: "Not yet defined", width: 90, align: "right" }, { header: "Geometry source", width: CW - 320 }],
    views.filter(([v]) => result.analysis[v]).map(([v, label]) => { const a = result.analysis[v] as ViewAnalysis; const ms = a.metrics; return { cells: [label, String(ms.filter((m: MetricResult) => m.value !== null).length), String(ms.filter((m) => m.value === null && m.status !== "definition_required").length), String(ms.filter((m) => m.status === "definition_required").length), a.status === "failed" ? "analysis failed" : a.provider], boldCol: 0 }; }));

  for (const [v, label] of views) { const a = result.analysis[v]; if (a) viewSection(f, a, label, input.images?.[v]); }
  scoreSection(f, result.scores); f.gap(6); methodology(f);
  f.para(`Engine ${ENGINE_VERSION} · processing ${result.processing.durationMs} ms · generated ${created.toISOString()}`, { size: 7.5, color: C.faint });

  doc.pages.forEach((p, i) => p.text(M, M - 4, `T1-Scan facial geometry report · page ${i + 1} of ${doc.pages.length}`, { size: 7.5, color: C.faint }));
  return doc.build();
}
