/**
 * EnginePanel - LEFT BEZEL Engine Control
 *
 * Expands from left side of screen:
 * - Closed: Slim vertical tab on left edge
 * - Open: Slides out from left with full controls
 */

import React from 'react';
import {
  Zap, Brain, Grid3X3, X,
  ChevronRight, ChevronLeft, Activity
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
  { id: 'PING_PONG', label: 'PING', desc: 'L/R', color: 'from-cyan-500 to-blue-500' },
  { id: 'BUILD_DROP', label: 'DROP', desc: 'Build', color: 'from-orange-500 to-red-500' },
  { id: 'STUTTER', label: 'STUT', desc: 'Cuts', color: 'from-pink-500 to-purple-500' },
  { id: 'VOGUE', label: 'VOGUE', desc: 'Pose', color: 'from-purple-500 to-pink-500' },
  { id: 'FLOW', label: 'FLOW', desc: 'Smooth', color: 'from-green-500 to-cyan-500' },
  { id: 'CHAOS', label: 'CHAOS', desc: 'Random', color: 'from-red-500 to-orange-500' },
  { id: 'MINIMAL', label: 'MIN', desc: 'Calm', color: 'from-gray-500 to-slate-500' },
  { id: 'ABAB', label: 'ABAB', desc: 'Alt', color: 'from-blue-500 to-cyan-500' },
  { id: 'AABB', label: 'AABB', desc: 'Pair', color: 'from-indigo-500 to-purple-500' },
  { id: 'ABAC', label: 'ABAC', desc: 'Var', color: 'from-teal-500 to-green-500' },
  { id: 'SNARE_ROLL', label: 'SNARE', desc: 'Hits', color: 'from-yellow-500 to-orange-500' },
  { id: 'GROOVE', label: 'GRV', desc: 'Mid', color: 'from-green-500 to-emerald-500' },
  { id: 'EMOTE', label: 'EMOTE', desc: 'Face', color: 'from-pink-500 to-rose-500' },
  { id: 'FOOTWORK', label: 'FEET', desc: 'Low', color: 'from-amber-500 to-yellow-500' },
  { id: 'IMPACT', label: 'HIT', desc: 'Drop', color: 'from-red-600 to-orange-500' },
];

const SEQUENCE_MODES: { id: SequenceMode; label: string; color: string }[] = [
  { id: 'GROOVE', label: 'GRV', color: 'from-green-500 to-emerald-500' },
  { id: 'EMOTE', label: 'EMT', color: 'from-purple-500 to-pink-500' },
  { id: 'IMPACT', label: 'IMP', color: 'from-red-500 to-orange-500' },
  { id: 'FOOTWORK', label: 'FT', color: 'from-blue-500 to-cyan-500' }
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

  // ============ CLOSED STATE - Vertical tab on left edge ============
  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="fixed left-0 top-1/3 z-[60]
                   w-10 min-h-[100px]
                   bg-gradient-to-b from-cyan-500/50 to-blue-500/50
                   border-y-2 border-r-2 border-cyan-400
                   rounded-r-xl py-3 px-1
                   flex flex-col items-center justify-center gap-1.5
                   hover:w-12 hover:bg-cyan-500/60
                   active:scale-95 transition-all duration-200
                   backdrop-blur-md font-rajdhani
                   shadow-xl shadow-cyan-500/40"
      >
        <Zap size={20} className="text-cyan-300" />
        <span className="text-[11px] font-black text-cyan-200"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
          ENGINE
        </span>
        {bpm && (
          <span className="text-[10px] font-mono text-cyan-200 bg-black/50 px-1.5 py-0.5 rounded">
            {Math.round(bpm)}
          </span>
        )}
        <ChevronRight size={16} className="text-cyan-300" />
      </button>
    );
  }

  // ============ OPEN STATE - Slides from left ============
  return (
    <div
      className={`fixed left-0 top-1/3 z-[60]
                 bg-black/95 backdrop-blur-xl
                 border-y-2 border-r-2 border-cyan-400 rounded-r-2xl
                 font-rajdhani text-white
                 transition-all duration-300 ease-out
                 shadow-2xl shadow-cyan-500/30
                 ${isExpanded ? 'w-[280px]' : 'w-[180px]'}`}
      style={{ maxHeight: '70vh' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-cyan-400" />
          <span className="text-sm font-bold text-cyan-400">ENGINE</span>
          {bpm && (
            <span className="px-1.5 py-0.5 text-[9px] font-mono bg-cyan-500/30 text-cyan-300 rounded">
              {bpm}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleExpand}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all"
          >
            {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
          <button
            onClick={onToggleOpen}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-all"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-2 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 50px)' }}>

        {/* Engine Mode Toggle */}
        <div className="mb-3">
          <div className="text-[9px] text-white/40 font-bold tracking-wider mb-1.5">MODE</div>
          <div className="flex gap-1">
            <button
              onClick={() => onEngineModeChange('PATTERN')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1
                         transition-all border
                         ${engineMode === 'PATTERN'
                           ? 'bg-gradient-to-r from-cyan-500/40 to-blue-500/40 border-cyan-400/60 text-cyan-300'
                           : 'bg-white/5 border-white/10 text-white/40'
                         }`}
            >
              <Grid3X3 size={12} />
              PAT
            </button>
            <button
              onClick={() => onEngineModeChange('KINETIC')}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1
                         transition-all border
                         ${engineMode === 'KINETIC'
                           ? 'bg-gradient-to-r from-purple-500/40 to-pink-500/40 border-purple-400/60 text-purple-300'
                           : 'bg-white/5 border-white/10 text-white/40'
                         }`}
            >
              <Brain size={12} />
              KIN
            </button>
          </div>
        </div>

        {/* Pattern Grid (when PATTERN mode) - All 15 patterns */}
        {engineMode === 'PATTERN' && (
          <div className="mb-3">
            <div className="text-[9px] text-white/40 font-bold tracking-wider mb-1.5">PATTERNS ({PATTERNS.length})</div>
            <div className={`grid gap-1 ${isExpanded ? 'grid-cols-5' : 'grid-cols-3'}`}>
              {PATTERNS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPatternChange(p.id)}
                  title={p.desc}
                  className={`relative py-2 rounded-lg text-[8px] font-bold transition-all border overflow-hidden
                             ${activePattern === p.id
                               ? 'border-white/40 text-white'
                               : 'border-white/10 text-white/40 hover:border-white/25'
                             }`}
                >
                  {activePattern === p.id && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${p.color} opacity-40`} />
                  )}
                  <span className="relative z-10">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sequence Mode (when KINETIC mode) */}
        {engineMode === 'KINETIC' && (
          <div className="mb-3">
            <div className="text-[9px] text-white/40 font-bold tracking-wider mb-1.5">SEQUENCE</div>
            <div className="grid grid-cols-2 gap-1">
              {SEQUENCE_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => onSequenceModeChange(mode.id)}
                  className={`relative py-2 rounded-lg text-[9px] font-bold transition-all border overflow-hidden
                             ${sequenceMode === mode.id
                               ? 'border-white/40 text-white'
                               : 'border-white/10 text-white/40'
                             }`}
                >
                  {sequenceMode === mode.id && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-40`} />
                  )}
                  <span className="relative z-10">{mode.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Physics Mode (expanded only) */}
        {isExpanded && (
          <div className="mb-3">
            <div className="text-[9px] text-white/40 font-bold tracking-wider mb-1.5">PHYSICS</div>
            <div className="flex gap-1">
              <button
                onClick={() => onPhysicsModeChange('LEGACY')}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold transition-all border
                           ${physicsMode === 'LEGACY'
                             ? 'bg-orange-500/30 border-orange-400/50 text-orange-300'
                             : 'bg-white/5 border-white/10 text-white/40'
                           }`}
              >
                LEGACY
              </button>
              <button
                onClick={() => onPhysicsModeChange('LABAN')}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold transition-all border
                           ${physicsMode === 'LABAN'
                             ? 'bg-cyan-500/30 border-cyan-400/50 text-cyan-300'
                             : 'bg-white/5 border-white/10 text-white/40'
                           }`}
              >
                LABAN
              </button>
            </div>
          </div>
        )}

        {/* Intensity - Vertical slider */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-white/40 font-bold tracking-wider">INTENSITY</span>
            <span className="text-[9px] text-cyan-400 font-mono">{Math.round(intensity * 100)}%</span>
          </div>
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
      </div>

      {/* Glow accent */}
      <div className="absolute top-0 bottom-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent" />
    </div>
  );
};

export default EnginePanel;
