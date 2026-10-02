import { ENGINE_VERSION } from "../confidence/constants";
import { applyAffine, uniformScale, type PreprocessingTransform } from "../geometry/transform";
import { scoreAll } from "../scoring/score";
import type { AnalysisResult, ImageView, LandmarkSet, ProgressStage, ViewAnalysis } from "../types/analysis";
import { parseExif } from "../vision/exif";
import { computeForensics, type Box } from "../vision/forensics";
import { landmarkSetFromNormalized } from "../vision/landmarks";
import { MediaPipeProvider } from "../vision/providers/mediapipe";
import { HybridProvider } from "../vision/providers/remote";
import type { DetectedFace, VisionProvider } from "../vision/providers/types";
import { autoLevels, cropTransform, faceCropRect, pickDominantFace, PREPROCESS, workingScale } from "../vision/preprocess";
import { analyzeView } from "./analyzeView";

export interface PipelineOptions {
  provider?: VisionProvider;
  onProgress?: (stage: ProgressStage, view?: ImageView) => void;
  signal?: AbortSignal;
  /** User's choice when a photo had several comparable faces: index into the left-to-right candidate list. */
  faceSelection?: Partial<Record<ImageView, number>>;
}

let defaultProvider: VisionProvider | undefined;
/** Images stay on-device unless the deployment explicitly enables the server-side 3D reconstruction service. */
export const REMOTE_3D_ENABLED = process.env.NEXT_PUBLIC_RECONSTRUCT_ENABLED === "true";
const getDefaultProvider = () => (defaultProvider ??= REMOTE_3D_ENABLED ? new HybridProvider() : new MediaPipeProvider());

const failureOnly = (view: ImageView, provider: string, code: string, message: string, guidance: string): ViewAnalysis => ({
  view, status: "failed", failure: { code, message, guidance }, landmarkIssues: [], landmarks: {}, metrics: [], warnings: [], provider,
});

function canvasOf(width: number, height: number): HTMLCanvasElement { const c = document.createElement("canvas"); c.width = width; c.height = height; return c; }
function ctx2d(c: HTMLCanvasElement) { const x = c.getContext("2d", { willReadFrequently: true }); if (!x) throw new Error("Canvas 2D is unavailable."); return x; }

/** Draws `source` region (original px) into a new canvas of `size`. The original bitmap is never modified. */
function render(source: ImageBitmap, region: Box, size: { width: number; height: number }): HTMLCanvasElement {
  const c = canvasOf(size.width, size.height);
  const x = ctx2d(c); x.imageSmoothingQuality = "high";
  x.drawImage(source, region.x, region.y, region.width, region.height, 0, 0, size.width, size.height);
  return c;
}

/** Deterministic left-to-right order so a candidate index means the same face on every run. */
const byPosition = (faces: DetectedFace[]) => [...faces].sort((a, b) => a.box.x - b.box.x || a.box.y - b.box.y);

function dominantFace(faces: DetectedFace[]): { face: DetectedFace | null; ambiguous: boolean } {
  const idx = pickDominantFace(faces.map((f) => f.box));
  return idx === null ? { face: null, ambiguous: faces.length > 1 } : { face: faces[idx], ambiguous: false };
}

async function analyzeOne(file: File, view: ImageView, provider: VisionProvider, opts: PipelineOptions): Promise<ViewAnalysis> {
  const progress = (s: ProgressStage) => opts.onProgress?.(s, view);
  const label = view === "front" ? "front" : "profile";
  if (file.size > PREPROCESS.MAX_INPUT_BYTES) return failureOnly(view, provider.id, "too_large", `The ${label} image is larger than ${PREPROCESS.MAX_INPUT_BYTES / 1024 / 1024} MB.`, "Choose a smaller file or export it at a lower resolution.");

  let bitmap: ImageBitmap; let focal35: number | null = null; let exifOrientation: number | null = null;
  try {
    const buffer = await file.arrayBuffer();
    const exif = parseExif(buffer); focal35 = exif.focalLength35mm; exifOrientation = exif.orientation;
    // "from-image" bakes EXIF orientation into the bitmap, so `original` below is the image exactly as the user sees it.
    bitmap = await createImageBitmap(new Blob([buffer], { type: file.type }), { imageOrientation: "from-image" });
  } catch {
    return failureOnly(view, provider.id, "decode_failed", `We couldn't open the ${label} image.`, "Use a JPG, PNG or WebP file that opens normally on your device.");
  }
  try {
    const original = { width: bitmap.width, height: bitmap.height };
    if (original.width * original.height > PREPROCESS.MAX_INPUT_PIXELS) return failureOnly(view, provider.id, "too_large", `The ${label} image has too many pixels to process safely.`, "Export it at a lower resolution and try again.");

    // Pass 1 — locate the face anywhere in the frame on a bounded working copy.
    progress("detecting_face");
    const ws = workingScale(original);
    const workSize = { width: Math.max(1, Math.round(original.width * ws)), height: Math.max(1, Math.round(original.height * ws)) };
    const work = render(bitmap, { x: 0, y: 0, ...original }, workSize);
    let faces = await provider.detectFaces(work);
    if (faces.length === 0) { // recovery: exposure normalisation (point-wise, so coordinates are unchanged)
      const x = ctx2d(work); const data = x.getImageData(0, 0, workSize.width, workSize.height);
      const levelled = autoLevels({ data: data.data, ...workSize }); data.data.set(levelled); x.putImageData(data, 0, 0);
      faces = await provider.detectFaces(work);
    }
    faces = byPosition(faces);
    const chosen = opts.faceSelection?.[view];
    const { face: auto, ambiguous } = dominantFace(faces);
    const located = chosen !== undefined && faces[chosen] ? faces[chosen] : auto;
    if (!located) {
      const candidates = faces.map((f) => ({ x: f.box.x / ws, y: f.box.y / ws, width: f.box.width / ws, height: f.box.height / ws }));
      return analyzeView({ view, provider: provider.id, landmarks: null, faceCount: ambiguous ? faces.length : 0, imageSize: original, candidates });
    }
    const originalBox: Box = { x: located.box.x / ws, y: located.box.y / ws, width: located.box.width / ws, height: located.box.height / ws };

    // Pass 2 — face-aware crop that keeps forehead, jaw, ears and neck; landmarks come from here, mapped back to the original.
    progress("estimating_pose");
    const rect = faceCropRect(originalBox, original);
    const { transform: cropT, size: cropSize } = cropTransform(rect);
    const crop = render(bitmap, rect, cropSize);
    let transform: PreprocessingTransform = { originalSize: original, processedSize: cropSize, originalToProcessed: cropT };
    let canvas = crop; let face: DetectedFace = located; let usedCrop = false;
    const refined = dominantFace(byPosition(await provider.detectFaces(crop))).face;
    if (refined) { face = refined; usedCrop = true; } else { transform = { originalSize: original, processedSize: workSize, originalToProcessed: uniformScale(ws) }; canvas = work; }

    progress("extracting_landmarks");
    const primary = landmarkSetFromNormalized(face.dense, transform, "mediapipe");

    // Optional independent 3D geometry source (consensus). Failure => landmark-only analysis, never a crash.
    let secondary: LandmarkSet | null = null;
    if (provider.reconstruct3D && usedCrop) {
      progress("building_3d_geometry");
      const dense3d = await provider.reconstruct3D(canvas, face).catch(() => null);
      if (dense3d) secondary = landmarkSetFromNormalized(dense3d, transform, "3d_reconstruction");
    }

    // Image forensics: quality is measured on the pixels the model saw, facts are reported against the original.
    const px = ctx2d(canvas).getImageData(0, 0, canvas.width, canvas.height);
    const toProcessed = (b: Box): Box => { const a = applyAffine(transform.originalToProcessed, { x: b.x, y: b.y, z: 0 }); const s = transform.originalToProcessed.a; return { x: a.x, y: a.y, width: b.width * s, height: b.height * s }; };
    // Compression artifacts live on the ORIGINAL pixel grid; resampling would erase or fake them, so sample 1:1 (8-px aligned).
    const nx = Math.floor(Math.min(Math.max(0, originalBox.x), original.width - 8) / 8) * 8; const ny = Math.floor(Math.min(Math.max(0, originalBox.y), original.height - 8) / 8) * 8;
    const nw = Math.min(512, original.width - nx); const nh = Math.min(512, original.height - ny);
    const native = ctx2d(render(bitmap, { x: nx, y: ny, width: nw, height: nh }, { width: nw, height: nh })).getImageData(0, 0, nw, nh);
    const forensics = computeForensics({ data: px.data, width: canvas.width, height: canvas.height }, { faceBox: toProcessed(originalBox), exifOrientation, reportSize: original, reportFaceBox: originalBox, nativeSample: { data: native.data, width: nw, height: nh } });

    progress("calculating_metrics");
    const analysis = analyzeView({ view, provider: provider.id, landmarks: primary, secondary, forensics, transform, imageSize: original, focalLength35mm: focal35 });
    if (!secondary && provider.reconstruct3D) analysis.warnings.push("3D reconstruction was unavailable; results use facial landmarks only.");
    return analysis;
  } finally { bitmap.close(); }
}

/** End-to-end analysis of one or two photos. Never throws for bad images; failures are structured per view. */
export async function analyzeImages(files: { front?: File; profile?: File }, opts: PipelineOptions = {}): Promise<AnalysisResult> {
  const t0 = performance.now(); const provider = opts.provider ?? getDefaultProvider();
  await provider.warmup();
  const out: AnalysisResult["analysis"] = {};
  for (const view of ["front", "profile"] as const) { // sequential: bounded memory and one shared model instance
    const file = files[view]; if (!file) continue;
    if (opts.signal?.aborted) throw new DOMException("Analysis cancelled", "AbortError");
    try { out[view] = await analyzeOne(file, view, provider, opts); }
    catch (error) { out[view] = failureOnly(view, provider.id, "internal", `Something went wrong while analyzing the ${view} image.`, "Please try again. If it keeps happening, try a different photo."); console.error("analysis failed", (error as Error).name); }
  }
  opts.onProgress?.("validating_results");
  opts.onProgress?.("complete");
  return {
    analysis: out, scores: scoreAll(out),
    warnings: [], processing: { durationMs: Math.round(performance.now() - t0), engineVersion: ENGINE_VERSION },
  };
}
