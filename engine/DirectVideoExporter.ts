/**
 * DIRECT VIDEO EXPORTER
 *
 * Since choreography is pre-computed (not reactive), we can render
 * the entire video directly without real-time playback.
 *
 * Benefits:
 * - No waiting for song to play through
 * - Faster than real-time rendering possible
 * - Consistent output (no timing jitter)
 * - Higher quality (no frame drops)
 * - Works offline
 */

import { ChoreographyMap, BeatChoreography } from './ChoreographyPlanner';
import { FrameManifest, ManifestFrame } from './FrameManifest';
import { SongMap } from './SongAnalyzer';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface ExportOptions {
  width: number;
  height: number;
  fps: number;
  quality: 'draft' | 'standard' | 'high';
  format: 'mp4' | 'webm';
  includeAudio: boolean;
  backgroundColor?: string;

  // Progress callback
  onProgress?: (progress: ExportProgress) => void;
}

export interface ExportProgress {
  phase: 'preparing' | 'rendering' | 'encoding' | 'finalizing';
  currentFrame: number;
  totalFrames: number;
  percent: number;
  estimatedTimeRemaining?: number;
}

export interface RenderedFrame {
  timestamp: number;
  imageData: ImageData | Blob;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  width: 1080,
  height: 1920,
  fps: 30,
  quality: 'standard',
  format: 'webm',
  includeAudio: true
};

// Quality presets
const QUALITY_PRESETS = {
  draft: { bitrate: 2_000_000, keyframeInterval: 60 },
  standard: { bitrate: 5_000_000, keyframeInterval: 30 },
  high: { bitrate: 10_000_000, keyframeInterval: 15 }
};

// =============================================================================
// FRAME RENDERER
// =============================================================================

export class FrameRenderer {
  private canvas: OffscreenCanvas | HTMLCanvasElement;
  private ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
  private imageCache: Map<string, ImageBitmap | HTMLImageElement> = new Map();
  private manifest: FrameManifest;

  constructor(manifest: FrameManifest, width: number, height: number) {
    this.manifest = manifest;

    // Use OffscreenCanvas if available (better performance)
    if (typeof OffscreenCanvas !== 'undefined') {
      this.canvas = new OffscreenCanvas(width, height);
      this.ctx = this.canvas.getContext('2d')!;
    } else {
      this.canvas = document.createElement('canvas');
      this.canvas.width = width;
      this.canvas.height = height;
      this.ctx = this.canvas.getContext('2d')!;
    }
  }

  /**
   * Pre-load all frame images for faster rendering
   */
  async preloadFrames(onProgress?: (loaded: number, total: number) => void): Promise<void> {
    const frames = this.manifest.allFrames;
    let loaded = 0;

    const loadPromises = frames.map(async (frame) => {
      if (!this.imageCache.has(frame.id)) {
        const img = await this.loadImage(frame.url);
        this.imageCache.set(frame.id, img);
      }
      loaded++;
      onProgress?.(loaded, frames.length);
    });

    await Promise.all(loadPromises);
  }

  private async loadImage(url: string): Promise<ImageBitmap | HTMLImageElement> {
    // Try createImageBitmap first (faster)
    if (typeof createImageBitmap !== 'undefined') {
      const response = await fetch(url);
      const blob = await response.blob();
      return createImageBitmap(blob);
    }

    // Fallback to HTMLImageElement
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Render a single frame based on choreography decision
   */
  renderFrame(
    choreography: BeatChoreography,
    interpolation: number = 0, // 0-1 progress to next beat
    prevChoreography?: BeatChoreography,
    backgroundColor: string = '#000000'
  ): ImageData {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    // Clear with background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Get frame image
    const frame = this.manifest.allFrames.find(f => f.id === choreography.frameId);
    if (!frame) {
      return ctx.getImageData(0, 0, width, height);
    }

    const img = this.imageCache.get(frame.id);
    if (!img) {
      return ctx.getImageData(0, 0, width, height);
    }

    ctx.save();

    // Apply physics transformations
    const physics = choreography.targetRotation;
    const squash = choreography.targetSquash;
    const bounce = choreography.targetBounce;

    // Center point
    const cx = width / 2;
    const cy = height / 2;

    ctx.translate(cx, cy + bounce);

    // Apply rotation (simplified 2D approximation of 3D rotation)
    const rotX = (physics.x * Math.PI) / 180;
    const rotY = (physics.y * Math.PI) / 180;
    const rotZ = (physics.z * Math.PI) / 180;

    // Rotation around Z axis
    ctx.rotate(rotZ);

    // Simulate X/Y rotation with scale (perspective approximation)
    const scaleX = Math.cos(rotY) * (1 / squash);
    const scaleY = Math.cos(rotX) * squash;
    ctx.scale(scaleX, scaleY);

    // Calculate image dimensions to fit canvas (contain mode)
    const imgAspect = img.width / img.height;
    const canvasAspect = width / height;

    let drawW: number, drawH: number;
    if (imgAspect > canvasAspect) {
      drawW = width * 0.9;
      drawH = drawW / imgAspect;
    } else {
      drawH = height * 0.9;
      drawW = drawH * imgAspect;
    }

    // Apply effects
    if (choreography.fxMode === 'INVERT') {
      ctx.filter = 'invert(1)';
    } else if (choreography.fxMode === 'BW') {
      ctx.filter = 'grayscale(1)';
    }

    // Draw character
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

    // RGB Split effect
    if (choreography.rgbSplit > 0.1) {
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.3 * choreography.rgbSplit;

      // Red channel offset
      ctx.filter = 'url(#redChannel)'; // Would need SVG filter
      ctx.drawImage(img, -drawW / 2 - 5 * choreography.rgbSplit, -drawH / 2, drawW, drawH);

      // Blue channel offset
      ctx.drawImage(img, -drawW / 2 + 5 * choreography.rgbSplit, -drawH / 2, drawW, drawH);

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.filter = 'none';
    }

    ctx.restore();

    // Flash effect
    if (choreography.flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${choreography.flash * 0.5})`;
      ctx.fillRect(0, 0, width, height);
    }

    return ctx.getImageData(0, 0, width, height);
  }

  /**
   * Get canvas as blob for video encoding
   */
  async getFrameBlob(quality: number = 0.9): Promise<Blob> {
    if (this.canvas instanceof OffscreenCanvas) {
      return this.canvas.convertToBlob({ type: 'image/jpeg', quality });
    } else {
      return new Promise((resolve) => {
        (this.canvas as HTMLCanvasElement).toBlob((blob) => resolve(blob!), 'image/jpeg', quality);
      });
    }
  }

  dispose(): void {
    this.imageCache.forEach((img) => {
      if (img instanceof ImageBitmap) {
        img.close();
      }
    });
    this.imageCache.clear();
  }
}

// =============================================================================
// DIRECT VIDEO EXPORTER
// =============================================================================

export class DirectVideoExporter {
  private manifest: FrameManifest;
  private choreographyMap: ChoreographyMap;
  private songMap: SongMap;
  private audioBuffer: AudioBuffer | null;

  constructor(
    manifest: FrameManifest,
    choreographyMap: ChoreographyMap,
    songMap: SongMap,
    audioBuffer?: AudioBuffer
  ) {
    this.manifest = manifest;
    this.choreographyMap = choreographyMap;
    this.songMap = songMap;
    this.audioBuffer = audioBuffer || null;
  }

  /**
   * Export video directly (no real-time playback needed)
   */
  async export(options: Partial<ExportOptions> = {}): Promise<Blob> {
    const opts: ExportOptions = { ...DEFAULT_EXPORT_OPTIONS, ...options };
    const { width, height, fps, quality, onProgress } = opts;

    // Calculate total frames
    const durationMs = this.songMap.duration;
    const totalFrames = Math.ceil((durationMs / 1000) * fps);
    const frameDurationMs = 1000 / fps;

    console.log(`[DirectExport] Starting export: ${totalFrames} frames @ ${fps}fps`);

    // Phase 1: Prepare
    onProgress?.({
      phase: 'preparing',
      currentFrame: 0,
      totalFrames,
      percent: 0
    });

    const renderer = new FrameRenderer(this.manifest, width, height);
    await renderer.preloadFrames((loaded, total) => {
      onProgress?.({
        phase: 'preparing',
        currentFrame: loaded,
        totalFrames: total,
        percent: (loaded / total) * 10 // 0-10% for preloading
      });
    });

    // Phase 2: Render frames
    const frames: Blob[] = [];
    const startTime = Date.now();

    for (let i = 0; i < totalFrames; i++) {
      const timestamp = i * frameDurationMs;

      // Get choreography for this timestamp
      const choreography = this.getChoreographyAt(timestamp);

      // Render frame
      renderer.renderFrame(choreography, 0, undefined, '#000000');
      const frameBlob = await renderer.getFrameBlob(quality === 'high' ? 0.95 : 0.85);
      frames.push(frameBlob);

      // Progress update
      if (i % 10 === 0) {
        const elapsed = Date.now() - startTime;
        const framesPerMs = i / elapsed;
        const remainingFrames = totalFrames - i;
        const estimatedRemaining = remainingFrames / framesPerMs;

        onProgress?.({
          phase: 'rendering',
          currentFrame: i,
          totalFrames,
          percent: 10 + (i / totalFrames) * 60, // 10-70%
          estimatedTimeRemaining: estimatedRemaining
        });
      }
    }

    // Phase 3: Encode video
    onProgress?.({
      phase: 'encoding',
      currentFrame: totalFrames,
      totalFrames,
      percent: 70
    });

    const videoBlob = await this.encodeVideo(frames, opts);

    // Phase 4: Add audio if requested
    let finalBlob = videoBlob;
    if (opts.includeAudio && this.audioBuffer) {
      onProgress?.({
        phase: 'finalizing',
        currentFrame: totalFrames,
        totalFrames,
        percent: 90
      });

      finalBlob = await this.muxAudio(videoBlob, opts);
    }

    // Cleanup
    renderer.dispose();

    onProgress?.({
      phase: 'finalizing',
      currentFrame: totalFrames,
      totalFrames,
      percent: 100
    });

    console.log(`[DirectExport] Complete! Size: ${(finalBlob.size / 1024 / 1024).toFixed(2)}MB`);

    return finalBlob;
  }

  /**
   * Get choreography decision for a specific timestamp
   */
  private getChoreographyAt(timestampMs: number): BeatChoreography {
    const beatInterval = 60000 / this.choreographyMap.bpm;
    const beatIndex = Math.floor(timestampMs / beatInterval);

    // Clamp to valid range
    const clampedIndex = Math.max(0, Math.min(beatIndex, this.choreographyMap.beatAssignments.length - 1));

    return this.choreographyMap.beatAssignments[clampedIndex];
  }

  /**
   * Encode frames to video using WebCodecs or fallback
   */
  private async encodeVideo(frames: Blob[], options: ExportOptions): Promise<Blob> {
    // Check for WebCodecs support
    if (typeof VideoEncoder !== 'undefined') {
      return this.encodeWithWebCodecs(frames, options);
    }

    // Fallback to MediaRecorder with canvas playback
    return this.encodeWithMediaRecorder(frames, options);
  }

  /**
   * Encode using WebCodecs API (modern browsers)
   */
  private async encodeWithWebCodecs(frames: Blob[], options: ExportOptions): Promise<Blob> {
    const { width, height, fps, quality } = options;
    const preset = QUALITY_PRESETS[quality];

    const chunks: EncodedVideoChunk[] = [];

    const encoder = new VideoEncoder({
      output: (chunk) => chunks.push(chunk),
      error: (e) => console.error('[WebCodecs] Encode error:', e)
    });

    encoder.configure({
      codec: options.format === 'mp4' ? 'avc1.640028' : 'vp8',
      width,
      height,
      bitrate: preset.bitrate,
      framerate: fps
    });

    // Encode each frame
    for (let i = 0; i < frames.length; i++) {
      const blob = frames[i];
      const bitmap = await createImageBitmap(blob);

      const frame = new VideoFrame(bitmap, {
        timestamp: i * (1000000 / fps), // microseconds
        duration: 1000000 / fps
      });

      const keyFrame = i % preset.keyframeInterval === 0;
      encoder.encode(frame, { keyFrame });
      frame.close();
      bitmap.close();
    }

    await encoder.flush();
    encoder.close();

    // Create video blob from chunks
    // Note: This creates a raw stream, would need muxing for proper container
    const data = chunks.map(chunk => {
      const buffer = new ArrayBuffer(chunk.byteLength);
      chunk.copyTo(buffer);
      return buffer;
    });

    return new Blob(data, { type: options.format === 'mp4' ? 'video/mp4' : 'video/webm' });
  }

  /**
   * Fallback encoding using MediaRecorder
   */
  private async encodeWithMediaRecorder(frames: Blob[], options: ExportOptions): Promise<Blob> {
    const { width, height, fps, quality } = options;
    const preset = QUALITY_PRESETS[quality];

    // Create canvas for playback
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Create MediaRecorder
    const stream = canvas.captureStream(fps);
    const mimeType = options.format === 'mp4'
      ? 'video/webm;codecs=vp9' // MP4 not directly supported, will need remux
      : 'video/webm;codecs=vp9';

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: preset.bitrate
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    // Start recording
    recorder.start();

    // Play through frames
    const frameDuration = 1000 / fps;
    for (let i = 0; i < frames.length; i++) {
      const img = await createImageBitmap(frames[i]);
      ctx.drawImage(img, 0, 0, width, height);
      img.close();

      // Wait for frame duration
      await new Promise(r => setTimeout(r, frameDuration));
    }

    // Stop and get result
    recorder.stop();
    await new Promise(r => recorder.onstop = r);

    return new Blob(chunks, { type: mimeType });
  }

  /**
   * Mux audio into video (simplified - in production use ffmpeg.wasm)
   */
  private async muxAudio(videoBlob: Blob, options: ExportOptions): Promise<Blob> {
    // For full audio muxing, you'd use ffmpeg.wasm
    // This is a simplified version that relies on the browser's capabilities

    if (!this.audioBuffer) return videoBlob;

    // Convert AudioBuffer to WAV
    const wavBlob = await this.audioBufferToWav(this.audioBuffer);

    // Note: Proper muxing requires ffmpeg.wasm or similar
    // For now, return video-only blob with a warning
    console.warn('[DirectExport] Audio muxing requires ffmpeg.wasm for MP4 output');

    return videoBlob;
  }

  /**
   * Convert AudioBuffer to WAV blob
   */
  private async audioBufferToWav(buffer: AudioBuffer): Promise<Blob> {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;

    const wavBuffer = new ArrayBuffer(44 + length * numChannels * 2);
    const view = new DataView(wavBuffer);

    // WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numChannels * 2, true);

    // Write audio data
    const channels: Float32Array[] = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, channels[ch][i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([wavBuffer], { type: 'audio/wav' });
  }
}

// =============================================================================
// CONVENIENCE EXPORT FUNCTION
// =============================================================================

export interface QuickExportParams {
  manifest: FrameManifest;
  choreographyMap: ChoreographyMap;
  songMap: SongMap;
  audioBuffer?: AudioBuffer;
  options?: Partial<ExportOptions>;
}

/**
 * Quick export function - creates exporter and exports in one call
 */
export async function exportVideo(params: QuickExportParams): Promise<Blob> {
  const { manifest, choreographyMap, songMap, audioBuffer, options } = params;

  const exporter = new DirectVideoExporter(
    manifest,
    choreographyMap,
    songMap,
    audioBuffer
  );

  return exporter.export(options);
}

/**
 * Export and download directly
 */
export async function exportAndDownload(
  params: QuickExportParams,
  filename: string = 'dance-video'
): Promise<void> {
  const blob = await exportVideo(params);

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${params.options?.format || 'webm'}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
