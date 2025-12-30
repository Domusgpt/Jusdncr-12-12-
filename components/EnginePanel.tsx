/**
 * EnginePanel - Premium Engine Control
 *
 * Redesigned with:
 * - Clear visual hierarchy
 * - Better collapse/expand UX
 * - Organized sections for Physics, Engine Mode, Patterns
 * - Visual intensity meter
 */

import React from 'react';
import {
  Zap, Brain, Grid3X3, ChevronDown, ChevronUp, X,
  Maximize2, Minimize2, Activity, Gauge
} from 'lucide-react';
import type {
  EngineMode, SequenceMode, PatternType
} from '../engine/GolemMixer';

interface EnginePanelProps {
  isOpen: boolean;
  isExpanded: boolean;
  onToggleOpen: () => void;
  onToggleExpand: () => void;

  physicsMode: 'LEGACY' | 'LABAN';
  onPhysicsModeChange: (mode: 'LEGACY' | 'LABAN') => void;

  engineMode: EngineMode;
  onEngineModeChange: (mode: EngineMode) => void;

  activePattern: PatternType;
  onPatternChange: (pattern: PatternType) => void;

  sequenceMode: SequenceMode;
  onSequenceModeChange: (mode: SequenceMode) => void;

  intensity: number;
  onIntensityChange: (intensity: number) => void;

  bpm?: number;
  labanEffort?: { weight: number; space: number; time: number; flow: number };
}

const PATTERNS: { id: PatternType; label: string; desc: string; color: string }[] = [
  { id: 'PING_PONG', label: 'PING', desc: 'Left-right', color: 'from-cyan-500 to-blue-500' },
  { id: 'BUILD_DROP', label: 'DROP', desc: 'Build & release', color: 'from-orange-500 to-red-500' },
  { id: 'STUTTER', label: 'STUT', desc: 'Rapid cuts', color: 'from-pink-500 to-purple-500' },
  { id: 'VOGUE', label: 'VOGUE', desc: 'Poses', color: 'from-purple-500 to-pink-500' },
  { id: 'FLOW', label: 'FLOW', desc: 'Smooth', color: 'from-green-500 to-cyan-500' },
  { id: 'CHAOS', label: 'CHAOS', desc: 'Random', color: 'from-red-500 to-orange-500' },
  { id: 'ABAB', label: 'ABAB', desc: 'Alternate', color: 'from-blue-500 to-cyan-500' },
  { id: 'AABB', label: 'AABB', desc: 'Paired', color: 'from-indigo-500 to-purple-500' },
  { id: 'SNARE_ROLL', label: 'SNARE', desc: 'On hits', color: 'from-yellow-500 to-orange-500' },
  { id: 'GROOVE', label: 'GRV', desc: 'Mid energy', color: 'from-green-500 to-emerald-500' },
];

const SEQUENCE_MODES: { id: SequenceMode; label: string; icon: string; color: string }[] = [
  { id: 'GROOVE', label: 'GROOVE', icon: '🎵', color: 'from-green-500 to-emerald-500' },
  { id: 'EMOTE', label: 'EMOTE', icon: '😎', color: 'from-purple-500 to-pink-500' },
  { id: 'IMPACT', label: 'IMPACT', icon: '💥', color: 'from-red-500 to-orange-500' },
  { id: 'FOOTWORK', label: 'FOOT', icon: '👟', color: 'from-blue-500 to-cyan-500' }
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

  // ============ CLOSED STATE ============
  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="fixed bottom-2 left-2 z-40 group
                   bg-gradient-to-r from-cyan-500/20 to-blue-500/20
                   border border-cyan-500/40 text-cyan-400
                   rounded-2xl px-4 py-2.5
                   flex items-center gap-3
                   hover:scale-105 hover:border-cyan-400/60 active:scale-95
                   transition-all duration-200
                   backdrop-blur-xl font-rajdhani
                   shadow-lg shadow-cyan-500/10"
      >
        <div className="relative">
          <Zap size={18} className="group-hover:animate-pulse" />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs font-bold tracking-wider leading-none">ENGINE</span>
          <span className="text-[9px] text-cyan-300/70">
            {engineMode === 'PATTERN' ? activePattern : sequenceMode}
          </span>
        </div>
        {bpm && (
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-1.5 py-0.5 rounded">
            {bpm}
          </span>
        )}
        <Maximize2 size={12} className="text-white/30 group-hover:text-white/60" />
      </button>
    );
  }

  // ============ OPEN STATE ============
  return (
    <div
      className={`fixed bottom-2 left-2 z-40
                 bg-gradient-to-b from-black/95 to-black/90 backdrop-blur-xl
                 border border-cyan-500/30 rounded-2xl
                 font-rajdhani text-white
                 transition-all duration-300 ease-out
                 shadow-2xl shadow-cyan-500/20
                 ${isExpanded ? 'w-[340px]' : 'w-[220px]'}`}
      style={{ maxHeight: isExpanded ? '55vh' : '150px' }}
    >
      {/* ===== HEADER ===== */}
      <div className="relative">
        <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30
                          flex items-center justify-center border border-cyan-500/30">
              <Zap size={16} className="text-cyan-400" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wider text-white flex items-center gap-2">
                ENGINE
                {bpm && (
                  <span className="px-1.5 py-0.5 text-[9px] font-mono bg-cyan-500/30 text-cyan-300 rounded-md">
                    {bpm} BPM
                  </span>
                )}
              </div>
              <div className="text-[10px] text-white/40">
                {engineMode === 'PATTERN' ? 'Pattern Mode' : 'Kinetic Mode'}
              </div>
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

      {/* ===== COMPACT MODE ===== */}
      {!isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Engine Mode Toggle */}
          <div className="flex gap-1.5">
            <button
              onClick={() => onEngineModeChange('PATTERN')}
              className={`flex-1 py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5
                         transition-all border
                         ${engineMode === 'PATTERN'
                           ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border-cyan-400/50 text-cyan-300'
                           : 'bg-white/5 border-white/10 text-white/40'
                         }`}
            >
              <Grid3X3 size={12} />
              PATTERN
            </button>
            <button
              onClick={() => onEngineModeChange('KINETIC')}
              className={`flex-1 py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5
                         transition-all border
                         ${engineMode === 'KINETIC'
                           ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-purple-400/50 text-purple-300'
                           : 'bg-white/5 border-white/10 text-white/40'
                         }`}
            >
              <Brain size={12} />
              KINETIC
            </button>
          </div>

          {/* Intensity Bar */}
          <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
              style={{ width: `${intensity * 100}%` }}
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={intensity}
              onChange={(e) => onIntensityChange(parseFloat(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* ===== EXPANDED MODE ===== */}
      {isExpanded && (
        <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(55vh - 70px)' }}>

          {/* Physics Mode */}
          <div className="px-3 pb-3">
            <div className="text-[10px] text-white/40 font-bold tracking-wider mb-2 flex items-center gap-2">
              <div className="w-1 h-3 rounded-full bg-gradient-to-b from-cyan-500 to-blue-500" />
              PHYSICS STYLE
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onPhysicsModeChange('LEGACY')}
                className={`py-2.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2
                           transition-all border
                           ${physicsMode === 'LEGACY'
                             ? 'bg-gradient-to-r from-orange-500/30 to-yellow-500/30 border-orange-400/50 text-orange-300'
                             : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                           }`}
              >
                <Zap size={14} />
                LEGACY
              </button>
              <button
                onClick={() => onPhysicsModeChange('LABAN')}
                className={`py-2.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2
                           transition-all border
                           ${physicsMode === 'LABAN'
                             ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border-cyan-400/50 text-cyan-300'
                             : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                           }`}
              >
                <Brain size={14} />
                LABAN
              </button>
            </div>

            {/* Laban Effort Display */}
            {physicsMode === 'LABAN' && labanEffort && (
              <div className="mt-2 grid grid-cols-4 gap-1 p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                {[
                  { label: 'WGT', value: labanEffort.weight },
                  { label: 'SPC', value: labanEffort.space },
                  { label: 'TME', value: labanEffort.time },
                  { label: 'FLW', value: labanEffort.flow }
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <div className="text-[8px] text-white/40">{label}</div>
                    <div className="text-[10px] font-bold text-cyan-400">{value.toFixed(1)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Engine Mode */}
          <div className="px-3 pb-3">
            <div className="text-[10px] text-white/40 font-bold tracking-wider mb-2 flex items-center gap-2">
              <div className="w-1 h-3 rounded-full bg-gradient-to-b from-purple-500 to-pink-500" />
              ENGINE MODE
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onEngineModeChange('PATTERN')}
                className={`py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1
                           transition-all border
                           ${engineMode === 'PATTERN'
                             ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-400/50 text-white'
                             : 'bg-white/5 border-white/10 text-white/40'
                           }`}
              >
                <Grid3X3 size={18} />
                PATTERN
              </button>
              <button
                onClick={() => onEngineModeChange('KINETIC')}
                className={`py-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1
                           transition-all border
                           ${engineMode === 'KINETIC'
                             ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/50 text-white'
                             : 'bg-white/5 border-white/10 text-white/40'
                           }`}
              >
                <Brain size={18} />
                KINETIC
              </button>
            </div>
          </div>

          {/* PATTERN Mode: Pattern Grid */}
          {engineMode === 'PATTERN' && (
            <div className="px-3 pb-3">
              <div className="text-[10px] text-white/40 font-bold tracking-wider mb-2 flex items-center gap-2">
                <div className="w-1 h-3 rounded-full bg-gradient-to-b from-cyan-500 to-blue-500" />
                PATTERNS
              </div>
              <div className="grid grid-cols-5 gap-1">
                {PATTERNS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onPatternChange(p.id)}
                    title={p.desc}
                    className={`relative py-2.5 rounded-xl text-[8px] font-bold transition-all border overflow-hidden
                               ${activePattern === p.id
                                 ? 'border-white/30 text-white'
                                 : 'border-white/10 text-white/40 hover:border-white/20'
                               }`}
                  >
                    {activePattern === p.id && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${p.color} opacity-30`} />
                    )}
                    <span className="relative z-10">{p.label}</span>
                  </button>
                ))}
              </div>
              <div className="text-[9px] text-white/40 text-center mt-2">
                {PATTERNS.find(p => p.id === activePattern)?.desc}
              </div>
            </div>
          )}

          {/* KINETIC Mode: Sequence Mode */}
          {engineMode === 'KINETIC' && (
            <div className="px-3 pb-3">
              <div className="text-[10px] text-white/40 font-bold tracking-wider mb-2 flex items-center gap-2">
                <div className="w-1 h-3 rounded-full bg-gradient-to-b from-purple-500 to-pink-500" />
                SEQUENCE
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {SEQUENCE_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => onSequenceModeChange(mode.id)}
                    className={`relative py-3 rounded-xl text-[10px] font-bold transition-all border overflow-hidden
                               flex items-center justify-center gap-2
                               ${sequenceMode === mode.id
                                 ? 'border-white/30 text-white'
                                 : 'border-white/10 text-white/40 hover:border-white/20'
                               }`}
                  >
                    {sequenceMode === mode.id && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-30`} />
                    )}
                    <span className="relative z-10">{mode.icon}</span>
                    <span className="relative z-10">{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Intensity Slider */}
          <div className="px-3 pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] text-white/40 font-bold tracking-wider flex items-center gap-2">
                <div className="w-1 h-3 rounded-full bg-gradient-to-b from-green-500 to-cyan-500" />
                INTENSITY
              </div>
              <span className="text-[10px] font-mono text-cyan-400">{Math.round(intensity * 100)}%</span>
            </div>
            <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 via-cyan-500 to-blue-500 rounded-full transition-all"
                style={{ width: `${intensity * 100}%` }}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={intensity}
                onChange={(e) => onIntensityChange(parseFloat(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex justify-between text-[8px] text-white/30 mt-1">
              <span>CHILL</span>
              <span>HYPE</span>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
    </div>
  );
};

export default EnginePanel;
