/**
 * useKineticEngine - React Hook for Kinetic Core Integration
 *
 * This hook provides a clean React interface for the KineticEngine,
 * handling initialization, frame updates, and state management.
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import {
  KineticEngine,
  createKineticEngine,
  KineticState,
  TransitionMode,
  MechanicalFX,
  RhythmPhase,
  LookaheadResult,
  MechanicalMultiplier,
  MechanicalFrame
} from '../engine/KineticEngine';
import { GeneratedFrame, EnergyLevel, MoveDirection } from '../types';
import { EnhancedAudioAnalysis } from './useAudioAnalyzer';

export interface KineticEngineOutput {
  frame: GeneratedFrame | null;
  transitionMode: TransitionMode;
  shouldTransition: boolean;
  mechanicalFx: MechanicalFX;
  phase: RhythmPhase;
  lookahead: LookaheadResult;
  state: KineticState;
}

export interface KineticEngineHook {
  // State
  isInitialized: boolean;
  currentOutput: KineticEngineOutput | null;
  expandedFrames: MechanicalFrame[];

  // Methods
  initialize: (frames: GeneratedFrame[]) => Promise<void>;
  update: (audioData: EnhancedAudioAnalysis) => KineticEngineOutput;
  forceTransition: (nodeId: string) => void;
  setBPM: (bpm: number) => void;

  // Direct access (for advanced use)
  engine: KineticEngine | null;
}

export const useKineticEngine = (): KineticEngineHook => {
  const engineRef = useRef<KineticEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentOutput, setCurrentOutput] = useState<KineticEngineOutput | null>(null);
  const [expandedFrames, setExpandedFrames] = useState<MechanicalFrame[]>([]);

  // Initialize engine on mount
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = createKineticEngine();
    }
    return () => {
      engineRef.current = null;
    };
  }, []);

  /**
   * Initialize the engine with generated frames
   * Also expands frames using mechanical multipliers
   */
  const initialize = useCallback(async (frames: GeneratedFrame[]): Promise<void> => {
    if (!engineRef.current) {
      engineRef.current = createKineticEngine();
    }

    // Expand frame pool with mechanical multipliers
    const expanded = await MechanicalMultiplier.expandFramePool(frames, {
      enableMirror: true,
      enableZoom: true,
      zoomFactors: [1.25, 1.6]
    });

    setExpandedFrames(expanded);

    // Convert MechanicalFrames back to GeneratedFrames for the engine
    const engineFrames: GeneratedFrame[] = expanded.map(mf => ({
      url: mf.url,
      pose: mf.pose,
      energy: mf.energy,
      direction: mf.direction,
      type: mf.type
    }));

    engineRef.current.initialize(engineFrames);
    setIsInitialized(true);
  }, []);

  /**
   * Update the engine with new audio data
   * Call this every frame in the animation loop
   */
  const update = useCallback((audioData: EnhancedAudioAnalysis): KineticEngineOutput => {
    if (!engineRef.current) {
      const defaultOutput: KineticEngineOutput = {
        frame: null,
        transitionMode: 'CUT',
        shouldTransition: false,
        mechanicalFx: 'none',
        phase: 'AMBIENT',
        lookahead: {
          predictedEnergy: 0,
          predictedBass: 0,
          predictedMid: 0,
          predictedHigh: 0,
          impactIn: -1,
          trend: 'stable'
        },
        state: {
          currentNode: 'idle',
          currentFrame: null,
          phase: 'AMBIENT',
          beatPosition: 0,
          beatCounter: 0,
          lastTransitionTime: 0,
          isStuttering: false,
          isCloseupLocked: false,
          closeupLockUntil: 0
        }
      };
      return defaultOutput;
    }

    // Update BPM if detected
    if (audioData.bpm !== 120) {
      engineRef.current.setBPM(audioData.bpm);
    }

    const now = performance.now();
    const result = engineRef.current.update(now, {
      bass: audioData.bass,
      mid: audioData.mid,
      high: audioData.high,
      energy: audioData.energy
    });

    const output: KineticEngineOutput = {
      ...result,
      state: engineRef.current.getState()
    };

    setCurrentOutput(output);
    return output;
  }, []);

  /**
   * Force transition to a specific node
   */
  const forceTransition = useCallback((nodeId: string): void => {
    if (engineRef.current) {
      engineRef.current.forceTransition(nodeId);
    }
  }, []);

  /**
   * Set BPM manually
   */
  const setBPM = useCallback((bpm: number): void => {
    if (engineRef.current) {
      engineRef.current.setBPM(bpm);
    }
  }, []);

  return {
    isInitialized,
    currentOutput,
    expandedFrames,
    initialize,
    update,
    forceTransition,
    setBPM,
    engine: engineRef.current
  };
};

/**
 * Type guards and utilities
 */
export const isHighEnergyPhase = (phase: RhythmPhase): boolean => {
  return ['DROP', 'CHAOS', 'GROOVE'].includes(phase);
};

export const isLowEnergyPhase = (phase: RhythmPhase): boolean => {
  return ['AMBIENT', 'WARMUP'].includes(phase);
};

export const getPhaseColor = (phase: RhythmPhase): string => {
  const colors: Record<RhythmPhase, string> = {
    AMBIENT: '#4a5568',   // Gray
    WARMUP: '#ed8936',    // Orange
    SWING_LEFT: '#48bb78', // Green
    SWING_RIGHT: '#4299e1', // Blue
    DROP: '#f56565',      // Red
    CHAOS: '#ed64a6',     // Pink
    GROOVE: '#9f7aea',    // Purple
    VOGUE: '#667eea',     // Indigo
    FLOW: '#38b2ac'       // Teal
  };
  return colors[phase] || '#ffffff';
};
