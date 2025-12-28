/**
 * GolemMixerPanel - Bottom Sheet Drawer for 4-Channel Mixer
 *
 * Slides up from bottom, never blocks animation (max 60% height).
 * Context-aware: shows patterns only in PATTERN mode.
 * Trigger pads at bottom for thumb accessibility.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Layers, Volume2, VolumeX,
  Zap, Brain, Disc, Grid3X3,
  ChevronDown, ChevronUp, GripHorizontal, Image
} from 'lucide-react';
import type {
  EngineMode, SequenceMode, PatternType, MixMode, MixerTelemetry, EffectsState
} from '../engine/GolemMixer';
import type { GeneratedFrame } from '../types';

// =============================================================================
// TYPES
// =============================================================================

interface DeckState {
  id: number;
  name: string;
  isActive: boolean;
  mixMode: MixMode;
  opacity: number;
  frameCount: number;
  rigName?: string;
  frames?: GeneratedFrame[]; // For thumbnail display
}

interface GolemMixerPanelProps {
  // Deck state
  decks: DeckState[];
  onDeckModeChange: (deckId: number, mode: MixMode) => void;
  onDeckOpacityChange: (deckId: number, opacity: number) => void;
  onLoadDeck: (deckId: number) => void;

  // Engine state
  engineMode: EngineMode;
  onEngineModeChange: (mode: EngineMode) => void;

  // Pattern (when in PATTERN mode)
  activePattern: PatternType;
  onPatternChange: (pattern: PatternType) => void;

  // Sequence mode (when in KINETIC mode)
  sequenceMode: SequenceMode;
  onSequenceModeChange: (mode: SequenceMode) => void;

  // BPM
  bpm: number;
  autoBPM: boolean;
  onBPMChange: (bpm: number) => void;
  onAutoBPMChange: (auto: boolean) => void;

  // Triggers
  onTriggerStutter: (active: boolean) => void;
  onTriggerReverse: (active: boolean) => void;
  onTriggerGlitch: (active: boolean) => void;
  onTriggerBurst: (active: boolean) => void;

  // Effects
  effects: EffectsState;
  onEffectChange: <K extends keyof EffectsState>(key: K, value: EffectsState[K]) => void;

  // Telemetry
  telemetry: MixerTelemetry | null;

  // Visibility
  isOpen: boolean;
  onToggle: () => void;
}

// =============================================================================
// PATTERN DEFINITIONS
// =============================================================================

const PATTERNS: { id: PatternType; label: string; desc: string }[] = [
  { id: 'PING_PONG', label: 'PING-PONG', desc: 'Left-right alternating' },
  { id: 'BUILD_DROP', label: 'BUILD-DROP', desc: 'Intensity to release' },
  { id: 'STUTTER', label: 'STUTTER', desc: 'Rapid cuts' },
  { id: 'VOGUE', label: 'VOGUE', desc: 'High-freq poses' },
  { id: 'FLOW', label: 'FLOW', desc: 'Smooth transitions' },
  { id: 'CHAOS', label: 'CHAOS', desc: 'Random everything' },
  { id: 'MINIMAL', label: 'MINIMAL', desc: 'Just beats' },
  { id: 'ABAB', label: 'A-B-A-B', desc: 'Standard alternate' },
  { id: 'AABB', label: 'A-A-B-B', desc: 'Paired frames' },
  { id: 'ABAC', label: 'A-B-A-C', desc: 'Third for breaks' },
  { id: 'SNARE_ROLL', label: 'SNARE ROLL', desc: 'Repeat on snares' },
  { id: 'GROOVE', label: 'GROOVE', desc: 'Mid-energy flow' },
  { id: 'EMOTE', label: 'EMOTE', desc: 'Closeup focus' },
  { id: 'FOOTWORK', label: 'FOOTWORK', desc: 'Lower body' },
  { id: 'IMPACT', label: 'IMPACT', desc: 'High energy hits' }
];

const SEQUENCE_MODES: { id: SequenceMode; label: string; color: string }[] = [
  { id: 'GROOVE', label: 'GROOVE', color: 'bg-green-500' },
  { id: 'EMOTE', label: 'EMOTE', color: 'bg-purple-500' },
  { id: 'IMPACT', label: 'IMPACT', color: 'bg-red-500' },
  { id: 'FOOTWORK', label: 'FOOTWORK', color: 'bg-blue-500' }
];

const MIX_MODES: { id: MixMode; label: string }[] = [
  { id: 'sequencer', label: 'SEQ' },
  { id: 'layer', label: 'LAY' },
  { id: 'off', label: 'OFF' }
];

// =============================================================================
// COMPONENT
// =============================================================================

export const GolemMixerPanel: React.FC<GolemMixerPanelProps> = ({
  decks,
  onDeckModeChange,
  onDeckOpacityChange,
  onLoadDeck,
  engineMode,
  onEngineModeChange,
  activePattern,
  onPatternChange,
  sequenceMode,
  onSequenceModeChange,
  bpm,
  autoBPM,
  onBPMChange,
  onAutoBPMChange,
  onTriggerStutter,
  onTriggerReverse,
  onTriggerGlitch,
  onTriggerBurst,
  effects,
  onEffectChange,
  telemetry,
  isOpen,
  onToggle
}) => {
  const [expandedDeck, setExpandedDeck] = useState<number | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [dragStartY, setDragStartY] = useState(0);

  // Swipe down to close
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - dragStartY;
    if (deltaY > 80) onToggle(); // Swipe down to close
  }, [dragStartY, onToggle]);

  // Closed state - don't render anything (ControlDock has the toggle)
  if (!isOpen) return null;

  return (
    <div
      ref={drawerRef}
      className="fixed bottom-0 left-0 right-0 z-40
                 bg-black/90 backdrop-blur-xl
                 border-t border-white/15 rounded-t-3xl font-rajdhani text-white
                 shadow-2xl shadow-black/50 overflow-hidden
                 max-h-[60vh] animate-in slide-in-from-bottom duration-300"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >

      {/* Drawer Handle */}
      <div className="flex flex-col items-center pt-2 pb-1">
        <div className="w-12 h-1.5 bg-white/30 rounded-full" />
      </div>

      {/* Header - compact */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Disc className="w-5 h-5 text-cyan-400" />
          <span className="text-base font-bold tracking-wider">MIXER</span>
          {telemetry && (
            <span className="text-xs text-cyan-400 font-mono">{telemetry.bpm} BPM</span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-2 text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/10"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content - all sections in one view */}
      <div className="p-3 overflow-y-auto max-h-[calc(60vh-80px)] custom-scrollbar space-y-4">

        {/* ENGINE MODE TOGGLE - Always visible at top */}
        <div className="space-y-2">
            {/* Engine Mode Toggle - Prominent */}
            <div className="flex gap-2">
              <button
                onClick={() => onEngineModeChange('KINETIC')}
                className={`flex-1 py-3 sm:py-4 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2
                           transition-all border-2 ${engineMode === 'KINETIC'
                             ? 'bg-purple-500/40 border-purple-400 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                             : 'bg-white/5 border-white/10 text-white/50 hover:border-purple-500/50'}`}
              >
                <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
                KINETIC
              </button>
              <button
                onClick={() => onEngineModeChange('PATTERN')}
                className={`flex-1 py-3 sm:py-4 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2
                           transition-all border-2 ${engineMode === 'PATTERN'
                             ? 'bg-cyan-500/40 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,255,255,0.3)]'
                             : 'bg-white/5 border-white/10 text-white/50 hover:border-cyan-500/50'}`}
              >
                <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5" />
                PATTERN
              </button>
            </div>

            {/* Kinetic Mode: Sequence Mode Indicators */}
            {engineMode === 'KINETIC' && (
              <div className="space-y-2">
                <div className="text-xs text-white/40">SEQUENCE MODE</div>
                <div className="grid grid-cols-4 gap-2">
                  {SEQUENCE_MODES.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => onSequenceModeChange(mode.id)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all border
                                 ${sequenceMode === mode.id
                                   ? `${mode.color} border-white/30 text-white shadow-lg`
                                   : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
                {/* Active indicator */}
                <div className="text-xs text-center">
                  <span className="text-white/40">Active: </span>
                  <span className={`font-bold ${
                    sequenceMode === 'GROOVE' ? 'text-green-400' :
                    sequenceMode === 'EMOTE' ? 'text-purple-400' :
                    sequenceMode === 'IMPACT' ? 'text-red-400' :
                    'text-blue-400'
                  }`}>
                    {sequenceMode}
                  </span>
                </div>
              </div>
            )}

            {/* Pattern Mode: Pattern Grid */}
            {engineMode === 'PATTERN' && (
              <div className="space-y-2">
                <div className="text-xs text-white/40">PATTERN</div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1">
                  {PATTERNS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => onPatternChange(p.id)}
                      title={p.desc}
                      className={`py-2 px-1 rounded text-[9px] sm:text-[10px] font-bold transition-all border
                                 ${activePattern === p.id
                                   ? 'bg-cyan-500 border-cyan-400 text-white shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                                   : 'bg-white/5 border-white/10 text-white/50 hover:border-cyan-500/50'}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {/* Active pattern description */}
                <div className="text-xs text-center text-white/40">
                  {PATTERNS.find(p => p.id === activePattern)?.desc}
                </div>
              </div>
            )}

            {/* BPM Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">BPM</span>
                <button
                  onClick={() => onAutoBPMChange(!autoBPM)}
                  className={`text-xs px-2 py-1 rounded transition-all
                             ${autoBPM
                               ? 'bg-green-500/20 text-green-400'
                               : 'bg-white/5 text-white/40'}`}
                >
                  {autoBPM ? 'AUTO' : 'MANUAL'}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="60"
                  max="200"
                  value={bpm}
                  onChange={(e) => onBPMChange(parseInt(e.target.value))}
                  disabled={autoBPM}
                  className="flex-1 h-2 rounded-full appearance-none cursor-pointer
                           bg-white/10 disabled:opacity-50"
                />
                <span className="text-lg font-bold w-12 text-right text-cyan-400">
                  {bpm}
                </span>
              </div>
              {/* Bar/Phrase display */}
              {telemetry && (
                <div className="flex gap-4 text-xs">
                  <div className="flex-1">
                    <div className="text-white/40 mb-1">BAR {telemetry.barCounter + 1}/16</div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 transition-all"
                        style={{ width: `${((telemetry.barCounter + 1) / 16) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-white/40 mb-1">PHRASE {telemetry.phraseCounter + 1}/8</div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-400 transition-all"
                        style={{ width: `${((telemetry.phraseCounter + 1) / 8) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

        </div>

        {/* TRIGGER PADS - Always at bottom for thumb access */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="text-xs text-white/40">TRIGGER PADS</div>
          <div className="grid grid-cols-4 gap-2">
            <TriggerPad
              label="STUTTER"
              color="yellow"
              onPress={() => onTriggerStutter(true)}
              onRelease={() => onTriggerStutter(false)}
            />
            <TriggerPad
              label="REVERSE"
              color="blue"
              onPress={() => onTriggerReverse(true)}
              onRelease={() => onTriggerReverse(false)}
            />
            <TriggerPad
              label="GLITCH"
              color="red"
              onPress={() => onTriggerGlitch(true)}
              onRelease={() => onTriggerGlitch(false)}
            />
            <TriggerPad
              label="BURST"
              color="green"
              onPress={() => onTriggerBurst(true)}
              onRelease={() => onTriggerBurst(false)}
            />
          </div>
        </div>

        {/* DECKS - Collapsible section */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="text-xs text-white/40">DECKS (tap to expand)</div>
          {decks.map(deck => (
            <DeckStrip
              key={deck.id}
              deck={deck}
              isExpanded={expandedDeck === deck.id}
              onToggleExpand={() => setExpandedDeck(expandedDeck === deck.id ? null : deck.id)}
              onModeChange={(mode) => onDeckModeChange(deck.id, mode)}
              onOpacityChange={(opacity) => onDeckOpacityChange(deck.id, opacity)}
              onLoad={() => onLoadDeck(deck.id)}
            />
          ))}
        </div>

      </div>
    </div>
  );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/** Deck channel strip with expandable frame thumbnails */
const DeckStrip: React.FC<{
  deck: DeckState;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onModeChange: (mode: MixMode) => void;
  onOpacityChange: (opacity: number) => void;
  onLoad: () => void;
}> = ({ deck, isExpanded, onToggleExpand, onModeChange, onOpacityChange, onLoad }) => {
  const isActive = deck.mixMode !== 'off';

  return (
    <div className={`rounded-xl border-2 transition-all overflow-hidden ${
      isActive
        ? 'bg-white/5 border-cyan-500/30'
        : 'bg-white/[0.02] border-white/10'
    }`}>
      {/* Main deck row - tap to expand */}
      <div
        className="p-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-all"
        onClick={onToggleExpand}
      >
        {/* Deck indicator */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg
                        ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/30'}`}>
          {deck.id + 1}
        </div>

        {/* Deck info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-white/40'}`}>
              {deck.rigName || `DECK ${deck.id + 1}`}
            </span>
            {deck.frameCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-400 rounded-full">
                {deck.frameCount} frames
              </span>
            )}
          </div>
          <div className="flex gap-1 mt-1">
            {MIX_MODES.map(mode => (
              <button
                key={mode.id}
                onClick={(e) => { e.stopPropagation(); onModeChange(mode.id); }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all
                           ${deck.mixMode === mode.id
                             ? mode.id === 'off'
                               ? 'bg-white/20 text-white/60'
                               : 'bg-cyan-500 text-white'
                             : 'bg-white/5 text-white/30 hover:text-white/50'}`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Expand indicator */}
        <div className="text-white/30">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {/* Expanded content - frame thumbnails */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-white/10 mt-0 pt-3 animate-in slide-in-from-top-2">
          {/* Opacity slider */}
          {isActive && (
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs text-white/40 w-16">OPACITY</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={deck.opacity}
                onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
                className="flex-1 h-2 rounded-full appearance-none cursor-pointer bg-white/10"
              />
              <span className="text-xs text-cyan-400 w-8 text-right">
                {Math.round(deck.opacity * 100)}%
              </span>
            </div>
          )}

          {/* Frame thumbnails */}
          {deck.frames && deck.frames.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {deck.frames.slice(0, 8).map((frame, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 w-14 h-14 rounded-lg border border-white/10
                             bg-black/30 overflow-hidden hover:border-cyan-500/50 transition-all"
                  title={frame.pose}
                >
                  <img
                    src={frame.url}
                    alt={frame.pose}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
              {deck.frames.length > 8 && (
                <div className="flex-shrink-0 w-14 h-14 rounded-lg border border-white/10
                               bg-white/5 flex items-center justify-center text-white/40 text-xs font-bold">
                  +{deck.frames.length - 8}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onLoad(); }}
              className="w-full py-4 rounded-lg border-2 border-dashed border-white/20
                         text-white/40 hover:border-cyan-500/50 hover:text-cyan-400
                         transition-all flex items-center justify-center gap-2"
            >
              <Image className="w-5 h-5" />
              <span className="text-sm font-bold">LOAD RIG FILE</span>
            </button>
          )}

          {/* Load button if has frames */}
          {deck.frames && deck.frames.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onLoad(); }}
              className="w-full mt-2 py-2 rounded-lg bg-white/5 border border-white/10
                         text-white/60 hover:text-white hover:bg-white/10 transition-all
                         text-xs font-bold flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4" />
              REPLACE RIG
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/** Trigger pad (hold to activate) */
const TriggerPad: React.FC<{
  label: string;
  color: string;
  onPress: () => void;
  onRelease: () => void;
}> = ({ label, color, onPress, onRelease }) => {
  const [isPressed, setIsPressed] = useState(false);

  const colorMap: Record<string, string> = {
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    green: 'bg-green-500'
  };

  const handleStart = () => {
    setIsPressed(true);
    onPress();
  };

  const handleEnd = () => {
    setIsPressed(false);
    onRelease();
  };

  return (
    <button
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      className={`py-3 rounded-lg text-[10px] font-bold transition-all border select-none
                 ${isPressed
                   ? `${colorMap[color]} border-white/50 text-white scale-95`
                   : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'}`}
    >
      {label}
    </button>
  );
};

export default GolemMixerPanel;
