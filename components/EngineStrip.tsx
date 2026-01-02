/**
 * EngineStrip - Bottom horizontal control strip
 *
 * Contains: Physics mode toggle, All 15 patterns with joystick highlighting, Mixer toggle
 * Responsive: Portrait shows scrollable patterns, Landscape shows compact view
 */

import React, { useRef, useEffect } from 'react';
import { Disc3, ChevronUp } from 'lucide-react';
import type { EngineMode, PatternType } from '../engine/GolemMixer';

// All 15 patterns matching AnimationZoneController
const ALL_PATTERNS: { id: PatternType; label: string; color: string }[] = [
  { id: 'PING_PONG', label: 'P-P', color: 'bg-cyan-500' },
  { id: 'BUILD_DROP', label: 'B-D', color: 'bg-purple-500' },
  { id: 'STUTTER', label: 'STT', color: 'bg-pink-500' },
  { id: 'VOGUE', label: 'VOG', color: 'bg-amber-500' },
  { id: 'FLOW', label: 'FLO', color: 'bg-green-500' },
  { id: 'CHAOS', label: 'CHS', color: 'bg-red-500' },
  { id: 'MINIMAL', label: 'MIN', color: 'bg-gray-500' },
  { id: 'ABAB', label: 'ABAB', color: 'bg-blue-500' },
  { id: 'AABB', label: 'AABB', color: 'bg-indigo-500' },
  { id: 'ABAC', label: 'ABAC', color: 'bg-violet-500' },
  { id: 'SNARE_ROLL', label: 'SNR', color: 'bg-orange-500' },
  { id: 'GROOVE', label: 'GRV', color: 'bg-emerald-500' },
  { id: 'EMOTE', label: 'EMT', color: 'bg-rose-500' },
  { id: 'FOOTWORK', label: 'FTW', color: 'bg-teal-500' },
  { id: 'IMPACT', label: 'IMP', color: 'bg-fuchsia-500' }
];

// KINETIC mode only uses 6 patterns
const KINETIC_PATTERNS: PatternType[] = [
  'PING_PONG', 'FLOW', 'STUTTER', 'CHAOS', 'VOGUE', 'BUILD_DROP'
];

interface EngineStripProps {
  // Physics mode (separate toggle)
  physicsMode: 'LEGACY' | 'LABAN';
  onPhysicsModeChange: (mode: 'LEGACY' | 'LABAN') => void;

  // Engine mode (controlled by animation zone touch)
  engineMode: EngineMode;
  onEngineModeChange: (mode: EngineMode) => void;

  // Pattern control
  currentPattern: PatternType;
  onPatternChange: (pattern: PatternType) => void;

  // Joystick hover pattern (from AnimationZoneController)
  joystickPattern?: PatternType;

  intensity: number;
  onIntensityChange: (value: number) => void;

  // Mixer
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
        const buttonWidth = 44; // approximate button width
        scrollRef.current.scrollTo({
          left: Math.max(0, index * buttonWidth - 60),
          behavior: 'smooth'
        });
      }
    }
  }, [currentPattern]);

  // Get patterns based on engine mode
  const visiblePatterns = engineMode === 'KINETIC'
    ? ALL_PATTERNS.filter(p => KINETIC_PATTERNS.includes(p.id))
    : ALL_PATTERNS;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="mx-2 mb-2 bg-black/80 backdrop-blur-xl rounded-xl
                     border border-white/10 shadow-xl">

        {/* Two-row layout for portrait mode */}
        <div className="flex flex-col">

          {/* Top row: Scrollable pattern buttons */}
          <div
            ref={scrollRef}
            className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto scrollbar-hide
                       border-b border-white/5"
          >
            {/* Engine mode indicator */}
            <div className={`flex-shrink-0 px-2 py-1 rounded-md text-[9px] font-bold
                           ${engineMode === 'PATTERN'
                             ? 'bg-cyan-500/30 text-cyan-400 border border-cyan-500/50'
                             : 'bg-pink-500/30 text-pink-400 border border-pink-500/50'}`}>
              {engineMode === 'PATTERN' ? 'PAT' : 'KIN'}
            </div>

            <div className="w-px h-5 bg-white/10 flex-shrink-0" />

            {/* All pattern buttons - BIGGER for touch targets */}
            {visiblePatterns.map(({ id, label, color }) => {
              const isActive = currentPattern === id;
              const isHovered = joystickPattern === id && joystickPattern !== currentPattern;

              return (
                <button
                  key={id}
                  onClick={() => onPatternChange(id)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-[11px] font-bold
                             transition-all duration-100 min-w-[44px] min-h-[36px]
                             ${isActive
                               ? `${color} text-white shadow-lg`
                               : isHovered
                                 ? `${color}/50 text-white border-2 border-white/50 animate-pulse`
                                 : 'bg-white/5 text-white/50 border border-white/10 hover:text-white hover:bg-white/10'
                             }`}
                  style={isActive ? {
                    boxShadow: `0 0 15px rgba(255,255,255,0.4)`
                  } : undefined}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Bottom row: Mode toggles and mixer */}
          <div className="flex items-center gap-2 px-2 py-1.5">

            {/* Physics Mode Toggle (LEGACY/LABAN - separate from touch zones) */}
            <div className="flex rounded-lg overflow-hidden border border-white/20">
              <button
                onClick={() => onPhysicsModeChange('LEGACY')}
                className={`px-2 py-1 text-[9px] font-bold transition-all
                           ${physicsMode === 'LEGACY'
                             ? 'bg-amber-500 text-white'
                             : 'bg-white/5 text-white/50 hover:text-white'
                           }`}
              >
                LEG
              </button>
              <button
                onClick={() => onPhysicsModeChange('LABAN')}
                className={`px-2 py-1 text-[9px] font-bold transition-all
                           ${physicsMode === 'LABAN'
                             ? 'bg-purple-500 text-white'
                             : 'bg-white/5 text-white/50 hover:text-white'
                           }`}
              >
                LAB
              </button>
            </div>

            <div className="w-px h-5 bg-white/10" />

            {/* Engine Mode Toggle */}
            <div className="flex rounded-lg overflow-hidden border border-white/20">
              <button
                onClick={() => onEngineModeChange('PATTERN')}
                className={`px-2 py-1 text-[9px] font-bold transition-all
                           ${engineMode === 'PATTERN'
                             ? 'bg-cyan-500 text-white shadow-[0_0_8px_rgba(0,255,255,0.5)]'
                             : 'bg-white/5 text-white/50 hover:text-white'
                           }`}
              >
                PAT
              </button>
              <button
                onClick={() => onEngineModeChange('KINETIC')}
                className={`px-2 py-1 text-[9px] font-bold transition-all
                           ${engineMode === 'KINETIC'
                             ? 'bg-pink-500 text-white shadow-[0_0_8px_rgba(236,72,153,0.5)]'
                             : 'bg-white/5 text-white/50 hover:text-white'
                           }`}
              >
                KIN
              </button>
            </div>

            {/* Current pattern display */}
            <div className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
              <span className="text-[8px] text-white/60 font-mono">
                {currentPattern.replace('_', ' ')}
              </span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Intensity Slider */}
            <div className="flex items-center gap-1 w-20">
              <span className="text-[7px] text-white/40 font-bold">INT</span>
              <input
                type="range"
                min="0"
                max="100"
                value={intensity}
                onChange={(e) => onIntensityChange(Number(e.target.value))}
                className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none
                          [&::-webkit-slider-thumb]:w-2.5
                          [&::-webkit-slider-thumb]:h-2.5
                          [&::-webkit-slider-thumb]:bg-brand-500
                          [&::-webkit-slider-thumb]:rounded-full
                          [&::-webkit-slider-thumb]:shadow-[0_0_4px_rgba(139,92,246,0.6)]"
              />
              <span className="text-[8px] text-white/60 font-mono w-5 text-right">
                {intensity}
              </span>
            </div>

            <div className="w-px h-5 bg-white/10" />

            {/* Mixer Toggle */}
            <button
              onClick={onMixerToggle}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all
                         ${isMixerOpen
                           ? 'bg-purple-500/30 border border-purple-500 text-purple-300'
                           : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                         }`}
            >
              <Disc3 size={14} />
              <span className="text-[9px] font-bold">MIX</span>
              {activeDeckCount > 0 && (
                <span className="w-3.5 h-3.5 rounded-full bg-purple-500 text-white text-[8px] font-bold
                               flex items-center justify-center">
                  {activeDeckCount}
                </span>
              )}
              <ChevronUp size={12} className={`transition-transform ${isMixerOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngineStrip;
