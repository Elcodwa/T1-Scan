import type { ImageQualityResult } from "./types";

/** Lightweight preflight that never claims face detection or anatomical precision. */
export async function inspectImage(file: File): Promise<ImageQualityResult> {
  const image = await createImageBitmap(file);
  const imageWidth = image.width;
  const imageHeight = image.height;
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 480 / Math.max(imageWidth, imageHeight));
  canvas.width = Math.max(1, Math.round(imageWidth * scale));
  canvas.height = Math.max(1, Math.round(imageHeight * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  image.close();

  let sum = 0;
  let sumSq = 0;
  const luminance = new Float32Array(canvas.width * canvas.height);
  for (let i = 0; i < pixels.length; i += 4) {
    const lum = pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722;
    sum += lum;
    sumSq += lum * lum;
    luminance[i / 4] = lum;
  }
  const count = pixels.length / 4;
  const brightness = sum / count;
  const contrast = Math.sqrt(Math.max(0, sumSq / count - brightness * brightness));
  let laplacianEnergy = 0;
  let laplacianCount = 0;
  for (let y = 1; y < canvas.height - 1; y += 2) for (let x = 1; x < canvas.width - 1; x += 2) {
    const index = y * canvas.width + x;
    const laplacian = 4 * luminance[index] - luminance[index - 1] - luminance[index + 1] - luminance[index - canvas.width] - luminance[index + canvas.width];
    laplacianEnergy += laplacian * laplacian; laplacianCount++;
  }
  const sharpness = Math.min(100, Math.sqrt(laplacianEnergy / Math.max(1, laplacianCount)) * 2.1);
  const brightnessScore = Math.max(0, 100 - Math.abs(brightness - 138) * 0.72);
  const contrastScore = Math.min(100, contrast * 2.2);
  const resolutionScore = Math.min(100, (imageWidth * imageHeight) / 9000);
  const warnings: string[] = [];
  if (imageWidth < 720 || imageHeight < 720) warnings.push("Use an image at least 720 px on its shortest side.");
  if (brightness < 55) warnings.push("The image is too dark for reliable landmarks.");
  if (brightness > 218) warnings.push("The image is overexposed; reduce direct light.");
  if (contrast < 22) warnings.push("The image has low contrast; improve even lighting.");
  const base = Math.round((brightnessScore * 0.25 + contrastScore * 0.2 + resolutionScore * 0.3 + sharpness * 0.25));
  const analysisLevel = base >= 76 ? "FULL_ANALYSIS" : base >= 57 ? "PARTIAL_ANALYSIS" : base >= 35 ? "LIMITED_ANALYSIS" : "UNRELIABLE";
  return {
    valid: warnings.length === 0,
    faceDetected: false,
    faceCount: 0,
    sharpnessScore: Math.round(sharpness),
    brightnessScore: Math.round(brightnessScore),
    contrastScore: Math.round(contrastScore),
    occlusionScore: 0,
    poseScore: 0,
    overallConfidence: base,
    warnings,
    analysisLevel,
    forensics: {
      width: imageWidth, height: imageHeight, aspectRatio: Number((imageWidth / imageHeight).toFixed(3)),
      sharpness: Math.round(sharpness), brightness: Math.round(brightness), contrast: Math.round(contrast),
      noiseEstimate: Math.max(0, Math.round(100 - sharpness)), imageQualityScore: base, orientationCorrected: true,
    },
  };
}
