/**
 * CHOREOGRAPHY PLANNER
 *
 * Pre-computes dance decisions for an entire song based on:
 * - Song structure (sections, drops, buildups)
 * - Frame manifest (available poses and their properties)
 * - Beat positions and strengths
 *
 * Output: A complete choreography map that can be played back with simple lookups.
 */

import { FrameManifest, ManifestFrame } from './FrameManifest';
import { SongMap, SongSection, BeatMarker, RepeatedPattern, getSectionAtTime, getPatternAtTime, isInBuildup } from './SongAnalyzer';
import { RhythmPhase, TransitionMode } from './KineticEngine';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface BeatChoreography {
  beatIndex: number;
  timestamp: number;

  // Frame selection
  frameId: string;
  transitionMode: TransitionMode;
  transitionSpeed: number;

  // Physics targets
  targetRotation: { x: number; y: number; z: number };
  targetSquash: number;
  targetBounce: number;

  // Effects
  fxMode: 'NORMAL' | 'INVERT' | 'BW' | 'STROBE' | 'GHOST';
  rgbSplit: number;
  flash: number;

  // Metadata
  phase: RhythmPhase;
  sectionType: string;
  isSignatureMove: boolean;
  patternId?: string;
  expectedEnergy: number;
}

export interface ChoreographyMood {
  energyLevel: 'ambient' | 'groove' | 'hype' | 'peak';
  framePool: string[];
  transitionSpeed: number;
  stutterProbability: number;
  closeupProbability: number;
}

export interface MoveSequence {
  patternId: string;
  moves: BeatChoreography[];
}

export interface ChoreographyMap {
  beatAssignments: BeatChoreography[];
  sectionMoods: Map<number, ChoreographyMood>;
  signatureMoves: Map<string, MoveSequence>;

  // Metadata
  songDuration: number;
  bpm: number;
  totalBeats: number;
}

// =============================================================================
// CHOREOGRAPHY PLANNER
// =============================================================================

export class ChoreographyPlanner {
  private manifest: FrameManifest;
  private bpm: number = 120;
  private lastFrameId: string | null = null;

  constructor(manifest: FrameManifest) {
    this.manifest = manifest;
  }

  /**
   * Plan choreography for entire song
   */
  planEntireSong(songMap: SongMap): ChoreographyMap {
    console.time('[ChoreographyPlanner] Planning');

    this.bpm = songMap.bpm;
    const beatAssignments: BeatChoreography[] = [];
    const sectionMoods = new Map<number, ChoreographyMood>();
    const signatureMoves = new Map<string, MoveSequence>();

    // 1. Assign moods to each section
    for (const section of songMap.sections) {
      sectionMoods.set(section.startBeat, this.moodForSection(section));
    }

    // 2. Create signature move sequences for repeated patterns
    for (const pattern of songMap.patterns) {
      if (pattern.occurrences.length >= 2) {
        const sequence = this.generateSignatureSequence(pattern, songMap);
        signatureMoves.set(pattern.id, sequence);
      }
    }

    // 3. Plan each beat
    const patternSequenceIndex = new Map<string, number>();
    let currentSection = songMap.sections[0];
    let currentMood = sectionMoods.get(0);
    this.lastFrameId = null;

    for (const beat of songMap.beats) {
      // Update current section
      const section = getSectionAtTime(songMap, beat.time);
      if (section && section !== currentSection) {
        currentSection = section;
        currentMood = sectionMoods.get(section.startBeat);
      }

      // Check if we're in a repeated pattern
      const activePattern = getPatternAtTime(songMap, beat.time);
      let choreography: BeatChoreography;

      if (activePattern && signatureMoves.has(activePattern.id)) {
        // Use signature move sequence
        const sequence = signatureMoves.get(activePattern.id)!;
        const seqIndex = patternSequenceIndex.get(activePattern.id) || 0;
        const baseMove = sequence.moves[seqIndex % sequence.moves.length];

        choreography = {
          ...baseMove,
          beatIndex: beat.index,
          timestamp: beat.time,
          isSignatureMove: true,
          patternId: activePattern.id
        };

        patternSequenceIndex.set(activePattern.id, seqIndex + 1);
        this.lastFrameId = choreography.frameId;
      } else {
        // Generate based on section mood + beat strength
        choreography = this.planBeat(
          beat,
          currentSection,
          currentMood,
          songMap,
          isInBuildup(songMap, beat.time) !== null
        );
      }

      beatAssignments.push(choreography);
    }

    console.timeEnd('[ChoreographyPlanner] Planning');
    console.log(`[ChoreographyPlanner] Planned ${beatAssignments.length} beats, ${signatureMoves.size} signature sequences`);

    return {
      beatAssignments,
      sectionMoods,
      signatureMoves,
      songDuration: songMap.duration,
      bpm: songMap.bpm,
      totalBeats: songMap.beats.length
    };
  }

  /**
   * Determine mood for a section
   */
  private moodForSection(section: SongSection): ChoreographyMood {
    const energy = section.energy;
    const type = section.type;

    let energyLevel: ChoreographyMood['energyLevel'] = 'groove';
    let transitionSpeed = 1.0;
    let stutterProbability = 0.2;
    let closeupProbability = 0.1;

    if (type === 'drop' || energy > 0.8) {
      energyLevel = 'peak';
      transitionSpeed = 2.0;
      stutterProbability = 0.5;
      closeupProbability = 0.05;
    } else if (type === 'chorus' || energy > 0.6) {
      energyLevel = 'hype';
      transitionSpeed = 1.5;
      stutterProbability = 0.3;
      closeupProbability = 0.1;
    } else if (type === 'breakdown' || type === 'intro' || energy < 0.3) {
      energyLevel = 'ambient';
      transitionSpeed = 0.5;
      stutterProbability = 0.05;
      closeupProbability = 0.2;
    }

    // Select frame pool based on energy level
    const framePool = this.getFramePoolForEnergy(energyLevel);

    return {
      energyLevel,
      framePool: framePool.map(f => f.id),
      transitionSpeed,
      stutterProbability,
      closeupProbability
    };
  }

  /**
   * Get frame pool for energy level
   */
  private getFramePoolForEnergy(level: ChoreographyMood['energyLevel']): ManifestFrame[] {
    switch (level) {
      case 'peak':
        return [...this.manifest.byEnergy.high, ...this.manifest.byType.closeup.slice(0, 2)];
      case 'hype':
        return [...this.manifest.byEnergy.high, ...this.manifest.byEnergy.mid];
      case 'groove':
        return [...this.manifest.byEnergy.mid, ...this.manifest.byEnergy.low.slice(0, 3)];
      case 'ambient':
        return [...this.manifest.byEnergy.low, ...this.manifest.byType.closeup];
      default:
        return this.manifest.allFrames;
    }
  }

  /**
   * Generate signature move sequence for a repeated pattern
   */
  private generateSignatureSequence(pattern: RepeatedPattern, songMap: SongMap): MoveSequence {
    const beatInterval = 60000 / this.bpm;
    const beatCount = Math.ceil(pattern.duration / beatInterval);
    const moves: BeatChoreography[] = [];

    // Use high-energy frames for patterns (they're usually hooks/choruses)
    const pool = pattern.energy > 0.5
      ? this.manifest.byEnergy.high
      : this.manifest.byEnergy.mid;

    if (pool.length === 0) {
      // Fallback to all frames
      return { patternId: pattern.id, moves: [] };
    }

    // Create memorable, repeatable sequence
    for (let i = 0; i < beatCount; i++) {
      const frameIndex = i % pool.length;
      const frame = pool[frameIndex];

      // Determine transition mode based on position in pattern
      let transitionMode: TransitionMode = 'CUT';
      if (i % 4 === 0) transitionMode = 'CUT';
      else if (i % 2 === 0) transitionMode = 'SLIDE';
      else transitionMode = 'SMOOTH';

      // Physics targets for signature moves are more dramatic
      const rotX = (i % 2 === 0) ? 25 : -15;
      const rotY = (i % 4 < 2) ? 10 : -10;

      moves.push({
        beatIndex: i,
        timestamp: 0, // Relative to pattern start
        frameId: frame.id,
        transitionMode,
        transitionSpeed: 1.5,
        targetRotation: { x: rotX, y: rotY, z: 0 },
        targetSquash: i % 4 === 0 ? 0.85 : 0.95,
        targetBounce: i % 4 === 0 ? -40 : -20,
        fxMode: 'NORMAL',
        rgbSplit: i % 4 === 0 ? 0.5 : 0,
        flash: i % 4 === 0 ? 0.3 : 0,
        phase: 'DROP',
        sectionType: 'chorus',
        isSignatureMove: true,
        patternId: pattern.id,
        expectedEnergy: pattern.energy
      });
    }

    return { patternId: pattern.id, moves };
  }

  /**
   * Plan a single beat
   */
  private planBeat(
    beat: BeatMarker,
    section: SongSection | null,
    mood: ChoreographyMood | undefined,
    songMap: SongMap,
    inBuildup: boolean
  ): BeatChoreography {
    // Determine phase based on beat position and section
    const phase = this.determinePhase(beat, section, inBuildup);

    // Get energy level from section or default
    const sectionEnergy = section?.energy || 0.5;

    // Select frame
    const frame = this.selectFrame(phase, mood, beat);

    // Determine transition mode
    const transitionMode = this.selectTransitionMode(phase, beat, frame);

    // Calculate physics targets
    const physics = this.calculatePhysics(phase, beat, sectionEnergy);

    // Determine effects
    const effects = this.determineEffects(phase, beat, inBuildup);

    return {
      beatIndex: beat.index,
      timestamp: beat.time,
      frameId: frame.id,
      transitionMode,
      transitionSpeed: mood?.transitionSpeed || 1.0,
      targetRotation: physics.rotation,
      targetSquash: physics.squash,
      targetBounce: physics.bounce,
      fxMode: effects.fxMode,
      rgbSplit: effects.rgbSplit,
      flash: effects.flash,
      phase,
      sectionType: section?.type || 'verse',
      isSignatureMove: false,
      expectedEnergy: sectionEnergy
    };
  }

  /**
   * Determine rhythm phase for a beat
   */
  private determinePhase(
    beat: BeatMarker,
    section: SongSection | null,
    inBuildup: boolean
  ): RhythmPhase {
    const beatInBar = beat.index % 16;

    // Section-based overrides
    if (section?.type === 'drop') return 'DROP';
    if (section?.type === 'breakdown') return 'AMBIENT';
    if (inBuildup) return 'WARMUP';

    // Beat-position based phases (16-beat cycle)
    if (beatInBar < 4) return 'WARMUP';
    if (beatInBar >= 4 && beatInBar < 8) return 'SWING_LEFT';
    if (beatInBar >= 8 && beatInBar < 12) return 'SWING_RIGHT';
    if (beatInBar >= 12 && beatInBar < 14) return 'DROP';
    return 'CHAOS';
  }

  /**
   * Select frame for a beat
   */
  private selectFrame(
    phase: RhythmPhase,
    mood: ChoreographyMood | undefined,
    beat: BeatMarker
  ): ManifestFrame {
    // Get pool based on phase
    let pool: ManifestFrame[] = [];

    // Phase-based pool selection
    switch (phase) {
      case 'AMBIENT':
      case 'WARMUP':
        pool = this.manifest.byEnergy.low;
        break;
      case 'SWING_LEFT':
        pool = this.manifest.byDirection.left.filter(f => f.energy !== 'low');
        if (pool.length === 0) pool = this.manifest.byEnergy.mid;
        break;
      case 'SWING_RIGHT':
        pool = this.manifest.byDirection.right.filter(f => f.energy !== 'low');
        if (pool.length === 0) pool = this.manifest.byEnergy.mid;
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
      default:
        pool = this.manifest.allFrames;
    }

    // Fallback if pool is empty
    if (pool.length === 0) {
      pool = this.manifest.allFrames;
    }

    // Prefer frames that transition well from previous
    if (this.lastFrameId) {
      const prev = this.manifest.allFrames.find(f => f.id === this.lastFrameId);
      if (prev?.preferredTransitions.length) {
        const preferred = pool.filter(f => prev.preferredTransitions.includes(f.id));
        if (preferred.length > 0) {
          pool = preferred;
        }
      }
    }

    // Weighted random selection
    const selected = this.weightedSelect(pool);
    this.lastFrameId = selected.id;
    return selected;
  }

  /**
   * Weighted random selection from frame pool
   */
  private weightedSelect(pool: ManifestFrame[]): ManifestFrame {
    if (pool.length === 0) {
      return this.manifest.allFrames[0];
    }

    const totalWeight = pool.reduce((sum, f) => sum + f.weight, 0);
    let r = Math.random() * totalWeight;

    for (const frame of pool) {
      r -= frame.weight;
      if (r <= 0) return frame;
    }

    return pool[0];
  }

  /**
   * Select transition mode based on phase and beat
   */
  private selectTransitionMode(
    phase: RhythmPhase,
    beat: BeatMarker,
    frame: ManifestFrame
  ): TransitionMode {
    // Downbeats get hard cuts
    if (beat.isDownbeat && phase === 'DROP') {
      return 'CUT';
    }

    // Closeups get zoom transitions
    if (frame.type === 'closeup') {
      return 'ZOOM_IN';
    }

    // Directional moves get slides
    if (phase === 'SWING_LEFT' || phase === 'SWING_RIGHT') {
      return 'SLIDE';
    }

    // Ambient/slow sections get smooth
    if (phase === 'AMBIENT' || phase === 'WARMUP') {
      return 'SMOOTH';
    }

    // Default based on beat strength
    if (beat.strength > 0.7) {
      return 'CUT';
    }

    return 'MORPH';
  }

  /**
   * Calculate physics targets for a beat
   */
  private calculatePhysics(
    phase: RhythmPhase,
    beat: BeatMarker,
    sectionEnergy: number
  ): { rotation: { x: number; y: number; z: number }; squash: number; bounce: number } {
    const intensity = beat.strength * sectionEnergy;

    // Base rotation from phase
    let rotX = 0, rotY = 0, rotZ = 0;

    switch (phase) {
      case 'DROP':
      case 'CHAOS':
        rotX = intensity * 35;
        rotZ = (Math.random() - 0.5) * 10;
        break;
      case 'SWING_LEFT':
        rotY = -15 * intensity;
        rotZ = -5 * intensity;
        break;
      case 'SWING_RIGHT':
        rotY = 15 * intensity;
        rotZ = 5 * intensity;
        break;
      case 'GROOVE':
        rotX = 10 * intensity;
        rotY = Math.sin(beat.index * 0.5) * 8;
        break;
      case 'AMBIENT':
        rotX = 3 * intensity;
        break;
    }

    // Squash/bounce on downbeats
    const squash = beat.isDownbeat ? 0.85 + (1 - intensity) * 0.1 : 0.95;
    const bounce = beat.isDownbeat ? -50 * intensity : -20 * intensity;

    return {
      rotation: { x: rotX, y: rotY, z: rotZ },
      squash,
      bounce
    };
  }

  /**
   * Determine visual effects for a beat
   */
  private determineEffects(
    phase: RhythmPhase,
    beat: BeatMarker,
    inBuildup: boolean
  ): { fxMode: BeatChoreography['fxMode']; rgbSplit: number; flash: number } {
    let fxMode: BeatChoreography['fxMode'] = 'NORMAL';
    let rgbSplit = 0;
    let flash = 0;

    // Drops get flash
    if (phase === 'DROP' && beat.isDownbeat) {
      flash = 0.6;
      rgbSplit = 0.4;
    }

    // Chaos gets random effects
    if (phase === 'CHAOS') {
      const rand = Math.random();
      if (rand > 0.8) fxMode = 'INVERT';
      else if (rand > 0.6) fxMode = 'BW';
      rgbSplit = rand > 0.5 ? 0.3 : 0;
    }

    // Buildups get progressive flash
    if (inBuildup && beat.isDownbeat) {
      flash = 0.3;
    }

    return { fxMode, rgbSplit, flash };
  }
}

// =============================================================================
// PRE-COMPUTED CHOREOGRAPHY PLAYBACK
// =============================================================================

export class PreComputedChoreography {
  private map: ChoreographyMap;
  private currentBeatIndex: number = 0;

  constructor(map: ChoreographyMap) {
    this.map = map;
  }

  /**
   * Get choreography for current time
   */
  update(currentTimeMs: number): BeatChoreography | null {
    const beatInterval = 60000 / this.map.bpm;
    const beatIndex = Math.floor(currentTimeMs / beatInterval);

    if (beatIndex !== this.currentBeatIndex && beatIndex < this.map.beatAssignments.length) {
      this.currentBeatIndex = beatIndex;
      return this.map.beatAssignments[beatIndex];
    }

    return null;
  }

  /**
   * Get beat at specific time
   */
  getBeatAt(timeMs: number): BeatChoreography | null {
    const beatInterval = 60000 / this.map.bpm;
    const beatIndex = Math.floor(timeMs / beatInterval);

    if (beatIndex >= 0 && beatIndex < this.map.beatAssignments.length) {
      return this.map.beatAssignments[beatIndex];
    }

    return null;
  }

  /**
   * Look ahead with 100% accuracy
   */
  peekAhead(beats: number): BeatChoreography[] {
    const start = this.currentBeatIndex;
    const end = Math.min(start + beats, this.map.beatAssignments.length);
    return this.map.beatAssignments.slice(start, end);
  }

  /**
   * Check if signature move is coming
   */
  isSignatureMoveComing(withinBeats: number): { patternId: string; inBeats: number } | null {
    for (let i = 0; i < withinBeats; i++) {
      const index = this.currentBeatIndex + i;
      if (index >= this.map.beatAssignments.length) break;

      const beat = this.map.beatAssignments[index];
      if (beat.isSignatureMove && beat.patternId) {
        return { patternId: beat.patternId, inBeats: i };
      }
    }

    return null;
  }

  /**
   * Get current section mood
   */
  getCurrentMood(): ChoreographyMood | null {
    const current = this.map.beatAssignments[this.currentBeatIndex];
    if (!current) return null;

    // Find the most recent mood
    let lastMoodBeat = 0;
    for (const [beatIndex] of this.map.sectionMoods) {
      if (beatIndex <= this.currentBeatIndex && beatIndex > lastMoodBeat) {
        lastMoodBeat = beatIndex;
      }
    }

    return this.map.sectionMoods.get(lastMoodBeat) || null;
  }

  /**
   * Get progress through song (0-1)
   */
  getProgress(): number {
    return this.currentBeatIndex / this.map.totalBeats;
  }

  /**
   * Reset to beginning
   */
  reset(): void {
    this.currentBeatIndex = 0;
  }
}
