/**
 * EnginePanel - Collapsible Engine Control
 *
 * Non-occluding, collapsible engine controls:
 * - Positioned at bottom-left
 * - Quick mode toggles in compact mode
 * - Full pattern/sequence controls in expanded mode
 */

import React, { useState } from 'react';
import {
  Zap, Brain, Grid3X3, ChevronDown, ChevronUp, X
} from 'lucide-react';
import type {
  EngineMode, SequenceMode, PatternType
} from '../engine/GolemMixer';

interface EnginePanelProps {
  isOpen: boolean;
  isExpanded: boolean;
  onToggleOpen: () => void;
  onToggleExpand: () => void;

  // Physics mode (how frames move)
  physicsMode: 'LEGACY' | 'LABAN';
  onPhysicsModeChange: (mode: 'LEGACY' | 'LABAN') => void;

  // Engine mode (which frame selected)
  engineMode: EngineMode;
  onEngineModeChange: (mode: EngineMode) => void;

  // Pattern (when in PATTERN mode)
  activePattern: PatternType;
  onPatternChange: (pattern: PatternType) => void;

  // Sequence mode (when in KINETIC mode)
  sequenceMode: SequenceMode;
  onSequenceModeChange: (mode: SequenceMode) => void;

  // Intensity
  intensity: number;
  onIntensityChange: (intensity: number) => void;

  // BPM Display
  bpm?: number;

  // Laban effort display
  labanEffort?: { weight: number; space: number; time: number; flow: number };
}

const PATTERNS: { id: PatternType; label: string; desc: string }[] = [
  { id: 'PING_PONG', label: 'PING', desc: 'Left-right alternating' },
  { id: 'BUILD_DROP', label: 'DROP', desc: 'Intensity to release' },
  { id: 'STUTTER', label: 'STUT', desc: 'Rapid cuts' },
  { id: 'VOGUE', label: 'VOGUE', desc: 'High-freq poses' },
  { id: 'FLOW', label: 'FLOW', desc: 'Smooth transitions' },
  { id: 'CHAOS', label: 'CHAOS', desc: 'Random everything' },
  { id: 'ABAB', label: 'ABAB', desc: 'Standard alternate' },
  { id: 'AABB', label: 'AABB', desc: 'Paired frames' },
  { id: 'ABAC', label: 'ABAC', desc: 'Third for breaks' },
  { id: 'SNARE_ROLL', label: 'SNARE', desc: 'Repeat on snares' },
  { id: 'GROOVE', label: 'GROOVE', desc: 'Mid-energy flow' },
  { id: 'EMOTE', label: 'EMOTE', desc: 'Closeup focus' },
  { id: 'FOOTWORK', label: 'FOOT', desc: 'Lower body' },
  { id: 'IMPACT', label: 'IMPACT', desc: 'High energy hits' },
  { id: 'MINIMAL', label: 'MIN', desc: 'Just beats' }
];

const SEQUENCE_MODES: { id: SequenceMode; label: string; color: string }[] = [
  { id: 'GROOVE', label: 'GRV', color: 'bg-green-500 border-green-400' },
  { id: 'EMOTE', label: 'EMT', color: 'bg-purple-500 border-purple-400' },
  { id: 'IMPACT', label: 'IMP', color: 'bg-red-500 border-red-400' },
  { id: 'FOOTWORK', label: 'FT', color: 'bg-blue-500 border-blue-400' }
];

export const EnginePanel: React.FC<EnginePanelProps> = ({
  isOpen,
  isExpanded,
  onToggleOpen,
  onToggleExpand,
  physicsMode,
  onPhysicsModeChange,
  engineMode,
  onEngineModeChange,
  activePattern,
  onPatternChange,
  sequenceMode,
  onSequenceModeChange,
  intensity,
  onIntensityChange,
  bpm,
  labanEffort
}) => {
  // Closed state - just a tab
  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="fixed bottom-2 left-2 z-40
                   bg-cyan-500/20 border border-cyan-500/50 text-cyan-400
                   rounded-xl px-3 py-2
                   flex items-center gap-2
                   hover:scale-105 active:scale-95
                   transition-all duration-200
                   backdrop-blur-xl font-rajdhani"
      >
        <Zap size={16} />
        <span className="text-xs font-bold tracking-wider">ENGINE</span>
        {bpm && (
          <span className="text-[10px] text-cyan-300 font-mono">{bpm}</span>
        )}
        <ChevronUp size={14} />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-2 left-2 z-40
                 bg-black/90 backdrop-blur-xl
                 border border-cyan-500/50 rounded-2xl
                 font-rajdhani text-white
                 transition-all duration-200 ease-out
                 ${isExpanded
                   ? 'w-[320px] shadow-[0_0_30px_rgba(0,255,255,0.3)]'
                   : 'w-[200px]'
                 }`}
      style={{ maxHeight: isExpanded ? '50vh' : '110px' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-white/10
                   cursor-pointer select-none"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-cyan-400" />
          <span className="text-sm font-bold tracking-wider text-cyan-400">ENGINE</span>
          {bpm && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-cyan-500/30 text-cyan-300 rounded-full font-mono">
              {bpm}
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

      {/* Compact Mode - Quick toggles */}
      {!isExpanded && (
        <div className="p-2 space-y-2">
          {/* Mode Toggle Row */}
          <div className="flex gap-1">
            <button
              onClick={() => onEngineModeChange('PATTERN')}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all border
                         ${engineMode === 'PATTERN'
                           ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300'
                           : 'bg-white/5 border-white/10 text-white/40'
                         }`}
            >
              <Grid3X3 size={12} className="inline mr-1" />
              PAT
            </button>
            <button
              onClick={() => onEngineModeChange('KINETIC')}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all border
                         ${engineMode === 'KINETIC'
                           ? 'bg-purple-500/30 border-purple-400 text-purple-300'
                           : 'bg-white/5 border-white/10 text-white/40'
                         }`}
            >
              <Brain size={12} className="inline mr-1" />
              KIN
            </button>
          </div>

          {/* Intensity bar */}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={intensity}
              onChange={(e) => onIntensityChange(parseFloat(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none bg-white/10
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
            />
            <span className="text-[10px] text-cyan-400 font-mono w-8">
              {Math.round(intensity * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Expanded Mode - Full controls */}
      {isExpanded && (
        <div className="p-3 overflow-y-auto space-y-3" style={{ maxHeight: 'calc(50vh - 50px)' }}>
          {/* Physics Style */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-white/40 tracking-wider">PHYSICS</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onPhysicsModeChange('LEGACY')}
                className={`py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1
                           transition-all border
                           ${physicsMode === 'LEGACY'
                             ? 'bg-orange-500/30 border-orange-400 text-orange-300'
                             : 'bg-white/5 border-white/10 text-white/40'
                           }`}
              >
                <Zap size={14} />
                LEGACY
              </button>
              <button
                onClick={() => onPhysicsModeChange('LABAN')}
                className={`py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1
                           transition-all border
                           ${physicsMode === 'LABAN'
                             ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300'
                             : 'bg-white/5 border-white/10 text-white/40'
                           }`}
              >
                <Brain size={14} />
                LABAN
              </button>
            </div>

            {/* Laban Effort Display */}
            {physicsMode === 'LABAN' && labanEffort && (
              <div className="grid grid-cols-4 gap-1 text-center text-[9px] p-2 bg-cyan-500/10 rounded-lg">
                <div>
                  <div className="text-white/40">WGT</div>
                  <div className="text-cyan-400 font-bold">{labanEffort.weight.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-white/40">SPC</div>
                  <div className="text-cyan-400 font-bold">{labanEffort.space.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-white/40">TME</div>
                  <div className="text-cyan-400 font-bold">{labanEffort.time.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-white/40">FLW</div>
                  <div className="text-cyan-400 font-bold">{labanEffort.flow.toFixed(1)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Engine Mode */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-white/40 tracking-wider">ENGINE MODE</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onEngineModeChange('PATTERN')}
                className={`py-2.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5
                           transition-all border
                           ${engineMode === 'PATTERN'
                             ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,255,255,0.2)]'
                             : 'bg-white/5 border-white/10 text-white/40'
                           }`}
              >
                <Grid3X3 size={14} />
                PATTERN
              </button>
              <button
                onClick={() => onEngineModeChange('KINETIC')}
                className={`py-2.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5
                           transition-all border
                           ${engineMode === 'KINETIC'
                             ? 'bg-purple-500/30 border-purple-400 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                             : 'bg-white/5 border-white/10 text-white/40'
                           }`}
              >
                <Brain size={14} />
                KINETIC
              </button>
            </div>
          </div>

          {/* PATTERN mode: Pattern Grid */}
          {engineMode === 'PATTERN' && (
            <div className="space-y-1.5">
              <div className="text-[10px] text-white/40 tracking-wider">PATTERNS</div>
              <div className="grid grid-cols-5 gap-1">
                {PATTERNS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onPatternChange(p.id)}
                    title={p.desc}
                    className={`py-2 rounded-lg text-[8px] font-bold transition-all border
                               ${activePattern === p.id
                                 ? 'bg-cyan-500/40 border-cyan-400 text-white'
                                 : 'bg-white/5 border-white/10 text-white/40'
                               }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="text-[9px] text-center text-white/40">
                {PATTERNS.find((p) => p.id === activePattern)?.desc}
              </div>
            </div>
          )}

          {/* KINETIC mode: Sequence Mode */}
          {engineMode === 'KINETIC' && (
            <div className="space-y-1.5">
              <div className="text-[10px] text-white/40 tracking-wider">SEQUENCE</div>
              <div className="grid grid-cols-4 gap-1">
                {SEQUENCE_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => onSequenceModeChange(mode.id)}
                    className={`py-2 rounded-lg text-[9px] font-bold transition-all border
                               ${sequenceMode === mode.id
                                 ? `${mode.color} text-white`
                                 : 'bg-white/5 border-white/10 text-white/40'
                               }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Intensity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/40 tracking-wider">INTENSITY</span>
              <span className="text-[10px] text-cyan-400 font-mono">{Math.round(intensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={intensity}
              onChange={(e) => onIntensityChange(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none
                        bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-lg"
            />
            <div className="flex justify-between text-[8px] text-white/30">
              <span>CHILL</span>
              <span>HYPE</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnginePanel;
