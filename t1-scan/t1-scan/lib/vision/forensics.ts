import { CONFIDENCE } from "../confidence/constants";
import { clamp } from "../geometry/primitives";
import type { ImageForensics } from "../types/analysis";

export interface RawImage { data: ArrayLike<number>; width: number; height: number } // RGBA, 8-bit
export interface Box { x: number; y: number; width: number; height: number }

/** A turned head has a narrow box; height is far less pose-dependent, so size the face by whichever is larger. */
export const equivalentFaceWidth = (b: Box): number => Math.max(b.width, b.height / CONFIDENCE.FACE_BOX_ASPECT);

const T = {
  /** Variance of the Laplacian (0-255 luma, face crop resampled to FACE_ANALYSIS_WIDTH) regarded as fully sharp. */
  SHARP_VARIANCE_GOOD: 90,
  FACE_ANALYSIS_WIDTH: 256,
  /** Immerkaer noise sigma (luma levels) at which the noise score reaches zero. */
  NOISE_SIGMA_BAD: 10,
  /** Relative excess of 8x8 block-boundary gradient over interior gradient at which compression score reaches zero. */
  BLOCKINESS_BAD: 0.5,
  CLIP_BAD_FRACTION: 0.15,
  EDGE_GRADIENT_THRESHOLD: 24,
  WEIGHTS: { exposure: 0.2, contrast: 0.1, sharpness: 0.3, noise: 0.1, compression: 0.1, resolution: 0.2 },
} as const;

function luma(img: RawImage): Float32Array {
  const out = new Float32Array(img.width * img.height);
  for (let i = 0, j = 0; i < out.length; i++, j += 4) out[i] = img.data[j] * 0.2126 + img.data[j + 1] * 0.7152 + img.data[j + 2] * 0.0722;
  return out;
}

function crop(src: Float32Array, w: number, h: number, box: Box): { data: Float32Array; width: number; height: number } {
  const x0 = clamp(Math.floor(box.x), 0, w - 1); const y0 = clamp(Math.floor(box.y), 0, h - 1);
  const x1 = clamp(Math.ceil(box.x + box.width), x0 + 1, w); const y1 = clamp(Math.ceil(box.y + box.height), y0 + 1, h);
  const cw = x1 - x0; const ch = y1 - y0; const data = new Float32Array(cw * ch);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) data[y * cw + x] = src[(y0 + y) * w + x0 + x];
  return { data, width: cw, height: ch };
}

/** Box-filter downscale so sharpness is comparable across resolutions. Never upsamples. */
function downscaleTo(src: { data: Float32Array; width: number; height: number }, targetWidth: number) {
  if (src.width <= targetWidth) return src;
  const f = src.width / targetWidth; const w = targetWidth; const h = Math.max(1, Math.round(src.height / f));
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const xs = Math.floor(x * f); const xe = Math.max(xs + 1, Math.floor((x + 1) * f)); const ys = Math.floor(y * f); const ye = Math.max(ys + 1, Math.floor((y + 1) * f));
    let s = 0; let n = 0;
    for (let yy = ys; yy < ye && yy < src.height; yy++) for (let xx = xs; xx < xe && xx < src.width; xx++) { s += src.data[yy * src.width + xx]; n++; }
    out[y * w + x] = s / Math.max(1, n);
  }
  return { data: out, width: w, height: h };
}

function laplacianVariance(g: { data: Float32Array; width: number; height: number }): number {
  const { data, width: w, height: h } = g; if (w < 3 || h < 3) return 0;
  let s = 0; let s2 = 0; let n = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x; const l = 4 * data[i] - data[i - 1] - data[i + 1] - data[i - w] - data[i + w];
    s += l; s2 += l * l; n++;
  }
  const mean = s / n; return s2 / n - mean * mean;
}

/** Immerkaer (1996) fast noise-sigma estimate. */
function noiseSigma(g: { data: Float32Array; width: number; height: number }): number {
  const { data, width: w, height: h } = g; if (w < 3 || h < 3) return 0;
  let sum = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    const v = data[i - w - 1] - 2 * data[i - w] + data[i - w + 1] - 2 * data[i - 1] + 4 * data[i] - 2 * data[i + 1] + data[i + w - 1] - 2 * data[i + w] + data[i + w + 1];
    sum += Math.abs(v);
  }
  return Math.sqrt(Math.PI / 2) * (1 / (6 * (w - 2) * (h - 2))) * sum;
}

/**
 * JPEG-style 8x8 grid detector. The grid phase is unknown (crops, EXIF rotation), so every phase 0..7 is
 * scored and the strongest is compared with the average of the rest: an image without a grid scores ~0.
 */
export function blockiness(g: { data: Float32Array; width: number; height: number }): number {
  const { data, width: w, height: h } = g; if (w < 32 || h < 8) return 0;
  const sum = new Float64Array(8); const cnt = new Float64Array(8);
  for (let y = 0; y < h; y += 2) for (let x = 1; x < w; x++) { const ph = x & 7; sum[ph] += Math.abs(data[y * w + x] - data[y * w + x - 1]); cnt[ph]++; }
  const mean = Array.from(sum, (v, i) => v / Math.max(1, cnt[i]));
  const top = Math.max(...mean); const others = (mean.reduce((a, b) => a + b, 0) - top) / 7;
  return others < 1e-6 ? 0 : Math.max(0, top / others - 1);
}

function edgeDensityOutside(g: Float32Array, w: number, h: number, box: Box): number {
  let edges = 0; let n = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    if (x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height) continue;
    const i = y * w + x; const gx = g[i + 1] - g[i - 1]; const gy = g[i + w] - g[i - w];
    if (Math.hypot(gx, gy) > T.EDGE_GRADIENT_THRESHOLD) edges++; n++;
  }
  return n ? edges / n : 0;
}

export function computeForensics(img: RawImage, opts: { faceBox?: Box | null; exifOrientation?: number | null; /** report facts about the ORIGINAL image while measuring quality on a crop */ reportSize?: { width: number; height: number }; reportFaceBox?: Box | null; /** un-resampled pixels from the original (1:1) used only for compression-artifact detection */ nativeSample?: RawImage } = {}): ImageForensics {
  const { width, height } = opts.reportSize ?? img; const g = luma(img); const notes: string[] = [];
  const faceBox = opts.faceBox ?? null;
  // Exposure is judged on the FACE, not the whole crop: a white wall or dark hair would otherwise flag a well-lit face as over/under-exposed.
  const region = faceBox ? crop(g, img.width, img.height, faceBox) : { data: g, width: img.width, height: img.height };
  let sum = 0; let sum2 = 0; let lo = 0; let hi = 0;
  for (let i = 0; i < region.data.length; i++) { const v = region.data[i]; sum += v; sum2 += v * v; if (v <= 5) lo++; if (v >= 250) hi++; }
  const brightness = sum / region.data.length; const contrast = Math.sqrt(Math.max(0, sum2 / region.data.length - brightness * brightness));
  const clippedShadows = lo / region.data.length; const clippedHighlights = hi / region.data.length;

  const analysis = downscaleTo(region, T.FACE_ANALYSIS_WIDTH);
  const sharpness = laplacianVariance(analysis);
  const noise = noiseSigma(analysis);
  const block = opts.nativeSample ? blockiness({ data: luma(opts.nativeSample), width: opts.nativeSample.width, height: opts.nativeSample.height }) : blockiness(region);

  const reportBox = opts.reportFaceBox ?? faceBox;
  const facePx = reportBox ? equivalentFaceWidth(reportBox) : Math.min(width, height);
  const exposure = clamp(1 - Math.max(0, Math.abs(brightness - 135) - 25) / 100, 0, 1) * (1 - clamp((clippedShadows + clippedHighlights) / T.CLIP_BAD_FRACTION, 0, 1) * 0.7);
  const scores = {
    exposure,
    contrast: clamp(contrast / 55, 0, 1),
    sharpness: clamp(sharpness / T.SHARP_VARIANCE_GOOD, 0, 1),
    noise: 1 - clamp(noise / T.NOISE_SIGMA_BAD, 0, 1),
    compression: 1 - clamp(block / T.BLOCKINESS_BAD, 0, 1),
    resolution: clamp((facePx - CONFIDENCE.FACE_PX_MIN) / (CONFIDENCE.FACE_PX_FULL_QUALITY - CONFIDENCE.FACE_PX_MIN), 0, 1),
    overall: 0,
  };
  scores.overall = (Object.keys(T.WEIGHTS) as (keyof typeof T.WEIGHTS)[]).reduce((s, k) => s + scores[k] * T.WEIGHTS[k], 0);
  if (scores.exposure < 0.5) notes.push(brightness < 135 ? "The photo is dark; fine landmarks are less certain." : "The photo is overexposed; fine landmarks are less certain.");
  if (scores.sharpness < 0.4) notes.push("The face looks soft or blurred; small distances carry more uncertainty.");
  if (scores.resolution < 0.4) notes.push("The face covers few pixels; precision is limited.");
  if (scores.compression < 0.4) notes.push("Heavy compression artifacts detected.");

  return {
    width, height, aspectRatio: width / height, orientation: Math.abs(width - height) / Math.max(width, height) < 0.02 ? "square" : width > height ? "landscape" : "portrait",
    exifOrientation: opts.exifOrientation ?? null, brightness, contrast, sharpness, noise, blockiness: block, clippedShadows, clippedHighlights,
    faceBox: reportBox, faceToImageRatio: reportBox ? (reportBox.width * reportBox.height) / (width * height) : null,
    backgroundComplexity: faceBox ? edgeDensityOutside(g, img.width, img.height, faceBox) : null,
    scores, notes,
  };
}
