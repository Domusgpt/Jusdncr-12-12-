/**
 * GolemMixer - 4-Channel Deck Mixer with Kinetic Engine
 *
 * Combines:
 * - 4-channel deck system with sequencer/layer modes
 * - KineticEngine DAG state machine with BPM detection
 * - Pattern-based choreography (15 patterns)
 * - Sequence modes (GROOVE/EMOTE/IMPACT/FOOTWORK)
 * - Trigger pads and FX controls
 */

import type { GeneratedFrame, SubjectCategory, SavedProject } from '../types';

// =============================================================================
// TYPES
// =============================================================================

export type EnergyLevel = 'low' | 'mid' | 'high';
export type MoveDirection = 'left' | 'right' | 'center';
export type FrameType = 'body' | 'closeup' | 'hands' | 'feet' | 'mandala' | 'acrobatic';

/** Deck mix modes */
export type MixMode = 'sequencer' | 'layer' | 'off';

/** Sequence modes (Golem-style) */
export type SequenceMode = 'GROOVE' | 'EMOTE' | 'IMPACT' | 'FOOTWORK';

/** Pattern types (our 15 patterns) */
export type PatternType =
  | 'PING_PONG' | 'BUILD_DROP' | 'STUTTER' | 'VOGUE' | 'FLOW' | 'CHAOS' | 'MINIMAL'
  | 'ABAB' | 'AABB' | 'ABAC' | 'SNARE_ROLL' | 'GROOVE' | 'EMOTE' | 'FOOTWORK' | 'IMPACT';

/** Engine modes */
export type EngineMode = 'PATTERN' | 'KINETIC';

/** Transition types */
export type TransitionMode = 'CUT' | 'SLIDE' | 'MORPH' | 'SMOOTH' | 'ZOOM_IN';

/** Audio analysis data */
export interface AudioData {
  bass: number;
  mid: number;
  high: number;
  energy: number;
  timestamp: number;
}

/** Extended frame with deck tracking */
export interface DeckFrame extends GeneratedFrame {
  deckId: number;
  bodyPart?: 'full' | 'upper' | 'lower' | 'hands' | 'face';
}

/** Deck slot configuration */
export interface GolemDeck {
  id: number;
  name: string;
  rig: SavedProject | null;
  isActive: boolean;
  mixMode: MixMode;
  opacity: number;
  volume: number;

  // Frame pools (categorized)
  allFrames: DeckFrame[];
  framesByEnergy: Record<EnergyLevel, DeckFrame[]>;
  closeups: DeckFrame[];
  hands: DeckFrame[];
  feet: DeckFrame[];
  mandalas: DeckFrame[];
  virtuals: DeckFrame[];
  acrobatics: DeckFrame[];
  leftFrames: DeckFrame[];
  rightFrames: DeckFrame[];
}

/** Kinetic state for DAG engine */
export interface KineticState {
  currentNode: string;
  previousNode: string;
  beatPos: number;        // 0.0-1.0 within current beat
  barCounter: number;     // 0-15
  phraseCounter: number;  // 0-7
  bpm: number;
  isLocked: boolean;
  lockReleaseTime: number;
  sequenceMode: SequenceMode;
}

/** Physics state */
export interface PhysicsState {
  rotation: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  squash: number;
  bounce: number;
  tilt: number;
  zoom: number;
  pan: { x: number; y: number };
}

/** Effects state */
export interface EffectsState {
  rgbSplit: number;
  flash: number;
  glitch: number;
  scanlines: number;
  hueShift: number;
  aberration: number;
  invert: boolean;
  grayscale: boolean;
  mirror: boolean;
  strobe: boolean;
}

/** Mixer output */
export interface MixerOutput {
  frame: DeckFrame | null;
  deckId: number;
  transitionMode: TransitionMode;
  transitionSpeed: number;
  physics: PhysicsState;
  effects: EffectsState;
  sequenceMode: SequenceMode;
  isTransitioning: boolean;
}

/** Telemetry for debug display */
export interface MixerTelemetry {
  fps: number;
  bpm: number;
  bpmConfidence: number;
  barCounter: number;
  phraseCounter: number;
  beatPos: number;
  sequenceMode: SequenceMode;
  engineMode: EngineMode;
  activePattern: PatternType;
  currentNode: string;
  activeDecks: number[];
  poolCounts: {
    low: number;
    mid: number;
    high: number;
    closeups: number;
    hands: number;
    feet: number;
    mandalas: number;
  };
}

// =============================================================================
// BPM DETECTOR
// =============================================================================

class BPMDetector {
  private energyHistory: number[] = [];
  private beatTimes: number[] = [];
  private lastBeatTime: number = 0;
  private readonly maxHistory = 60;
  private readonly minInterval = 250;  // Max 240 BPM
  private readonly maxInterval = 1500; // Min 40 BPM

  detectBeat(bass: number, timestamp: number): boolean {
    this.energyHistory.push(bass);
    if (this.energyHistory.length > this.maxHistory) {
      this.energyHistory.shift();
    }

    const avg = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;
    const max = Math.max(...this.energyHistory);
    const threshold = avg + (max - avg) * 0.5;

    const interval = timestamp - this.lastBeatTime;

    if (bass > threshold && interval > this.minInterval && interval < this.maxInterval) {
      this.lastBeatTime = timestamp;
      this.beatTimes.push(timestamp);
      if (this.beatTimes.length > 16) this.beatTimes.shift();
      return true;
    }
    return false;
  }

  getBPM(): { bpm: number; confidence: number } {
    if (this.beatTimes.length < 4) {
      return { bpm: 120, confidence: 0 };
    }

    const intervals: number[] = [];
    for (let i = 1; i < this.beatTimes.length; i++) {
      intervals.push(this.beatTimes[i] - this.beatTimes[i - 1]);
    }

    intervals.sort((a, b) => a - b);
    const median = intervals[Math.floor(intervals.length / 2)];
    const bpm = Math.round(60000 / median);

    // Calculate confidence from coefficient of variation
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length;
    const cv = Math.sqrt(variance) / mean;
    const confidence = Math.max(0, Math.min(1, 1 - cv * 2));

    return {
      bpm: Math.max(60, Math.min(200, bpm)),
      confidence
    };
  }

  reset(): void {
    this.energyHistory = [];
    this.beatTimes = [];
    this.lastBeatTime = 0;
  }
}

// =============================================================================
// KINETIC NODE GRAPH (DAG)
// =============================================================================

interface KineticNode {
  id: string;
  energyRequired: number;
  exitThreshold: number;
  minDuration: number;
  transitions: string[];
  mechanicalFX?: string[];
}

const KINETIC_GRAPH: Record<string, KineticNode> = {
  idle: {
    id: 'idle',
    energyRequired: 0,
    exitThreshold: 0,
    minDuration: 0,
    transitions: ['groove_left', 'groove_right', 'groove_center', 'crouch']
  },
  groove_left: {
    id: 'groove_left',
    energyRequired: 0.3,
    exitThreshold: 0.2,
    minDuration: 100,
    transitions: ['idle', 'groove_center', 'groove_right', 'vogue_left', 'crouch'],
    mechanicalFX: ['tilt_left']
  },
  groove_right: {
    id: 'groove_right',
    energyRequired: 0.3,
    exitThreshold: 0.2,
    minDuration: 100,
    transitions: ['idle', 'groove_center', 'groove_left', 'vogue_right', 'crouch'],
    mechanicalFX: ['tilt_right', 'mirror']
  },
  groove_center: {
    id: 'groove_center',
    energyRequired: 0.2,
    exitThreshold: 0.1,
    minDuration: 100,
    transitions: ['groove_left', 'groove_right', 'jump', 'crouch', 'closeup']
  },
  crouch: {
    id: 'crouch',
    energyRequired: 0.4,
    exitThreshold: 0.3,
    minDuration: 150,
    transitions: ['jump', 'groove_center', 'idle']
  },
  jump: {
    id: 'jump',
    energyRequired: 0.7,
    exitThreshold: 0.5,
    minDuration: 100,
    transitions: ['crouch', 'groove_center', 'impact'],
    mechanicalFX: ['zoom']
  },
  vogue_left: {
    id: 'vogue_left',
    energyRequired: 0.5,
    exitThreshold: 0.3,
    minDuration: 200,
    transitions: ['groove_left', 'vogue_right', 'closeup']
  },
  vogue_right: {
    id: 'vogue_right',
    energyRequired: 0.5,
    exitThreshold: 0.3,
    minDuration: 200,
    transitions: ['groove_right', 'vogue_left', 'closeup'],
    mechanicalFX: ['mirror']
  },
  closeup: {
    id: 'closeup',
    energyRequired: 0.6,
    exitThreshold: 0.4,
    minDuration: 500, // Lock for minimum duration
    transitions: ['groove_center', 'idle', 'hands'],
    mechanicalFX: ['zoom']
  },
  hands: {
    id: 'hands',
    energyRequired: 0.5,
    exitThreshold: 0.4,
    minDuration: 300,
    transitions: ['closeup', 'mandala', 'groove_center']
  },
  feet: {
    id: 'feet',
    energyRequired: 0.4,
    exitThreshold: 0.3,
    minDuration: 200,
    transitions: ['crouch', 'groove_left', 'groove_right']
  },
  mandala: {
    id: 'mandala',
    energyRequired: 0.7,
    exitThreshold: 0.5,
    minDuration: 300,
    transitions: ['hands', 'groove_center', 'impact'],
    mechanicalFX: ['mandala']
  },
  impact: {
    id: 'impact',
    energyRequired: 0.8,
    exitThreshold: 0.6,
    minDuration: 150,
    transitions: ['jump', 'mandala', 'groove_center'],
    mechanicalFX: ['zoom', 'flash']
  },
  acrobatic: {
    id: 'acrobatic',
    energyRequired: 0.9,
    exitThreshold: 0.7,
    minDuration: 400,
    transitions: ['impact', 'jump', 'groove_center'],
    mechanicalFX: ['zoom']
  }
};

// =============================================================================
// GOLEM MIXER CLASS
// =============================================================================

export class GolemMixer {
  // Decks
  private decks: GolemDeck[] = [];

  // Engine state
  private engineMode: EngineMode = 'KINETIC';
  private activePattern: PatternType = 'PING_PONG';

  // Kinetic state
  private kineticState: KineticState = {
    currentNode: 'idle',
    previousNode: 'idle',
    beatPos: 0,
    barCounter: 0,
    phraseCounter: 0,
    bpm: 120,
    isLocked: false,
    lockReleaseTime: 0,
    sequenceMode: 'GROOVE'
  };

  // BPM detection
  private bpmDetector = new BPMDetector();
  private autoBPM = true;
  private manualBPM = 120;

  // Physics
  private physics: PhysicsState = {
    rotation: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    squash: 1,
    bounce: 0,
    tilt: 0,
    zoom: 1.15,
    pan: { x: 0, y: 0 }
  };

  // Effects
  private effects: EffectsState = {
    rgbSplit: 0,
    flash: 0,
    glitch: 0,
    scanlines: 0,
    hueShift: 0,
    aberration: 0,
    invert: false,
    grayscale: false,
    mirror: false,
    strobe: false
  };

  // Transition state
  private currentFrame: DeckFrame | null = null;
  private previousFrame: DeckFrame | null = null;
  private transitionProgress = 1.0;
  private transitionMode: TransitionMode = 'CUT';
  private transitionSpeed = 10.0;

  // Timing
  private lastBeatTime = 0;
  private lastUpdateTime = 0;
  private beatDuration = 500; // ms per beat

  // Triggers (held states)
  private triggerStutter = false;
  private triggerReverse = false;
  private triggerGlitch = false;
  private triggerBurst = false;

  // Pattern state
  private patternIndex = 0;
  private patternFrameA: DeckFrame | null = null;
  private patternFrameB: DeckFrame | null = null;
  private patternFrameC: DeckFrame | null = null;

  // FPS tracking
  private frameCount = 0;
  private lastFpsTime = 0;
  private currentFps = 0;

  constructor() {
    // Initialize 4 decks
    for (let i = 0; i < 4; i++) {
      this.decks.push(this.createEmptyDeck(i));
    }
  }

  private createEmptyDeck(id: number): GolemDeck {
    return {
      id,
      name: `Deck ${id + 1}`,
      rig: null,
      isActive: id === 0, // Only first deck active by default
      mixMode: id === 0 ? 'sequencer' : 'off',
      opacity: 1,
      volume: 1,
      allFrames: [],
      framesByEnergy: { low: [], mid: [], high: [] },
      closeups: [],
      hands: [],
      feet: [],
      mandalas: [],
      virtuals: [],
      acrobatics: [],
      leftFrames: [],
      rightFrames: []
    };
  }

  // ===========================================================================
  // DECK MANAGEMENT
  // ===========================================================================

  loadDeck(deckId: number, frames: GeneratedFrame[], category: SubjectCategory): void {
    if (deckId < 0 || deckId >= 4) return;

    const deck = this.decks[deckId];
    deck.allFrames = [];
    deck.framesByEnergy = { low: [], mid: [], high: [] };
    deck.closeups = [];
    deck.hands = [];
    deck.feet = [];
    deck.mandalas = [];
    deck.virtuals = [];
    deck.acrobatics = [];
    deck.leftFrames = [];
    deck.rightFrames = [];

    // Process and categorize frames
    frames.forEach(f => {
      const deckFrame: DeckFrame = { ...f, deckId };
      deck.allFrames.push(deckFrame);

      // By energy
      const energy = f.energy || 'mid';
      if (deck.framesByEnergy[energy]) {
        deck.framesByEnergy[energy].push(deckFrame);
      }

      // By type
      const frameType = f.type || 'body';
      if (frameType === 'closeup') deck.closeups.push(deckFrame);

      // By direction
      const dir = f.direction;
      if (dir === 'left') deck.leftFrames.push(deckFrame);
      else if (dir === 'right') deck.rightFrames.push(deckFrame);

      // Generate virtual zoom variants for high-energy frames
      if (energy === 'high' && frameType === 'body') {
        const virtual: DeckFrame = {
          ...deckFrame,
          pose: f.pose + '_vzoom',
          bodyPart: 'upper'
        };
        deck.virtuals.push(virtual);
      }
    });

    // Ensure pools aren't empty
    if (deck.framesByEnergy.low.length === 0) deck.framesByEnergy.low = [...deck.allFrames];
    if (deck.framesByEnergy.mid.length === 0) deck.framesByEnergy.mid = [...deck.allFrames];
    if (deck.framesByEnergy.high.length === 0) deck.framesByEnergy.high = [...deck.allFrames];

    deck.isActive = true;
    deck.mixMode = 'sequencer';
  }

  loadDeckFromProject(deckId: number, project: SavedProject): void {
    if (deckId < 0 || deckId >= 4) return;
    this.decks[deckId].rig = project;
    this.loadDeck(deckId, project.frames, project.subjectCategory);
  }

  setDeckMode(deckId: number, mode: MixMode): void {
    if (deckId < 0 || deckId >= 4) return;
    this.decks[deckId].mixMode = mode;
    this.decks[deckId].isActive = mode !== 'off';
  }

  setDeckOpacity(deckId: number, opacity: number): void {
    if (deckId < 0 || deckId >= 4) return;
    this.decks[deckId].opacity = Math.max(0, Math.min(1, opacity));
  }

  getDeck(deckId: number): GolemDeck | null {
    return this.decks[deckId] || null;
  }

  getActiveDecks(): GolemDeck[] {
    return this.decks.filter(d => d.isActive && d.mixMode !== 'off');
  }

  getSequencerDecks(): GolemDeck[] {
    return this.decks.filter(d => d.isActive && d.mixMode === 'sequencer');
  }

  // ===========================================================================
  // ENGINE CONTROLS
  // ===========================================================================

  setEngineMode(mode: EngineMode): void {
    this.engineMode = mode;
  }

  setPattern(pattern: PatternType): void {
    this.activePattern = pattern;
    this.patternIndex = 0;
    this.patternFrameA = null;
    this.patternFrameB = null;
    this.patternFrameC = null;
  }

  setSequenceMode(mode: SequenceMode): void {
    this.kineticState.sequenceMode = mode;
  }

  setBPM(bpm: number): void {
    this.manualBPM = Math.max(60, Math.min(200, bpm));
    if (!this.autoBPM) {
      this.kineticState.bpm = this.manualBPM;
      this.beatDuration = 60000 / this.manualBPM;
    }
  }

  setAutoBPM(enabled: boolean): void {
    this.autoBPM = enabled;
    if (!enabled) {
      this.kineticState.bpm = this.manualBPM;
      this.beatDuration = 60000 / this.manualBPM;
    }
  }

  // ===========================================================================
  // TRIGGER PADS
  // ===========================================================================

  setTriggerStutter(active: boolean): void {
    this.triggerStutter = active;
  }

  setTriggerReverse(active: boolean): void {
    this.triggerReverse = active;
  }

  setTriggerGlitch(active: boolean): void {
    this.triggerGlitch = active;
  }

  setTriggerBurst(active: boolean): void {
    this.triggerBurst = active;
  }

  // ===========================================================================
  // EFFECTS CONTROLS
  // ===========================================================================

  setEffect<K extends keyof EffectsState>(key: K, value: EffectsState[K]): void {
    this.effects[key] = value;
  }

  getEffects(): EffectsState {
    return { ...this.effects };
  }

  // ===========================================================================
  // FRAME POOLING
  // ===========================================================================

  private gatherFrames<T>(selector: (deck: GolemDeck) => T[]): T[] {
    return this.getSequencerDecks().flatMap(d => selector(d) || []);
  }

  private selectRandom<T>(arr: T[]): T | null {
    if (arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ===========================================================================
  // KINETIC ENGINE UPDATE
  // ===========================================================================

  private updateKineticEngine(audio: AudioData, dt: number): void {
    const { bass, mid, high, timestamp } = audio;
    const now = timestamp;

    // BPM Detection
    const beatDetected = this.bpmDetector.detectBeat(bass, now);
    if (this.autoBPM) {
      const { bpm, confidence } = this.bpmDetector.getBPM();
      if (confidence > 0.5) {
        this.kineticState.bpm = bpm;
        this.beatDuration = 60000 / bpm;
      }
    }

    // Beat position (0.0 - 1.0)
    this.kineticState.beatPos = ((now % this.beatDuration) / this.beatDuration);

    // Update counters on beat
    if (beatDetected) {
      this.lastBeatTime = now;
      this.kineticState.barCounter = (this.kineticState.barCounter + 1) % 16;
      this.kineticState.phraseCounter = (this.kineticState.phraseCounter + 1) % 8;

      // Trigger physics on beat
      this.physics.squash = 0.85;
      this.physics.bounce = -50 * bass;
      this.effects.flash = 0.3 * bass;
    }

    // Check if locked
    if (this.kineticState.isLocked && now < this.kineticState.lockReleaseTime) {
      return; // Don't transition while locked
    }
    this.kineticState.isLocked = false;

    // Determine sequence mode based on audio
    this.updateSequenceMode(audio);

    // Handle triggers
    if (this.triggerReverse) {
      this.kineticState.sequenceMode = 'GROOVE';
    }
    if (this.triggerGlitch) {
      this.effects.glitch = 0.8;
      this.effects.rgbSplit = 0.5;
    }

    // Get current node
    const currentNode = KINETIC_GRAPH[this.kineticState.currentNode];
    if (!currentNode) return;

    // Check if we can transition (energy below exit threshold)
    const energy = (bass + mid + high) / 3;
    if (energy > currentNode.exitThreshold) {
      // Try to find valid transition
      const validTransitions = currentNode.transitions.filter(nodeId => {
        const node = KINETIC_GRAPH[nodeId];
        return node && energy >= node.energyRequired;
      });

      // 30% transition probability - allows natural groove without constant switching
      if (validTransitions.length > 0 && Math.random() < 0.3) {
        const nextNodeId = this.selectRandom(validTransitions);
        if (nextNodeId) {
          this.transitionToNode(nextNodeId, now);
        }
      }
    }

    // FALLBACK: Force frame selection on beat even if node didn't change
    // This prevents frames from getting stuck when node transitions are rare
    if (beatDetected && !this.kineticState.isLocked) {
      this.selectFrameForMode();
    }
  }

  private updateSequenceMode(audio: AudioData): void {
    const { bass, high } = audio;
    const hasCloseups = this.gatherFrames(d => d.closeups).length > 0;
    const hasHands = this.gatherFrames(d => d.hands).length > 0;
    const hasFeet = this.gatherFrames(d => d.feet).length > 0;

    const isDrop = bass > 0.8;
    const isPeak = high > 0.7;
    const isFill = this.kineticState.phraseCounter === 7;

    if (isPeak && hasCloseups) {
      this.kineticState.sequenceMode = 'EMOTE';
    } else if (isDrop && hasHands) {
      this.kineticState.sequenceMode = 'IMPACT';
    } else if (this.kineticState.barCounter >= 12 && hasFeet) {
      this.kineticState.sequenceMode = 'FOOTWORK';
    } else if (isFill) {
      this.kineticState.sequenceMode = 'IMPACT';
    } else {
      this.kineticState.sequenceMode = 'GROOVE';
    }
  }

  private transitionToNode(nodeId: string, now: number): void {
    const node = KINETIC_GRAPH[nodeId];
    if (!node) return;

    this.kineticState.previousNode = this.kineticState.currentNode;
    this.kineticState.currentNode = nodeId;

    // Lock if node has minimum duration
    if (node.minDuration >= 500) {
      this.kineticState.isLocked = true;
      this.kineticState.lockReleaseTime = now + node.minDuration;
    }

    // Select frame based on sequence mode
    this.selectFrameForMode();
  }

  private selectFrameForMode(): void {
    let pool: DeckFrame[] = [];
    let transition: TransitionMode = 'CUT';

    switch (this.kineticState.sequenceMode) {
      case 'EMOTE':
        pool = this.gatherFrames(d => d.virtuals);
        if (pool.length === 0) pool = this.gatherFrames(d => d.closeups);
        transition = 'ZOOM_IN';
        break;

      case 'FOOTWORK':
        pool = this.gatherFrames(d => d.feet);
        if (pool.length === 0) pool = this.gatherFrames(d => d.framesByEnergy.mid);
        transition = 'CUT';
        break;

      case 'IMPACT':
        pool = this.gatherFrames(d => d.mandalas);
        if (pool.length === 0) pool = this.gatherFrames(d => d.hands);
        if (pool.length === 0) pool = this.gatherFrames(d => d.framesByEnergy.high);
        transition = 'CUT';
        this.effects.flash = 0.5;
        break;

      case 'GROOVE':
      default:
        const dir = this.kineticState.barCounter % 2 === 0 ? 'left' : 'right';
        pool = this.gatherFrames(d =>
          d.framesByEnergy.mid.filter(f => f.direction === dir)
        );
        if (pool.length === 0) pool = this.gatherFrames(d => d.framesByEnergy.mid);
        transition = 'SLIDE';
        break;
    }

    if (pool.length === 0) {
      pool = this.gatherFrames(d => d.allFrames);
    }

    // Try to select a different frame than current (up to 3 attempts)
    let newFrame = this.selectRandom(pool);
    let attempts = 0;
    while (newFrame && newFrame.pose === this.currentFrame?.pose && attempts < 3 && pool.length > 1) {
      newFrame = this.selectRandom(pool);
      attempts++;
    }

    if (newFrame && newFrame.pose !== this.currentFrame?.pose) {
      this.previousFrame = this.currentFrame;
      this.currentFrame = newFrame;
      this.transitionMode = transition;
      this.transitionProgress = 0;
      this.transitionSpeed = transition === 'CUT' ? 100 : 8;
    }
  }

  // ===========================================================================
  // PATTERN ENGINE UPDATE
  // ===========================================================================

  private updatePatternEngine(audio: AudioData, dt: number): void {
    const { bass, mid, high, timestamp } = audio;
    const now = timestamp;

    // Beat detection
    const beatDetected = this.bpmDetector.detectBeat(bass, now);

    if (!beatDetected) return;

    this.lastBeatTime = now;
    this.physics.squash = 0.85;
    this.physics.bounce = -40 * bass;

    // Get pooled frames
    let pool: DeckFrame[] = [];

    switch (this.activePattern) {
      case 'PING_PONG':
        this.patternIndex = (this.patternIndex + 1) % 2;
        pool = this.patternIndex === 0
          ? this.gatherFrames(d => d.leftFrames)
          : this.gatherFrames(d => d.rightFrames);
        break;

      case 'ABAB':
        this.patternIndex = (this.patternIndex + 1) % 2;
        // Refresh pattern frames periodically to prevent staleness
        if (this.kineticState.barCounter % 4 === 0) {
          this.patternFrameA = null;
          this.patternFrameB = null;
        }
        if (this.patternIndex === 0) {
          if (!this.patternFrameA) this.patternFrameA = this.selectRandom(this.gatherFrames(d => d.allFrames));
          this.triggerFrame(this.patternFrameA, 'CUT');
        } else {
          if (!this.patternFrameB) this.patternFrameB = this.selectRandom(this.gatherFrames(d => d.allFrames));
          this.triggerFrame(this.patternFrameB, 'CUT');
        }
        break;

      case 'AABB':
        this.patternIndex = (this.patternIndex + 1) % 4;
        // Refresh pattern frames periodically
        if (this.patternIndex === 0 && this.kineticState.barCounter % 4 === 0) {
          this.patternFrameA = null;
          this.patternFrameB = null;
        }
        if (this.patternIndex < 2) {
          if (!this.patternFrameA) this.patternFrameA = this.selectRandom(this.gatherFrames(d => d.allFrames));
          this.triggerFrame(this.patternFrameA, 'CUT');
        } else {
          if (!this.patternFrameB) this.patternFrameB = this.selectRandom(this.gatherFrames(d => d.allFrames));
          this.triggerFrame(this.patternFrameB, 'CUT');
        }
        break;

      case 'ABAC':
        this.patternIndex = (this.patternIndex + 1) % 4;
        // Refresh pattern frames every 8 bars
        if (this.patternIndex === 0 && this.kineticState.barCounter % 8 === 0) {
          this.patternFrameA = null;
          this.patternFrameB = null;
          this.patternFrameC = null;
        }
        if (!this.patternFrameA) this.patternFrameA = this.selectRandom(this.gatherFrames(d => d.allFrames));
        if (!this.patternFrameB) this.patternFrameB = this.selectRandom(this.gatherFrames(d => d.allFrames));
        if (!this.patternFrameC) this.patternFrameC = this.selectRandom(this.gatherFrames(d => d.allFrames));
        const abacMap = [this.patternFrameA, this.patternFrameB, this.patternFrameA, this.patternFrameC];
        this.triggerFrame(abacMap[this.patternIndex], 'CUT');
        break;

      case 'STUTTER':
      case 'SNARE_ROLL':
        if (mid > 0.6 || this.triggerStutter) {
          // Repeat current frame
          this.transitionProgress = 0;
          this.transitionSpeed = 50;
          this.effects.glitch = 0.3;
          return;
        }
        pool = this.gatherFrames(d => d.framesByEnergy.high);
        break;

      case 'BUILD_DROP':
      case 'IMPACT':
        if (bass > 0.7) {
          pool = this.gatherFrames(d => d.framesByEnergy.high);
          this.effects.flash = 0.4;
        } else {
          pool = this.gatherFrames(d => d.framesByEnergy.low);
        }
        break;

      case 'VOGUE':
        pool = this.gatherFrames(d => d.closeups);
        if (pool.length === 0) pool = this.gatherFrames(d => d.framesByEnergy.high);
        break;

      case 'FLOW':
        pool = this.gatherFrames(d => d.framesByEnergy.mid);
        this.transitionMode = 'SMOOTH';
        this.transitionSpeed = 3;
        break;

      case 'CHAOS':
        pool = this.gatherFrames(d => d.allFrames);
        this.effects.glitch = Math.random() * 0.5;
        break;

      case 'MINIMAL':
        pool = this.gatherFrames(d => d.framesByEnergy.low);
        break;

      case 'GROOVE':
        const dir = this.kineticState.barCounter % 2 === 0 ? 'left' : 'right';
        pool = this.gatherFrames(d =>
          d.framesByEnergy.mid.filter(f => f.direction === dir)
        );
        break;

      case 'EMOTE':
        pool = this.gatherFrames(d => d.closeups);
        this.transitionMode = 'ZOOM_IN';
        break;

      case 'FOOTWORK':
        pool = this.gatherFrames(d => d.feet);
        if (pool.length === 0) pool = this.gatherFrames(d => d.framesByEnergy.mid);
        break;

      default:
        pool = this.gatherFrames(d => d.allFrames);
    }

    if (pool.length === 0) {
      pool = this.gatherFrames(d => d.allFrames);
    }

    const newFrame = this.selectRandom(pool);
    this.triggerFrame(newFrame, this.transitionMode);
  }

  private triggerFrame(frame: DeckFrame | null, mode: TransitionMode): void {
    // Compare pose strings, not object references - fixes pattern getting stuck
    if (!frame || frame.pose === this.currentFrame?.pose) return;

    this.previousFrame = this.currentFrame;
    this.currentFrame = frame;
    this.transitionMode = mode;
    this.transitionProgress = 0;

    switch (mode) {
      case 'CUT': this.transitionSpeed = 100; break;
      case 'SLIDE': this.transitionSpeed = 8; break;
      case 'MORPH': this.transitionSpeed = 5; break;
      case 'SMOOTH': this.transitionSpeed = 3; break;
      case 'ZOOM_IN': this.transitionSpeed = 6; break;
    }
  }

  // ===========================================================================
  // PHYSICS UPDATE
  // ===========================================================================

  private updatePhysics(audio: AudioData, dt: number): void {
    const { bass, mid, high } = audio;
    const stiffness = 140;
    const damping = 8;

    // Target rotations from audio
    const targetRotX = bass * 35;
    const targetRotY = mid * 25 * Math.sin(Date.now() * 0.005);
    const targetRotZ = high * 15;

    // Spring solver
    this.physics.velocity.x += ((targetRotX - this.physics.rotation.x) * stiffness - this.physics.velocity.x * damping) * dt;
    this.physics.rotation.x += this.physics.velocity.x * dt;

    this.physics.velocity.y += ((targetRotY - this.physics.rotation.y) * stiffness * 0.5 - this.physics.velocity.y * damping * 0.8) * dt;
    this.physics.rotation.y += this.physics.velocity.y * dt;

    this.physics.velocity.z += ((targetRotZ - this.physics.rotation.z) * stiffness - this.physics.velocity.z * damping) * dt;
    this.physics.rotation.z += this.physics.velocity.z * dt;

    // Decay
    this.physics.squash += (1.0 - this.physics.squash) * (12 * dt);
    this.physics.bounce += (0 - this.physics.bounce) * (10 * dt);
    this.physics.zoom += (1.15 - this.physics.zoom) * (5 * dt);

    // Transition progress
    if (this.transitionProgress < 1.0) {
      this.transitionProgress += this.transitionSpeed * dt;
      if (this.transitionProgress > 1.0) this.transitionProgress = 1.0;
    }

    // Effects decay
    this.effects.flash *= Math.exp(-15 * dt);
    this.effects.glitch *= Math.exp(-10 * dt);
    this.effects.rgbSplit *= Math.exp(-8 * dt);
  }

  // ===========================================================================
  // MAIN UPDATE
  // ===========================================================================

  update(audio: AudioData): MixerOutput {
    const now = audio.timestamp;
    const dt = Math.min((now - this.lastUpdateTime) / 1000, 0.1);
    this.lastUpdateTime = now;

    // FPS calculation
    this.frameCount++;
    if (now - this.lastFpsTime > 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    // Handle stutter trigger
    if (this.triggerStutter && this.currentFrame) {
      this.transitionProgress = 0;
      this.transitionSpeed = 50;
    }

    // Update based on engine mode
    if (this.engineMode === 'KINETIC') {
      this.updateKineticEngine(audio, dt);
    } else {
      this.updatePatternEngine(audio, dt);
    }

    // Update physics
    this.updatePhysics(audio, dt);

    return {
      frame: this.currentFrame,
      deckId: this.currentFrame?.deckId ?? 0,
      transitionMode: this.transitionMode,
      transitionSpeed: this.transitionSpeed,
      physics: { ...this.physics },
      effects: { ...this.effects },
      sequenceMode: this.kineticState.sequenceMode,
      isTransitioning: this.transitionProgress < 1.0
    };
  }

  // ===========================================================================
  // TELEMETRY
  // ===========================================================================

  getTelemetry(): MixerTelemetry {
    return {
      fps: this.currentFps,
      bpm: this.kineticState.bpm,
      bpmConfidence: this.autoBPM ? this.bpmDetector.getBPM().confidence : 1,
      barCounter: this.kineticState.barCounter,
      phraseCounter: this.kineticState.phraseCounter,
      beatPos: this.kineticState.beatPos,
      sequenceMode: this.kineticState.sequenceMode,
      engineMode: this.engineMode,
      activePattern: this.activePattern,
      currentNode: this.kineticState.currentNode,
      activeDecks: this.getActiveDecks().map(d => d.id),
      poolCounts: {
        low: this.gatherFrames(d => d.framesByEnergy.low).length,
        mid: this.gatherFrames(d => d.framesByEnergy.mid).length,
        high: this.gatherFrames(d => d.framesByEnergy.high).length,
        closeups: this.gatherFrames(d => d.closeups).length,
        hands: this.gatherFrames(d => d.hands).length,
        feet: this.gatherFrames(d => d.feet).length,
        mandalas: this.gatherFrames(d => d.mandalas).length
      }
    };
  }

  // ===========================================================================
  // RESET
  // ===========================================================================

  reset(): void {
    this.bpmDetector.reset();
    this.kineticState = {
      currentNode: 'idle',
      previousNode: 'idle',
      beatPos: 0,
      barCounter: 0,
      phraseCounter: 0,
      bpm: 120,
      isLocked: false,
      lockReleaseTime: 0,
      sequenceMode: 'GROOVE'
    };
    this.patternIndex = 0;
    this.patternFrameA = null;
    this.patternFrameB = null;
    this.patternFrameC = null;
    this.transitionProgress = 1.0;
  }
}

// Export singleton or factory
export function createGolemMixer(): GolemMixer {
  return new GolemMixer();
}
