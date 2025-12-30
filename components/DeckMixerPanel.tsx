/**
 * DeckMixerPanel - 4-Channel Frame Deck Control
 *
 * Collapsible, non-occluding deck control:
 * - Positioned at bottom-center (above ControlDock)
 * - 4 channels with easy mute/SEQ/LAYER toggles
 * - Compact mode shows channel status, expanded shows full controls
 * - Frame inspection built into each channel
 */

import React, { useState } from 'react';
import {
  Layers, Upload, X, ChevronDown, ChevronUp, Eye
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

interface DeckMixerPanelProps {
  decks: DeckData[];
  beatCounter: number;

  // Deck controls
  onLoadDeck: (deckId: number) => void;
  onDeckModeChange: (deckId: number, mode: MixMode) => void;
  onDeckOpacityChange: (deckId: number, opacity: number) => void;
  onClearDeck: (deckId: number) => void;
  onSelectFrame: (deckId: number, frameIndex: number) => void;
  onTriggerFrame: (deckId: number) => void;

  // Visibility - now with isExpanded for collapsible behavior
  isOpen: boolean;
  isExpanded: boolean;
  onToggleOpen: () => void;
  onToggleExpand: () => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

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

  // Closed state - just a tab at bottom center
  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40
                   bg-purple-500/20 border border-purple-500/50 text-purple-400
                   rounded-xl px-4 py-2
                   flex items-center gap-2
                   hover:scale-105 active:scale-95
                   transition-all duration-200
                   backdrop-blur-xl font-rajdhani"
      >
        <Layers size={16} />
        <span className="text-xs font-bold tracking-wider">DECKS</span>
        {activeCount > 0 && (
          <span className="w-4 h-4 bg-purple-500 rounded-full text-[9px] font-bold text-white
                          flex items-center justify-center">
            {activeCount}
          </span>
        )}
        <ChevronUp size={14} />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-40
                 bg-black/90 backdrop-blur-xl
                 border border-purple-500/50 rounded-2xl
                 font-rajdhani text-white
                 transition-all duration-200 ease-out
                 ${isExpanded
                   ? 'w-[95vw] max-w-[600px] shadow-[0_0_30px_rgba(168,85,247,0.3)]'
                   : 'w-[320px]'
                 }`}
      style={{ maxHeight: isExpanded ? '40vh' : '120px' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-white/10
                   cursor-pointer select-none"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-purple-400" />
          <span className="text-sm font-bold tracking-wider text-purple-400">DECKS</span>
          <span className="text-[10px] text-white/40">4-CH</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-500/30 text-purple-300 rounded-full">
              {activeCount} ON
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleOpen(); }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Compact Mode - 4 channel status buttons */}
      {!isExpanded && (
        <div className="p-2 flex gap-2 justify-center">
          {decks.map((deck) => {
            const isActive = deck.mixMode !== 'off';
            const hasFrames = deck.frames.length > 0;
            const pulseOnBeat = isActive && beatCounter % 4 === 0;

            return (
              <button
                key={deck.id}
                onClick={() => {
                  if (hasFrames) {
                    // Cycle through modes: off -> sequencer -> layer -> off
                    const modes: MixMode[] = ['off', 'sequencer', 'layer'];
                    const currentIdx = modes.indexOf(deck.mixMode);
                    onDeckModeChange(deck.id, modes[(currentIdx + 1) % 3]);
                  } else {
                    onLoadDeck(deck.id);
                  }
                }}
                className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5
                           transition-all active:scale-95 border-2
                           ${!hasFrames
                             ? 'bg-white/5 border-dashed border-white/20 text-white/30'
                             : pulseOnBeat
                               ? 'border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                               : isActive
                                 ? deck.mixMode === 'layer'
                                   ? 'bg-purple-500/30 border-purple-400 text-purple-300'
                                   : 'bg-cyan-500/30 border-cyan-400 text-cyan-300'
                                 : 'bg-white/10 border-white/20 text-white/50'
                           }`}
              >
                <span className="text-lg font-black">{deck.id + 1}</span>
                <span className="text-[8px] font-bold">
                  {!hasFrames ? 'LOAD' : deck.mixMode === 'off' ? 'OFF' : deck.mixMode === 'layer' ? 'LAY' : 'SEQ'}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Expanded Mode - Full deck controls */}
      {isExpanded && (
        <div className="p-3 overflow-y-auto" style={{ maxHeight: 'calc(40vh - 50px)' }}>
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
    </div>
  );
};

// =============================================================================
// DECK CHANNEL - Individual channel control (compact version)
// =============================================================================

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

  return (
    <div
      className={`rounded-xl overflow-hidden border-2 transition-all
                 ${isActive
                   ? pulseOnBeat
                     ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.3)]'
                     : deck.mixMode === 'layer'
                       ? 'border-purple-500/50'
                       : 'border-cyan-500/50'
                   : 'border-white/10'
                 }
                 ${isSelected ? 'col-span-2' : ''}`}
    >
      {/* Channel Header */}
      <div className="flex items-center justify-between p-2 bg-black/50">
        <div className="flex items-center gap-1.5">
          {/* Channel number */}
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-sm font-black
                          ${isActive ? 'bg-cyan-500/30 text-cyan-400' : 'bg-white/10 text-white/40'}`}>
            {deck.id + 1}
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-0.5 bg-black/40 rounded-lg p-0.5">
            {(['off', 'sequencer', 'layer'] as MixMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onModeChange(mode)}
                className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all
                           ${deck.mixMode === mode
                             ? mode === 'off'
                               ? 'bg-white/20 text-white/60'
                               : mode === 'layer'
                                 ? 'bg-purple-500 text-white'
                                 : 'bg-cyan-500 text-white'
                             : 'text-white/30'
                           }`}
              >
                {mode === 'sequencer' ? 'SEQ' : mode === 'layer' ? 'LAY' : 'OFF'}
              </button>
            ))}
          </div>
        </div>

        {/* Expand/Details */}
        <button
          onClick={onSelect}
          className="p-1 text-white/40 hover:text-white rounded-lg hover:bg-white/10"
        >
          {isSelected ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Preview thumbnail */}
      {hasFrames ? (
        <button
          onClick={onTrigger}
          className="w-full h-16 bg-black/30 flex items-center justify-center relative
                     active:scale-95 transition-transform"
        >
          <img
            src={currentFrame?.url}
            alt={currentFrame?.pose || 'frame'}
            className="max-w-full max-h-full object-contain"
          />
          <div className="absolute bottom-0.5 right-1 px-1.5 py-0.5 bg-black/70 rounded text-[9px] font-mono text-cyan-400">
            {deck.currentFrameIndex + 1}/{deck.frames.length}
          </div>
          {isActive && (
            <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          )}
        </button>
      ) : (
        <button
          onClick={onLoad}
          className="w-full h-16 bg-white/5 flex items-center justify-center gap-1
                     hover:bg-cyan-500/10 border-t border-dashed border-white/20
                     transition-all"
        >
          <Upload size={14} className="text-white/40" />
          <span className="text-[10px] text-white/40 font-bold">LOAD</span>
        </button>
      )}

      {/* Layer opacity slider */}
      {deck.mixMode === 'layer' && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-purple-500/10 border-t border-purple-500/30">
          <Eye size={12} className="text-purple-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={deck.opacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            className="flex-1 h-1 rounded-full appearance-none bg-white/10
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400"
          />
          <span className="text-[9px] text-purple-400 font-mono">
            {Math.round(deck.opacity * 100)}%
          </span>
        </div>
      )}

      {/* Selected: Frame browser */}
      {isSelected && hasFrames && (
        <div className="p-2 bg-black/30 border-t border-white/10">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-white/40 tracking-wider truncate max-w-[120px]">
              {deck.rigName || 'FRAMES'}
            </span>
            <button
              onClick={onClear}
              className="px-1.5 py-0.5 text-[9px] text-red-400 hover:bg-red-500/20 rounded transition-all"
            >
              CLEAR
            </button>
          </div>
          <div className="grid grid-cols-8 gap-1 max-h-20 overflow-y-auto">
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
                <img
                  src={frame.url}
                  alt={frame.pose}
                  className="w-full h-full object-contain bg-black/50"
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
