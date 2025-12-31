/**
 * DeckMixerPanel - RIGHT BEZEL 4-Channel Deck Control
 *
 * Expands from right side of screen:
 * - Closed: Vertical tab showing 4 channel status indicators
 * - Open: Slides out with full deck controls
 */

import React, { useState } from 'react';
import {
  Layers, Upload, X, ChevronDown, ChevronUp, Eye,
  ChevronLeft, ChevronRight, SkipForward, Trash2
} from 'lucide-react';
import type { GeneratedFrame } from '../types';
import type { MixMode } from '../engine/GolemMixer';

interface DeckData {
  id: number;
  frames: GeneratedFrame[];
  rigName: string;
  mixMode: MixMode;
  opacity: number;
  isActive: boolean;
  currentFrameIndex: number;
}

interface DeckMixerPanelProps {
  decks: DeckData[];
  beatCounter: number;

  onLoadDeck: (deckId: number) => void;
  onDeckModeChange: (deckId: number, mode: MixMode) => void;
  onDeckOpacityChange: (deckId: number, opacity: number) => void;
  onClearDeck: (deckId: number) => void;
  onSelectFrame: (deckId: number, frameIndex: number) => void;
  onTriggerFrame: (deckId: number) => void;

  isOpen: boolean;
  isExpanded: boolean;
  onToggleOpen: () => void;
  onToggleExpand: () => void;
}

const MODE_COLORS = {
  off: { bg: 'bg-gray-500/30', border: 'border-gray-500/40', text: 'text-gray-400', label: 'OFF' },
  sequencer: { bg: 'bg-cyan-500/30', border: 'border-cyan-500/50', text: 'text-cyan-400', label: 'SEQ' },
  layer: { bg: 'bg-purple-500/30', border: 'border-purple-500/50', text: 'text-purple-400', label: 'LAY' }
};

export const DeckMixerPanel: React.FC<DeckMixerPanelProps> = ({
  decks,
  beatCounter,
  onLoadDeck,
  onDeckModeChange,
  onDeckOpacityChange,
  onClearDeck,
  onSelectFrame,
  onTriggerFrame,
  isOpen,
  isExpanded,
  onToggleOpen,
  onToggleExpand
}) => {
  const [selectedDeck, setSelectedDeck] = useState<number | null>(null);
  const activeCount = decks.filter(d => d.mixMode !== 'off').length;

  // ============ CLOSED STATE - Vertical tab on right edge with channel indicators ============
  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50
                   bg-gradient-to-b from-purple-500/30 to-pink-500/30
                   border-y border-l border-purple-500/50
                   rounded-l-xl py-3 px-1.5
                   flex flex-col items-center gap-2
                   hover:px-2.5 hover:bg-purple-500/40
                   active:scale-95 transition-all duration-200
                   backdrop-blur-xl font-rajdhani
                   shadow-lg shadow-purple-500/20"
      >
        <Layers size={16} className="text-purple-400" />
        <span className="text-[9px] font-bold text-purple-400"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
          DECKS
        </span>

        {/* Mini channel status indicators */}
        <div className="flex flex-col gap-1 mt-1">
          {decks.map((deck) => {
            const hasFrames = deck.frames.length > 0;
            const modeColor = MODE_COLORS[deck.mixMode];
            const pulseOnBeat = deck.mixMode !== 'off' && beatCounter % 4 === 0;

            return (
              <div
                key={deck.id}
                className={`w-4 h-4 rounded text-[8px] font-black flex items-center justify-center
                           transition-all ${modeColor.bg} ${modeColor.border} border
                           ${pulseOnBeat ? 'scale-110 shadow-lg' : ''}`}
              >
                <span className={modeColor.text}>{deck.id + 1}</span>
              </div>
            );
          })}
        </div>

        <ChevronLeft size={12} className="text-purple-400/60 mt-1" />
      </button>
    );
  }

  // ============ OPEN STATE - Slides from right ============
  return (
    <div
      className={`fixed right-0 top-1/2 -translate-y-1/2 z-50
                 bg-black/95 backdrop-blur-xl
                 border-y border-l border-purple-500/40 rounded-l-2xl
                 font-rajdhani text-white
                 transition-all duration-300 ease-out
                 shadow-2xl shadow-purple-500/20
                 ${isExpanded ? 'w-[320px]' : 'w-[200px]'}`}
      style={{ maxHeight: '85vh' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleOpen}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-all"
          >
            <X size={14} />
          </button>
          <button
            onClick={onToggleExpand}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all"
          >
            {isExpanded ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-purple-400">DECKS</span>
          <Layers size={16} className="text-purple-400" />
        </div>
      </div>

      {/* Channel Grid */}
      <div className="p-2 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 50px)' }}>
        <div className={`grid gap-2 ${isExpanded ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {decks.map((deck) => (
            <DeckChannel
              key={deck.id}
              deck={deck}
              isSelected={selectedDeck === deck.id}
              isExpanded={isExpanded}
              beatCounter={beatCounter}
              onSelect={() => setSelectedDeck(selectedDeck === deck.id ? null : deck.id)}
              onModeChange={(mode) => onDeckModeChange(deck.id, mode)}
              onOpacityChange={(opacity) => onDeckOpacityChange(deck.id, opacity)}
              onLoad={() => onLoadDeck(deck.id)}
              onClear={() => onClearDeck(deck.id)}
              onSelectFrame={(index) => onSelectFrame(deck.id, index)}
              onTrigger={() => onTriggerFrame(deck.id)}
            />
          ))}
        </div>
      </div>

      {/* Glow accent */}
      <div className="absolute top-0 bottom-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-purple-500/30 to-transparent" />
    </div>
  );
};

// ============ DECK CHANNEL COMPONENT ============
const DeckChannel: React.FC<{
  deck: DeckData;
  isSelected: boolean;
  isExpanded: boolean;
  beatCounter: number;
  onSelect: () => void;
  onModeChange: (mode: MixMode) => void;
  onOpacityChange: (opacity: number) => void;
  onLoad: () => void;
  onClear: () => void;
  onSelectFrame: (index: number) => void;
  onTrigger: () => void;
}> = ({
  deck,
  isSelected,
  isExpanded,
  beatCounter,
  onSelect,
  onModeChange,
  onOpacityChange,
  onLoad,
  onClear,
  onSelectFrame,
  onTrigger
}) => {
  const hasFrames = deck.frames.length > 0;
  const currentFrame = deck.frames[deck.currentFrameIndex];
  const isActive = deck.mixMode !== 'off';
  const pulseOnBeat = isActive && beatCounter % 4 === 0;
  const modeColor = MODE_COLORS[deck.mixMode];

  return (
    <div
      className={`rounded-xl overflow-hidden border transition-all duration-200
                 ${isSelected && isExpanded ? 'col-span-2' : ''}
                 ${pulseOnBeat ? `${modeColor.border} shadow-lg` : modeColor.border}`}
    >
      {/* Channel Header */}
      <div className={`flex items-center justify-between p-1.5 ${modeColor.bg}`}>
        <div className="flex items-center gap-1.5">
          {/* Channel badge */}
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black
                          bg-black/40 ${modeColor.text}`}>
            {deck.id + 1}
          </div>

          {/* Mode toggle */}
          <div className="flex gap-0.5 bg-black/30 rounded p-0.5">
            {(['off', 'sequencer', 'layer'] as MixMode[]).map((mode) => {
              const btnColor = MODE_COLORS[mode];
              return (
                <button
                  key={mode}
                  onClick={() => onModeChange(mode)}
                  className={`px-1.5 py-0.5 text-[8px] font-bold rounded transition-all
                             ${deck.mixMode === mode
                               ? `${btnColor.bg} ${btnColor.text}`
                               : 'text-white/30 hover:text-white/60'
                             }`}
                >
                  {btnColor.label}
                </button>
              );
            })}
          </div>
        </div>

        {hasFrames && (
          <button
            onClick={onSelect}
            className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-all"
          >
            {isSelected ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {/* Preview / Load */}
      {hasFrames ? (
        <button
          onClick={onTrigger}
          className="w-full h-16 bg-black/40 flex items-center justify-center relative
                     active:scale-[0.98] transition-transform group"
        >
          <img
            src={currentFrame?.url}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
          <div className="absolute bottom-0.5 right-1 px-1 py-0.5 bg-black/70 rounded text-[8px] font-mono text-cyan-400">
            {deck.currentFrameIndex + 1}/{deck.frames.length}
          </div>
          {isActive && (
            <div className="absolute top-0.5 left-1 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          )}
        </button>
      ) : (
        <button
          onClick={onLoad}
          className="w-full h-16 bg-white/5 flex flex-col items-center justify-center gap-0.5
                     hover:bg-purple-500/10 border-t border-dashed border-white/20 transition-all"
        >
          <Upload size={14} className="text-white/30" />
          <span className="text-[8px] text-white/30 font-bold">LOAD</span>
        </button>
      )}

      {/* Layer opacity */}
      {deck.mixMode === 'layer' && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/10 border-t border-purple-500/30">
          <Eye size={10} className="text-purple-400" />
          <div className="flex-1 relative h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-purple-500 rounded-full transition-all"
              style={{ width: `${deck.opacity * 100}%` }}
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={deck.opacity}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <span className="text-[8px] text-purple-400 font-mono">{Math.round(deck.opacity * 100)}%</span>
        </div>
      )}

      {/* Frame browser (expanded + selected) */}
      {isSelected && hasFrames && (
        <div className="p-1.5 bg-black/40 border-t border-white/10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] text-white/40 font-bold truncate max-w-[100px]">
              {deck.rigName || 'FRAMES'}
            </span>
            <button
              onClick={onClear}
              className="flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] text-red-400 hover:bg-red-500/20 rounded transition-all"
            >
              <Trash2 size={8} />
              CLR
            </button>
          </div>
          <div className="grid grid-cols-6 gap-0.5 max-h-16 overflow-y-auto">
            {deck.frames.map((frame, idx) => (
              <button
                key={idx}
                onClick={() => onSelectFrame(idx)}
                className={`aspect-square rounded overflow-hidden border transition-all
                           ${idx === deck.currentFrameIndex
                             ? 'border-cyan-400 shadow-[0_0_6px_rgba(0,255,255,0.3)]'
                             : 'border-white/10'
                           }`}
              >
                <img src={frame.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeckMixerPanel;
