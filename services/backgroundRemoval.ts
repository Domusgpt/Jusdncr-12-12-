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
  tolerance: 60,
  edgeSoftness: 0.3,
  autoDetect: true
};

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
 * Flood-fill from edges to mark connected background pixels
 * This prevents removing similar-colored pixels inside the character
 */
function floodFillFromEdges(
  imageData: ImageData,
  targetColor: { r: number; g: number; b: number },
  maxDistance: number
): Uint8Array {
  const { data, width, height } = imageData;
  const visited = new Uint8Array(width * height);
  const isBackground = new Uint8Array(width * height);

  // Helper to check if pixel matches background color
  const matchesBackground = (index: number): boolean => {
    const i = index * 4;
    const pixelColor = { r: data[i], g: data[i + 1], b: data[i + 2] };
    return colorDistance(pixelColor, targetColor) < maxDistance;
  };

  // BFS flood fill from a starting point
  const floodFill = (startX: number, startY: number) => {
    const queue: [number, number][] = [[startX, startY]];

    while (queue.length > 0) {
      const [x, y] = queue.shift()!;

      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      const idx = y * width + x;
      if (visited[idx]) continue;

      visited[idx] = 1;

      if (!matchesBackground(idx)) continue;

      isBackground[idx] = 1;

      // Add neighbors (4-connected for speed, can use 8-connected for better results)
      queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  };

  // Start flood fill from all edge pixels
  for (let x = 0; x < width; x++) {
    if (matchesBackground(x)) floodFill(x, 0); // Top edge
    if (matchesBackground((height - 1) * width + x)) floodFill(x, height - 1); // Bottom edge
  }
  for (let y = 0; y < height; y++) {
    if (matchesBackground(y * width)) floodFill(0, y); // Left edge
    if (matchesBackground(y * width + width - 1)) floodFill(width - 1, y); // Right edge
  }

  return isBackground;
}

/**
 * Remove background from an image using chroma key with flood-fill
 * This prevents green screen artifacts inside characters
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
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data, width, height } = imageData;

        // Auto-detect background color if enabled
        let targetColor = opts.targetColor!;
        if (opts.autoDetect) {
          targetColor = detectBackgroundColor(imageData);
          console.log('[BG Removal] Auto-detected background color:', targetColor);
        }

        const tolerance = opts.tolerance!;
        const maxDistance = tolerance * 3;

        // Use flood-fill to find connected background regions from edges
        const isBackground = floodFillFromEdges(imageData, targetColor, maxDistance);

        // Process each pixel - only remove pixels marked as background
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const i = idx * 4;

            if (isBackground[idx]) {
              const pixelColor = {
                r: data[i],
                g: data[i + 1],
                b: data[i + 2]
              };

              const distance = colorDistance(pixelColor, targetColor);
              const normalizedDistance = distance / maxDistance;
              const softness = opts.edgeSoftness!;

              if (normalizedDistance < (1 - softness)) {
                data[i + 3] = 0; // Fully transparent
              } else {
                // Partial transparency for soft edges
                const edgeAlpha = (normalizedDistance - (1 - softness)) / softness;
                data[i + 3] = Math.floor(255 * edgeAlpha);
              }
            }
            // Pixels not connected to edges keep their original alpha
          }
        }

        ctx.putImageData(imageData, 0, 0);

        // Return as PNG to preserve transparency
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
