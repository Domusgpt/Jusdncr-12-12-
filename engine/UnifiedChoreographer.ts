/**
 * UNIFIED CHOREOGRAPHER
 *
 * Brings together all dance systems into a coherent hierarchy:
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ LAYER 1: PHYSICS STYLE (affects HOW frames move)               │
 * │   LEGACY = Simple spring physics, direct audio mapping         │
 * │   LABAN  = Effort-based physics (Weight, Space, Time, Flow)    │
 * └─────────────────────────────────────────────────────────────────┘
 *                              ↓
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ LAYER 2: ENGINE MODE (affects WHICH frame is selected)         │
 * │   KINETIC = DAG state machine, auto-transitions based on energy│
 * │   PATTERN = User-selected pattern (PING_PONG, STUTTER, etc.)   │
 * └─────────────────────────────────────────────────────────────────┘
 *                              ↓
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ LAYER 3: SEQUENCE MODE (affects which POOL to draw from)       │
 * │   GROOVE   = mid-energy, directional (L/R alternating)         │
 * │   EMOTE    = closeups/virtuals (triggered by high freq)        │
 * │   IMPACT   = mandalas/hands/high-energy (bass drops)           │
 * │   FOOTWORK = feet/low-energy (beat 12-15)                      │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { ProcessedFrame, FramePools, getPoolForSequenceMode, getPhysicsForStyle, getTransitionMode, TransitionMode, PhysicsModifiers } from '../services/frameProcessor';
import { LabanEffort, audioToEffortFactors, factorsToEffort } from './LabanEffortSystem';

// =============================================================================
// TYPES
// =============================================================================

export type PhysicsStyle = 'LEGACY' | 'LABAN';
export type EngineMode = 'KINETIC' | 'PATTERN';
export type SequenceMode = 'GROOVE' | 'EMOTE' | 'IMPACT' | 'FOOTWORK';
export type PatternType =
  | 'PING_PONG' | 'BUILD_DROP' | 'STUTTER' | 'VOGUE' | 'FLOW'
  | 'CHAOS' | 'MINIMAL' | 'ABAB' | 'AABB' | 'ABAC'
  | 'SNARE_ROLL' | 'GROOVE' | 'EMOTE' | 'FOOTWORK' | 'IMPACT';

export interface AudioData {
  bass: number;      // 0-1
  mid: number;       // 0-1
  high: number;      // 0-1
  energy: number;    // 0-1 (combined)
}

export interface ChoreographerConfig {
  physicsStyle: PhysicsStyle;
  engineMode: EngineMode;
  sequenceMode: SequenceMode;
  pattern: PatternType;

  // Intensity modifiers
  energyMultiplier: number;  // 0-2 (scales energy response)
  stutterChance: number;     // 0-1 (probability of stutter)

  // Auto-mode flags
  autoSequenceMode: boolean; // Auto-switch sequence mode based on audio
}

export interface ChoreographerState {
  // Current frame
  currentFrame: ProcessedFrame | null;
  previousFrame: ProcessedFrame | null;

  // Transition
  transitionMode: TransitionMode;
  transitionProgress: number; // 0-1
  transitionSpeed: number;    // frames/sec

  // Physics output
  physics: PhysicsModifiers & {
    rotX: number;
    rotY: number;
    rotZ: number;
    squash: number;
    bounce: number;
    skew: number;
  };

  // Timing
  beatCount: number;
  barCount: number;
  phraseCount: number;
  bpm: number;

  // Active sequence mode (may differ from config if auto)
  activeSequenceMode: SequenceMode;

  // LABAN state (if using LABAN physics)
  labanEffort?: LabanEffort;
}

export interface ChoreographerOutput {
  frameId: string | null;
  transition: {
    mode: TransitionMode;
    speed: number;
    progress: number;
  };
  physics: ChoreographerState['physics'];
  sequenceMode: SequenceMode;
  isBeat: boolean;
  isPhrase: boolean;
}

// =============================================================================
// KINETIC DAG - Simplified state machine
// =============================================================================

interface KineticNode {
  id: string;
  energyThreshold: number;
  transitions: string[];
  sequenceMode: SequenceMode;
}

const KINETIC_GRAPH: Record<string, KineticNode> = {
  idle: {
    id: 'idle',
    energyThreshold: 0,
    transitions: ['groove_center', 'emote'],
    sequenceMode: 'EMOTE'
  },
  groove_center: {
    id: 'groove_center',
    energyThreshold: 0.2,
    transitions: ['groove_left', 'groove_right', 'impact', 'idle'],
    sequenceMode: 'GROOVE'
  },
  groove_left: {
    id: 'groove_left',
    energyThreshold: 0.3,
    transitions: ['groove_right', 'groove_center', 'footwork'],
    sequenceMode: 'GROOVE'
  },
  groove_right: {
    id: 'groove_right',
    energyThreshold: 0.3,
    transitions: ['groove_left', 'groove_center', 'footwork'],
    sequenceMode: 'GROOVE'
  },
  impact: {
    id: 'impact',
    energyThreshold: 0.7,
    transitions: ['groove_center', 'emote'],
    sequenceMode: 'IMPACT'
  },
  emote: {
    id: 'emote',
    energyThreshold: 0.1,
    transitions: ['groove_center', 'idle'],
    sequenceMode: 'EMOTE'
  },
  footwork: {
    id: 'footwork',
    energyThreshold: 0.4,
    transitions: ['groove_left', 'groove_right', 'impact'],
    sequenceMode: 'FOOTWORK'
  }
};

// =============================================================================
// PATTERN SEQUENCERS
// =============================================================================

interface PatternState {
  index: number;
  history: string[]; // Last N frame IDs
  direction: 'left' | 'right';
}

function getNextFrameByPattern(
  pattern: PatternType,
  pools: FramePools,
  state: PatternState,
  beat: number
): { frame: ProcessedFrame | null; newState: PatternState } {
  let pool: ProcessedFrame[] = [];
  const newState = { ...state };

  switch (pattern) {
    case 'PING_PONG':
      // Alternate left/right
      pool = state.direction === 'left' ? pools.left : pools.right;
      if (pool.length === 0) pool = pools.mid;
      newState.direction = state.direction === 'left' ? 'right' : 'left';
      break;

    case 'ABAB':
      // Alternate between two specific frames
      pool = beat % 2 === 0 ? pools.low : pools.mid;
      break;

    case 'AABB':
      // Two of each
      pool = beat % 4 < 2 ? pools.low : pools.mid;
      break;

    case 'ABAC':
      // A-B-A-C pattern
      const abacPos = beat % 4;
      if (abacPos === 0 || abacPos === 2) pool = pools.low;
      else if (abacPos === 1) pool = pools.mid;
      else pool = pools.high;
      break;

    case 'BUILD_DROP':
      // Build with low/mid, drop with high
      pool = beat % 16 < 12 ? [...pools.low, ...pools.mid] : pools.high;
      break;

    case 'STUTTER':
      // High chance of repeating previous frame
      if (Math.random() < 0.6 && state.history.length > 0) {
        const lastId = state.history[state.history.length - 1];
        const lastFrame = pools.all.find(f => f.pose === lastId);
        if (lastFrame) return { frame: lastFrame, newState };
      }
      pool = pools.mid;
      break;

    case 'VOGUE':
      // Pose-heavy, use closeups and dramatic poses
      pool = pools.closeups.length > 0 ? pools.closeups : pools.high;
      break;

    case 'FLOW':
      // Smooth, use mid-energy
      pool = pools.mid;
      break;

    case 'CHAOS':
      // Random from all
      pool = pools.all;
      break;

    case 'MINIMAL':
      // Low energy only
      pool = pools.low;
      break;

    case 'SNARE_ROLL':
      // Rapid switching on high beats
      pool = beat % 16 >= 12 ? pools.high : pools.mid;
      break;

    case 'GROOVE':
      pool = pools.mid;
      break;

    case 'EMOTE':
      pool = pools.closeups;
      break;

    case 'FOOTWORK':
      pool = pools.feet.length > 0 ? pools.feet : pools.low;
      break;

    case 'IMPACT':
      pool = pools.high;
      break;
  }

  if (pool.length === 0) pool = pools.all;
  if (pool.length === 0) return { frame: null, newState };

  // Pick random from pool (could be weighted)
  const frame = pool[Math.floor(Math.random() * pool.length)];

  // Update history
  newState.history = [...state.history.slice(-4), frame.pose];
  newState.index++;

  return { frame, newState };
}

// =============================================================================
// UNIFIED CHOREOGRAPHER CLASS
// =============================================================================

export class UnifiedChoreographer {
  private pools: FramePools | null = null;
  private config: ChoreographerConfig;
  private state: ChoreographerState;
  private patternState: PatternState;
  private kineticNode: string = 'idle';
  private lastBeatTime: number = 0;
  private beatIntervals: number[] = [];

  constructor(config: Partial<ChoreographerConfig> = {}) {
    this.config = {
      physicsStyle: 'LEGACY',
      engineMode: 'PATTERN',
      sequenceMode: 'GROOVE',
      pattern: 'PING_PONG',
      energyMultiplier: 1.0,
      stutterChance: 0.3,
      autoSequenceMode: false,
      ...config
    };

    this.state = {
      currentFrame: null,
      previousFrame: null,
      transitionMode: 'CUT',
      transitionProgress: 1,
      transitionSpeed: 10,
      physics: {
        rotationScale: 1,
        squashAmount: 0,
        bounceIntensity: 0,
        transitionSmoothing: 0.1,
        rotX: 0,
        rotY: 0,
        rotZ: 0,
        squash: 1,
        bounce: 0,
        skew: 0
      },
      beatCount: 0,
      barCount: 0,
      phraseCount: 0,
      bpm: 120,
      activeSequenceMode: this.config.sequenceMode
    };

    this.patternState = {
      index: 0,
      history: [],
      direction: 'left'
    };
  }

  // ---------------------------------------------------------------------------
  // CONFIGURATION
  // ---------------------------------------------------------------------------

  setFramePools(pools: FramePools): void {
    this.pools = pools;
    console.log('[Choreographer] Frame pools loaded:', {
      total: pools.all.length,
      closeups: pools.closeups.length,
      hands: pools.hands.length,
      feet: pools.feet.length
    });
  }

  setPhysicsStyle(style: PhysicsStyle): void {
    this.config.physicsStyle = style;
  }

  setEngineMode(mode: EngineMode): void {
    this.config.engineMode = mode;
  }

  setSequenceMode(mode: SequenceMode): void {
    this.config.sequenceMode = mode;
    if (!this.config.autoSequenceMode) {
      this.state.activeSequenceMode = mode;
    }
  }

  setPattern(pattern: PatternType): void {
    this.config.pattern = pattern;
  }

  setAutoSequenceMode(auto: boolean): void {
    this.config.autoSequenceMode = auto;
  }

  getConfig(): ChoreographerConfig {
    return { ...this.config };
  }

  getState(): ChoreographerState {
    return { ...this.state };
  }

  // ---------------------------------------------------------------------------
  // MAIN UPDATE
  // ---------------------------------------------------------------------------

  update(audio: AudioData, deltaTime: number): ChoreographerOutput {
    if (!this.pools) {
      return this.emptyOutput();
    }

    const now = Date.now();
    const scaledEnergy = audio.energy * this.config.energyMultiplier;

    // Detect beats and update BPM
    const isBeat = this.detectBeat(audio.bass, now);

    // Update transition progress
    if (this.state.transitionProgress < 1) {
      this.state.transitionProgress += this.state.transitionSpeed * deltaTime;
      if (this.state.transitionProgress > 1) this.state.transitionProgress = 1;
    }

    // Auto sequence mode (if enabled)
    if (this.config.autoSequenceMode || this.config.engineMode === 'KINETIC') {
      this.updateSequenceMode(audio);
    }

    // Select frame (on beat)
    let frameChanged = false;
    if (isBeat) {
      this.state.beatCount++;
      if (this.state.beatCount % 16 === 0) this.state.barCount++;
      if (this.state.beatCount % 128 === 0) this.state.phraseCount++;

      const newFrame = this.selectFrame(audio);
      if (newFrame && newFrame.pose !== this.state.currentFrame?.pose) {
        this.state.previousFrame = this.state.currentFrame;
        this.state.currentFrame = newFrame;
        this.state.transitionProgress = 0;
        this.state.transitionMode = getTransitionMode(
          this.config.engineMode,
          this.config.pattern,
          this.getPhase(),
          scaledEnergy
        );
        frameChanged = true;
      }
    }

    // Stutter check
    if (this.config.stutterChance > 0 && Math.random() < this.config.stutterChance * 0.1) {
      if (audio.mid > 0.6 || audio.high > 0.6) {
        // Swap frames (stutter effect)
        const temp = this.state.currentFrame;
        this.state.currentFrame = this.state.previousFrame;
        this.state.previousFrame = temp;
        this.state.transitionProgress = 0;
        this.state.transitionMode = 'CUT';
      }
    }

    // Calculate physics
    this.updatePhysics(audio, deltaTime);

    return {
      frameId: this.state.currentFrame?.pose || null,
      transition: {
        mode: this.state.transitionMode,
        speed: this.state.transitionSpeed,
        progress: this.state.transitionProgress
      },
      physics: this.state.physics,
      sequenceMode: this.state.activeSequenceMode,
      isBeat,
      isPhrase: this.state.beatCount % 128 === 0
    };
  }

  // ---------------------------------------------------------------------------
  // BEAT DETECTION
  // ---------------------------------------------------------------------------

  private detectBeat(bass: number, now: number): boolean {
    if (bass > 0.5 && (now - this.lastBeatTime) > 200) {
      const interval = now - this.lastBeatTime;
      this.lastBeatTime = now;

      if (interval > 200 && interval < 2000) {
        this.beatIntervals.push(interval);
        if (this.beatIntervals.length > 8) this.beatIntervals.shift();

        if (this.beatIntervals.length >= 4) {
          const avg = this.beatIntervals.reduce((a, b) => a + b, 0) / this.beatIntervals.length;
          this.state.bpm = Math.max(60, Math.min(200, Math.round(60000 / avg)));
        }
      }

      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // SEQUENCE MODE UPDATE
  // ---------------------------------------------------------------------------

  private updateSequenceMode(audio: AudioData): void {
    if (this.config.engineMode === 'KINETIC') {
      // DAG-driven sequence mode
      const currentNode = KINETIC_GRAPH[this.kineticNode];
      const energy = audio.energy;

      // Check for transitions
      for (const nextId of currentNode.transitions) {
        const nextNode = KINETIC_GRAPH[nextId];
        if (nextNode && energy >= nextNode.energyThreshold) {
          // Probabilistic transition
          if (Math.random() < 0.3) {
            this.kineticNode = nextId;
            this.state.activeSequenceMode = nextNode.sequenceMode;
            break;
          }
        }
      }
    } else {
      // Auto-detect based on audio
      if (audio.bass > 0.8) {
        this.state.activeSequenceMode = 'IMPACT';
      } else if (audio.high > 0.7) {
        this.state.activeSequenceMode = 'EMOTE';
      } else if (this.state.beatCount % 16 >= 12) {
        this.state.activeSequenceMode = 'FOOTWORK';
      } else {
        this.state.activeSequenceMode = 'GROOVE';
      }
    }
  }

  // ---------------------------------------------------------------------------
  // FRAME SELECTION
  // ---------------------------------------------------------------------------

  private selectFrame(audio: AudioData): ProcessedFrame | null {
    if (!this.pools) return null;

    if (this.config.engineMode === 'PATTERN') {
      // Pattern-driven selection
      const result = getNextFrameByPattern(
        this.config.pattern,
        this.pools,
        this.patternState,
        this.state.beatCount
      );
      this.patternState = result.newState;
      return result.frame;
    } else {
      // Kinetic/sequence-mode-driven selection
      const direction = this.state.beatCount % 8 < 4 ? 'left' : 'right';
      const pool = getPoolForSequenceMode(
        this.pools,
        this.state.activeSequenceMode,
        direction
      );

      if (pool.length === 0) return null;
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }

  // ---------------------------------------------------------------------------
  // PHYSICS
  // ---------------------------------------------------------------------------

  private updatePhysics(audio: AudioData, dt: number): void {
    const energy = audio.energy * this.config.energyMultiplier;

    // Get base physics from style
    let labanEffort: LabanEffort | undefined;
    if (this.config.physicsStyle === 'LABAN') {
      const factors = audioToEffortFactors(audio.bass, audio.mid, audio.high, energy);
      labanEffort = factorsToEffort(factors);
      this.state.labanEffort = labanEffort;
    }

    const modifiers = getPhysicsForStyle(
      this.config.physicsStyle,
      energy,
      labanEffort ? {
        weight: labanEffort.weight === 'light' ? 0.2 : labanEffort.weight === 'strong' ? 0.8 : 0.5,
        space: labanEffort.space === 'indirect' ? 0.2 : labanEffort.space === 'direct' ? 0.8 : 0.5,
        time: labanEffort.time === 'sustained' ? 0.2 : labanEffort.time === 'sudden' ? 0.8 : 0.5,
        flow: labanEffort.flow === 'free' ? 0.2 : labanEffort.flow === 'bound' ? 0.8 : 0.5
      } : undefined
    );

    // Apply spring physics
    const stiffness = 140;
    const damping = 8;

    const targetRotX = audio.bass * 35 * modifiers.rotationScale;
    const targetRotY = audio.mid * 25 * Math.sin(Date.now() * 0.005) * modifiers.rotationScale;
    const targetRotZ = audio.high * 15 * modifiers.rotationScale;

    // Spring solver
    const smooth = modifiers.transitionSmoothing;
    this.state.physics.rotX += (targetRotX - this.state.physics.rotX) * (1 - Math.exp(-stiffness * dt * smooth));
    this.state.physics.rotY += (targetRotY - this.state.physics.rotY) * (1 - Math.exp(-stiffness * 0.5 * dt * smooth));
    this.state.physics.rotZ += (targetRotZ - this.state.physics.rotZ) * (1 - Math.exp(-stiffness * dt * smooth));

    // Squash and bounce
    this.state.physics.squash = 1 - modifiers.squashAmount;
    this.state.physics.bounce = -modifiers.bounceIntensity * audio.bass;

    // Decay bounce
    this.state.physics.bounce += (0 - this.state.physics.bounce) * (10 * dt);

    // Copy modifiers
    this.state.physics.rotationScale = modifiers.rotationScale;
    this.state.physics.squashAmount = modifiers.squashAmount;
    this.state.physics.bounceIntensity = modifiers.bounceIntensity;
    this.state.physics.transitionSmoothing = modifiers.transitionSmoothing;
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  private getPhase(): string {
    const beat = this.state.beatCount % 16;
    if (beat < 4) return 'WARMUP';
    if (beat < 8) return 'SWING_LEFT';
    if (beat < 12) return 'SWING_RIGHT';
    return 'DROP';
  }

  private emptyOutput(): ChoreographerOutput {
    return {
      frameId: null,
      transition: { mode: 'CUT', speed: 10, progress: 1 },
      physics: this.state.physics,
      sequenceMode: this.state.activeSequenceMode,
      isBeat: false,
      isPhrase: false
    };
  }

  // ---------------------------------------------------------------------------
  // RESET
  // ---------------------------------------------------------------------------

  reset(): void {
    this.state.beatCount = 0;
    this.state.barCount = 0;
    this.state.phraseCount = 0;
    this.state.currentFrame = null;
    this.state.previousFrame = null;
    this.state.transitionProgress = 1;
    this.patternState = { index: 0, history: [], direction: 'left' };
    this.kineticNode = 'idle';
    this.lastBeatTime = 0;
    this.beatIntervals = [];
  }
}

// =============================================================================
// FACTORY
// =============================================================================

export function createUnifiedChoreographer(
  config?: Partial<ChoreographerConfig>
): UnifiedChoreographer {
  return new UnifiedChoreographer(config);
}
