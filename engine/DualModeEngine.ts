/**
 * DUAL-MODE CHOREOGRAPHY ENGINE
 *
 * Unified engine that combines:
 * - Pre-analysis for file-based playback (structure, signature moves)
 * - Real-time analysis for live input (mic, streaming)
 * - Hybrid mode: pre-computed structure + real-time modulation
 *
 * This is the main entry point for the enhanced choreography system.
 */

import { FrameManifest, ManifestFrame, FrameManifestBuilder } from './FrameManifest';
import { SongAnalyzer, SongMap, getSectionAtTime, getPatternAtTime, isInBuildup } from './SongAnalyzer';
import { ChoreographyPlanner, ChoreographyMap, BeatChoreography, PreComputedChoreography } from './ChoreographyPlanner';
import { RhythmPhase, TransitionMode, AudioData } from './KineticEngine';
import { GeneratedFrame, SubjectCategory } from '../types';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type EngineMode = 'file' | 'stream' | 'mic';

export interface AudioSource {
  type: 'file' | 'stream' | 'mic';
  buffer?: AudioBuffer;
  element?: HTMLAudioElement;
  stream?: MediaStream;
}

export interface ChoreographyDecision {
  frameId: string | null;
  transitionMode: TransitionMode | null;
  transitionSpeed: number;

  physics: {
    rotX: number;
    rotY: number;
    rotZ: number;
    squash: number;
    bounce: number;
  };

  fx: {
    mode: 'NORMAL' | 'INVERT' | 'BW' | 'STROBE' | 'GHOST';
    rgbSplit: number;
    flash: number;
  } | null;

  // Metadata
  phase: RhythmPhase;
  isSignatureMove: boolean;
  isBeatChange: boolean;
}

export interface RealTimeAnalysisResult {
  beatDetected: boolean;
  phase: RhythmPhase;
  energy: number;
  bass: number;
  mid: number;
  high: number;
  bpm: number;
}

// =============================================================================
// REAL-TIME ANALYZER (for mic/streaming)
// =============================================================================

export class RealTimeAnalyzer {
  private beatCounter: number = 0;
  private lastBeatTime: number = 0;
  private beatIntervals: number[] = [];
  private energyHistory: number[] = [];
  private peakBass: number = 0;
  private peakMid: number = 0;
  private peakHigh: number = 0;
  private estimatedBpm: number = 120;

  private readonly ENERGY_HISTORY_SIZE = 30;
  private readonly BEAT_INTERVAL_SIZE = 8;
  private readonly PEAK_DECAY = 0.95;
  private readonly BEAT_THRESHOLD = 0.5;
  private readonly MIN_BEAT_INTERVAL = 200;

  update(audio: AudioData): void {
    // Update energy history
    this.energyHistory.push(audio.energy);
    if (this.energyHistory.length > this.ENERGY_HISTORY_SIZE) {
      this.energyHistory.shift();
    }

    // Update peaks with decay
    this.peakBass = Math.max(audio.bass, this.peakBass * this.PEAK_DECAY);
    this.peakMid = Math.max(audio.mid, this.peakMid * this.PEAK_DECAY);
    this.peakHigh = Math.max(audio.high, this.peakHigh * this.PEAK_DECAY);
  }

  analyze(audio: AudioData): RealTimeAnalysisResult {
    const now = Date.now();
    let beatDetected = false;

    // Beat detection using bass threshold + peak comparison
    if (audio.bass > this.BEAT_THRESHOLD &&
      audio.bass > this.peakBass * 0.8 &&
      (now - this.lastBeatTime) > this.MIN_BEAT_INTERVAL) {

      beatDetected = true;
      this.beatCounter++;

      // Track interval for BPM estimation
      const interval = now - this.lastBeatTime;
      if (interval > 0 && interval < 2000) {
        this.beatIntervals.push(interval);
        if (this.beatIntervals.length > this.BEAT_INTERVAL_SIZE) {
          this.beatIntervals.shift();
        }

        // Estimate BPM
        if (this.beatIntervals.length >= 4) {
          const avgInterval = this.beatIntervals.reduce((a, b) => a + b, 0) / this.beatIntervals.length;
          this.estimatedBpm = Math.round(60000 / avgInterval);
          this.estimatedBpm = Math.max(60, Math.min(200, this.estimatedBpm));
        }
      }

      this.lastBeatTime = now;
    }

    // Determine phase based on beat counter and energy
    const phase = this.determinePhase(audio);

    return {
      beatDetected,
      phase,
      energy: audio.energy,
      bass: audio.bass,
      mid: audio.mid,
      high: audio.high,
      bpm: this.estimatedBpm
    };
  }

  private determinePhase(audio: AudioData): RhythmPhase {
    const beatInCycle = this.beatCounter % 16;
    const energy = audio.energy;

    // Energy-based overrides
    if (energy > 0.8 && audio.bass > 0.7) return 'DROP';
    if (audio.high > 0.7 && audio.mid > 0.5) return 'CHAOS';
    if (energy < 0.2) return 'AMBIENT';

    // Beat-position based phases
    if (beatInCycle < 4) return 'WARMUP';
    if (beatInCycle >= 4 && beatInCycle < 8) return 'SWING_LEFT';
    if (beatInCycle >= 8 && beatInCycle < 12) return 'SWING_RIGHT';
    if (beatInCycle >= 12 && beatInCycle < 14) return 'DROP';
    return 'CHAOS';
  }

  getCurrentPhase(): RhythmPhase {
    return this.determinePhase({ bass: this.peakBass, mid: this.peakMid, high: this.peakHigh, energy: 0.5 });
  }

  getEnergyTrend(): number {
    if (this.energyHistory.length < 10) return 0;
    const recent = this.energyHistory.slice(-10);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const current = this.energyHistory[this.energyHistory.length - 1];
    return current - avg;
  }

  getBeatCounter(): number {
    return this.beatCounter;
  }

  getBpm(): number {
    return this.estimatedBpm;
  }

  reset(): void {
    this.beatCounter = 0;
    this.lastBeatTime = 0;
    this.beatIntervals = [];
    this.energyHistory = [];
    this.peakBass = 0;
    this.peakMid = 0;
    this.peakHigh = 0;
    this.estimatedBpm = 120;
  }
}

// =============================================================================
// DUAL-MODE CHOREOGRAPHY ENGINE
// =============================================================================

export class DualModeChoreographyEngine {
  private manifest: FrameManifest | null = null;
  private preComputed: PreComputedChoreography | null = null;
  private realTime: RealTimeAnalyzer;
  private songAnalyzer: SongAnalyzer;
  private songMap: SongMap | null = null;

  private mode: EngineMode = 'mic';
  private lastFrameId: string | null = null;
  private transitionGracePeriod: number = 0;
  private gracePeriodStart: number = 0;

  // Progressive analysis for streaming
  private streamAccumulator: AudioData[] = [];
  private lastProgressiveAnalysis: number = 0;
  private partialBpm: number | null = null;

  constructor() {
    this.realTime = new RealTimeAnalyzer();
    this.songAnalyzer = new SongAnalyzer();
  }

  /**
   * Initialize with generated frames to build manifest
   */
  async initializeFrames(
    frames: GeneratedFrame[],
    subjectCategory: SubjectCategory
  ): Promise<void> {
    console.log('[DualModeEngine] Building frame manifest...');
    const builder = new FrameManifestBuilder();
    this.manifest = await builder.buildManifest(frames, subjectCategory);
    console.log(`[DualModeEngine] Manifest ready: ${this.manifest.totalFrameCount} frames`);
  }

  /**
   * Initialize with audio source
   */
  async initializeAudio(audioSource: AudioSource): Promise<void> {
    if (!this.manifest) {
      throw new Error('Frame manifest not initialized. Call initializeFrames() first.');
    }

    if (audioSource.type === 'file' && audioSource.buffer) {
      // File mode: pre-analyze entire song
      this.mode = 'file';
      console.log('[DualModeEngine] Analyzing song...');

      this.songMap = await this.songAnalyzer.analyzeSong(audioSource.buffer);

      const planner = new ChoreographyPlanner(this.manifest);
      const choreoMap = planner.planEntireSong(this.songMap);
      this.preComputed = new PreComputedChoreography(choreoMap);

      console.log(`[DualModeEngine] File mode ready: ${this.songMap.beats.length} beats planned`);

    } else if (audioSource.type === 'stream') {
      // Streaming: start in real-time, accumulate for partial analysis
      this.mode = 'stream';
      this.preComputed = null;
      this.streamAccumulator = [];
      this.partialBpm = null;
      console.log('[DualModeEngine] Stream mode: real-time with progressive analysis');

    } else {
      // Mic: pure real-time
      this.mode = 'mic';
      this.preComputed = null;
      console.log('[DualModeEngine] Mic mode: pure real-time');
    }

    this.realTime.reset();
  }

  /**
   * Main update - call every frame
   */
  update(currentTimeMs: number, liveAudio: AudioData): ChoreographyDecision {
    if (!this.manifest) {
      return this.emptyDecision();
    }

    // Always update real-time analyzer
    this.realTime.update(liveAudio);

    // Handle grace period after mode switch
    if (this.transitionGracePeriod > 0) {
      if (Date.now() - this.gracePeriodStart > this.transitionGracePeriod) {
        this.transitionGracePeriod = 0;
      } else {
        return this.microExpressions(liveAudio);
      }
    }

    // Mode-specific handling
    if (this.preComputed && this.mode === 'file') {
      return this.fileMode(currentTimeMs, liveAudio);
    } else if (this.mode === 'stream') {
      return this.streamMode(currentTimeMs, liveAudio);
    } else {
      return this.liveMode(liveAudio);
    }
  }

  /**
   * FILE MODE: Pre-computed structure + real-time modulation
   */
  private fileMode(timeMs: number, liveAudio: AudioData): ChoreographyDecision {
    const planned = this.preComputed!.getBeatAt(timeMs);

    if (!planned) {
      // Between beats: micro-expressions
      return this.microExpressions(liveAudio);
    }

    // Check if this is a new beat
    const isBeatChange = planned.frameId !== this.lastFrameId;
    this.lastFrameId = planned.frameId;

    // Modulate physics with live energy
    const liveEnergy = liveAudio.energy;
    const plannedEnergy = planned.expectedEnergy;
    const energyRatio = liveEnergy / (plannedEnergy + 0.01);
    const clampedRatio = Math.min(Math.max(energyRatio, 0.7), 1.5);

    return {
      frameId: planned.frameId,
      transitionMode: planned.transitionMode,
      transitionSpeed: planned.transitionSpeed,
      physics: {
        rotX: planned.targetRotation.x * clampedRatio,
        rotY: planned.targetRotation.y * clampedRatio,
        rotZ: planned.targetRotation.z,
        squash: planned.targetSquash * (1 + (clampedRatio - 1) * 0.3),
        bounce: planned.targetBounce * clampedRatio
      },
      fx: {
        mode: planned.fxMode,
        rgbSplit: planned.rgbSplit * clampedRatio,
        flash: planned.flash * clampedRatio
      },
      phase: planned.phase,
      isSignatureMove: planned.isSignatureMove,
      isBeatChange
    };
  }

  /**
   * STREAM MODE: Real-time with progressive analysis
   */
  private streamMode(timeMs: number, liveAudio: AudioData): ChoreographyDecision {
    // Accumulate for progressive analysis
    this.streamAccumulator.push(liveAudio);

    // Re-analyze every 10 seconds
    const now = Date.now();
    if (this.streamAccumulator.length > 600 && // ~10s at 60fps
      now - this.lastProgressiveAnalysis > 10000) {
      this.progressiveAnalyze();
      this.lastProgressiveAnalysis = now;
    }

    // Use real-time analysis
    return this.liveMode(liveAudio);
  }

  /**
   * Progressive analysis for streaming
   */
  private progressiveAnalyze(): void {
    // Estimate BPM from accumulated data
    if (!this.partialBpm && this.streamAccumulator.length > 300) {
      const intervals: number[] = [];
      let lastBeat = 0;

      for (let i = 0; i < this.streamAccumulator.length; i++) {
        if (this.streamAccumulator[i].bass > 0.5) {
          if (lastBeat > 0 && i - lastBeat > 10) { // Minimum gap
            intervals.push((i - lastBeat) * (1000 / 60)); // Convert to ms
          }
          lastBeat = i;
        }
      }

      if (intervals.length >= 4) {
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        this.partialBpm = Math.round(60000 / avgInterval);
        this.partialBpm = Math.max(60, Math.min(200, this.partialBpm));
        console.log(`[DualModeEngine] Progressive BPM detected: ${this.partialBpm}`);
      }
    }
  }

  /**
   * LIVE MODE: Fully real-time
   */
  private liveMode(audio: AudioData): ChoreographyDecision {
    const analysis = this.realTime.analyze(audio);

    if (analysis.beatDetected) {
      // Select frame for this beat
      const frame = this.selectFrameRealTime(analysis.phase, audio);
      const transitionMode = this.selectTransitionRealTime(analysis.phase, audio);
      const physics = this.calculatePhysicsRealTime(analysis.phase, audio);
      const fx = this.calculateFxRealTime(analysis.phase, audio);

      this.lastFrameId = frame.id;

      return {
        frameId: frame.id,
        transitionMode,
        transitionSpeed: 1.0,
        physics,
        fx,
        phase: analysis.phase,
        isSignatureMove: false,
        isBeatChange: true
      };
    }

    // No beat: micro-expressions
    return this.microExpressions(audio);
  }

  /**
   * Micro-expressions between beats
   */
  private microExpressions(audio: AudioData): ChoreographyDecision {
    return {
      frameId: null, // Keep current frame
      transitionMode: null,
      transitionSpeed: 0,
      physics: {
        rotX: audio.bass * 5,
        rotY: audio.mid * 3,
        rotZ: audio.high * 2,
        squash: 1 + audio.energy * 0.05,
        bounce: -audio.bass * 10
      },
      fx: null, // Keep current fx
      phase: this.realTime.getCurrentPhase(),
      isSignatureMove: false,
      isBeatChange: false
    };
  }

  /**
   * Select frame for real-time mode
   */
  private selectFrameRealTime(phase: RhythmPhase, audio: AudioData): ManifestFrame {
    if (!this.manifest) {
      throw new Error('Manifest not initialized');
    }

    // Get pool based on phase
    let pool: ManifestFrame[] = [];

    switch (phase) {
      case 'AMBIENT':
      case 'WARMUP':
        pool = this.manifest.byEnergy.low;
        break;
      case 'SWING_LEFT':
        pool = this.manifest.byDirection.left;
        break;
      case 'SWING_RIGHT':
        pool = this.manifest.byDirection.right;
        break;
      case 'DROP':
      case 'CHAOS':
        pool = this.manifest.byEnergy.high;
        break;
      case 'GROOVE':
        pool = this.manifest.byEnergy.mid;
        break;
      case 'VOGUE':
      case 'FLOW':
        pool = this.manifest.byType.closeup;
        break;
    }

    // Fallback
    if (pool.length === 0) {
      pool = this.manifest.allFrames;
    }

    // Prefer good transitions from previous frame
    if (this.lastFrameId) {
      const prev = this.manifest.allFrames.find(f => f.id === this.lastFrameId);
      if (prev?.preferredTransitions.length) {
        const preferred = pool.filter(f => prev.preferredTransitions.includes(f.id));
        if (preferred.length > 0) {
          pool = preferred;
        }
      }
    }

    // Weighted random
    const totalWeight = pool.reduce((sum, f) => sum + f.weight, 0);
    let r = Math.random() * totalWeight;

    for (const frame of pool) {
      r -= frame.weight;
      if (r <= 0) return frame;
    }

    return pool[0];
  }

  /**
   * Select transition mode for real-time
   */
  private selectTransitionRealTime(phase: RhythmPhase, audio: AudioData): TransitionMode {
    if (phase === 'DROP' && audio.bass > 0.7) return 'CUT';
    if (phase === 'SWING_LEFT' || phase === 'SWING_RIGHT') return 'SLIDE';
    if (phase === 'VOGUE') return 'ZOOM_IN';
    if (audio.energy < 0.3) return 'SMOOTH';
    return 'MORPH';
  }

  /**
   * Calculate physics for real-time
   */
  private calculatePhysicsRealTime(
    phase: RhythmPhase,
    audio: AudioData
  ): ChoreographyDecision['physics'] {
    const intensity = audio.energy;

    let rotX = audio.bass * 35;
    let rotY = audio.mid * 25 * Math.sin(Date.now() * 0.005);
    let rotZ = audio.high * 15;

    // Phase adjustments
    if (phase === 'SWING_LEFT') rotY = -15;
    if (phase === 'SWING_RIGHT') rotY = 15;

    return {
      rotX,
      rotY,
      rotZ,
      squash: 0.85 + (1 - intensity) * 0.15,
      bounce: -50 * intensity
    };
  }

  /**
   * Calculate effects for real-time
   */
  private calculateFxRealTime(
    phase: RhythmPhase,
    audio: AudioData
  ): ChoreographyDecision['fx'] {
    let mode: 'NORMAL' | 'INVERT' | 'BW' | 'STROBE' | 'GHOST' = 'NORMAL';
    let rgbSplit = 0;
    let flash = 0;

    if (phase === 'DROP') {
      flash = 0.6;
      rgbSplit = 0.4;
    }

    if (phase === 'CHAOS' && Math.random() > 0.7) {
      mode = Math.random() > 0.5 ? 'INVERT' : 'BW';
      rgbSplit = 0.3;
    }

    return { mode, rgbSplit, flash };
  }

  /**
   * Empty decision (before initialization)
   */
  private emptyDecision(): ChoreographyDecision {
    return {
      frameId: null,
      transitionMode: null,
      transitionSpeed: 0,
      physics: { rotX: 0, rotY: 0, rotZ: 0, squash: 1, bounce: 0 },
      fx: null,
      phase: 'AMBIENT',
      isSignatureMove: false,
      isBeatChange: false
    };
  }

  // ==========================================================================
  // MODE TRANSITIONS
  // ==========================================================================

  /**
   * Switch audio source (handles mode transitions gracefully)
   */
  async switchSource(newSource: AudioSource): Promise<void> {
    const previousMode = this.mode;
    await this.initializeAudio(newSource);

    // Smooth transition
    if (previousMode !== this.mode) {
      this.transitionGracePeriod = 500;
      this.gracePeriodStart = Date.now();
    }
  }

  /**
   * Upgrade stream to file mode (e.g., when video finishes loading)
   */
  async upgradeToFullAnalysis(completeBuffer: AudioBuffer): Promise<void> {
    if (this.mode === 'stream' && this.manifest) {
      console.log('[DualModeEngine] Upgrading stream to pre-analyzed mode');

      this.songMap = await this.songAnalyzer.analyzeSong(completeBuffer);
      const planner = new ChoreographyPlanner(this.manifest);
      const choreoMap = planner.planEntireSong(this.songMap);
      this.preComputed = new PreComputedChoreography(choreoMap);
      this.mode = 'file';

      console.log('[DualModeEngine] Upgrade complete');
    }
  }

  // ==========================================================================
  // GETTERS
  // ==========================================================================

  getMode(): EngineMode {
    return this.mode;
  }

  getManifest(): FrameManifest | null {
    return this.manifest;
  }

  getSongMap(): SongMap | null {
    return this.songMap;
  }

  getPreComputed(): PreComputedChoreography | null {
    return this.preComputed;
  }

  getRealTimeAnalyzer(): RealTimeAnalyzer {
    return this.realTime;
  }

  getFrameById(id: string): ManifestFrame | undefined {
    return this.manifest?.allFrames.find(f => f.id === id);
  }

  /**
   * Get frame URL by ID (convenience method)
   */
  getFrameUrl(id: string): string | null {
    const frame = this.getFrameById(id);
    return frame?.url || null;
  }

  /**
   * Check if engine is ready
   */
  isReady(): boolean {
    return this.manifest !== null;
  }

  /**
   * Get progress (for file mode only)
   */
  getProgress(): number {
    if (this.mode === 'file' && this.preComputed) {
      return this.preComputed.getProgress();
    }
    return 0;
  }

  /**
   * Reset engine state
   */
  reset(): void {
    this.realTime.reset();
    this.preComputed?.reset();
    this.lastFrameId = null;
    this.streamAccumulator = [];
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export async function createDualModeEngine(
  frames: GeneratedFrame[],
  subjectCategory: SubjectCategory,
  audioSource?: AudioSource
): Promise<DualModeChoreographyEngine> {
  const engine = new DualModeChoreographyEngine();

  // Initialize frames
  await engine.initializeFrames(frames, subjectCategory);

  // Initialize audio if provided
  if (audioSource) {
    await engine.initializeAudio(audioSource);
  }

  return engine;
}
