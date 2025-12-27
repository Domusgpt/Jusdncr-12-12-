/**
 * UNIFIED FRAME PROCESSOR
 *
 * Takes base generated frames and:
 * 1. Enriches metadata (type, direction, energy)
 * 2. Creates virtual variants (zoom crops, mirrors)
 * 3. Organizes into pools for all engine systems
 * 4. Ensures compatibility with LABAN, KINETIC, and PATTERN modes
 */

import { GeneratedFrame, EnergyLevel, MoveDirection, SubjectCategory } from '../types';

// Extended frame type for all systems
export type ExtendedFrameType = 'body' | 'closeup' | 'hands' | 'feet' | 'mandala' | 'acrobatic';

// ProcessedFrame uses Omit to override the type field properly
export interface ProcessedFrame extends Omit<GeneratedFrame, 'type' | 'direction'> {
  // Required fields (overridden from optional)
  type: ExtendedFrameType;
  direction: MoveDirection;

  // Virtual frame properties
  isVirtual?: boolean;
  virtualZoom?: number;
  virtualOffsetY?: number;
  sourceFrameId?: string; // Reference to original frame

  // Pool assignments (for quick lookup)
  pools: string[];

  // Deck tracking
  deckId?: number;
}

export interface FramePools {
  all: ProcessedFrame[];

  // By energy
  low: ProcessedFrame[];
  mid: ProcessedFrame[];
  high: ProcessedFrame[];

  // By type
  body: ProcessedFrame[];
  closeups: ProcessedFrame[];
  hands: ProcessedFrame[];
  feet: ProcessedFrame[];
  mandalas: ProcessedFrame[];
  acrobatics: ProcessedFrame[];
  virtuals: ProcessedFrame[];

  // By direction
  left: ProcessedFrame[];
  right: ProcessedFrame[];
  center: ProcessedFrame[];
}

export interface FrameProcessorConfig {
  createVirtuals: boolean;       // Create zoom variants
  createMirrors: boolean;        // Create L/R mirrors
  inferTypes: boolean;           // Infer hands/feet from pose names
  deckId?: number;               // Assign deck ID
}

const DEFAULT_CONFIG: FrameProcessorConfig = {
  createVirtuals: true,
  createMirrors: true,
  inferTypes: true,
  deckId: 0
};

/**
 * Infer frame type from pose name or other metadata
 */
function inferFrameType(frame: GeneratedFrame): ExtendedFrameType {
  const pose = frame.pose.toLowerCase();

  // Check for explicit type
  if (frame.type === 'closeup') return 'closeup';

  // Infer from pose name
  if (pose.includes('hand') || pose.includes('gesture') || pose.includes('point')) return 'hands';
  if (pose.includes('foot') || pose.includes('feet') || pose.includes('kick') || pose.includes('step')) return 'feet';
  if (pose.includes('mandala') || pose.includes('kaleid') || pose.includes('mirror')) return 'mandala';
  if (pose.includes('jump') || pose.includes('flip') || pose.includes('acro') || pose.includes('spin')) return 'acrobatic';
  if (pose.includes('face') || pose.includes('head') || pose.includes('close')) return 'closeup';

  // Default to body
  return 'body';
}

/**
 * Infer direction from pose name
 */
function inferDirection(frame: GeneratedFrame): MoveDirection {
  if (frame.direction) return frame.direction;

  const pose = frame.pose.toLowerCase();
  if (pose.includes('left') || pose.includes('_l_') || pose.endsWith('_l')) return 'left';
  if (pose.includes('right') || pose.includes('_r_') || pose.endsWith('_r')) return 'right';

  return 'center';
}

/**
 * Create virtual zoom variant of a frame
 */
function createVirtualZoom(
  frame: ProcessedFrame,
  suffix: string,
  zoom: number,
  offsetY: number
): ProcessedFrame {
  return {
    ...frame,
    pose: `${frame.pose}_${suffix}`,
    isVirtual: true,
    virtualZoom: zoom,
    virtualOffsetY: offsetY,
    sourceFrameId: frame.pose,
    pools: [...frame.pools, 'virtuals']
  };
}

/**
 * Create mirrored variant of a frame
 */
function createMirror(frame: ProcessedFrame): ProcessedFrame | null {
  // Only mirror directional frames
  if (frame.direction === 'center') return null;

  const mirrorDir: MoveDirection = frame.direction === 'left' ? 'right' : 'left';

  return {
    ...frame,
    pose: `${frame.pose}_mirror`,
    direction: mirrorDir,
    pools: frame.pools.map(p => p === frame.direction ? mirrorDir : p)
  };
}

/**
 * Process a single frame - enrich metadata
 */
function processFrame(
  frame: GeneratedFrame,
  config: FrameProcessorConfig
): ProcessedFrame {
  const type = config.inferTypes ? inferFrameType(frame) : (frame.type as ExtendedFrameType || 'body');
  const direction = inferDirection(frame);

  // Determine which pools this frame belongs to
  const pools: string[] = [
    frame.energy,           // low, mid, high
    type,                   // body, closeup, hands, etc.
    direction               // left, right, center
  ];

  return {
    ...frame,
    type,
    direction,
    pools,
    deckId: config.deckId
  };
}

/**
 * Main frame processor - takes raw frames, returns organized pools
 */
export function processFrames(
  frames: GeneratedFrame[],
  _category: SubjectCategory,
  config: Partial<FrameProcessorConfig> = {}
): FramePools {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Initialize pools
  const pools: FramePools = {
    all: [],
    low: [], mid: [], high: [],
    body: [], closeups: [], hands: [], feet: [], mandalas: [], acrobatics: [], virtuals: [],
    left: [], right: [], center: []
  };

  // Process each frame
  for (const frame of frames) {
    const processed = processFrame(frame, cfg);

    // Add to main list
    pools.all.push(processed);

    // Add to energy pools
    pools[processed.energy].push(processed);

    // Add to type pools
    if (processed.type === 'closeup') pools.closeups.push(processed);
    else if (processed.type === 'hands') pools.hands.push(processed);
    else if (processed.type === 'feet') pools.feet.push(processed);
    else if (processed.type === 'mandala') pools.mandalas.push(processed);
    else if (processed.type === 'acrobatic') pools.acrobatics.push(processed);
    else pools.body.push(processed);

    // Add to direction pools
    pools[processed.direction].push(processed);

    // Create virtual variants
    if (cfg.createVirtuals) {
      // High energy body frames get dramatic zoom
      if (processed.energy === 'high' && processed.type === 'body') {
        const vzoom = createVirtualZoom(processed, 'vzoom', 1.6, 0.2);
        pools.all.push(vzoom);
        pools.virtuals.push(vzoom);
        pools.closeups.push(vzoom); // Virtual zooms act as closeups
      }

      // Mid energy body frames get subtle zoom
      if (processed.energy === 'mid' && processed.type === 'body') {
        const vmid = createVirtualZoom(processed, 'vmid', 1.25, 0.1);
        pools.all.push(vmid);
        pools.virtuals.push(vmid);
        pools.mid.push(vmid);
      }
    }

    // Create mirrors
    if (cfg.createMirrors) {
      const mirror = createMirror(processed);
      if (mirror) {
        pools.all.push(mirror);
        pools[mirror.energy].push(mirror);
        pools[mirror.direction].push(mirror);
        if (mirror.type === 'body') pools.body.push(mirror);
      }
    }
  }

  // Ensure fallbacks - if pools are empty, populate with alternatives
  if (pools.hands.length === 0) pools.hands = pools.closeups.slice(0, 2);
  if (pools.feet.length === 0) pools.feet = pools.low.slice(0, 2);
  if (pools.mandalas.length === 0) pools.mandalas = pools.high.slice(0, 2);
  if (pools.acrobatics.length === 0) pools.acrobatics = pools.high.filter(f => f.energy === 'high');
  if (pools.closeups.length === 0) pools.closeups = pools.virtuals;

  console.log(`[FrameProcessor] Processed ${frames.length} frames into ${pools.all.length} total (with virtuals/mirrors)`);
  console.log(`[FrameProcessor] Pools: body=${pools.body.length}, closeups=${pools.closeups.length}, hands=${pools.hands.length}, feet=${pools.feet.length}`);

  return pools;
}

/**
 * Quick utility to get a frame pool by sequence mode
 */
export function getPoolForSequenceMode(
  pools: FramePools,
  mode: 'GROOVE' | 'EMOTE' | 'IMPACT' | 'FOOTWORK',
  direction?: MoveDirection
): ProcessedFrame[] {
  switch (mode) {
    case 'GROOVE':
      if (direction === 'left') return pools.left.filter(f => f.energy === 'mid');
      if (direction === 'right') return pools.right.filter(f => f.energy === 'mid');
      return pools.mid;

    case 'EMOTE':
      return pools.closeups.length > 0 ? pools.closeups : pools.virtuals;

    case 'IMPACT':
      return pools.mandalas.length > 0 ? pools.mandalas :
             pools.hands.length > 0 ? pools.hands : pools.high;

    case 'FOOTWORK':
      return pools.feet.length > 0 ? pools.feet : pools.low;

    default:
      return pools.mid;
  }
}

/**
 * Get physics modifiers based on choreography style
 */
export interface PhysicsModifiers {
  rotationScale: number;
  squashAmount: number;
  bounceIntensity: number;
  transitionSmoothing: number;
}

export function getPhysicsForStyle(
  style: 'LEGACY' | 'LABAN',
  energy: number,
  labanEffort?: { weight: number; space: number; time: number; flow: number }
): PhysicsModifiers {
  if (style === 'LEGACY') {
    // Simple spring physics
    return {
      rotationScale: 1.0,
      squashAmount: 0.15 * energy,
      bounceIntensity: 50 * energy,
      transitionSmoothing: 0.1
    };
  }

  // LABAN effort-based physics
  const effort = labanEffort || { weight: 0.5, space: 0.5, time: 0.5, flow: 0.5 };

  return {
    rotationScale: 0.5 + effort.space * 1.5, // Direct space = more rotation
    squashAmount: effort.weight * 0.3,       // Heavy weight = more squash
    bounceIntensity: effort.time * 80,       // Quick time = more bounce
    transitionSmoothing: 1.0 - effort.flow   // Bound flow = sharper transitions
  };
}

/**
 * Determine transition mode based on engine settings
 */
export type TransitionMode = 'CUT' | 'MORPH' | 'SLIDE' | 'ZOOM_IN' | 'SMOOTH';

export function getTransitionMode(
  engineMode: 'PATTERN' | 'KINETIC',
  pattern: string,
  phase: string,
  energy: number
): TransitionMode {
  if (engineMode === 'KINETIC') {
    // DAG-driven: energy determines transition
    if (energy > 0.7) return 'CUT';
    if (energy < 0.3) return 'SMOOTH';
    return 'MORPH';
  }

  // Pattern-driven
  switch (pattern) {
    case 'STUTTER':
    case 'IMPACT':
      return 'CUT';
    case 'FLOW':
    case 'GROOVE':
      return 'SMOOTH';
    case 'VOGUE':
    case 'EMOTE':
      return 'ZOOM_IN';
    default:
      // Phase-based fallback
      if (phase.includes('SWING')) return 'SLIDE';
      if (phase === 'DROP') return 'CUT';
      return 'MORPH';
  }
}
