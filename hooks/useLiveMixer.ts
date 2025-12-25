/**
 * useLiveMixer - React hook for the VJ-style live mixing system
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import {
  LiveMixer,
  createLiveMixer,
  EngineType,
  PatternType,
  EffectsRackState,
  MixedOutput,
  AudioData,
  LiveMixerState
} from '../engine/LiveMixer';
import type { GeneratedFrame, SubjectCategory } from '../types';

export interface UseLiveMixerReturn {
  // Initialization
  isReady: boolean;
  loadDeckA: (frames: GeneratedFrame[], category: SubjectCategory) => void;
  loadDeckB: (frames: GeneratedFrame[], category: SubjectCategory) => void;

  // Engine control
  setDeckAEngine: (type: EngineType) => void;
  setDeckBEngine: (type: EngineType) => void;
  availableEngines: EngineType[];

  // Pattern control
  setDeckAPattern: (pattern: PatternType) => void;
  setDeckBPattern: (pattern: PatternType) => void;
  availablePatterns: PatternType[];

  // Crossfader
  crossfader: number;
  setCrossfader: (value: number) => void;

  // Effects rack
  effects: EffectsRackState;
  setEffect: (effect: keyof EffectsRackState, value: number | boolean) => void;

  // Update (call in animation loop)
  update: (audio: AudioData) => MixedOutput | null;

  // State
  state: LiveMixerState | null;
}

export function useLiveMixer(): UseLiveMixerReturn {
  const mixerRef = useRef<LiveMixer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [crossfader, setCrossfaderState] = useState(0);
  const [effects, setEffectsState] = useState<EffectsRackState>({
    rgbSplit: 0,
    flash: 0,
    invert: false,
    grayscale: false,
    glitch: 0,
    mirror: false,
    zoomPulse: 0,
    strobe: false
  });
  const [state, setState] = useState<LiveMixerState | null>(null);

  // Initialize mixer
  useEffect(() => {
    mixerRef.current = createLiveMixer();
    setIsReady(true);
    return () => {
      mixerRef.current = null;
    };
  }, []);

  // Load frames into Deck A
  const loadDeckA = useCallback((frames: GeneratedFrame[], category: SubjectCategory) => {
    if (mixerRef.current) {
      mixerRef.current.loadDeckA(frames, category);
      setState(mixerRef.current.getState());
    }
  }, []);

  // Load frames into Deck B
  const loadDeckB = useCallback((frames: GeneratedFrame[], category: SubjectCategory) => {
    if (mixerRef.current) {
      mixerRef.current.loadDeckB(frames, category);
      setState(mixerRef.current.getState());
    }
  }, []);

  // Set engine for Deck A
  const setDeckAEngine = useCallback((type: EngineType) => {
    if (mixerRef.current) {
      mixerRef.current.setDeckAEngine(type);
      setState(mixerRef.current.getState());
    }
  }, []);

  // Set engine for Deck B
  const setDeckBEngine = useCallback((type: EngineType) => {
    if (mixerRef.current) {
      mixerRef.current.setDeckBEngine(type);
      setState(mixerRef.current.getState());
    }
  }, []);

  // Set pattern for Deck A
  const setDeckAPattern = useCallback((pattern: PatternType) => {
    if (mixerRef.current) {
      mixerRef.current.setDeckAPattern(pattern);
      setState(mixerRef.current.getState());
    }
  }, []);

  // Set pattern for Deck B
  const setDeckBPattern = useCallback((pattern: PatternType) => {
    if (mixerRef.current) {
      mixerRef.current.setDeckBPattern(pattern);
      setState(mixerRef.current.getState());
    }
  }, []);

  // Crossfader
  const setCrossfader = useCallback((value: number) => {
    if (mixerRef.current) {
      mixerRef.current.setCrossfader(value);
      setCrossfaderState(value);
      setState(mixerRef.current.getState());
    }
  }, []);

  // Effects
  const setEffect = useCallback((effect: keyof EffectsRackState, value: number | boolean) => {
    if (mixerRef.current) {
      mixerRef.current.setEffect(effect, value);
      setEffectsState(mixerRef.current.getEffects());
    }
  }, []);

  // Update (call every frame)
  const update = useCallback((audio: AudioData): MixedOutput | null => {
    if (!mixerRef.current) return null;
    return mixerRef.current.update(audio);
  }, []);

  // Available engines and patterns
  const availableEngines = mixerRef.current?.getAvailableEngines() || [];
  const availablePatterns = mixerRef.current?.getAvailablePatterns() || [];

  return {
    isReady,
    loadDeckA,
    loadDeckB,
    setDeckAEngine,
    setDeckBEngine,
    availableEngines,
    setDeckAPattern,
    setDeckBPattern,
    availablePatterns,
    crossfader,
    setCrossfader,
    effects,
    setEffect,
    update,
    state
  };
}
