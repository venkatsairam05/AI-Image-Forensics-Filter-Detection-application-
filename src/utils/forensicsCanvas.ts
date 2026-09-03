/**
 * Client-side Real-time Forensic Image Processing Engine
 * Provides live Error Level Analysis (ELA), Noise Residual Analysis, and Saturation Heatmaps.
 */

export interface ElaOptions {
  quality?: number; // 0.50 to 0.95, default 0.88
  scaleMultiplier?: number; // 10 to 40, default 20
  colorMode?: 'rgb' | 'grayscale' | 'heatmap';
}

/**
 * Performs Error Level Analysis (ELA) on an HTMLImageElement and draws the result to the target canvas.
 */
export async function performELA(
  img: HTMLImageElement,
  targetCanvas: HTMLCanvasElement,
  options: ElaOptions = {}
): Promise<void> {
  const quality = options.quality ?? 0.88;
  const multiplier = options.scaleMultiplier ?? 20;
  const colorMode = options.colorMode ?? 'rgb';

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  if (width === 0 || height === 0) return;

  targetCanvas.width = width;
  targetCanvas.height = height;
  const targetCtx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!targetCtx) return;

  // 1. Draw original image to offscreen canvas
  const origCanvas = document.createElement('canvas');
  origCanvas.width = width;
  origCanvas.height = height;
  const origCtx = origCanvas.getContext('2d', { willReadFrequently: true });
  if (!origCtx) return;
  origCtx.drawImage(img, 0, 0, width, height);

  const origImageData = origCtx.getImageData(0, 0, width, height);
  const origData = origImageData.data;

  // 2. Compress to JPEG at specified quality
  const jpegUrl = origCanvas.toDataURL('image/jpeg', quality);

  // 3. Load compressed JPEG back
  await new Promise<void>((resolve, reject) => {
    const recompressedImg = new Image();
    recompressedImg.crossOrigin = 'anonymous';
    recompressedImg.onload = () => {
      const compCanvas = document.createElement('canvas');
      compCanvas.width = width;
      compCanvas.height = height;
      const compCtx = compCanvas.getContext('2d', { willReadFrequently: true });
      if (!compCtx) {
        resolve();
        return;
      }
      compCtx.drawImage(recompressedImg, 0, 0, width, height);
      const compImageData = compCtx.getImageData(0, 0, width, height);
      const compData = compImageData.data;

      // 4. Compute pixel difference
      const outputImageData = targetCtx.createImageData(width, height);
      const outData = outputImageData.data;

      const len = origData.length;
      for (let i = 0; i < len; i += 4) {
        const diffR = Math.abs(origData[i] - compData[i]) * multiplier;
        const diffG = Math.abs(origData[i + 1] - compData[i + 1]) * multiplier;
        const diffB = Math.abs(origData[i + 2] - compData[i + 2]) * multiplier;

        if (colorMode === 'rgb') {
          outData[i] = Math.min(255, diffR);
          outData[i + 1] = Math.min(255, diffG);
          outData[i + 2] = Math.min(255, diffB);
        } else if (colorMode === 'grayscale') {
          const avg = (diffR + diffG + diffB) / 3;
          const val = Math.min(255, avg);
          outData[i] = val;
          outData[i + 1] = val;
          outData[i + 2] = val;
        } else {
          // Heatmap: Cold dark blue -> Cyan -> Yellow -> Intense Red
          const avg = Math.min(255, (diffR + diffG + diffB) / 3);
          const t = avg / 255;
          if (t < 0.25) {
            outData[i] = 10;
            outData[i + 1] = Math.floor(t * 4 * 180);
            outData[i + 2] = Math.floor(120 + t * 4 * 135);
          } else if (t < 0.5) {
            const nt = (t - 0.25) * 4;
            outData[i] = Math.floor(nt * 220);
            outData[i + 1] = 230;
            outData[i + 2] = Math.floor((1 - nt) * 255);
          } else if (t < 0.75) {
            const nt = (t - 0.5) * 4;
            outData[i] = 255;
            outData[i + 1] = Math.floor(230 - nt * 100);
            outData[i + 2] = 0;
          } else {
            const nt = (t - 0.75) * 4;
            outData[i] = 255;
            outData[i + 1] = Math.floor((1 - nt) * 100);
            outData[i + 2] = Math.floor(nt * 80);
          }
        }
        outData[i + 3] = 255; // Alpha
      }

      targetCtx.putImageData(outputImageData, 0, 0);
      resolve();
    };
    recompressedImg.onerror = () => reject(new Error('Failed to load recompressed JPEG for ELA'));
    recompressedImg.src = jpegUrl;
  });
}

/**
 * Computes Noise Residual Map using a high-pass Laplacian filter
 * Reveals natural sensor PRNU / grain vs AI synthetic flat surfaces
 */
export function performNoiseAnalysis(
  img: HTMLImageElement,
  targetCanvas: HTMLCanvasElement,
  gain: number = 6
): void {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  if (width === 0 || height === 0) return;

  targetCanvas.width = width;
  targetCanvas.height = height;
  const targetCtx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!targetCtx) return;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!tempCtx) return;
  tempCtx.drawImage(img, 0, 0, width, height);

  const srcData = tempCtx.getImageData(0, 0, width, height);
  const src = srcData.data;
  const dstData = targetCtx.createImageData(width, height);
  const dst = dstData.data;

  // 3x3 Laplacian high-pass filter
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Calculate high-pass for green channel (highest luminance resolution)
      const center = src[idx + 1];
      const top = src[((y - 1) * width + x) * 4 + 1];
      const bottom = src[((y + 1) * width + x) * 4 + 1];
      const left = src[(y * width + (x - 1)) * 4 + 1];
      const right = src[(y * width + (x + 1)) * 4 + 1];

      const residual = (center * 4 - top - bottom - left - right) * gain;
      const centered = Math.min(255, Math.max(0, 128 + residual));

      dst[idx] = centered;
      dst[idx + 1] = centered;
      dst[idx + 2] = centered;
      dst[idx + 3] = 255;
    }
  }

  targetCtx.putImageData(dstData, 0, 0);
}

/**
 * Computes Color Saturation & Chromatic Grading Heatmap
 * Highlights heavy beauty filters, contrast boosting, and synthetic color palettes
 */
export function performSaturationAnalysis(
  img: HTMLImageElement,
  targetCanvas: HTMLCanvasElement
): void {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  if (width === 0 || height === 0) return;

  targetCanvas.width = width;
  targetCanvas.height = height;
  const targetCtx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!targetCtx) return;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!tempCtx) return;
  tempCtx.drawImage(img, 0, 0, width, height);

  const srcData = tempCtx.getImageData(0, 0, width, height);
  const src = srcData.data;
  const dstData = targetCtx.createImageData(width, height);
  const dst = dstData.data;

  const len = src.length;
  for (let i = 0; i < len; i += 4) {
    const r = src[i] / 255;
    const g = src[i + 1] / 255;
    const b = src[i + 2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const sat = max === 0 ? 0 : delta / max; // 0 to 1

    // Map saturation to false-color: Deep Indigo (0.0) -> Cyan (0.3) -> Green (0.6) -> Amber (0.8) -> Intense Magenta/Red (1.0)
    if (sat < 0.25) {
      const t = sat / 0.25;
      dst[i] = Math.floor(15 + t * 20);
      dst[i + 1] = Math.floor(30 + t * 140);
      dst[i + 2] = Math.floor(90 + t * 140);
    } else if (sat < 0.5) {
      const t = (sat - 0.25) / 0.25;
      dst[i] = Math.floor(35 + t * 40);
      dst[i + 1] = Math.floor(170 + t * 65);
      dst[i + 2] = Math.floor(230 - t * 120);
    } else if (sat < 0.75) {
      const t = (sat - 0.5) / 0.25;
      dst[i] = Math.floor(75 + t * 170);
      dst[i + 1] = Math.floor(235 - t * 50);
      dst[i + 2] = Math.floor(110 - t * 100);
    } else {
      const t = (sat - 0.75) / 0.25;
      dst[i] = Math.floor(245 + t * 10);
      dst[i + 1] = Math.floor(185 - t * 145);
      dst[i + 2] = Math.floor(10 + t * 160);
    }
    dst[i + 3] = 255;
  }

  targetCtx.putImageData(dstData, 0, 0);
}

/**
 * Computes Sobel Edge Gradient Magnitude
 * Detects boundary discontinuities, airbrush halos, and diffusion feathering
 */
export function performSobelAnalysis(
  img: HTMLImageElement,
  targetCanvas: HTMLCanvasElement,
  gain: number = 2.5
): void {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  if (width === 0 || height === 0) return;

  targetCanvas.width = width;
  targetCanvas.height = height;
  const targetCtx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!targetCtx) return;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!tempCtx) return;
  tempCtx.drawImage(img, 0, 0, width, height);

  const srcData = tempCtx.getImageData(0, 0, width, height);
  const src = srcData.data;
  const dstData = targetCtx.createImageData(width, height);
  const dst = dstData.data;

  // Convert to grayscale luminance buffer
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0, j = 0; i < src.length; i += 4, j++) {
    gray[j] = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
  }

  // Sobel convolution kernels
  // Gx: [-1, 0, 1], [-2, 0, 2], [-1, 0, 1]
  // Gy: [-1, -2, -1], [0, 0, 0], [1, 2, 1]
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const p00 = gray[(y - 1) * width + (x - 1)];
      const p01 = gray[(y - 1) * width + x];
      const p02 = gray[(y - 1) * width + (x + 1)];
      const p10 = gray[y * width + (x - 1)];
      const p12 = gray[y * width + (x + 1)];
      const p20 = gray[(y + 1) * width + (x - 1)];
      const p21 = gray[(y + 1) * width + x];
      const p22 = gray[(y + 1) * width + (x + 1)];

      const gx = -p00 + p02 - 2 * p10 + 2 * p12 - p20 + p22;
      const gy = -p00 - 2 * p01 - p02 + p20 + 2 * p21 + p22;

      const mag = Math.min(255, Math.hypot(gx, gy) * gain);
      const pixelIdx = idx * 4;

      // Render edge gradient in vivid cyber-cyan against deep obsidian
      if (mag > 40) {
        dst[pixelIdx] = Math.floor(mag * 0.4); // R
        dst[pixelIdx + 1] = Math.floor(mag * 0.95); // G
        dst[pixelIdx + 2] = Math.floor(mag); // B
      } else {
        dst[pixelIdx] = Math.floor(mag * 0.15);
        dst[pixelIdx + 1] = Math.floor(mag * 0.2);
        dst[pixelIdx + 2] = Math.floor(mag * 0.3);
      }
      dst[pixelIdx + 3] = 255;
    }
  }

  targetCtx.putImageData(dstData, 0, 0);
}

export interface HistogramData {
  r: number[];
  g: number[];
  b: number[];
  lum: number[];
  shadowClippingPct: number;
  highlightClippingPct: number;
}

/**
 * Computes 256-bin RGB and Luminance Histogram
 */
export function computeColorHistogram(img: HTMLImageElement): HistogramData {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const r = new Array(256).fill(0);
  const g = new Array(256).fill(0);
  const b = new Array(256).fill(0);
  const lum = new Array(256).fill(0);

  if (width === 0 || height === 0) {
    return { r, g, b, lum, shadowClippingPct: 0, highlightClippingPct: 0 };
  }

  const canvas = document.createElement('canvas');
  // Downsample large images for fast responsive UI calculation
  const maxDim = 400;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const sw = Math.max(1, Math.floor(width * scale));
  const sh = Math.max(1, Math.floor(height * scale));
  canvas.width = sw;
  canvas.height = sh;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { r, g, b, lum, shadowClippingPct: 0, highlightClippingPct: 0 };

  ctx.drawImage(img, 0, 0, sw, sh);
  const data = ctx.getImageData(0, 0, sw, sh).data;
  const totalPixels = sw * sh;

  let shadowCount = 0;
  let highlightCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const grn = data[i + 1];
    const blu = data[i + 2];
    const l = Math.round(0.299 * red + 0.587 * grn + 0.114 * blu);

    r[red]++;
    g[grn]++;
    b[blu]++;
    lum[l]++;

    if (l < 5) shadowCount++;
    if (l > 250) highlightCount++;
  }

  return {
    r,
    g,
    b,
    lum,
    shadowClippingPct: Number(((shadowCount / totalPixels) * 100).toFixed(1)),
    highlightClippingPct: Number(((highlightCount / totalPixels) * 100).toFixed(1)),
  };
}
