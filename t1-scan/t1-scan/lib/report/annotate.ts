import { STATUS_STYLE } from "../analysis/format";
import type { ViewAnalysis } from "../types/analysis";

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = () => reject(new Error("image load failed")); i.src = src; });

/**
 * Renders the user's photo with every measured construction drawn on it (numbered to match the report table).
 * Uses ORIGINAL-image coordinates, scaled uniformly, so it lines up exactly like the on-screen overlay. Browser only.
 */
export async function renderAnnotatedJpeg(src: string, analysis: ViewAnalysis, maxSide = 1100): Promise<Uint8Array | null> {
  try {
    const size = analysis.transform?.originalSize; if (!size) return null;
    const img = await loadImage(src); const s = Math.min(1, maxSide / Math.max(size.width, size.height));
    const canvas = document.createElement("canvas"); canvas.width = Math.round(size.width * s); canvas.height = Math.round(size.height * s);
    const ctx = canvas.getContext("2d"); if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const u = canvas.width / 1000; ctx.lineCap = "round";
    analysis.metrics.filter((m) => m.value !== null).forEach((m, i) => {
      const color = STATUS_STYLE[m.status].stroke; let tag: { x: number; y: number } | null = null;
      for (const c of m.construction) {
        if (c.kind === "line") {
          ctx.strokeStyle = color; ctx.lineWidth = (c.role === "measure" ? 2.4 : 1.6) * u; ctx.setLineDash(c.role === "reference" ? [6 * u, 5 * u] : []);
          ctx.beginPath(); ctx.moveTo(c.from.x * s, c.from.y * s); ctx.lineTo(c.to.x * s, c.to.y * s); ctx.stroke();
          if (c.role === "measure" && !tag) tag = { x: ((c.from.x + c.to.x) / 2) * s, y: ((c.from.y + c.to.y) / 2) * s };
        } else if (c.kind === "point") { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(c.at.x * s, c.at.y * s, 3.5 * u, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.setLineDash([]);
      const angle = m.construction.find((c) => c.kind === "angle"); if (angle && angle.kind === "angle") tag = { x: angle.vertex.x * s, y: angle.vertex.y * s };
      if (tag) { const r = 9 * u; ctx.fillStyle = "rgba(11,10,22,.88)"; ctx.strokeStyle = color; ctx.lineWidth = 1.5 * u; ctx.beginPath(); ctx.arc(tag.x, tag.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.font = `700 ${11 * u}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(i + 1), tag.x, tag.y + 0.5 * u); }
    });
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86)); if (!blob) return null;
    return new Uint8Array(await blob.arrayBuffer());
  } catch { return null; } // a failed photo render must never block the report; the PDF simply omits the image
}
