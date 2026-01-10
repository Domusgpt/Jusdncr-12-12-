/**
 * MixerDrawer - Bottom sheet drawer for 4-channel deck mixer
 *
 * Swipes up from bottom, max 60% screen height
 * Shows all 4 decks with mode toggles, opacity, frame count, load buttons
 */

import React, { useState, useRef } from 'react';
import {
  Layers, Upload, ChevronDown, ChevronUp, Trash2, Eye
} from 'lucide-react';
import type { MixMode } from '../engine/GolemMixer';
import type { GeneratedFrame } from '../types';

interface DeckData {
  id: number;
  frames: GeneratedFrame[];
  rigName?: string;
  mixMode: MixMode;
  opacity: number;
  isActive: boolean;
  currentFrameIndex: number;
}

interface MixerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  decks: DeckData[];
  onLoadDeck: (deckId: number) => void;
  onDeckModeChange: (deckId: number, mode: MixMode) => void;
  onDeckOpacityChange: (deckId: number, opacity: number) => void;
  onClearDeck: (deckId: number) => void;
  onSelectFrame: (deckId: number, frameIndex: number) => void;
}

const MODE_CONFIG = {
  off: { label: 'OFF', color: 'bg-gray-500/30 border-gray-500/50 text-gray-400' },
  sequencer: { label: 'SEQ', color: 'bg-cyan-500/30 border-cyan-500 text-cyan-400' },
  layer: { label: 'LAY', color: 'bg-purple-500/30 border-purple-500 text-purple-400' }
};

export const MixerDrawer: React.FC<MixerDrawerProps> = ({
  isOpen,
  onClose,
  decks,
  onLoadDeck,
  onDeckModeChange,
  onDeckOpacityChange,
  onClearDeck,
  onSelectFrame
}) => {
  const [expandedDeck, setExpandedDeck] = useState<number | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentTranslate, setCurrentTranslate] = useState(0);

  // Handle drag to close
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (dragStartY === 0) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const delta = clientY - dragStartY;
    if (delta > 0) {
      setCurrentTranslate(delta);
    }
  };

  const handleDragEnd = () => {
    if (currentTranslate > 100) {
      onClose();
    }
    setDragStartY(0);
    setCurrentTranslate(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="relative bg-black/95 backdrop-blur-xl rounded-t-2xl border-t border-white/20
                   max-h-[60vh] overflow-hidden shadow-2xl"
        style={{ transform: `translateY(${currentTranslate}px)` }}
      >
        {/* Drag handle */}
        <div
          className="py-3 cursor-grab active:cursor-grabbing"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onMouseDown={handleDragStart}
          onMouseMove={dragStartY ? handleDragMove : undefined}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
        >
          <div className="w-12 h-1 bg-white/30 rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-purple-400" />
            <span className="text-sm font-bold text-white">DECK MIXER</span>
            <span className="text-xs text-white/40">
              {decks.filter(d => d.mixMode !== 'off').length} active
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60"
          >
            <ChevronDown size={18} />
          </button>
        </div>

        {/* Decks list */}
        <div className="overflow-y-auto max-h-[calc(60vh-80px)] p-3 space-y-2">
          {decks.map((deck) => {
            const isExpanded = expandedDeck === deck.id;
            const hasFrames = deck.frames.length > 0;
            const modeConfig = MODE_CONFIG[deck.mixMode];

            return (
              <div
                key={deck.id}
                className={`rounded-xl border transition-all overflow-hidden
                           ${deck.mixMode !== 'off'
                             ? 'bg-white/5 border-white/20'
                             : 'bg-white/[0.02] border-white/10'
                           }`}
              >
                {/* Deck header */}
                <div className="flex items-center gap-2 p-3">
                  {/* Deck number */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                                 font-bold text-sm ${modeConfig.color} border`}>
                    {deck.id + 1}
                  </div>

                  {/* Mode toggles */}
                  <div className="flex rounded-lg overflow-hidden border border-white/20">
                    {(['off', 'sequencer', 'layer'] as MixMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => onDeckModeChange(deck.id, mode)}
                        className={`px-2.5 py-1 text-[10px] font-bold transition-all
                                   ${deck.mixMode === mode
                                     ? MODE_CONFIG[mode].color
                                     : 'bg-white/5 text-white/40 hover:text-white'
                                   }`}
                      >
                        {MODE_CONFIG[mode].label}
                      </button>
                    ))}
                  </div>

                  {/* Frame count / Rig name */}
                  <div className="flex-1 text-center">
                    {hasFrames ? (
                      <div>
                        <span className="text-[10px] text-white/60">
                          {deck.rigName || 'Unnamed'}
                        </span>
                        <span className="text-[10px] text-cyan-400 ml-2">
                          {deck.frames.length} frames
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-white/30">Empty</span>
                    )}
                  </div>

                  {/* Opacity slider (only when active) */}
                  {deck.mixMode !== 'off' && hasFrames && (
                    <div className="flex items-center gap-1 w-20">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={deck.opacity * 100}
                        onChange={(e) => onDeckOpacityChange(deck.id, Number(e.target.value) / 100)}
                        className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                                  [&::-webkit-slider-thumb]:appearance-none
                                  [&::-webkit-slider-thumb]:w-2.5
                                  [&::-webkit-slider-thumb]:h-2.5
                                  [&::-webkit-slider-thumb]:bg-white
                                  [&::-webkit-slider-thumb]:rounded-full"
                      />
                      <span className="text-[9px] text-white/40 w-6">
                        {Math.round(deck.opacity * 100)}%
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {hasFrames && (
                      <>
                        <button
                          onClick={() => setExpandedDeck(isExpanded ? null : deck.id)}
                          className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/60"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => onClearDeck(deck.id)}
                          className="p-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onLoadDeck(deck.id)}
                      className="p-1.5 rounded-md bg-brand-500/20 hover:bg-brand-500/30 text-brand-400"
                    >
                      <Upload size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded frame browser */}
                {isExpanded && hasFrames && (
                  <div className="px-3 pb-3 border-t border-white/10 pt-2">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {deck.frames.slice(0, 20).map((frame, i) => (
                        <button
                          key={i}
                          onClick={() => onSelectFrame(deck.id, i)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2
                                     transition-all hover:scale-105
                                     ${deck.currentFrameIndex === i
                                       ? 'border-cyan-500 shadow-[0_0_10px_rgba(0,255,255,0.3)]'
                                       : 'border-white/10 hover:border-white/30'
                                     }`}
                        >
                          <img
                            src={frame.url}
                            alt={`Frame ${i + 1}`}
                            className="w-full h-full object-contain bg-black/50"
                          />
                        </button>
                      ))}
                      {deck.frames.length > 20 && (
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-white/5 border border-white/10
                                       flex items-center justify-center text-[10px] text-white/40">
                          +{deck.frames.length - 20}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MixerDrawer;
