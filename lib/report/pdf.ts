import { HELVETICA_BOLD_WIDTHS, HELVETICA_WIDTHS } from "./helvetica-widths";

/** Minimal, dependency-free PDF 1.4 writer: standard fonts, rectangles, lines, text and JPEG images. */
export type RGB = [number, number, number];
export const A4 = { width: 595.28, height: 841.89 };

const CP1252_EXTRA: Record<string, number> = { "–": 0x96, "—": 0x97, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "…": 0x85, "€": 0x80 };
const FALLBACK: Record<string, string> = { "→": "->", "←": "<-", "≈": "~", "≥": ">=", "≤": "<=", "✓": "v", "−": "-", "·": "·", "≠": "!=", "∞": "inf" };

/** Encodes text for WinAnsi; characters outside it degrade to a safe ASCII equivalent instead of corrupting the file. */
export function encodeWinAnsi(text: string): number[] {
  const out: number[] = [];
  for (const raw of text) {
    for (const ch of FALLBACK[raw] ?? raw) {
      const c = ch.codePointAt(0) as number;
      out.push(CP1252_EXTRA[ch] ?? (c >= 32 && c <= 255 ? c : 63));
    }
  }
  return out;
}

export function textWidth(text: string, size: number, bold = false): number {
  const table = bold ? HELVETICA_BOLD_WIDTHS : HELVETICA_WIDTHS;
  return (encodeWinAnsi(text).reduce((s, c) => s + (table[c - 32] ?? 556), 0) * size) / 1000;
}

/** Greedy word wrap using real glyph metrics; very long tokens are split so nothing overflows. */
export function wrapText(text: string, maxWidth: number, size: number, bold = false): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (let word of paragraph.split(/\s+/).filter(Boolean)) {
      while (textWidth(word, size, bold) > maxWidth) { // split an over-long token
        let cut = word.length - 1; while (cut > 1 && textWidth(word.slice(0, cut), size, bold) > maxWidth) cut--;
        if (line) { lines.push(line); line = ""; }
        lines.push(word.slice(0, cut)); word = word.slice(cut);
      }
      const trial = line ? `${line} ${word}` : word;
      if (textWidth(trial, size, bold) <= maxWidth) line = trial; else { lines.push(line); line = word; }
    }
    lines.push(line);
  }
  return lines;
}

const hex = (bytes: number[]) => bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
const num = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, "").replace(/\.$/, ""));
const rgb = (c: RGB) => c.map((v) => num(v)).join(" ");

export interface JpegInfo { width: number; height: number; components: number }
export function readJpegInfo(b: Uint8Array): JpegInfo {
  if (b[0] !== 0xff || b[1] !== 0xd8) throw new Error("Not a JPEG");
  let p = 2;
  while (p + 9 < b.length) {
    if (b[p] !== 0xff) { p++; continue; }
    const marker = b[p + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { height: (b[p + 5] << 8) | b[p + 6], width: (b[p + 7] << 8) | b[p + 8], components: b[p + 9] };
    p += 2 + ((b[p + 2] << 8) | b[p + 3]);
  }
  throw new Error("JPEG size not found");
}

export class PdfPage {
  readonly ops: string[] = []; readonly images = new Set<string>();
  constructor(readonly width = A4.width, readonly height = A4.height) {}
  text(x: number, y: number, s: string, o: { size?: number; bold?: boolean; color?: RGB } = {}) {
    this.ops.push(`BT /${o.bold ? "F2" : "F1"} ${num(o.size ?? 10)} Tf ${rgb(o.color ?? [0, 0, 0])} rg ${num(x)} ${num(y)} Td <${hex(encodeWinAnsi(s))}> Tj ET`);
  }
  rect(x: number, y: number, w: number, h: number, o: { fill?: RGB; stroke?: RGB; lineWidth?: number } = {}) {
    const parts = ["q"]; if (o.fill) parts.push(`${rgb(o.fill)} rg`); if (o.stroke) parts.push(`${rgb(o.stroke)} RG ${num(o.lineWidth ?? 0.75)} w`);
    parts.push(`${num(x)} ${num(y)} ${num(w)} ${num(h)} re ${o.fill && o.stroke ? "B" : o.fill ? "f" : "S"}`, "Q"); this.ops.push(parts.join(" "));
  }
  line(x1: number, y1: number, x2: number, y2: number, o: { color?: RGB; width?: number; dash?: number[] } = {}) {
    this.ops.push(`q ${rgb(o.color ?? [0, 0, 0])} RG ${num(o.width ?? 0.75)} w ${o.dash ? `[${o.dash.map(num).join(" ")}] 0 d ` : ""}${num(x1)} ${num(y1)} m ${num(x2)} ${num(y2)} l S Q`);
  }
  image(name: string, x: number, y: number, w: number, h: number) { this.images.add(name); this.ops.push(`q ${num(w)} 0 0 ${num(h)} ${num(x)} ${num(y)} cm /${name} Do Q`); }
}

export class PdfDoc {
  readonly pages: PdfPage[] = []; private jpegs: { name: string; bytes: Uint8Array; info: JpegInfo }[] = [];
  constructor(private meta: { title: string; author?: string; subject?: string; created?: Date }) {}
  addPage(): PdfPage { const p = new PdfPage(); this.pages.push(p); return p; }
  addJpeg(bytes: Uint8Array): { name: string; width: number; height: number } {
    const info = readJpegInfo(bytes); const name = `Im${this.jpegs.length + 1}`; this.jpegs.push({ name, bytes, info }); return { name, width: info.width, height: info.height };
  }
  build(): Uint8Array {
    const chunks: Uint8Array[] = []; const offsets: number[] = []; let length = 0;
    const enc = new TextEncoder();
    const push = (b: Uint8Array) => { chunks.push(b); length += b.length; };
    const str = (s: string) => push(enc.encode(s));
    const obj = (n: number, body: () => void) => { offsets[n] = length; str(`${n} 0 obj\n`); body(); str("\nendobj\n"); };

    // object numbering: 1 catalog, 2 pages, 3 F1, 4 F2, 5 info, then images, then (page, content) pairs
    const imageBase = 6; const pageBase = imageBase + this.jpegs.length;
    const nObjects = pageBase + this.pages.length * 2;
    str("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
    obj(1, () => str("<< /Type /Catalog /Pages 2 0 R >>"));
    obj(2, () => str(`<< /Type /Pages /Count ${this.pages.length} /Kids [${this.pages.map((_, i) => `${pageBase + i * 2} 0 R`).join(" ")}] >>`));
    obj(3, () => str("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"));
    obj(4, () => str("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"));
    const d = (this.meta.created ?? new Date()).toISOString().replace(/[-:T]/g, "").slice(0, 14);
    const lit = (s: string) => `<${hex(encodeWinAnsi(s))}>`;
    obj(5, () => str(`<< /Title ${lit(this.meta.title)} /Author ${lit(this.meta.author ?? "T1-Scan")} /Subject ${lit(this.meta.subject ?? "")} /Producer ${lit("T1-Scan")} /CreationDate (D:${d}Z) >>`));
    this.jpegs.forEach((j, i) => obj(imageBase + i, () => {
      str(`<< /Type /XObject /Subtype /Image /Width ${j.info.width} /Height ${j.info.height} /ColorSpace /${j.info.components === 1 ? "DeviceGray" : j.info.components === 4 ? "DeviceCMYK" : "DeviceRGB"} /BitsPerComponent 8 /Filter /DCTDecode /Length ${j.bytes.length} >>\nstream\n`);
      push(j.bytes); str("\nendstream");
    }));
    this.pages.forEach((p, i) => {
      const pn = pageBase + i * 2; const cn = pn + 1;
      const xobj = [...p.images].map((n) => `/${n} ${imageBase + this.jpegs.findIndex((j) => j.name === n)} 0 R`).join(" ");
      obj(pn, () => str(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(p.width)} ${num(p.height)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << ${xobj} >> >> /Contents ${cn} 0 R >>`));
      const content = p.ops.join("\n"); const bytes = enc.encode(content);
      obj(cn, () => { str(`<< /Length ${bytes.length} >>\nstream\n`); push(bytes); str("\nendstream"); });
    });
    const xref = length;
    str(`xref\n0 ${nObjects}\n0000000000 65535 f \n`);
    for (let n = 1; n < nObjects; n++) str(`${String(offsets[n]).padStart(10, "0")} 00000 n \n`);
    str(`trailer\n<< /Size ${nObjects} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
    const out = new Uint8Array(length); let o = 0; for (const c of chunks) { out.set(c, o); o += c.length; }
    return out;
  }
}
