import { NextResponse } from "next/server";

export const runtime = "nodejs";
const MAX_BYTES = 8 * 1024 * 1024;
const TIMEOUT_MS = 25_000;

/**
 * Thin proxy to the Python 3D-reconstruction service. The image is forwarded in memory only:
 * it is never written to disk, logged, or cached here. When no service is configured the route
 * answers 503 and the client transparently falls back to landmark-only analysis.
 */
export async function POST(request: Request) {
  const upstream = process.env.RECONSTRUCT_SERVICE_URL;
  if (!upstream) return NextResponse.json({ error: "reconstruction_not_configured" }, { status: 503 });
  const form = await request.formData().catch(() => null);
  const image = form?.get("image");
  if (!(image instanceof Blob)) return NextResponse.json({ error: "missing_image" }, { status: 400 });
  if (image.size > MAX_BYTES) return NextResponse.json({ error: "image_too_large" }, { status: 413 });
  const body = new FormData(); body.append("image", image, "face.jpg");
  try {
    const res = await fetch(`${upstream.replace(/\/$/, "")}/reconstruct`, { method: "POST", body, signal: AbortSignal.timeout(TIMEOUT_MS), headers: process.env.RECONSTRUCT_SERVICE_TOKEN ? { authorization: `Bearer ${process.env.RECONSTRUCT_SERVICE_TOKEN}` } : undefined });
    if (!res.ok) return NextResponse.json({ error: "reconstruction_failed" }, { status: 502 });
    return NextResponse.json(await res.json(), { headers: { "cache-control": "no-store" } });
  } catch { return NextResponse.json({ error: "reconstruction_unavailable" }, { status: 504 }); }
}
