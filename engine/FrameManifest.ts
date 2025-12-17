/**
 * FRAME MANIFEST SYSTEM
 *
 * Pre-computes ALL frame variants (mirror, zoom, etc.) at generation time
 * and stores them in a manifest with complete metadata for choreography.
 *
 * Benefits:
 * - Zero runtime image processing
 * - Complete knowledge of all available frames
 * - Pre-computed transition affinities
 * - Deterministic frame selection
 */

import { GeneratedFrame, EnergyLevel, MoveDirection, FrameType, SheetRole, SubjectCategory } from '../types';
import { RhythmPhase } from './KineticEngine';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type MechanicalOperationType = 'mirror' | 'zoom' | 'crop' | 'rotate' | 'stutter';

export interface MechanicalOperation {
  type: MechanicalOperationType;
  axis?: 'horizontal' | 'vertical';
  factor?: number;
  offsetY?: number;
  region?: 'face' | 'hands' | 'upper' | 'lower';
  degrees?: number;
}

export interface SourceFrame {
  id: string;
  url: string;
  role: SheetRole;
  gridPosition: number;
  energy: EnergyLevel;
  direction: MoveDirection;
  type: FrameType;
}

export interface DerivedFrame {
  id: string;
  sourceId: string;
  url: string;
  operation: MechanicalOperation;
  energy: EnergyLevel;
  direction: MoveDirection;
  type: FrameType;
}

export interface ManifestFrame {
  id: string;
  url: string;
  isSource: boolean;
  sourceId?: string;
  operation?: MechanicalOperation;
  energy: EnergyLevel;
  direction: MoveDirection;
  type: FrameType;
  role?: SheetRole;

  // Pre-computed for choreography
  weight: number;
  preferredTransitions: string[];
  bestForPhases: RhythmPhase[];
}

export interface FrameManifest {
  sourceFrames: SourceFrame[];
  derivedFrames: DerivedFrame[];
  allFrames: ManifestFrame[];

  // Quick lookup indices
  byEnergy: Record<EnergyLevel, ManifestFrame[]>;
  byDirection: Record<MoveDirection, ManifestFrame[]>;
  byType: Record<FrameType, ManifestFrame[]>;
  byMechanical: Record<MechanicalOperationType, ManifestFrame[]>;

  // Metadata
  totalFrameCount: number;
  sourceFrameCount: number;
  derivedFrameCount: number;
  subjectCategory: SubjectCategory;
}

// Compact format for storage/transmission
export interface CompactManifest {
  urls: string[];
  frames: CompactFrame[];
  meta: {
    subject: SubjectCategory;
    sourceCount: number;
  };
}

export interface CompactFrame {
  u: number;      // URL index
  e: 0 | 1 | 2;   // Energy (low=0, mid=1, high=2)
  d: 0 | 1 | 2;   // Direction (left=0, center=1, right=2)
  t: 0 | 1;       // Type (body=0, closeup=1)
  s?: number;     // Source frame index (for derivatives)
  o?: number;     // Operation type index
  w: number;      // Weight (0-100)
  p: number[];    // Preferred transition indices
  ph: number[];   // Best phases (as indices)
}

// =============================================================================
// FRAME MANIFEST BUILDER
// =============================================================================

export class FrameManifestBuilder {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }
  }

  async buildManifest(
    generatedFrames: GeneratedFrame[],
    subjectCategory: SubjectCategory
  ): Promise<FrameManifest> {
    const sourceFrames: SourceFrame[] = [];
    const derivedFrames: DerivedFrame[] = [];

    // 1. Convert GeneratedFrames to SourceFrames with proper tagging
    for (let i = 0; i < generatedFrames.length; i++) {
      const gf = generatedFrames[i];
      sourceFrames.push({
        id: `src_${i}_${gf.pose}`,
        url: gf.url,
        role: gf.role || 'base',
        gridPosition: i,
        energy: gf.energy,
        direction: gf.direction || 'center',
        type: gf.type || 'body'
      });
    }

    // 2. Generate ALL mechanical derivatives upfront
    for (const source of sourceFrames) {
      const derivatives = await this.generateDerivatives(source, subjectCategory);
      derivedFrames.push(...derivatives);
    }

    // 3. Build unified pool
    const allFrames: ManifestFrame[] = [
      ...sourceFrames.map(f => this.sourceToManifest(f)),
      ...derivedFrames.map(f => this.derivedToManifest(f))
    ];

    // 4. Pre-compute choreography weights and affinities
    this.assignWeights(allFrames);
    this.computeTransitionAffinities(allFrames);
    this.assignBestPhases(allFrames);

    // 5. Build lookup indices
    const manifest: FrameManifest = {
      sourceFrames,
      derivedFrames,
      allFrames,
      byEnergy: this.indexByEnergy(allFrames),
      byDirection: this.indexByDirection(allFrames),
      byType: this.indexByType(allFrames),
      byMechanical: this.indexByMechanical(allFrames),
      totalFrameCount: allFrames.length,
      sourceFrameCount: sourceFrames.length,
      derivedFrameCount: derivedFrames.length,
      subjectCategory
    };

    console.log(`[FrameManifest] Built manifest: ${sourceFrames.length} source → ${allFrames.length} total frames`);

    return manifest;
  }

  private async generateDerivatives(
    source: SourceFrame,
    category: SubjectCategory
  ): Promise<DerivedFrame[]> {
    const derivatives: DerivedFrame[] = [];

    // === MIRROR ===
    // Only for CHARACTER type (not TEXT/SYMBOL)
    if (category === 'CHARACTER' && source.type === 'body') {
      try {
        const mirroredUrl = await this.mirrorFrame(source.url);
        derivatives.push({
          id: `${source.id}_mirror`,
          sourceId: source.id,
          url: mirroredUrl,
          operation: { type: 'mirror', axis: 'horizontal' },
          energy: source.energy,
          direction: this.flipDirection(source.direction),
          type: source.type
        });
      } catch (e) {
        console.warn(`[FrameManifest] Mirror failed for ${source.id}:`, e);
      }
    }

    // === ZOOM VARIANTS ===
    // High energy frames get closeup zoom (1.6x)
    if (source.energy === 'high' && source.type === 'body') {
      try {
        const zoom160 = await this.zoomFrame(source.url, 1.6, 0.15);
        derivatives.push({
          id: `${source.id}_zoom_160`,
          sourceId: source.id,
          url: zoom160,
          operation: { type: 'zoom', factor: 1.6, offsetY: 0.15 },
          energy: 'high',
          direction: source.direction,
          type: 'closeup' // Becomes closeup
        });
      } catch (e) {
        console.warn(`[FrameManifest] Zoom 1.6x failed for ${source.id}:`, e);
      }
    }

    // Mid energy frames get subtle zoom (1.25x)
    if (source.energy === 'mid' && source.type === 'body') {
      try {
        const zoom125 = await this.zoomFrame(source.url, 1.25, 0.08);
        derivatives.push({
          id: `${source.id}_zoom_125`,
          sourceId: source.id,
          url: zoom125,
          operation: { type: 'zoom', factor: 1.25, offsetY: 0.08 },
          energy: source.energy,
          direction: source.direction,
          type: source.type
        });
      } catch (e) {
        console.warn(`[FrameManifest] Zoom 1.25x failed for ${source.id}:`, e);
      }
    }

    // === MIRRORED ZOOMS (for characters with high/mid energy) ===
    if (category === 'CHARACTER' && source.type === 'body' && source.energy !== 'low') {
      const zoomDerivative = derivatives.find(d => d.operation.type === 'zoom');
      if (zoomDerivative) {
        try {
          const mirrorZoomUrl = await this.mirrorFrame(zoomDerivative.url);
          derivatives.push({
            id: `${zoomDerivative.id}_mirror`,
            sourceId: source.id,
            url: mirrorZoomUrl,
            operation: { type: 'mirror', axis: 'horizontal', factor: zoomDerivative.operation.factor },
            energy: zoomDerivative.energy,
            direction: this.flipDirection(zoomDerivative.direction),
            type: zoomDerivative.type
          });
        } catch (e) {
          console.warn(`[FrameManifest] Mirror zoom failed for ${source.id}:`, e);
        }
      }
    }

    return derivatives;
  }

  private async mirrorFrame(url: string): Promise<string> {
    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas not available');
    }

    const img = await this.loadImage(url);
    this.canvas.width = img.width;
    this.canvas.height = img.height;

    // Flip horizontally
    this.ctx.save();
    this.ctx.translate(this.canvas.width, 0);
    this.ctx.scale(-1, 1);
    this.ctx.drawImage(img, 0, 0);
    this.ctx.restore();

    return this.canvas.toDataURL('image/jpeg', 0.85);
  }

  private async zoomFrame(url: string, factor: number, offsetY: number): Promise<string> {
    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas not available');
    }

    const img = await this.loadImage(url);
    this.canvas.width = img.width;
    this.canvas.height = img.height;

    // Calculate crop region
    const cropW = img.width / factor;
    const cropH = img.height / factor;
    const cropX = (img.width - cropW) / 2;
    const cropY = (img.height - cropH) / 2 - (offsetY * img.height);

    // Draw cropped and scaled
    this.ctx.drawImage(
      img,
      cropX, Math.max(0, cropY), cropW, cropH,
      0, 0, this.canvas.width, this.canvas.height
    );

    return this.canvas.toDataURL('image/jpeg', 0.85);
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  private flipDirection(dir: MoveDirection): MoveDirection {
    if (dir === 'left') return 'right';
    if (dir === 'right') return 'left';
    return dir;
  }

  private sourceToManifest(source: SourceFrame): ManifestFrame {
    return {
      id: source.id,
      url: source.url,
      isSource: true,
      energy: source.energy,
      direction: source.direction,
      type: source.type,
      role: source.role,
      weight: 1.0,
      preferredTransitions: [],
      bestForPhases: []
    };
  }

  private derivedToManifest(derived: DerivedFrame): ManifestFrame {
    return {
      id: derived.id,
      url: derived.url,
      isSource: false,
      sourceId: derived.sourceId,
      operation: derived.operation,
      energy: derived.energy,
      direction: derived.direction,
      type: derived.type,
      weight: 0.7, // Derivatives slightly less preferred
      preferredTransitions: [],
      bestForPhases: []
    };
  }

  private assignWeights(frames: ManifestFrame[]): void {
    for (const frame of frames) {
      let weight = frame.isSource ? 1.0 : 0.7;

      // Mirror frames slightly less common
      if (frame.operation?.type === 'mirror') {
        weight *= 0.8;
      }

      // Zoom frames reserved for special moments
      if (frame.operation?.type === 'zoom') {
        weight *= 0.5;
      }

      // Closeups are rare and special
      if (frame.type === 'closeup') {
        weight *= 0.4;
      }

      frame.weight = weight;
    }
  }

  private computeTransitionAffinities(frames: ManifestFrame[]): void {
    for (const frame of frames) {
      frame.preferredTransitions = [];

      // Prefer transitions to opposite direction (ping-pong effect)
      const opposite = this.flipDirection(frame.direction);
      const oppositeFrames = frames.filter(f =>
        f.direction === opposite &&
        f.energy === frame.energy &&
        f.id !== frame.id
      );
      frame.preferredTransitions.push(...oppositeFrames.slice(0, 5).map(f => f.id));

      // Also allow same-direction with different source
      const sameDir = frames.filter(f =>
        f.direction === frame.direction &&
        f.sourceId !== (frame.sourceId || frame.id) &&
        f.id !== frame.id &&
        f.energy === frame.energy
      );
      frame.preferredTransitions.push(...sameDir.slice(0, 3).map(f => f.id));

      // Energy step-ups (low -> mid, mid -> high)
      if (frame.energy === 'low') {
        const midFrames = frames.filter(f => f.energy === 'mid').slice(0, 3);
        frame.preferredTransitions.push(...midFrames.map(f => f.id));
      } else if (frame.energy === 'mid') {
        const highFrames = frames.filter(f => f.energy === 'high').slice(0, 2);
        frame.preferredTransitions.push(...highFrames.map(f => f.id));
      }
    }
  }

  private assignBestPhases(frames: ManifestFrame[]): void {
    for (const frame of frames) {
      frame.bestForPhases = [];

      // Energy-based phase assignment
      if (frame.energy === 'low') {
        frame.bestForPhases = ['AMBIENT', 'WARMUP', 'FLOW'];
      } else if (frame.energy === 'mid') {
        frame.bestForPhases = ['SWING_LEFT', 'SWING_RIGHT', 'GROOVE'];
      } else if (frame.energy === 'high') {
        frame.bestForPhases = ['DROP', 'CHAOS', 'GROOVE'];
      }

      // Closeups for specific phases
      if (frame.type === 'closeup') {
        frame.bestForPhases = ['VOGUE', 'FLOW'];
      }

      // Zoom frames for impact moments
      if (frame.operation?.type === 'zoom') {
        frame.bestForPhases = ['DROP', 'CHAOS'];
      }
    }
  }

  private indexByEnergy(frames: ManifestFrame[]): Record<EnergyLevel, ManifestFrame[]> {
    return {
      low: frames.filter(f => f.energy === 'low'),
      mid: frames.filter(f => f.energy === 'mid'),
      high: frames.filter(f => f.energy === 'high')
    };
  }

  private indexByDirection(frames: ManifestFrame[]): Record<MoveDirection, ManifestFrame[]> {
    return {
      left: frames.filter(f => f.direction === 'left'),
      center: frames.filter(f => f.direction === 'center'),
      right: frames.filter(f => f.direction === 'right')
    };
  }

  private indexByType(frames: ManifestFrame[]): Record<FrameType, ManifestFrame[]> {
    return {
      body: frames.filter(f => f.type === 'body'),
      closeup: frames.filter(f => f.type === 'closeup')
    };
  }

  private indexByMechanical(frames: ManifestFrame[]): Record<MechanicalOperationType, ManifestFrame[]> {
    return {
      mirror: frames.filter(f => f.operation?.type === 'mirror'),
      zoom: frames.filter(f => f.operation?.type === 'zoom'),
      crop: frames.filter(f => f.operation?.type === 'crop'),
      rotate: frames.filter(f => f.operation?.type === 'rotate'),
      stutter: frames.filter(f => f.operation?.type === 'stutter')
    };
  }
}

// =============================================================================
// SERIALIZATION (for caching)
// =============================================================================

const ENERGY_MAP: Record<EnergyLevel, 0 | 1 | 2> = { low: 0, mid: 1, high: 2 };
const ENERGY_REVERSE: Record<number, EnergyLevel> = { 0: 'low', 1: 'mid', 2: 'high' };

const DIR_MAP: Record<MoveDirection, 0 | 1 | 2> = { left: 0, center: 1, right: 2 };
const DIR_REVERSE: Record<number, MoveDirection> = { 0: 'left', 1: 'center', 2: 'right' };

const TYPE_MAP: Record<FrameType, 0 | 1> = { body: 0, closeup: 1 };
const TYPE_REVERSE: Record<number, FrameType> = { 0: 'body', 1: 'closeup' };

const PHASE_MAP: Record<RhythmPhase, number> = {
  AMBIENT: 0, WARMUP: 1, SWING_LEFT: 2, SWING_RIGHT: 3,
  DROP: 4, CHAOS: 5, GROOVE: 6, VOGUE: 7, FLOW: 8
};
const PHASE_REVERSE: Record<number, RhythmPhase> = {
  0: 'AMBIENT', 1: 'WARMUP', 2: 'SWING_LEFT', 3: 'SWING_RIGHT',
  4: 'DROP', 5: 'CHAOS', 6: 'GROOVE', 7: 'VOGUE', 8: 'FLOW'
};

export function serializeManifest(manifest: FrameManifest): string {
  const urlMap = new Map<string, number>();
  const urls: string[] = [];

  // Deduplicate URLs
  for (const frame of manifest.allFrames) {
    if (!urlMap.has(frame.url)) {
      urlMap.set(frame.url, urls.length);
      urls.push(frame.url);
    }
  }

  // Build frame ID to index map
  const idToIndex = new Map<string, number>();
  manifest.allFrames.forEach((f, i) => idToIndex.set(f.id, i));

  const frames: CompactFrame[] = manifest.allFrames.map(f => ({
    u: urlMap.get(f.url)!,
    e: ENERGY_MAP[f.energy],
    d: DIR_MAP[f.direction],
    t: TYPE_MAP[f.type],
    s: f.sourceId ? idToIndex.get(f.sourceId) : undefined,
    o: f.operation ? ['mirror', 'zoom', 'crop', 'rotate', 'stutter'].indexOf(f.operation.type) : undefined,
    w: Math.round(f.weight * 100),
    p: f.preferredTransitions.map(id => idToIndex.get(id) || 0).slice(0, 10),
    ph: f.bestForPhases.map(p => PHASE_MAP[p])
  }));

  const compact: CompactManifest = {
    urls,
    frames,
    meta: {
      subject: manifest.subjectCategory,
      sourceCount: manifest.sourceFrameCount
    }
  };

  return JSON.stringify(compact);
}

export function deserializeManifest(json: string): FrameManifest {
  const compact: CompactManifest = JSON.parse(json);

  const allFrames: ManifestFrame[] = compact.frames.map((cf, i) => ({
    id: `frame_${i}`,
    url: compact.urls[cf.u],
    isSource: i < compact.meta.sourceCount,
    sourceId: cf.s !== undefined ? `frame_${cf.s}` : undefined,
    operation: cf.o !== undefined ? { type: ['mirror', 'zoom', 'crop', 'rotate', 'stutter'][cf.o] as MechanicalOperationType } : undefined,
    energy: ENERGY_REVERSE[cf.e],
    direction: DIR_REVERSE[cf.d],
    type: TYPE_REVERSE[cf.t],
    weight: cf.w / 100,
    preferredTransitions: cf.p.map(idx => `frame_${idx}`),
    bestForPhases: cf.ph.map(p => PHASE_REVERSE[p])
  }));

  const builder = new FrameManifestBuilder();

  return {
    sourceFrames: [], // Not restored in compact format
    derivedFrames: [],
    allFrames,
    byEnergy: {
      low: allFrames.filter(f => f.energy === 'low'),
      mid: allFrames.filter(f => f.energy === 'mid'),
      high: allFrames.filter(f => f.energy === 'high')
    },
    byDirection: {
      left: allFrames.filter(f => f.direction === 'left'),
      center: allFrames.filter(f => f.direction === 'center'),
      right: allFrames.filter(f => f.direction === 'right')
    },
    byType: {
      body: allFrames.filter(f => f.type === 'body'),
      closeup: allFrames.filter(f => f.type === 'closeup')
    },
    byMechanical: {
      mirror: allFrames.filter(f => f.operation?.type === 'mirror'),
      zoom: allFrames.filter(f => f.operation?.type === 'zoom'),
      crop: allFrames.filter(f => f.operation?.type === 'crop'),
      rotate: allFrames.filter(f => f.operation?.type === 'rotate'),
      stutter: allFrames.filter(f => f.operation?.type === 'stutter')
    },
    totalFrameCount: allFrames.length,
    sourceFrameCount: compact.meta.sourceCount,
    derivedFrameCount: allFrames.length - compact.meta.sourceCount,
    subjectCategory: compact.meta.subject
  };
}
