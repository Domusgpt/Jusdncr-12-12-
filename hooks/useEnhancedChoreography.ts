/**
 * ENHANCED CHOREOGRAPHY HOOK
 *
 * Unified hook that combines:
 * - Enhanced audio analysis (multi-band, spectral)
 * - Laban effort mapping
 * - Motion grammar sequencing
 * - Physics modulation
 *
 * Provides a single interface for Step4Preview to consume
 */

import { useRef, useCallback, useMemo } from 'react';
import { EnhancedAudioAnalyzer, EnhancedAudioFeatures } from '../engine/EnhancedAudioAnalyzer';
import {
  analyzeMovementQualities,
  MovementQualities,
  AudioSignature,
  effortToPhysics,
  effortToTransitionMode,
  danceStyleToPoolWeights,
  FramePoolWeights,
  PhysicsModifiers,
  TransitionMode as LabanTransitionMode
} from '../engine/LabanEffortSystem';
import {
  MotionGrammar,
  ChoreographySequencer,
  MoveDescriptor
} from '../engine/MotionGrammar';
import { EnergyLevel, MoveDirection, GeneratedFrame, FrameType } from '../types';

// =============================================================================
// TYPES
// =============================================================================

export interface ChoreographyState {
  // Current move descriptor
  currentMove: MoveDescriptor | null;

  // Movement qualities from Laban analysis
  movementQualities: MovementQualities;

  // Physics parameters
  physics: PhysicsModifiers;

  // Preferred transition mode
  transitionMode: LabanTransitionMode;

  // Frame pool weights
  poolWeights: FramePoolWeights;

  // Audio features
  audio: EnhancedAudioFeatures;

  // Timing
  shouldTransition: boolean;
  isOnBeat: boolean;
  isPhraseBoundary: boolean;
}

export interface FrameSelection {
  frame: GeneratedFrame | null;
  direction: MoveDirection;
  energy: EnergyLevel;
  transitionMode: LabanTransitionMode;
}

interface FramePools {
  low: GeneratedFrame[];
  mid: GeneratedFrame[];
  high: GeneratedFrame[];
  closeup: GeneratedFrame[];
  left: GeneratedFrame[];
  right: GeneratedFrame[];
}

// =============================================================================
// HOOK
// =============================================================================

export function useEnhancedChoreography() {
  // Core systems
  const analyzerRef = useRef<EnhancedAudioAnalyzer | null>(null);
  const sequencerRef = useRef<ChoreographySequencer | null>(null);

  // State tracking
  const lastAnalysisRef = useRef<EnhancedAudioFeatures | null>(null);
  const lastMoveTimeRef = useRef<number>(0);
  const currentMoveRef = useRef<MoveDescriptor | null>(null);

  // Frame pool cache
  const framePoolsRef = useRef<FramePools>({
    low: [],
    mid: [],
    high: [],
    closeup: [],
    left: [],
    right: []
  });

  /**
   * Initialize systems lazily
   */
  const getAnalyzer = useCallback(() => {
    if (!analyzerRef.current) {
      analyzerRef.current = new EnhancedAudioAnalyzer();
    }
    return analyzerRef.current;
  }, []);

  const getSequencer = useCallback(() => {
    if (!sequencerRef.current) {
      sequencerRef.current = new ChoreographySequencer();
    }
    return sequencerRef.current;
  }, []);

  /**
   * Process audio data and get choreography state
   */
  const processAudio = useCallback((
    frequencyData: Uint8Array,
    currentTime: number
  ): ChoreographyState => {
    const analyzer = getAnalyzer();
    const sequencer = getSequencer();

    // Analyze audio
    const audio = analyzer.analyze(frequencyData);
    lastAnalysisRef.current = audio;

    // Update sequencer BPM
    sequencer.setBPM(audio.bpm);

    // Build audio signature for Laban analysis
    const audioSignature: AudioSignature = {
      bass: audio.bass,
      mid: audio.mid,
      high: audio.high,
      energy: audio.energy,
      bassOnset: audio.onsets.kickDetected ? 1 : audio.onsets.kick,
      snareOnset: audio.onsets.snareDetected ? 1 : audio.onsets.snare,
      hihatOnset: audio.onsets.hihatDetected ? 1 : audio.onsets.hihat,
      spectralCentroid: audio.spectral.centroid,
      spectralFlux: audio.spectral.flux,
      rmsEnergy: audio.energy
    };

    // Get movement qualities from Laban analysis
    const movementQualities = analyzeMovementQualities(audioSignature);

    // Get physics modifiers
    const physics = effortToPhysics(movementQualities.effort, movementQualities.intensity);

    // Get preferred transition mode
    const transitionMode = effortToTransitionMode(movementQualities.effort);

    // Get frame pool weights based on dance style
    const poolWeights = danceStyleToPoolWeights(
      movementQualities.danceStyle,
      audio.phrase.beatInPhrase / 32
    );

    // Get next move from sequencer
    const nextMove = sequencer.getNextMove(
      movementQualities.effort,
      audio.phrase.phraseSection,
      audio.phrase.beatInPhrase,
      audio.phrase.isDownbeat,
      currentTime
    );

    if (nextMove) {
      currentMoveRef.current = nextMove;
      lastMoveTimeRef.current = currentTime;
    }

    // Determine if we should transition
    const shouldTransition = nextMove !== null ||
      (audio.onsets.kickDetected && audio.phrase.isDownbeat);

    return {
      currentMove: currentMoveRef.current,
      movementQualities,
      physics,
      transitionMode,
      poolWeights,
      audio,
      shouldTransition,
      isOnBeat: audio.phrase.isDownbeat,
      isPhraseBoundary: audio.phrase.isPhraseBoundary
    };
  }, [getAnalyzer, getSequencer]);

  /**
   * Update frame pools (call when frames change)
   */
  const updateFramePools = useCallback((frames: GeneratedFrame[]) => {
    const pools: FramePools = {
      low: [],
      mid: [],
      high: [],
      closeup: [],
      left: [],
      right: []
    };

    for (const frame of frames) {
      // By energy
      if (frame.energy === 'low') pools.low.push(frame);
      else if (frame.energy === 'mid') pools.mid.push(frame);
      else if (frame.energy === 'high') pools.high.push(frame);

      // By type
      if (frame.type === 'closeup') pools.closeup.push(frame);

      // By direction
      if (frame.direction === 'left') pools.left.push(frame);
      else if (frame.direction === 'right') pools.right.push(frame);
    }

    // Ensure fallbacks
    if (pools.low.length === 0 && frames.length > 0) {
      pools.low = [frames[0]];
    }
    if (pools.mid.length === 0) pools.mid = [...pools.low];
    if (pools.high.length === 0) pools.high = [...pools.mid];

    framePoolsRef.current = pools;
  }, []);

  /**
   * Select frame based on current choreography state
   */
  const selectFrame = useCallback((
    state: ChoreographyState,
    currentPose: string
  ): FrameSelection => {
    const pools = framePoolsRef.current;
    const weights = state.poolWeights;
    const move = state.currentMove;

    // Determine target energy and direction
    let targetEnergy: EnergyLevel = move?.energy || 'mid';
    let targetDirection: MoveDirection = move?.direction || 'center';

    // Build weighted pool
    const weightedPool: GeneratedFrame[] = [];

    // Add by energy weight
    const addWithWeight = (pool: GeneratedFrame[], weight: number) => {
      const count = Math.ceil(pool.length * weight * 3);
      for (let i = 0; i < count && pool.length > 0; i++) {
        weightedPool.push(pool[Math.floor(Math.random() * pool.length)]);
      }
    };

    addWithWeight(pools.low, weights.lowEnergy);
    addWithWeight(pools.mid, weights.midEnergy);
    addWithWeight(pools.high, weights.highEnergy);
    addWithWeight(pools.closeup, weights.closeup);

    // Add direction-specific frames
    if (weights.preferLeft && targetDirection !== 'right') {
      addWithWeight(pools.left, 1.5);
    }
    if (weights.preferRight && targetDirection !== 'left') {
      addWithWeight(pools.right, 1.5);
    }

    // If no weighted pool, fall back to mid
    if (weightedPool.length === 0) {
      weightedPool.push(...pools.mid);
    }
    if (weightedPool.length === 0 && pools.low.length > 0) {
      weightedPool.push(...pools.low);
    }

    // Filter by target direction if specified
    let filteredPool = weightedPool;
    if (targetDirection !== 'center') {
      const directionMatches = weightedPool.filter(f => f.direction === targetDirection);
      if (directionMatches.length > 0) {
        filteredPool = directionMatches;
      }
    }

    // Avoid same pose if possible
    let candidates = filteredPool.filter(f => f.pose !== currentPose);
    if (candidates.length === 0) {
      candidates = filteredPool;
    }

    // Select random from candidates
    const selected = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : null;

    return {
      frame: selected,
      direction: selected?.direction || targetDirection,
      energy: selected?.energy || targetEnergy,
      transitionMode: move?.transitionMode || state.transitionMode
    };
  }, []);

  /**
   * Get simplified audio data for legacy compatibility
   */
  const getSimpleAudioData = useCallback(() => {
    const audio = lastAnalysisRef.current;
    if (!audio) {
      return { bass: 0, mid: 0, high: 0, energy: 0 };
    }
    return {
      bass: audio.bass,
      mid: audio.mid,
      high: audio.high,
      energy: audio.energy
    };
  }, []);

  /**
   * Reset all systems
   */
  const reset = useCallback(() => {
    analyzerRef.current?.reset();
    sequencerRef.current?.reset();
    currentMoveRef.current = null;
    lastMoveTimeRef.current = 0;
    lastAnalysisRef.current = null;
  }, []);

  /**
   * Get current BPM
   */
  const getBPM = useCallback(() => {
    return analyzerRef.current?.getBPM() || 120;
  }, []);

  /**
   * Get current beat count
   */
  const getBeatCount = useCallback(() => {
    return analyzerRef.current?.getBeatCounter() || 0;
  }, []);

  return {
    processAudio,
    updateFramePools,
    selectFrame,
    getSimpleAudioData,
    reset,
    getBPM,
    getBeatCount
  };
}
