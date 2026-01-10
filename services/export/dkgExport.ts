import JSZip from 'jszip';
import { GeneratedFrame, SubjectCategory } from '../../types';

export interface AtlasFrameEntry {
  id: string;
  pose: string;
  energy: GeneratedFrame['energy'];
  type: GeneratedFrame['type'];
  role: GeneratedFrame['role'];
  direction: GeneratedFrame['direction'];
  rect: { x: number; y: number; w: number; h: number };
  sourceUrl: string;
}

export interface AtlasLayout {
  width: number;
  height: number;
  cellWidth: number;
  cellHeight: number;
  columns: number;
  rows: number;
  frames: AtlasFrameEntry[];
}

export interface DkgManifest {
  version: string;
  subjectCategory: SubjectCategory;
  frameCount: number;
  atlas: Omit<AtlasLayout, 'frames'> & { format: 'webp' };
  frames: AtlasFrameEntry[];
}

export interface DkgMeta {
  version: string;
  createdAt: string;
  generator: string;
  subjectCategory: SubjectCategory;
}

const DEFAULT_CANVAS_SIZE = 512;

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });

export const buildAtlasLayout = (
  frames: GeneratedFrame[],
  sizes?: Array<{ width: number; height: number }>
): AtlasLayout => {
  if (frames.length === 0) {
    throw new Error('Cannot build atlas: no frames provided.');
  }

  const dimensions = sizes ?? frames.map(() => ({ width: DEFAULT_CANVAS_SIZE, height: DEFAULT_CANVAS_SIZE }));
  const cellWidth = Math.max(...dimensions.map((size) => size.width));
  const cellHeight = Math.max(...dimensions.map((size) => size.height));
  const columns = Math.ceil(Math.sqrt(frames.length));
  const rows = Math.ceil(frames.length / columns);

  const layoutFrames = frames.map((frame, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    return {
      id: `frame_${index}`,
      pose: frame.pose,
      energy: frame.energy,
      type: frame.type ?? 'body',
      role: frame.role ?? 'base',
      direction: frame.direction ?? 'center',
      rect: {
        x: col * cellWidth,
        y: row * cellHeight,
        w: cellWidth,
        h: cellHeight
      },
      sourceUrl: frame.url
    };
  });

  return {
    width: columns * cellWidth,
    height: rows * cellHeight,
    cellWidth,
    cellHeight,
    columns,
    rows,
    frames: layoutFrames
  };
};

export const buildManifest = (
  frames: GeneratedFrame[],
  layout: AtlasLayout,
  subjectCategory: SubjectCategory
): DkgManifest => ({
  version: '1.0',
  subjectCategory,
  frameCount: frames.length,
  atlas: {
    width: layout.width,
    height: layout.height,
    cellWidth: layout.cellWidth,
    cellHeight: layout.cellHeight,
    columns: layout.columns,
    rows: layout.rows,
    format: 'webp'
  },
  frames: layout.frames
});

export const createDkgMeta = (subjectCategory: SubjectCategory): DkgMeta => ({
  version: '1.0',
  createdAt: new Date().toISOString(),
  generator: 'jusDNCE',
  subjectCategory
});

export const buildDkgZip = async (
  atlasBlob: Blob,
  manifest: DkgManifest,
  meta: DkgMeta
): Promise<Blob> => {
  const zip = new JSZip();
  zip.file('meta.json', JSON.stringify(meta, null, 2));
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('atlas.webp', atlasBlob);
  return zip.generateAsync({ type: 'blob' });
};

export const buildDkgExport = async (
  frames: GeneratedFrame[],
  subjectCategory: SubjectCategory
): Promise<{ blob: Blob; manifest: DkgManifest; meta: DkgMeta }> => {
  if (typeof document === 'undefined') {
    throw new Error('DKG export requires a browser environment.');
  }

  const images = await Promise.all(frames.map((frame) => loadImage(frame.url)));
  const sizes = images.map((img) => ({ width: img.naturalWidth, height: img.naturalHeight }));
  const layout = buildAtlasLayout(frames, sizes);

  const canvas = document.createElement('canvas');
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to create 2D context for atlas.');
  }

  layout.frames.forEach((entry, index) => {
    const image = images[index];
    const scale = Math.min(entry.rect.w / image.naturalWidth, entry.rect.h / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const offsetX = entry.rect.x + (entry.rect.w - drawWidth) / 2;
    const offsetY = entry.rect.y + (entry.rect.h - drawHeight) / 2;
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  });

  const atlasBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to encode atlas to WebP.'));
        }
      },
      'image/webp',
      0.92
    );
  });

  const manifest = buildManifest(frames, layout, subjectCategory);
  const meta = createDkgMeta(subjectCategory);
  const zipBlob = await buildDkgZip(atlasBlob, manifest, meta);

  return { blob: zipBlob, manifest, meta };
};
