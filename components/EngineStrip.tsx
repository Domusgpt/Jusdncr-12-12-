/**
 * EngineStrip - Bottom horizontal control strip
 *
 * Contains: Physics mode, Sequence modes, Intensity slider, Mixer toggle
 * 56px height, fixed at bottom above safe area
 */

import React from 'react';
import { Disc3, ChevronUp } from 'lucide-react';
import type { EngineMode, SequenceMode } from '../engine/GolemMixer';

interface EngineStripProps {
  // Engine state
  physicsMode: 'LEGACY' | 'LABAN';
  onPhysicsModeChange: (mode: 'LEGACY' | 'LABAN') => void;

  engineMode: EngineMode;
  onEngineModeChange: (mode: EngineMode) => void;

  sequenceMode: SequenceMode;
  onSequenceModeChange: (mode: SequenceMode) => void;

  intensity: number;
  onIntensityChange: (value: number) => void;

  // Mixer
  isMixerOpen: boolean;
  onMixerToggle: () => void;
  activeDeckCount: number;

  // Current pattern display
  currentPattern?: string;
}

const SEQUENCE_MODES: { id: SequenceMode; label: string }[] = [
  { id: 'GROOVE', label: 'GRV' },
  { id: 'EMOTE', label: 'EMT' },
  { id: 'IMPACT', label: 'IMP' },
  { id: 'FOOTWORK', label: 'FT' }
];

export const EngineStrip: React.FC<EngineStripProps> = ({
  physicsMode,
  onPhysicsModeChange,
  engineMode,
  onEngineModeChange,
  sequenceMode,
  onSequenceModeChange,
  intensity,
  onIntensityChange,
  isMixerOpen,
  onMixerToggle,
  activeDeckCount,
  currentPattern
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="mx-2 mb-2 bg-black/80 backdrop-blur-xl rounded-xl
                     border border-white/10 shadow-xl">

        {/* Main controls row */}
        <div className="flex items-center gap-2 px-2 py-2">

          {/* Physics Mode Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-white/20">
            <button
              onClick={() => onPhysicsModeChange('LEGACY')}
              className={`px-2.5 py-1.5 text-[10px] font-bold transition-all
                         ${physicsMode === 'LEGACY'
                           ? 'bg-amber-500 text-white'
                           : 'bg-white/5 text-white/50 hover:text-white'
                         }`}
            >
              LEG
            </button>
            <button
              onClick={() => onPhysicsModeChange('LABAN')}
              className={`px-2.5 py-1.5 text-[10px] font-bold transition-all
                         ${physicsMode === 'LABAN'
                           ? 'bg-purple-500 text-white'
                           : 'bg-white/5 text-white/50 hover:text-white'
                         }`}
            >
              LAB
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10" />

          {/* Engine Mode Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-white/20">
            <button
              onClick={() => onEngineModeChange('KINETIC')}
              className={`px-2.5 py-1.5 text-[10px] font-bold transition-all
                         ${engineMode === 'KINETIC'
                           ? 'bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                           : 'bg-white/5 text-white/50 hover:text-white'
                         }`}
            >
              KIN
            </button>
            <button
              onClick={() => onEngineModeChange('PATTERN')}
              className={`px-2.5 py-1.5 text-[10px] font-bold transition-all
                         ${engineMode === 'PATTERN'
                           ? 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(0,255,255,0.5)]'
                           : 'bg-white/5 text-white/50 hover:text-white'
                         }`}
            >
              PAT
            </button>
          </div>

          {/* Current Pattern Indicator */}
          {currentPattern && (
            <div className="px-2 py-1 rounded-md bg-white/5 border border-white/10">
              <span className="text-[9px] text-white/60 font-mono">{currentPattern}</span>
            </div>
          )}

          {/* Sequence Mode Buttons */}
          <div className="flex gap-1">
            {SEQUENCE_MODES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => onSequenceModeChange(id)}
                className={`px-2 py-1.5 rounded-md text-[10px] font-bold transition-all
                           ${sequenceMode === id
                             ? 'bg-green-500 text-white shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                             : 'bg-white/5 text-white/40 border border-white/10 hover:text-white'
                           }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Intensity Slider */}
          <div className="flex items-center gap-2 w-28">
            <span className="text-[8px] text-white/40 font-bold">INT</span>
            <input
              type="range"
              min="0"
              max="100"
              value={intensity}
              onChange={(e) => onIntensityChange(Number(e.target.value))}
              className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-3
                        [&::-webkit-slider-thumb]:h-3
                        [&::-webkit-slider-thumb]:bg-brand-500
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(139,92,246,0.6)]"
            />
            <span className="text-[9px] text-white/60 font-mono w-6 text-right">
              {intensity}%
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10" />

          {/* Mixer Toggle */}
          <button
            onClick={onMixerToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all
                       ${isMixerOpen
                         ? 'bg-purple-500/30 border border-purple-500 text-purple-300'
                         : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                       }`}
          >
            <Disc3 size={16} />
            <span className="text-[10px] font-bold">MIX</span>
            {activeDeckCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-purple-500 text-white text-[9px] font-bold
                             flex items-center justify-center">
                {activeDeckCount}
              </span>
            )}
            <ChevronUp size={14} className={`transition-transform ${isMixerOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EngineStrip;
