/**
 * LiveDeckMixer - Touch-focused interactive deck control system
 *
 * Features:
 * - 4 interactive deck pads with touch/drag control
 * - Frame inspection integrated into each deck
 * - Crossfader for deck blending
 * - Beat-sync trigger pads
 * - Real-time BPM tap tempo
 * - Visual audio reactivity
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, Layers, X, Zap, Music2, ChevronDown, ChevronUp,
  Play, Pause, RotateCcw, Shuffle
} from 'lucide-react';
import type { GeneratedFrame } from '../types';
import type { MixMode } from '../engine/GolemMixer';

// =============================================================================
// TYPES
// =============================================================================

interface DeckData {
  id: number;
  frames: GeneratedFrame[];
  rigName: string;
  mixMode: MixMode;
  opacity: number;
  isActive: boolean;
  currentFrameIndex: number;
}

interface LiveDeckMixerProps {
  decks: DeckData[];
  activeDeckId: number;
  crossfaderPosition: number; // 0-1, 0 = deck A, 1 = deck B
  bpm: number;
  bpmConfidence: number;
  beatCounter: number;
  isPlaying: boolean;

  // Deck controls
  onLoadDeck: (deckId: number) => void;
  onDeckModeChange: (deckId: number, mode: MixMode) => void;
  onDeckOpacityChange: (deckId: number, opacity: number) => void;
  onActivateDeck: (deckId: number) => void;
  onClearDeck: (deckId: number) => void;

  // Crossfader
  onCrossfaderChange: (position: number) => void;

  // Frame selection
  onSelectFrame: (deckId: number, frameIndex: number) => void;
  onTriggerFrame: (deckId: number) => void;

  // BPM
  onTapTempo: () => void;
  onBPMChange: (bpm: number) => void;

  // Visibility
  isOpen: boolean;
  onClose: () => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const LiveDeckMixer: React.FC<LiveDeckMixerProps> = ({
  decks,
  activeDeckId,
  crossfaderPosition,
  bpm,
  bpmConfidence,
  beatCounter,
  isPlaying,
  onLoadDeck,
  onDeckModeChange,
  onDeckOpacityChange,
  onActivateDeck,
  onClearDeck,
  onCrossfaderChange,
  onSelectFrame,
  onTriggerFrame,
  onTapTempo,
  onBPMChange,
  isOpen,
  onClose
}) => {
  const [expandedDeck, setExpandedDeck] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'pads' | 'mixer'>('pads');
  const lastTapRef = useRef<number>(0);
  const tapTimesRef = useRef<number[]>([]);

  // Handle tap tempo
  const handleTapTempo = useCallback(() => {
    const now = Date.now();
    tapTimesRef.current.push(now);

    // Keep only last 8 taps
    if (tapTimesRef.current.length > 8) {
      tapTimesRef.current.shift();
    }

    // Calculate BPM from taps
    if (tapTimesRef.current.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 60 && calculatedBpm <= 200) {
        onBPMChange(calculatedBpm);
      }
    }

    lastTapRef.current = now;
    onTapTempo();
  }, [onBPMChange, onTapTempo]);

  // Reset tap tempo after 2 seconds of no taps
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (Date.now() - lastTapRef.current > 2000) {
        tapTimesRef.current = [];
      }
    }, 2100);
    return () => clearTimeout(timeout);
  }, [lastTapRef.current]);

  if (!isOpen) return null;

  // Get decks A and B for crossfader (first two active sequencer decks)
  const sequencerDecks = decks.filter(d => d.isActive && d.mixMode === 'sequencer');
  const deckA = sequencerDecks[0];
  const deckB = sequencerDecks[1];

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col font-rajdhani animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-cyan-400" />
          <span className="text-lg font-bold tracking-wider text-white">LIVE DECK MIXER</span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-1 bg-black/50 rounded-lg p-1">
          <button
            onClick={() => setViewMode('pads')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all
                       ${viewMode === 'pads'
                         ? 'bg-cyan-500 text-white'
                         : 'text-white/50 hover:text-white'}`}
          >
            PADS
          </button>
          <button
            onClick={() => setViewMode('mixer')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all
                       ${viewMode === 'mixer'
                         ? 'bg-cyan-500 text-white'
                         : 'text-white/50 hover:text-white'}`}
          >
            MIXER
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* BPM Display & Tap Tempo */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-4">
        <button
          onClick={handleTapTempo}
          className="flex-1 py-4 bg-gradient-to-b from-cyan-500/20 to-cyan-500/10
                     border-2 border-cyan-500/50 rounded-xl
                     active:scale-95 active:bg-cyan-500/30 transition-all
                     flex flex-col items-center justify-center gap-1"
        >
          <div className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-cyan-400" />
            <span className="text-3xl font-black text-cyan-400">{bpm}</span>
            <span className="text-sm text-cyan-400/60">BPM</span>
          </div>
          <span className="text-[10px] text-white/40 tracking-widest">TAP TEMPO</span>
          {bpmConfidence > 0 && (
            <div className="flex gap-1 mt-1">
              {[0.25, 0.5, 0.75, 1].map((threshold, i) => (
                <div
                  key={i}
                  className={`w-6 h-1 rounded-full transition-all
                             ${bpmConfidence >= threshold ? 'bg-cyan-400' : 'bg-white/10'}`}
                />
              ))}
            </div>
          )}
        </button>

        {/* Beat Counter */}
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((beat) => (
            <div
              key={beat}
              className={`w-4 h-12 rounded-md transition-all
                         ${beatCounter % 4 === beat
                           ? beat === 0
                             ? 'bg-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.5)]'
                             : 'bg-brand-500 shadow-[0_0_10px_rgba(139,92,246,0.4)]'
                           : 'bg-white/10'
                         }`}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === 'pads' ? (
          /* PADS VIEW - 2x2 Interactive Deck Pads */
          <div className="grid grid-cols-2 gap-3 h-full max-h-[60vh]">
            {decks.map((deck) => (
              <DeckPad
                key={deck.id}
                deck={deck}
                isActive={activeDeckId === deck.id}
                isExpanded={expandedDeck === deck.id}
                beatCounter={beatCounter}
                onTap={() => onTriggerFrame(deck.id)}
                onActivate={() => onActivateDeck(deck.id)}
                onLoad={() => onLoadDeck(deck.id)}
                onClear={() => onClearDeck(deck.id)}
                onExpand={() => setExpandedDeck(expandedDeck === deck.id ? null : deck.id)}
                onModeChange={(mode) => onDeckModeChange(deck.id, mode)}
                onOpacityChange={(opacity) => onDeckOpacityChange(deck.id, opacity)}
                onSelectFrame={(index) => onSelectFrame(deck.id, index)}
              />
            ))}
          </div>
        ) : (
          /* MIXER VIEW - Crossfader & Layers */
          <div className="space-y-6">
            {/* Deck A/B Display */}
            <div className="grid grid-cols-2 gap-4">
              <DeckPreview
                deck={deckA}
                label="A"
                blend={1 - crossfaderPosition}
                onTrigger={() => deckA && onTriggerFrame(deckA.id)}
              />
              <DeckPreview
                deck={deckB}
                label="B"
                blend={crossfaderPosition}
                onTrigger={() => deckB && onTriggerFrame(deckB.id)}
              />
            </div>

            {/* Crossfader */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-cyan-400 font-bold">A</span>
                <span className="text-xs text-white/40 tracking-wider">CROSSFADER</span>
                <span className="text-xs text-purple-400 font-bold">B</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={crossfaderPosition}
                  onChange={(e) => onCrossfaderChange(parseFloat(e.target.value))}
                  className="w-full h-12 appearance-none cursor-pointer bg-gradient-to-r from-cyan-500/30 via-white/10 to-purple-500/30 rounded-xl"
                  style={{
                    WebkitAppearance: 'none'
                  }}
                />
                {/* Crossfader position indicator */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-6 h-10 bg-white rounded-lg shadow-lg pointer-events-none transition-all"
                  style={{ left: `calc(${crossfaderPosition * 100}% - 12px)` }}
                />
              </div>
            </div>

            {/* Layer Decks */}
            <div className="space-y-2">
              <div className="text-xs text-white/40 tracking-wider">LAYER DECKS</div>
              {decks.filter(d => d.mixMode === 'layer').map((deck) => (
                <LayerDeckStrip
                  key={deck.id}
                  deck={deck}
                  onOpacityChange={(opacity) => onDeckOpacityChange(deck.id, opacity)}
                  onModeChange={(mode) => onDeckModeChange(deck.id, mode)}
                />
              ))}
              {decks.filter(d => d.mixMode === 'layer').length === 0 && (
                <div className="text-center text-white/20 py-4 text-sm">
                  Set decks to LAYER mode to blend them
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Bar */}
      <div className="px-4 py-3 border-t border-white/10 flex gap-2">
        <button
          onClick={() => {
            // Shuffle all active deck frames
            decks.forEach(d => {
              if (d.isActive && d.frames.length > 0) {
                const randomIndex = Math.floor(Math.random() * d.frames.length);
                onSelectFrame(d.id, randomIndex);
              }
            });
          }}
          className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl
                     text-white/60 hover:text-white hover:bg-white/10 transition-all
                     flex items-center justify-center gap-2"
        >
          <Shuffle className="w-4 h-4" />
          <span className="text-xs font-bold">SHUFFLE ALL</span>
        </button>
        <button
          onClick={() => {
            // Reset all decks to frame 0
            decks.forEach(d => {
              if (d.frames.length > 0) {
                onSelectFrame(d.id, 0);
              }
            });
          }}
          className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl
                     text-white/60 hover:text-white hover:bg-white/10 transition-all
                     flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-xs font-bold">RESET ALL</span>
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// DECK PAD - Interactive touch pad for each deck
// =============================================================================

const DeckPad: React.FC<{
  deck: DeckData;
  isActive: boolean;
  isExpanded: boolean;
  beatCounter: number;
  onTap: () => void;
  onActivate: () => void;
  onLoad: () => void;
  onClear: () => void;
  onExpand: () => void;
  onModeChange: (mode: MixMode) => void;
  onOpacityChange: (opacity: number) => void;
  onSelectFrame: (index: number) => void;
}> = ({
  deck,
  isActive,
  isExpanded,
  beatCounter,
  onTap,
  onActivate,
  onLoad,
  onClear,
  onExpand,
  onModeChange,
  onOpacityChange,
  onSelectFrame
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const hasFrames = deck.frames.length > 0;
  const currentFrame = deck.frames[deck.currentFrameIndex];

  // Pulse effect on beat
  const pulseOnBeat = isActive && beatCounter % 4 === 0;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden transition-all
                 ${isActive
                   ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-black'
                   : 'ring-1 ring-white/10'}
                 ${isExpanded ? 'col-span-2 row-span-2' : ''}`}
    >
      {/* Background - current frame or placeholder */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-gray-900 to-black
                   ${pulseOnBeat ? 'animate-pulse' : ''}`}
      >
        {currentFrame && (
          <img
            src={currentFrame.url}
            alt={currentFrame.pose}
            className={`w-full h-full object-contain opacity-30
                       ${isPressed ? 'scale-110' : 'scale-100'} transition-transform`}
          />
        )}
      </div>

      {/* Main tap area */}
      <button
        className={`absolute inset-0 flex flex-col items-center justify-center
                   transition-all active:scale-95
                   ${isPressed ? 'bg-cyan-500/20' : ''}`}
        onMouseDown={() => { setIsPressed(true); onTap(); }}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => { setIsPressed(true); onTap(); }}
        onTouchEnd={() => setIsPressed(false)}
      >
        {!hasFrames ? (
          <div className="flex flex-col items-center gap-2 text-white/40">
            <Upload className="w-8 h-8" />
            <span className="text-xs font-bold">LOAD RIG</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-4xl font-black text-white/80">{deck.id + 1}</span>
            <span className="text-[10px] text-white/40 tracking-wider max-w-[80%] truncate">
              {deck.rigName || 'DECK'}
            </span>
            <span className="text-xs text-cyan-400 font-mono">
              {deck.frames.length} frames
            </span>
          </div>
        )}
      </button>

      {/* Top bar - mode & controls */}
      <div className="absolute top-0 left-0 right-0 p-2 flex items-center justify-between">
        {/* Mode selector */}
        <div className="flex gap-0.5 bg-black/60 rounded-lg p-0.5 backdrop-blur-sm">
          {(['sequencer', 'layer', 'off'] as MixMode[]).map((mode) => (
            <button
              key={mode}
              onClick={(e) => { e.stopPropagation(); onModeChange(mode); }}
              className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all
                         ${deck.mixMode === mode
                           ? mode === 'off'
                             ? 'bg-white/20 text-white/60'
                             : mode === 'layer'
                               ? 'bg-purple-500 text-white'
                               : 'bg-cyan-500 text-white'
                           : 'text-white/30 hover:text-white/60'
                         }`}
            >
              {mode === 'sequencer' ? 'SEQ' : mode === 'layer' ? 'LAY' : 'OFF'}
            </button>
          ))}
        </div>

        {/* Expand/collapse */}
        <button
          onClick={(e) => { e.stopPropagation(); onExpand(); }}
          className="p-1.5 bg-black/60 rounded-lg backdrop-blur-sm text-white/40 hover:text-white"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom bar - opacity & actions */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        {hasFrames ? (
          <div className="flex items-center gap-2 bg-black/60 rounded-lg p-2 backdrop-blur-sm">
            {/* Opacity slider */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={deck.opacity}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 h-1.5 rounded-full appearance-none bg-white/10"
            />
            <span className="text-[10px] text-white/40 w-8 text-right">
              {Math.round(deck.opacity * 100)}%
            </span>
            {/* Clear button */}
            <button
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="p-1 text-red-400/60 hover:text-red-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onLoad(); }}
            className="w-full py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg
                       text-cyan-400 text-xs font-bold hover:bg-cyan-500/30 transition-all"
          >
            LOAD RIG FILE
          </button>
        )}
      </div>

      {/* Expanded frame browser */}
      {isExpanded && hasFrames && (
        <div className="absolute top-16 left-2 right-2 bottom-16 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="grid grid-cols-4 gap-1 p-1">
              {deck.frames.map((frame, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); onSelectFrame(idx); }}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all
                             ${idx === deck.currentFrameIndex
                               ? 'border-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                               : 'border-white/10 hover:border-white/30'
                             }`}
                >
                  <img
                    src={frame.url}
                    alt={frame.pose}
                    className="w-full h-full object-contain bg-black/50"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active indicator glow */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none border-2 border-cyan-400/50 rounded-2xl" />
      )}
    </div>
  );
};

// =============================================================================
// DECK PREVIEW - For mixer view
// =============================================================================

const DeckPreview: React.FC<{
  deck: DeckData | undefined;
  label: string;
  blend: number;
  onTrigger: () => void;
}> = ({ deck, label, blend, onTrigger }) => {
  const currentFrame = deck?.frames[deck?.currentFrameIndex ?? 0];

  return (
    <button
      onClick={onTrigger}
      disabled={!deck}
      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all
                 active:scale-95
                 ${blend > 0.5
                   ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.3)]'
                   : 'border-white/20'}`}
      style={{ opacity: 0.3 + blend * 0.7 }}
    >
      {currentFrame ? (
        <img
          src={currentFrame.url}
          alt={currentFrame.pose}
          className="w-full h-full object-contain bg-black"
        />
      ) : (
        <div className="w-full h-full bg-black/50 flex items-center justify-center text-white/20">
          NO DECK
        </div>
      )}

      {/* Label */}
      <div className={`absolute top-2 left-2 w-8 h-8 rounded-lg flex items-center justify-center
                      font-black text-lg
                      ${label === 'A' ? 'bg-cyan-500 text-white' : 'bg-purple-500 text-white'}`}>
        {label}
      </div>

      {/* Blend indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
        <div
          className={`h-full transition-all
                     ${label === 'A' ? 'bg-cyan-400' : 'bg-purple-400'}`}
          style={{ width: `${blend * 100}%` }}
        />
      </div>
    </button>
  );
};

// =============================================================================
// LAYER DECK STRIP - For layer mode decks in mixer view
// =============================================================================

const LayerDeckStrip: React.FC<{
  deck: DeckData;
  onOpacityChange: (opacity: number) => void;
  onModeChange: (mode: MixMode) => void;
}> = ({ deck, onOpacityChange, onModeChange }) => {
  const currentFrame = deck.frames[deck.currentFrameIndex];

  return (
    <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
      {/* Preview thumbnail */}
      <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
        {currentFrame ? (
          <img src={currentFrame.url} alt="" className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full bg-black/50" />
        )}
      </div>

      {/* Info & controls */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold text-white truncate">{deck.rigName || `Deck ${deck.id + 1}`}</span>
          <span className="text-[10px] text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded">LAYER</span>
        </div>

        {/* Opacity slider */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={deck.opacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            className="flex-1 h-1.5 rounded-full appearance-none bg-white/10"
          />
          <span className="text-xs text-white/40 w-8 text-right">
            {Math.round(deck.opacity * 100)}%
          </span>
        </div>
      </div>

      {/* Mode toggle */}
      <button
        onClick={() => onModeChange('off')}
        className="p-2 text-white/30 hover:text-white/60"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default LiveDeckMixer;
