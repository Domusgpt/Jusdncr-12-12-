/**
 * LiveMixer - VJ-style live mixing system for hot-swapping choreography engines,
 * patterns, and effects during playback
 */

import type { GeneratedFrame, SubjectCategory } from '../types';

// =============================================================================
// TYPES
// =============================================================================

/** Audio analysis data passed to engines */
export interface AudioData {
  bass: number;      // 0-1, low frequencies
  mid: number;       // 0-1, mid frequencies
  high: number;      // 0-1, high frequencies
  energy: number;    // 0-1, overall energy
  beatDetected: boolean;
  bpm: number;
  time: number;      // Current playback time in ms
}

/** Output from a choreography engine */
export interface ChoreographyOutput {
  frameId: string;
  transitionMode: TransitionMode;
  transitionSpeed: number;  // ms
  physics: PhysicsState;
  effects: EffectsState;
}

export type TransitionMode = 'CUT' | 'SLIDE' | 'MORPH' | 'SMOOTH' | 'ZOOM_IN';

export interface PhysicsState {
  rotation: { x: number; y: number; z: number };
  squash: number;      // 0.8-1.2
  bounce: number;      // -50 to 50
  tilt: number;        // degrees
  zoom: number;        // 1.0-2.0
  pan: { x: number; y: number };
}

export interface EffectsState {
  rgbSplit: number;    // 0-1
  flash: number;       // 0-1
  invert: boolean;
  grayscale: boolean;
  glitch: number;      // 0-1
  mirror: boolean;
}

/** Pattern that modifies engine behavior */
export type PatternType =
  | 'PING_PONG'     // Left-right alternating
  | 'BUILD_DROP'    // Gradual intensity → release
  | 'STUTTER'       // Rapid cuts
  | 'VOGUE'         // High-frequency poses
  | 'FLOW'          // Smooth transitions only
  | 'CHAOS'         // Random everything
  | 'MINIMAL';      // Just beats, no flourishes

/** Engine types available */
export type EngineType =
  | 'REACTIVE'      // Beat-reactive, energy-driven (Step4Preview style)
  | 'KINETIC'       // State machine with 11 nodes
  | 'CHAOS'         // Random, high stutter
  | 'MINIMAL'       // Simple beat cuts
  | 'FLOW';         // Smooth, ambient

// =============================================================================
// CHOREOGRAPHY ENGINE INTERFACE
// =============================================================================

export interface IChoreographyEngine {
  readonly name: string;
  readonly type: EngineType;

  /** Initialize with frames */
  initialize(frames: GeneratedFrame[], category: SubjectCategory): void;

  /** Process audio and return choreography decision */
  update(audio: AudioData): ChoreographyOutput;

  /** Force transition to specific frame */
  forceFrame(frameId: string): void;

  /** Apply pattern modifier */
  setPattern(pattern: PatternType): void;

  /** Reset engine state */
  reset(): void;
}

// =============================================================================
// BASE ENGINE CLASS
// =============================================================================

abstract class BaseEngine implements IChoreographyEngine {
  abstract readonly name: string;
  abstract readonly type: EngineType;

  protected frames: GeneratedFrame[] = [];
  protected category: SubjectCategory = 'CHARACTER';
  protected currentFrameId: string = '';
  protected previousFrameId: string = '';
  protected pattern: PatternType = 'PING_PONG';
  protected beatCounter: number = 0;
  protected lastBeatTime: number = 0;
  protected phase: 'LEFT' | 'RIGHT' | 'CENTER' | 'DROP' | 'CHAOS' = 'CENTER';

  // Frame pools by energy/direction
  protected lowEnergyFrames: GeneratedFrame[] = [];
  protected midEnergyFrames: GeneratedFrame[] = [];
  protected highEnergyFrames: GeneratedFrame[] = [];
  protected leftFrames: GeneratedFrame[] = [];
  protected rightFrames: GeneratedFrame[] = [];
  protected closeupFrames: GeneratedFrame[] = [];

  initialize(frames: GeneratedFrame[], category: SubjectCategory): void {
    this.frames = frames;
    this.category = category;
    this.categorizeFrames();
    if (frames.length > 0) {
      this.currentFrameId = frames[0].id;
    }
  }

  protected categorizeFrames(): void {
    this.lowEnergyFrames = this.frames.filter(f => f.energy === 'low');
    this.midEnergyFrames = this.frames.filter(f => f.energy === 'mid');
    this.highEnergyFrames = this.frames.filter(f => f.energy === 'high');
    this.leftFrames = this.frames.filter(f => f.direction === 'left');
    this.rightFrames = this.frames.filter(f => f.direction === 'right');
    this.closeupFrames = this.frames.filter(f => f.type === 'closeup');

    // Ensure pools aren't empty
    if (this.lowEnergyFrames.length === 0) this.lowEnergyFrames = this.frames;
    if (this.midEnergyFrames.length === 0) this.midEnergyFrames = this.frames;
    if (this.highEnergyFrames.length === 0) this.highEnergyFrames = this.frames;
    if (this.leftFrames.length === 0) this.leftFrames = this.frames;
    if (this.rightFrames.length === 0) this.rightFrames = this.frames;
  }

  abstract update(audio: AudioData): ChoreographyOutput;

  forceFrame(frameId: string): void {
    this.previousFrameId = this.currentFrameId;
    this.currentFrameId = frameId;
  }

  setPattern(pattern: PatternType): void {
    this.pattern = pattern;
  }

  reset(): void {
    this.beatCounter = 0;
    this.lastBeatTime = 0;
    this.phase = 'CENTER';
    if (this.frames.length > 0) {
      this.currentFrameId = this.frames[0].id;
    }
  }

  protected selectRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  protected defaultPhysics(): PhysicsState {
    return {
      rotation: { x: 0, y: 0, z: 0 },
      squash: 1,
      bounce: 0,
      tilt: 0,
      zoom: 1,
      pan: { x: 0, y: 0 }
    };
  }

  protected defaultEffects(): EffectsState {
    return {
      rgbSplit: 0,
      flash: 0,
      invert: false,
      grayscale: false,
      glitch: 0,
      mirror: false
    };
  }
}

// =============================================================================
// REACTIVE ENGINE - Beat-reactive, energy-driven (Step4Preview style)
// =============================================================================

export class ReactiveEngine extends BaseEngine {
  readonly name = 'Reactive';
  readonly type: EngineType = 'REACTIVE';

  private closeupLockUntil: number = 0;
  private stutterCount: number = 0;

  update(audio: AudioData): ChoreographyOutput {
    const { bass, mid, high, energy, beatDetected, time } = audio;

    let frameId = this.currentFrameId;
    let transitionMode: TransitionMode = 'SMOOTH';
    let transitionSpeed = 150;
    const physics = this.defaultPhysics();
    const effects = this.defaultEffects();

    // Beat detection with 400ms minimum interval
    if (beatDetected && (time - this.lastBeatTime) > 400) {
      this.lastBeatTime = time;
      this.beatCounter = (this.beatCounter + 1) % 16;

      // Determine phase based on beat counter
      const beat = this.beatCounter;
      if (beat < 4) this.phase = 'CENTER';
      else if (beat < 8) this.phase = 'LEFT';
      else if (beat < 12) this.phase = 'RIGHT';
      else if (beat < 14) this.phase = 'DROP';
      else this.phase = 'CHAOS';

      // Apply pattern modifiers
      const pool = this.getFramePoolForPattern(energy);
      const newFrame = this.selectRandom(pool);

      if (newFrame) {
        this.previousFrameId = this.currentFrameId;
        this.currentFrameId = newFrame.id;
        frameId = newFrame.id;
      }

      // Determine transition mode
      if (this.phase === 'DROP') {
        transitionMode = 'CUT';
        transitionSpeed = 50;
        effects.flash = 0.4;
        effects.rgbSplit = 0.3;
      } else if (this.phase === 'CHAOS') {
        transitionMode = Math.random() > 0.5 ? 'CUT' : 'MORPH';
        transitionSpeed = 80;
        effects.glitch = 0.5;
      } else if (this.phase === 'LEFT' || this.phase === 'RIGHT') {
        transitionMode = 'SLIDE';
        transitionSpeed = 120;
      }

      // Physics on beat
      physics.squash = 0.85;
      physics.bounce = -35 * bass;
      physics.zoom = 1 + bass * 0.2;
    }

    // Stutter mode (rapid cuts on high energy)
    if (mid > 0.8 && high > 0.7 && time - this.lastBeatTime > 100) {
      if (Math.random() < 0.2) {
        this.stutterCount++;
        transitionMode = 'CUT';
        transitionSpeed = 30;
        effects.glitch = 0.4;
        effects.rgbSplit = 0.3;
      }
    }

    // Closeup trigger
    if (high > 0.7 && mid > 0.5 && bass < 0.4 && time > this.closeupLockUntil) {
      if (this.closeupFrames.length > 0 && Math.random() < 0.3) {
        const closeup = this.selectRandom(this.closeupFrames);
        this.previousFrameId = this.currentFrameId;
        this.currentFrameId = closeup.id;
        frameId = closeup.id;
        transitionMode = 'ZOOM_IN';
        this.closeupLockUntil = time + 3000;
      }
    }

    // Continuous physics modulation
    physics.rotation.x = bass * 25;
    physics.rotation.y = mid * 15 * Math.sin(time * 0.003);
    physics.rotation.z = high * 10;
    physics.tilt = this.phase === 'LEFT' ? -6 : this.phase === 'RIGHT' ? 6 : 0;
    physics.pan.x = this.phase === 'LEFT' ? -0.1 : this.phase === 'RIGHT' ? 0.1 : 0;

    return { frameId, transitionMode, transitionSpeed, physics, effects };
  }

  private getFramePoolForPattern(energy: number): GeneratedFrame[] {
    switch (this.pattern) {
      case 'PING_PONG':
        return this.phase === 'LEFT' ? this.leftFrames :
               this.phase === 'RIGHT' ? this.rightFrames :
               this.midEnergyFrames;
      case 'BUILD_DROP':
        return energy > 0.7 ? this.highEnergyFrames :
               energy > 0.4 ? this.midEnergyFrames :
               this.lowEnergyFrames;
      case 'STUTTER':
        return this.highEnergyFrames;
      case 'VOGUE':
        return this.closeupFrames.length > 0 ? this.closeupFrames : this.highEnergyFrames;
      case 'FLOW':
        return this.midEnergyFrames;
      case 'CHAOS':
        return this.frames;
      case 'MINIMAL':
        return energy > 0.5 ? this.highEnergyFrames : this.lowEnergyFrames;
      default:
        return this.frames;
    }
  }
}

// =============================================================================
// CHAOS ENGINE - Random, aggressive, high stutter
// =============================================================================

export class ChaosEngine extends BaseEngine {
  readonly name = 'Chaos';
  readonly type: EngineType = 'CHAOS';

  private lastFrameChange: number = 0;

  update(audio: AudioData): ChoreographyOutput {
    const { bass, mid, high, energy, time } = audio;

    const physics = this.defaultPhysics();
    const effects = this.defaultEffects();
    let frameId = this.currentFrameId;
    let transitionMode: TransitionMode = 'CUT';
    const transitionSpeed = 30 + Math.random() * 50;

    // Change frame very frequently
    const changeInterval = 100 + Math.random() * 200;
    if (time - this.lastFrameChange > changeInterval) {
      this.lastFrameChange = time;
      const newFrame = this.selectRandom(this.frames);
      if (newFrame) {
        this.previousFrameId = this.currentFrameId;
        this.currentFrameId = newFrame.id;
        frameId = newFrame.id;
      }

      // Random transition
      const modes: TransitionMode[] = ['CUT', 'MORPH', 'ZOOM_IN'];
      transitionMode = this.selectRandom(modes);
    }

    // Aggressive physics
    physics.rotation.x = (Math.random() - 0.5) * 60 * energy;
    physics.rotation.y = (Math.random() - 0.5) * 40 * energy;
    physics.rotation.z = (Math.random() - 0.5) * 30 * energy;
    physics.squash = 0.7 + Math.random() * 0.5;
    physics.bounce = (Math.random() - 0.5) * 80 * bass;
    physics.tilt = (Math.random() - 0.5) * 15;
    physics.zoom = 0.9 + Math.random() * 0.6;

    // Heavy effects
    effects.rgbSplit = 0.3 + Math.random() * 0.5;
    effects.flash = bass > 0.7 ? 0.5 : 0;
    effects.invert = Math.random() < 0.1;
    effects.glitch = 0.4 + Math.random() * 0.4;
    effects.mirror = Math.random() < 0.2;

    return { frameId, transitionMode, transitionSpeed, physics, effects };
  }
}

// =============================================================================
// MINIMAL ENGINE - Simple beat cuts, clean
// =============================================================================

export class MinimalEngine extends BaseEngine {
  readonly name = 'Minimal';
  readonly type: EngineType = 'MINIMAL';

  update(audio: AudioData): ChoreographyOutput {
    const { bass, energy, beatDetected, time } = audio;

    const physics = this.defaultPhysics();
    const effects = this.defaultEffects();
    let frameId = this.currentFrameId;
    let transitionMode: TransitionMode = 'SMOOTH';
    let transitionSpeed = 200;

    // Only change on strong beats
    if (beatDetected && bass > 0.6 && (time - this.lastBeatTime) > 500) {
      this.lastBeatTime = time;

      const pool = energy > 0.6 ? this.highEnergyFrames :
                   energy > 0.3 ? this.midEnergyFrames :
                   this.lowEnergyFrames;

      const newFrame = this.selectRandom(pool);
      if (newFrame) {
        this.previousFrameId = this.currentFrameId;
        this.currentFrameId = newFrame.id;
        frameId = newFrame.id;
      }

      transitionMode = 'CUT';
      transitionSpeed = 100;
    }

    // Minimal physics
    physics.zoom = 1 + bass * 0.1;

    return { frameId, transitionMode, transitionSpeed, physics, effects };
  }
}

// =============================================================================
// FLOW ENGINE - Smooth, ambient, dreamy
// =============================================================================

export class FlowEngine extends BaseEngine {
  readonly name = 'Flow';
  readonly type: EngineType = 'FLOW';

  private driftAngle: number = 0;

  update(audio: AudioData): ChoreographyOutput {
    const { bass, mid, high, energy, beatDetected, time } = audio;

    const physics = this.defaultPhysics();
    const effects = this.defaultEffects();
    let frameId = this.currentFrameId;
    const transitionMode: TransitionMode = 'SMOOTH';
    const transitionSpeed = 500;

    // Slow frame changes
    if (beatDetected && (time - this.lastBeatTime) > 2000) {
      this.lastBeatTime = time;

      const pool = this.midEnergyFrames.length > 0 ? this.midEnergyFrames : this.frames;
      const newFrame = this.selectRandom(pool);
      if (newFrame) {
        this.previousFrameId = this.currentFrameId;
        this.currentFrameId = newFrame.id;
        frameId = newFrame.id;
      }
    }

    // Dreamy physics - slow drifting
    this.driftAngle += 0.001;
    physics.rotation.x = Math.sin(this.driftAngle) * 10 * mid;
    physics.rotation.y = Math.cos(this.driftAngle * 0.7) * 15 * high;
    physics.rotation.z = Math.sin(this.driftAngle * 1.3) * 5;
    physics.zoom = 1 + Math.sin(this.driftAngle * 0.5) * 0.1;
    physics.pan.x = Math.sin(this.driftAngle * 0.3) * 0.05;
    physics.pan.y = Math.cos(this.driftAngle * 0.4) * 0.03;

    // Subtle effects
    effects.rgbSplit = energy * 0.1;

    return { frameId, transitionMode, transitionSpeed, physics, effects };
  }
}

// =============================================================================
// EFFECTS RACK - Stackable effects modifiers
// =============================================================================

export interface EffectsRackState {
  rgbSplit: number;     // 0-1 intensity
  flash: number;        // 0-1 intensity
  invert: boolean;
  grayscale: boolean;
  glitch: number;       // 0-1 intensity
  mirror: boolean;
  zoomPulse: number;    // 0-1 intensity (beat-synced zoom)
  strobe: boolean;      // Rapid flash on beats
}

export class EffectsRack {
  private state: EffectsRackState = {
    rgbSplit: 0,
    flash: 0,
    invert: false,
    grayscale: false,
    glitch: 0,
    mirror: false,
    zoomPulse: 0,
    strobe: false
  };

  private strobeState: boolean = false;
  private lastStrobeTime: number = 0;

  setState(partial: Partial<EffectsRackState>): void {
    this.state = { ...this.state, ...partial };
  }

  getState(): EffectsRackState {
    return { ...this.state };
  }

  /** Apply rack effects on top of engine effects */
  apply(engineEffects: EffectsState, audio: AudioData): EffectsState {
    const result = { ...engineEffects };

    // Additive effects
    result.rgbSplit = Math.min(1, result.rgbSplit + this.state.rgbSplit);
    result.glitch = Math.min(1, result.glitch + this.state.glitch);

    // Flash (beat-synced if strobe enabled)
    if (this.state.strobe && audio.beatDetected) {
      if (audio.time - this.lastStrobeTime > 100) {
        this.strobeState = !this.strobeState;
        this.lastStrobeTime = audio.time;
      }
      result.flash = this.strobeState ? 1 : 0;
    } else {
      result.flash = Math.min(1, result.flash + this.state.flash);
    }

    // Toggle effects
    result.invert = result.invert || this.state.invert;
    result.grayscale = result.grayscale || this.state.grayscale;
    result.mirror = result.mirror || this.state.mirror;

    return result;
  }

  /** Apply zoom pulse to physics */
  applyPhysics(physics: PhysicsState, audio: AudioData): PhysicsState {
    const result = { ...physics };

    if (this.state.zoomPulse > 0) {
      result.zoom += audio.bass * this.state.zoomPulse * 0.3;
    }

    return result;
  }
}

// =============================================================================
// DECK - Single channel with frames + engine
// =============================================================================

export interface DeckState {
  id: string;
  frames: GeneratedFrame[];
  category: SubjectCategory;
  engine: IChoreographyEngine;
  pattern: PatternType;
  volume: number;  // 0-1, for crossfading
}

export class Deck {
  readonly id: string;
  private frames: GeneratedFrame[] = [];
  private category: SubjectCategory = 'CHARACTER';
  private engine: IChoreographyEngine;
  private pattern: PatternType = 'PING_PONG';
  private _volume: number = 1;

  constructor(id: string, engine?: IChoreographyEngine) {
    this.id = id;
    this.engine = engine || new ReactiveEngine();
  }

  get volume(): number { return this._volume; }
  set volume(v: number) { this._volume = Math.max(0, Math.min(1, v)); }

  loadFrames(frames: GeneratedFrame[], category: SubjectCategory): void {
    this.frames = frames;
    this.category = category;
    this.engine.initialize(frames, category);
  }

  setEngine(engine: IChoreographyEngine): void {
    this.engine = engine;
    if (this.frames.length > 0) {
      this.engine.initialize(this.frames, this.category);
    }
    this.engine.setPattern(this.pattern);
  }

  setPattern(pattern: PatternType): void {
    this.pattern = pattern;
    this.engine.setPattern(pattern);
  }

  update(audio: AudioData): ChoreographyOutput | null {
    if (this.frames.length === 0) return null;
    return this.engine.update(audio);
  }

  getFrame(frameId: string): GeneratedFrame | undefined {
    return this.frames.find(f => f.id === frameId);
  }

  getState(): DeckState {
    return {
      id: this.id,
      frames: this.frames,
      category: this.category,
      engine: this.engine,
      pattern: this.pattern,
      volume: this._volume
    };
  }
}

// =============================================================================
// LIVE MIXER - Main orchestrator
// =============================================================================

export interface LiveMixerState {
  deckA: DeckState;
  deckB: DeckState;
  crossfader: number;  // -1 (full A) to 1 (full B)
  effectsRack: EffectsRackState;
  masterVolume: number;
}

export interface MixedOutput {
  primary: {
    frame: GeneratedFrame | undefined;
    output: ChoreographyOutput;
  };
  secondary?: {
    frame: GeneratedFrame | undefined;
    output: ChoreographyOutput;
    blend: number;  // 0-1, how much of secondary to blend
  };
  effects: EffectsState;
  physics: PhysicsState;
}

export class LiveMixer {
  private deckA: Deck;
  private deckB: Deck;
  private crossfader: number = 0;  // -1 to 1
  private effectsRack: EffectsRack;
  private engines: Map<EngineType, () => IChoreographyEngine>;

  constructor() {
    this.deckA = new Deck('A');
    this.deckB = new Deck('B');
    this.effectsRack = new EffectsRack();

    // Engine factory
    this.engines = new Map([
      ['REACTIVE', () => new ReactiveEngine()],
      ['CHAOS', () => new ChaosEngine()],
      ['MINIMAL', () => new MinimalEngine()],
      ['FLOW', () => new FlowEngine()]
    ]);
  }

  // Deck A controls
  loadDeckA(frames: GeneratedFrame[], category: SubjectCategory): void {
    this.deckA.loadFrames(frames, category);
  }

  setDeckAEngine(type: EngineType): void {
    const factory = this.engines.get(type);
    if (factory) {
      this.deckA.setEngine(factory());
    }
  }

  setDeckAPattern(pattern: PatternType): void {
    this.deckA.setPattern(pattern);
  }

  // Deck B controls
  loadDeckB(frames: GeneratedFrame[], category: SubjectCategory): void {
    this.deckB.loadFrames(frames, category);
  }

  setDeckBEngine(type: EngineType): void {
    const factory = this.engines.get(type);
    if (factory) {
      this.deckB.setEngine(factory());
    }
  }

  setDeckBPattern(pattern: PatternType): void {
    this.deckB.setPattern(pattern);
  }

  // Crossfader (-1 = full A, 0 = center, 1 = full B)
  setCrossfader(value: number): void {
    this.crossfader = Math.max(-1, Math.min(1, value));
    // Update deck volumes
    this.deckA.volume = 1 - Math.max(0, this.crossfader);
    this.deckB.volume = 1 + Math.min(0, this.crossfader);
  }

  getCrossfader(): number {
    return this.crossfader;
  }

  // Effects rack
  setEffect(effect: keyof EffectsRackState, value: number | boolean): void {
    this.effectsRack.setState({ [effect]: value });
  }

  getEffects(): EffectsRackState {
    return this.effectsRack.getState();
  }

  // Main update
  update(audio: AudioData): MixedOutput {
    const outputA = this.deckA.update(audio);
    const outputB = this.deckB.update(audio);

    // Determine primary/secondary based on crossfader
    const aVolume = this.deckA.volume;
    const bVolume = this.deckB.volume;

    let primary: { frame: GeneratedFrame | undefined; output: ChoreographyOutput };
    let secondary: { frame: GeneratedFrame | undefined; output: ChoreographyOutput; blend: number } | undefined;

    if (aVolume >= bVolume) {
      primary = {
        frame: outputA ? this.deckA.getFrame(outputA.frameId) : undefined,
        output: outputA || this.defaultOutput()
      };
      if (outputB && bVolume > 0) {
        secondary = {
          frame: this.deckB.getFrame(outputB.frameId),
          output: outputB,
          blend: bVolume
        };
      }
    } else {
      primary = {
        frame: outputB ? this.deckB.getFrame(outputB.frameId) : undefined,
        output: outputB || this.defaultOutput()
      };
      if (outputA && aVolume > 0) {
        secondary = {
          frame: this.deckA.getFrame(outputA.frameId),
          output: outputA,
          blend: aVolume
        };
      }
    }

    // Apply effects rack
    const effects = this.effectsRack.apply(primary.output.effects, audio);
    const physics = this.effectsRack.applyPhysics(primary.output.physics, audio);

    return { primary, secondary, effects, physics };
  }

  private defaultOutput(): ChoreographyOutput {
    return {
      frameId: '',
      transitionMode: 'SMOOTH',
      transitionSpeed: 200,
      physics: {
        rotation: { x: 0, y: 0, z: 0 },
        squash: 1,
        bounce: 0,
        tilt: 0,
        zoom: 1,
        pan: { x: 0, y: 0 }
      },
      effects: {
        rgbSplit: 0,
        flash: 0,
        invert: false,
        grayscale: false,
        glitch: 0,
        mirror: false
      }
    };
  }

  getState(): LiveMixerState {
    return {
      deckA: this.deckA.getState(),
      deckB: this.deckB.getState(),
      crossfader: this.crossfader,
      effectsRack: this.effectsRack.getState(),
      masterVolume: 1
    };
  }

  // Get available engines
  getAvailableEngines(): EngineType[] {
    return Array.from(this.engines.keys());
  }

  // Get available patterns
  getAvailablePatterns(): PatternType[] {
    return ['PING_PONG', 'BUILD_DROP', 'STUTTER', 'VOGUE', 'FLOW', 'CHAOS', 'MINIMAL'];
  }
}

// =============================================================================
// FACTORY
// =============================================================================

export function createLiveMixer(): LiveMixer {
  return new LiveMixer();
}

export function createEngine(type: EngineType): IChoreographyEngine {
  switch (type) {
    case 'REACTIVE': return new ReactiveEngine();
    case 'CHAOS': return new ChaosEngine();
    case 'MINIMAL': return new MinimalEngine();
    case 'FLOW': return new FlowEngine();
    default: return new ReactiveEngine();
  }
}
