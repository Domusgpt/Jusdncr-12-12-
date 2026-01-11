/**
 * EngineStrip - Bottom horizontal control strip
 *
 * Positioned OVER THE VISUALIZER (background edges), not over the player
 * Contains: Physics mode toggle, All 15 patterns with joystick highlighting, Mixer toggle
 */

import React, { useRef, useEffect } from 'react';
import { Disc3, ChevronUp } from 'lucide-react';
import type { EngineMode, PatternType } from '../engine/GolemMixer';

// All 15 patterns matching AnimationZoneController
const ALL_PATTERNS: { id: PatternType; label: string; color: string }[] = [
  { id: 'PING_PONG', label: 'PING', color: 'bg-cyan-500' },
  { id: 'BUILD_DROP', label: 'DROP', color: 'bg-purple-500' },
  { id: 'STUTTER', label: 'STUT', color: 'bg-pink-500' },
  { id: 'VOGUE', label: 'VOGUE', color: 'bg-amber-500' },
  { id: 'FLOW', label: 'FLOW', color: 'bg-green-500' },
  { id: 'CHAOS', label: 'CHAOS', color: 'bg-red-500' },
  { id: 'MINIMAL', label: 'MIN', color: 'bg-gray-500' },
  { id: 'ABAB', label: 'ABAB', color: 'bg-blue-500' },
  { id: 'AABB', label: 'AABB', color: 'bg-indigo-500' },
  { id: 'ABAC', label: 'ABAC', color: 'bg-violet-500' },
  { id: 'SNARE_ROLL', label: 'SNARE', color: 'bg-orange-500' },
  { id: 'GROOVE', label: 'GRV', color: 'bg-emerald-500' },
  { id: 'EMOTE', label: 'EMT', color: 'bg-rose-500' },
  { id: 'FOOTWORK', label: 'FOOT', color: 'bg-teal-500' },
  { id: 'IMPACT', label: 'IMP', color: 'bg-fuchsia-500' }
];

// KINETIC mode only uses 6 patterns
const KINETIC_PATTERNS: PatternType[] = [
  'PING_PONG', 'FLOW', 'STUTTER', 'CHAOS', 'VOGUE', 'BUILD_DROP'
];

interface EngineStripProps {
  physicsMode: 'LEGACY' | 'LABAN';
  onPhysicsModeChange: (mode: 'LEGACY' | 'LABAN') => void;
  engineMode: EngineMode;
  onEngineModeChange: (mode: EngineMode) => void;
  currentPattern: PatternType;
  onPatternChange: (pattern: PatternType) => void;
  joystickPattern?: PatternType;
  intensity: number;
  onIntensityChange: (value: number) => void;
  isMixerOpen: boolean;
  onMixerToggle: () => void;
  activeDeckCount: number;
}

export const EngineStrip: React.FC<EngineStripProps> = ({
  physicsMode,
  onPhysicsModeChange,
  engineMode,
  onEngineModeChange,
  currentPattern,
  onPatternChange,
  joystickPattern,
  intensity,
  onIntensityChange,
  isMixerOpen,
  onMixerToggle,
  activeDeckCount
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current pattern
  useEffect(() => {
    if (scrollRef.current && currentPattern) {
      const index = ALL_PATTERNS.findIndex(p => p.id === currentPattern);
      if (index >= 0) {
        const buttonWidth = 56;
        scrollRef.current.scrollTo({
          left: Math.max(0, index * buttonWidth - 80),
          behavior: 'smooth'
        });
      }
    }
  }, [currentPattern]);

  const visiblePatterns = engineMode === 'KINETIC'
    ? ALL_PATTERNS.filter(p => KINETIC_PATTERNS.includes(p.id))
    : ALL_PATTERNS;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe pointer-events-none">
      {/* Outer container - flush to edges, OVER visualizer */}
      <div className="pointer-events-auto">

        {/* Pattern row - scrollable, bigger buttons */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2 px-1 py-2 overflow-x-auto scrollbar-hide
                     bg-gradient-to-t from-black/90 via-black/70 to-transparent"
        >
          {/* Engine mode badge */}
          <div className={`flex-shrink-0 ml-1 px-3 py-2 rounded-lg text-xs font-black
                         ${engineMode === 'PATTERN'
                           ? 'bg-cyan-500/40 text-cyan-300 border border-cyan-500/60'
                           : 'bg-pink-500/40 text-pink-300 border border-pink-500/60'}`}>
            {engineMode === 'PATTERN' ? 'PAT' : 'KIN'}
          </div>

          <div className="w-px h-8 bg-white/20 flex-shrink-0" />

          {/* BIGGER pattern buttons - 48px min height for touch */}
          {visiblePatterns.map(({ id, label, color }) => {
            const isActive = currentPattern === id;
            const isHovered = joystickPattern === id && joystickPattern !== currentPattern;

            return (
              <button
                key={id}
                onClick={() => onPatternChange(id)}
                className={`flex-shrink-0 px-4 py-3 rounded-xl text-sm font-black
                           transition-all duration-150 min-w-[52px] min-h-[48px]
                           ${isActive
                             ? `${color} text-white`
                             : isHovered
                               ? `${color}/60 text-white border-2 border-white/60 animate-pulse`
                               : 'bg-white/10 text-white/60 border border-white/20 hover:text-white hover:bg-white/20'
                           }`}
                style={isActive ? {
                  boxShadow: `0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,255,255,0.2)`
                } : undefined}
              >
                {label}
              </button>
            );
          })}

          <div className="w-4 flex-shrink-0" /> {/* End padding */}
        </div>

        {/* Bottom controls row */}
        <div className="flex items-center gap-2 px-2 py-2 bg-black/90 border-t border-white/10">

          {/* Physics Mode Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-white/30">
            <button
              onClick={() => onPhysicsModeChange('LEGACY')}
              className={`px-3 py-2 text-xs font-bold transition-all
                         ${physicsMode === 'LEGACY'
                           ? 'bg-amber-500 text-white'
                           : 'bg-white/10 text-white/50 hover:text-white'}`}
            >
              LEG
            </button>
            <button
              onClick={() => onPhysicsModeChange('LABAN')}
              className={`px-3 py-2 text-xs font-bold transition-all
                         ${physicsMode === 'LABAN'
                           ? 'bg-purple-500 text-white'
                           : 'bg-white/10 text-white/50 hover:text-white'}`}
            >
              LAB
            </button>
          </div>

          <div className="w-px h-6 bg-white/20" />

          {/* Engine Mode Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-white/30">
            <button
              onClick={() => onEngineModeChange('PATTERN')}
              className={`px-3 py-2 text-xs font-bold transition-all
                         ${engineMode === 'PATTERN'
                           ? 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(0,255,255,0.6)]'
                           : 'bg-white/10 text-white/50 hover:text-white'}`}
            >
              PAT
            </button>
            <button
              onClick={() => onEngineModeChange('KINETIC')}
              className={`px-3 py-2 text-xs font-bold transition-all
                         ${engineMode === 'KINETIC'
                           ? 'bg-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.6)]'
                           : 'bg-white/10 text-white/50 hover:text-white'}`}
            >
              KIN
            </button>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Intensity */}
          <div className="flex items-center gap-2 w-24">
            <span className="text-[9px] text-white/50 font-bold">INT</span>
            <input
              type="range"
              min="0"
              max="100"
              value={intensity}
              onChange={(e) => onIntensityChange(Number(e.target.value))}
              className="flex-1 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:bg-brand-500
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(139,92,246,0.8)]"
            />
          </div>

          <div className="w-px h-6 bg-white/20" />

          {/* Mixer Toggle */}
          <button
            onClick={onMixerToggle}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                       ${isMixerOpen
                         ? 'bg-purple-500/40 border border-purple-400 text-purple-200'
                         : 'bg-white/10 border border-white/20 text-white/60 hover:text-white'}`}
          >
            <Disc3 size={16} />
            <span className="text-xs font-bold">MIX</span>
            {activeDeckCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-[10px] font-bold
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
