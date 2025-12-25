/**
 * BACKGROUND REMOVAL SERVICE
 *
 * Client-side background removal using canvas-based chroma key.
 * Works with solid color backgrounds (green screen style).
 *
 * For best results, prompts should request:
 * - "solid green background" or "solid blue background"
 * - "isolated on plain colored background"
 */

export interface ChromaKeyOptions {
  /** Target color to remove (hex or rgb) */
  targetColor?: { r: number; g: number; b: number };
  /** Tolerance for color matching (0-255) */
  tolerance?: number;
  /** Edge softness for smooth cutout (0-1) */
  edgeSoftness?: number;
  /** Whether to auto-detect the background color */
  autoDetect?: boolean;
}

const DEFAULT_OPTIONS: ChromaKeyOptions = {
  targetColor: { r: 0, g: 255, b: 0 }, // Green screen default
  tolerance: 80, // Increased for better coverage
  edgeSoftness: 0.2, // Tighter edges
  autoDetect: true
};

// Common background colors to try if auto-detect fails
const FALLBACK_COLORS = [
  { r: 0, g: 255, b: 0 },     // Bright green
  { r: 0, g: 200, b: 0 },     // Dark green
  { r: 255, g: 255, b: 255 }, // White
  { r: 240, g: 240, b: 240 }, // Light gray
  { r: 200, g: 200, b: 200 }, // Medium gray
  { r: 128, g: 128, b: 128 }, // Gray
  { r: 0, g: 0, b: 255 },     // Blue
  { r: 0, g: 128, b: 255 },   // Light blue
];

/**
 * Detect the most common edge color (likely background)
 */
function detectBackgroundColor(imageData: ImageData): { r: number; g: number; b: number } {
  const { data, width, height } = imageData;
  const colorCounts = new Map<string, number>();

  // Sample edges (top, bottom, left, right rows)
  const samplePixels: number[] = [];

  // Top and bottom rows
  for (let x = 0; x < width; x++) {
    samplePixels.push((0 * width + x) * 4); // Top
    samplePixels.push(((height - 1) * width + x) * 4); // Bottom
  }

  // Left and right columns
  for (let y = 0; y < height; y++) {
    samplePixels.push((y * width + 0) * 4); // Left
    samplePixels.push((y * width + (width - 1)) * 4); // Right
  }

  // Count colors
  for (const i of samplePixels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Quantize to reduce noise (group similar colors)
    const key = `${Math.floor(r / 20) * 20},${Math.floor(g / 20) * 20},${Math.floor(b / 20) * 20}`;
    colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
  }

  // Find most common color
  let maxCount = 0;
  let dominantColor = '128,128,128';
  for (const [color, count] of colorCounts) {
    if (count > maxCount) {
      maxCount = count;
      dominantColor = color;
    }
  }

  const [r, g, b] = dominantColor.split(',').map(Number);
  return { r, g, b };
}

/**
 * Calculate color distance between two colors
 */
function colorDistance(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }): number {
  // Use weighted Euclidean distance (human perception weights)
  const rDiff = c1.r - c2.r;
  const gDiff = c1.g - c2.g;
  const bDiff = c1.b - c2.b;
  return Math.sqrt(2 * rDiff * rDiff + 4 * gDiff * gDiff + 3 * bDiff * bDiff);
}

/**
 * Apply chroma key removal to image data
 */
function applyChromaKey(
  imageData: ImageData,
  targetColor: { r: number; g: number; b: number },
  tolerance: number,
  edgeSoftness: number
): number {
  const { data } = imageData;
  const maxDistance = tolerance * 3;
  let removedPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const pixelColor = {
      r: data[i],
      g: data[i + 1],
      b: data[i + 2]
    };

    const distance = colorDistance(pixelColor, targetColor);

    if (distance < maxDistance) {
      const normalizedDistance = distance / maxDistance;

      if (normalizedDistance < (1 - edgeSoftness)) {
        data[i + 3] = 0;
        removedPixels++;
      } else {
        const edgeAlpha = (normalizedDistance - (1 - edgeSoftness)) / edgeSoftness;
        const newAlpha = Math.floor(255 * edgeAlpha);
        if (newAlpha < data[i + 3]) {
          data[i + 3] = newAlpha;
          removedPixels++;
        }
      }
    }
  }

  return removedPixels;
}

/**
 * Check if a color is likely a background (not skin tone, not too saturated)
 */
function isLikelyBackground(color: { r: number; g: number; b: number }): boolean {
  const { r, g, b } = color;

  // Skip skin tones
  if (r > 150 && g > 100 && g < 180 && b > 50 && b < 150) {
    return false;
  }

  // Accept very uniform colors (gray, white, solid colors)
  const variance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);

  // Accept greens specifically
  if (g > r && g > b && g > 100) return true;

  // Accept whites/grays
  if (variance < 60 && (r + g + b) / 3 > 100) return true;

  // Accept blues
  if (b > r && b > g && b > 100) return true;

  return variance < 80;
}

/**
 * Remove background from an image using chroma key with multiple fallback strategies
 */
export async function removeBackground(
  imageUrl: string,
  options: ChromaKeyOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Draw image
        ctx.drawImage(img, 0, 0);
        const originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Calculate total edge pixels for threshold
        const totalPixels = canvas.width * canvas.height;
        const minRemovalThreshold = totalPixels * 0.15; // At least 15% should be removed for valid BG

        let bestResult: ImageData | null = null;
        let bestRemovedCount = 0;
        let bestColor: { r: number; g: number; b: number } | null = null;

        // Strategy 1: Auto-detect from edges
        if (opts.autoDetect) {
          const detectedColor = detectBackgroundColor(originalData);

          if (isLikelyBackground(detectedColor)) {
            const testData = new ImageData(
              new Uint8ClampedArray(originalData.data),
              originalData.width,
              originalData.height
            );

            const removed = applyChromaKey(testData, detectedColor, opts.tolerance!, opts.edgeSoftness!);

            if (removed > bestRemovedCount && removed > minRemovalThreshold) {
              bestRemovedCount = removed;
              bestResult = testData;
              bestColor = detectedColor;
            }
          }
        }

        // Strategy 2: Try common fallback colors
        for (const fallbackColor of FALLBACK_COLORS) {
          const testData = new ImageData(
            new Uint8ClampedArray(originalData.data),
            originalData.width,
            originalData.height
          );

          const removed = applyChromaKey(testData, fallbackColor, opts.tolerance!, opts.edgeSoftness!);

          if (removed > bestRemovedCount && removed > minRemovalThreshold) {
            bestRemovedCount = removed;
            bestResult = testData;
            bestColor = fallbackColor;
          }
        }

        // Strategy 3: Try with higher tolerance if nothing worked well
        if (bestRemovedCount < minRemovalThreshold) {
          const detectedColor = detectBackgroundColor(originalData);
          const testData = new ImageData(
            new Uint8ClampedArray(originalData.data),
            originalData.width,
            originalData.height
          );

          // Try with much higher tolerance
          const removed = applyChromaKey(testData, detectedColor, 120, 0.15);

          if (removed > bestRemovedCount) {
            bestRemovedCount = removed;
            bestResult = testData;
            bestColor = detectedColor;
          }
        }

        // Apply best result or return original if nothing worked
        if (bestResult && bestRemovedCount > minRemovalThreshold * 0.5) {
          ctx.putImageData(bestResult, 0, 0);
          console.log(`[BG Removal] Removed ${bestRemovedCount} pixels using color:`, bestColor);
        } else {
          console.log('[BG Removal] Could not find suitable background to remove');
        }

        resolve(canvas.toDataURL('image/png'));

      } catch (e) {
        reject(e);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image for background removal'));
    img.src = imageUrl;
  });
}

/**
 * Remove background from multiple frames
 */
export async function removeBackgroundBatch(
  frameUrls: string[],
  options: ChromaKeyOptions = {},
  onProgress?: (processed: number, total: number) => void
): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < frameUrls.length; i++) {
    try {
      const processed = await removeBackground(frameUrls[i], options);
      results.push(processed);
    } catch (e) {
      console.warn(`Failed to remove background from frame ${i}, using original`);
      results.push(frameUrls[i]);
    }
    onProgress?.(i + 1, frameUrls.length);
  }

  return results;
}

/**
 * Check if an image has a removable solid background
 * Returns confidence score (0-1)
 */
export async function analyzeBackground(imageUrl: string): Promise<{
  hasRemovableBackground: boolean;
  confidence: number;
  dominantColor: { r: number; g: number; b: number };
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const dominantColor = detectBackgroundColor(imageData);

        // Count how many edge pixels match the dominant color
        const { data, width, height } = imageData;
        let matchingPixels = 0;
        let totalEdgePixels = 0;

        // Check edges
        for (let x = 0; x < width; x++) {
          for (const y of [0, height - 1]) {
            const i = (y * width + x) * 4;
            const pixelColor = { r: data[i], g: data[i + 1], b: data[i + 2] };
            if (colorDistance(pixelColor, dominantColor) < 100) {
              matchingPixels++;
            }
            totalEdgePixels++;
          }
        }

        for (let y = 0; y < height; y++) {
          for (const x of [0, width - 1]) {
            const i = (y * width + x) * 4;
            const pixelColor = { r: data[i], g: data[i + 1], b: data[i + 2] };
            if (colorDistance(pixelColor, dominantColor) < 100) {
              matchingPixels++;
            }
            totalEdgePixels++;
          }
        }

        const confidence = matchingPixels / totalEdgePixels;

        resolve({
          hasRemovableBackground: confidence > 0.7,
          confidence,
          dominantColor
        });

      } catch (e) {
        reject(e);
      }
    };

    img.onerror = () => reject(new Error('Failed to analyze image'));
    img.src = imageUrl;
  });
}
