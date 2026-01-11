/**
 * DKG Export Service
 *
 * Creates .dkg files - a ZIP containing:
 * - meta.json: name, category, created date
 * - atlas.webp: all frames in one sprite sheet
 * - manifest.json: frame positions + metadata
 *
 * NO AUDIO - frames work with ANY audio source. The player handles audio.
 */

import type { GeneratedFrame, SubjectCategory } from '../types';

export interface DKGMeta {
    version: '1.0';
    name: string;
    category: SubjectCategory;
    created: string;
    generator: string;
    frameCount: number;
}

export interface DKGFrameManifest {
    pose: string;
    energy: 'low' | 'mid' | 'high';
    type: 'body' | 'closeup' | 'hands' | 'feet' | 'mandala' | 'acrobatic';
    direction: 'left' | 'right' | 'center';
    role: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface DKGManifest {
    atlasWidth: number;
    atlasHeight: number;
    cellSize: number;
    frames: DKGFrameManifest[];
}

// Constants
const CELL_SIZE = 256;
const ATLAS_COLS = 8;

/**
 * Load an image from a data URL
 */
async function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * Create a sprite atlas from frames
 */
async function createSpriteAtlas(frames: GeneratedFrame[]): Promise<{ blob: Blob; width: number; height: number }> {
    const cols = ATLAS_COLS;
    const rows = Math.ceil(frames.length / cols);
    const width = cols * CELL_SIZE;
    const height = rows * CELL_SIZE;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Fill with transparent
    ctx.clearRect(0, 0, width, height);

    // Draw each frame
    for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * CELL_SIZE;
        const y = row * CELL_SIZE;

        try {
            const img = await loadImage(frame.url);
            // Draw centered and scaled to fit cell
            const scale = Math.min(CELL_SIZE / img.width, CELL_SIZE / img.height);
            const scaledW = img.width * scale;
            const scaledH = img.height * scale;
            const offsetX = (CELL_SIZE - scaledW) / 2;
            const offsetY = (CELL_SIZE - scaledH) / 2;
            ctx.drawImage(img, x + offsetX, y + offsetY, scaledW, scaledH);
        } catch (e) {
            console.warn(`Failed to load frame ${i}:`, e);
        }
    }

    // Convert to WebP blob
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve({ blob, width, height });
                else reject(new Error('Failed to create atlas blob'));
            },
            'image/webp',
            0.85
        );
    });
}

/**
 * Create frame manifest
 */
function createManifest(frames: GeneratedFrame[], atlasWidth: number, atlasHeight: number): DKGManifest {
    const cols = ATLAS_COLS;

    return {
        atlasWidth,
        atlasHeight,
        cellSize: CELL_SIZE,
        frames: frames.map((frame, i) => ({
            pose: frame.pose,
            energy: (frame.energy as 'low' | 'mid' | 'high') || 'mid',
            type: (frame.type as DKGFrameManifest['type']) || 'body',
            direction: (frame.direction as 'left' | 'right' | 'center') || 'center',
            role: frame.role || 'base',
            x: (i % cols) * CELL_SIZE,
            y: Math.floor(i / cols) * CELL_SIZE,
            w: CELL_SIZE,
            h: CELL_SIZE
        }))
    };
}

/**
 * Create a .dkg file (ZIP format)
 */
export async function exportDKG(
    frames: GeneratedFrame[],
    category: SubjectCategory,
    name: string
): Promise<Blob> {
    // Create sprite atlas
    const atlas = await createSpriteAtlas(frames);

    // Create metadata
    const meta: DKGMeta = {
        version: '1.0',
        name,
        category,
        created: new Date().toISOString(),
        generator: 'jusdnce-web-1.0',
        frameCount: frames.length
    };

    // Create manifest
    const manifest = createManifest(frames, atlas.width, atlas.height);

    // Use JSZip if available, otherwise create manually
    if (typeof (window as any).JSZip !== 'undefined') {
        const JSZip = (window as any).JSZip;
        const zip = new JSZip();
        zip.file('meta.json', JSON.stringify(meta, null, 2));
        zip.file('atlas.webp', atlas.blob);
        zip.file('manifest.json', JSON.stringify(manifest, null, 2));
        return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    }

    // Fallback: Create a simple uncompressed ZIP manually
    // This is a minimal ZIP implementation for browsers without JSZip
    return createMinimalZip([
        { name: 'meta.json', data: new TextEncoder().encode(JSON.stringify(meta, null, 2)) },
        { name: 'manifest.json', data: new TextEncoder().encode(JSON.stringify(manifest, null, 2)) },
        { name: 'atlas.webp', data: new Uint8Array(await atlas.blob.arrayBuffer()) }
    ]);
}

/**
 * Minimal ZIP creation (no compression, for browsers without JSZip)
 */
function createMinimalZip(files: Array<{ name: string; data: Uint8Array }>): Blob {
    const parts: Uint8Array[] = [];
    const centralDirectory: Uint8Array[] = [];
    let offset = 0;

    for (const file of files) {
        const nameBytes = new TextEncoder().encode(file.name);

        // Local file header
        const localHeader = new Uint8Array(30 + nameBytes.length);
        const localView = new DataView(localHeader.buffer);
        localView.setUint32(0, 0x04034b50, true); // Local file header signature
        localView.setUint16(4, 20, true); // Version needed
        localView.setUint16(6, 0, true); // General purpose flag
        localView.setUint16(8, 0, true); // Compression method (none)
        localView.setUint16(10, 0, true); // File mod time
        localView.setUint16(12, 0, true); // File mod date
        localView.setUint32(14, crc32(file.data), true); // CRC-32
        localView.setUint32(18, file.data.length, true); // Compressed size
        localView.setUint32(22, file.data.length, true); // Uncompressed size
        localView.setUint16(26, nameBytes.length, true); // File name length
        localView.setUint16(28, 0, true); // Extra field length
        localHeader.set(nameBytes, 30);

        parts.push(localHeader);
        parts.push(file.data);

        // Central directory header
        const centralHeader = new Uint8Array(46 + nameBytes.length);
        const centralView = new DataView(centralHeader.buffer);
        centralView.setUint32(0, 0x02014b50, true); // Central directory signature
        centralView.setUint16(4, 20, true); // Version made by
        centralView.setUint16(6, 20, true); // Version needed
        centralView.setUint16(8, 0, true); // General purpose flag
        centralView.setUint16(10, 0, true); // Compression method
        centralView.setUint16(12, 0, true); // File mod time
        centralView.setUint16(14, 0, true); // File mod date
        centralView.setUint32(16, crc32(file.data), true); // CRC-32
        centralView.setUint32(20, file.data.length, true); // Compressed size
        centralView.setUint32(24, file.data.length, true); // Uncompressed size
        centralView.setUint16(28, nameBytes.length, true); // File name length
        centralView.setUint16(30, 0, true); // Extra field length
        centralView.setUint16(32, 0, true); // File comment length
        centralView.setUint16(34, 0, true); // Disk number start
        centralView.setUint16(36, 0, true); // Internal file attributes
        centralView.setUint32(38, 0, true); // External file attributes
        centralView.setUint32(42, offset, true); // Relative offset
        centralHeader.set(nameBytes, 46);

        centralDirectory.push(centralHeader);
        offset += localHeader.length + file.data.length;
    }

    const centralDirOffset = offset;
    let centralDirSize = 0;
    for (const header of centralDirectory) {
        parts.push(header);
        centralDirSize += header.length;
    }

    // End of central directory
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);
    endView.setUint32(0, 0x06054b50, true); // End of central directory signature
    endView.setUint16(4, 0, true); // Disk number
    endView.setUint16(6, 0, true); // Disk with central directory
    endView.setUint16(8, files.length, true); // Number of entries on this disk
    endView.setUint16(10, files.length, true); // Total number of entries
    endView.setUint32(12, centralDirSize, true); // Size of central directory
    endView.setUint32(16, centralDirOffset, true); // Offset of central directory
    endView.setUint16(20, 0, true); // Comment length

    parts.push(endRecord);

    return new Blob(parts, { type: 'application/zip' });
}

/**
 * CRC-32 calculation for ZIP
 */
function crc32(data: Uint8Array): number {
    let crc = 0xFFFFFFFF;
    const table = getCRC32Table();
    for (let i = 0; i < data.length; i++) {
        crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

let crc32Table: Uint32Array | null = null;
function getCRC32Table(): Uint32Array {
    if (crc32Table) return crc32Table;
    crc32Table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        crc32Table[i] = c;
    }
    return crc32Table;
}

/**
 * Download a .dkg file
 */
export function downloadDKG(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.dkg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Export and download in one step
 */
export async function exportAndDownloadDKG(
    frames: GeneratedFrame[],
    category: SubjectCategory,
    name: string
): Promise<void> {
    const blob = await exportDKG(frames, category, name);
    downloadDKG(blob, name);
}
