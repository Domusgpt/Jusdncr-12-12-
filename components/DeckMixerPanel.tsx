/**
 * DeckMixerPanel - Premium 4-Channel Deck Control
 *
 * Redesigned with:
 * - Clear visual hierarchy
 * - Better collapse/expand UX
 * - Visual channel status
 * - Smooth mode transitions
 */

import React, { useState } from 'react';
import {
  Layers, Upload, X, ChevronDown, ChevronUp, Eye,
  Maximize2, Minimize2, Play, Pause, SkipForward, Trash2
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
  off: { bg: 'from-gray-500/20 to-gray-600/20', border: 'border-gray-500/30', text: 'text-gray-400' },
  sequencer: { bg: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/40', text: 'text-cyan-400' },
  layer: { bg: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/40', text: 'text-purple-400' }
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
  const loadedCount = decks.filter(d => d.frames.length > 0).length;

  // ============ CLOSED STATE ============
  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 group
                   bg-gradient-to-r from-purple-500/20 to-pink-500/20
                   border border-purple-500/40 text-purple-400
                   rounded-2xl px-4 py-2.5
                   flex items-center gap-3
                   hover:scale-105 hover:border-purple-400/60 active:scale-95
                   transition-all duration-200
                   backdrop-blur-xl font-rajdhani
                   shadow-lg shadow-purple-500/10"
      >
        <div className="relative">
          <Layers size={18} className="group-hover:animate-pulse" />
          {activeCount > 0 && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
          )}
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs font-bold tracking-wider leading-none">DECKS</span>
          <span className="text-[9px] text-purple-300/70">
            {loadedCount}/4 loaded • {activeCount} active
          </span>
        </div>
        <Maximize2 size={12} className="text-white/30 group-hover:text-white/60" />
      </button>
    );
  }

  // ============ OPEN STATE ============
  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-40
                 bg-gradient-to-b from-black/95 to-black/90 backdrop-blur-xl
                 border border-purple-500/30 rounded-2xl
                 font-rajdhani text-white
                 transition-all duration-300 ease-out
                 shadow-2xl shadow-purple-500/20
                 ${isExpanded ? 'w-[90vw] max-w-[560px]' : 'w-[340px]'}`}
      style={{ maxHeight: isExpanded ? '45vh' : '130px' }}
    >
      {/* ===== HEADER ===== */}
      <div className="relative">
        <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30
                          flex items-center justify-center border border-purple-500/30">
              <Layers size={16} className="text-purple-400" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wider text-white flex items-center gap-2">
                DECKS
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-500/30 text-purple-300 rounded-md">
                  {activeCount}/4
                </span>
              </div>
              <div className="text-[10px] text-white/40">4-Channel Mixer</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleExpand}
              className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white
                       transition-all active:scale-90"
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button
              onClick={onToggleOpen}
              className="p-2 rounded-xl hover:bg-red-500/20 text-white/50 hover:text-red-400
                       transition-all active:scale-90"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ===== COMPACT MODE - 4 Channel buttons ===== */}
      {!isExpanded && (
        <div className="px-3 pb-3">
          <div className="flex gap-2 justify-center">
            {decks.map((deck) => {
              const hasFrames = deck.frames.length > 0;
              const isActive = deck.mixMode !== 'off';
              const pulseOnBeat = isActive && beatCounter % 4 === 0;
              const modeColor = MODE_COLORS[deck.mixMode];

              return (
                <button
                  key={deck.id}
                  onClick={() => {
                    if (hasFrames) {
                      const modes: MixMode[] = ['off', 'sequencer', 'layer'];
                      const currentIdx = modes.indexOf(deck.mixMode);
                      onDeckModeChange(deck.id, modes[(currentIdx + 1) % 3]);
                    } else {
                      onLoadDeck(deck.id);
                    }
                  }}
                  className={`relative w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1
                             transition-all duration-150 active:scale-95 border overflow-hidden
                             ${!hasFrames
                               ? 'border-dashed border-white/20 bg-white/5'
                               : pulseOnBeat
                                 ? `bg-gradient-to-br ${modeColor.bg} ${modeColor.border} shadow-lg`
                                 : `bg-gradient-to-br ${modeColor.bg} ${modeColor.border}`
                             }`}
                >
                  {/* Active glow */}
                  {isActive && pulseOnBeat && (
                    <div className="absolute inset-0 bg-white/10 animate-pulse" />
                  )}

                  {/* Thumbnail or number */}
                  {hasFrames && deck.frames[deck.currentFrameIndex] ? (
                    <img
                      src={deck.frames[deck.currentFrameIndex].url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-30"
                    />
                  ) : null}

                  <span className={`text-xl font-black relative z-10 ${hasFrames ? modeColor.text : 'text-white/30'}`}>
                    {deck.id + 1}
                  </span>
                  <span className={`text-[8px] font-bold relative z-10 ${hasFrames ? modeColor.text : 'text-white/30'}`}>
                    {!hasFrames ? 'LOAD' : deck.mixMode === 'off' ? 'OFF' : deck.mixMode === 'layer' ? 'LAY' : 'SEQ'}
                  </span>

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-400 animate-pulse z-10" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== EXPANDED MODE ===== */}
      {isExpanded && (
        <div className="overflow-y-auto custom-scrollbar px-3 pb-3" style={{ maxHeight: 'calc(45vh - 70px)' }}>
          <div className="grid grid-cols-2 gap-2">
            {decks.map((deck) => (
              <DeckChannel
                key={deck.id}
                deck={deck}
                isSelected={selectedDeck === deck.id}
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
      )}

      <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
    </div>
  );
};

// ============ DECK CHANNEL COMPONENT ============
const DeckChannel: React.FC<{
  deck: DeckData;
  isSelected: boolean;
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
                 ${isSelected ? 'col-span-2' : ''}
                 ${isActive
                   ? pulseOnBeat
                     ? `${modeColor.border} shadow-lg`
                     : modeColor.border
                   : 'border-white/10'
                 }`}
    >
      {/* Channel Header */}
      <div className={`flex items-center justify-between p-2 bg-gradient-to-r ${modeColor.bg}`}>
        <div className="flex items-center gap-2">
          {/* Channel number badge */}
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black
                          bg-black/30 ${modeColor.text}`}>
            {deck.id + 1}
          </div>

          {/* Mode buttons */}
          <div className="flex gap-0.5 bg-black/30 rounded-lg p-0.5">
            {(['off', 'sequencer', 'layer'] as MixMode[]).map((mode) => {
              const isCurrentMode = deck.mixMode === mode;
              const btnColor = MODE_COLORS[mode];
              return (
                <button
                  key={mode}
                  onClick={() => onModeChange(mode)}
                  className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all
                             ${isCurrentMode
                               ? `bg-gradient-to-r ${btnColor.bg} ${btnColor.text}`
                               : 'text-white/30 hover:text-white/60'
                             }`}
                >
                  {mode === 'sequencer' ? 'SEQ' : mode === 'layer' ? 'LAY' : 'OFF'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Expand button */}
        <button
          onClick={onSelect}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
        >
          {isSelected ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Preview / Load Area */}
      {hasFrames ? (
        <button
          onClick={onTrigger}
          className="w-full h-20 bg-black/40 flex items-center justify-center relative
                     active:scale-[0.98] transition-transform group"
        >
          <img
            src={currentFrame?.url}
            alt={currentFrame?.pose || 'frame'}
            className="max-w-full max-h-full object-contain"
          />

          {/* Frame counter */}
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-[9px] font-mono text-cyan-400">
            {deck.currentFrameIndex + 1}/{deck.frames.length}
          </div>

          {/* Play indicator */}
          {isActive && (
            <div className="absolute top-1 left-1 flex items-center gap-1 px-1.5 py-0.5 bg-green-500/30 rounded">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[8px] text-green-400 font-bold">LIVE</span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <SkipForward size={20} className="text-white/60" />
          </div>
        </button>
      ) : (
        <button
          onClick={onLoad}
          className="w-full h-20 bg-white/5 flex flex-col items-center justify-center gap-1
                     hover:bg-purple-500/10 border-t border-dashed border-white/20
                     transition-all group"
        >
          <Upload size={18} className="text-white/30 group-hover:text-purple-400 transition-colors" />
          <span className="text-[10px] text-white/30 group-hover:text-purple-400 font-bold transition-colors">
            LOAD RIG
          </span>
        </button>
      )}

      {/* Layer opacity slider */}
      {deck.mixMode === 'layer' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border-t border-purple-500/30">
          <Eye size={12} className="text-purple-400" />
          <div className="flex-1 relative h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
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
          <span className="text-[9px] text-purple-400 font-mono w-8 text-right">
            {Math.round(deck.opacity * 100)}%
          </span>
        </div>
      )}

      {/* Expanded: Frame browser */}
      {isSelected && hasFrames && (
        <div className="p-2 bg-black/40 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/40 font-bold tracking-wider truncate max-w-[150px]">
              {deck.rigName || 'FRAMES'}
            </span>
            <button
              onClick={onClear}
              className="flex items-center gap-1 px-2 py-1 text-[9px] text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
            >
              <Trash2 size={10} />
              CLEAR
            </button>
          </div>
          <div className="grid grid-cols-8 gap-1 max-h-24 overflow-y-auto">
            {deck.frames.map((frame, idx) => (
              <button
                key={idx}
                onClick={() => onSelectFrame(idx)}
                className={`aspect-square rounded-lg overflow-hidden border transition-all
                           ${idx === deck.currentFrameIndex
                             ? 'border-cyan-400 shadow-[0_0_8px_rgba(0,255,255,0.3)]'
                             : 'border-white/10 hover:border-white/30'
                           }`}
              >
                <img
                  src={frame.url}
                  alt={frame.pose}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeckMixerPanel;
