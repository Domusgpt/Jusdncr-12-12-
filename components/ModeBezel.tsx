/**
 * ModeBezel - Right-side bezel drawer for mode controls
 *
 * Shows: Physics mode (L/B), Engine mode (P/K), Intensity value, Mixer button
 * Expands on tap to show full controls.
 */

import React, { useState, useCallback } from 'react';
import { Sliders } from 'lucide-react';

interface ModeBezelProps {
  physicsMode: 'LEGACY' | 'LABAN';
  onPhysicsModeChange: (mode: 'LEGACY' | 'LABAN') => void;
  engineMode: 'PATTERN' | 'KINETIC';
  onEngineModeChange: (mode: 'PATTERN' | 'KINETIC') => void;
  intensity: number;
  onIntensityChange: (value: number) => void;
  isMixerOpen: boolean;
  onMixerToggle: () => void;
  activeDeckCount: number;
}

export const ModeBezel: React.FC<ModeBezelProps> = ({
  physicsMode,
  onPhysicsModeChange,
  engineMode,
  onEngineModeChange,
  intensity,
  onIntensityChange,
  isMixerOpen,
  onMixerToggle,
  activeDeckCount
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleBezelClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.mode-btn, .mode-slider')) return;
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const handleClickOutside = useCallback(() => {
    if (isExpanded) setIsExpanded(false);
  }, [isExpanded]);

  return (
    <>
      {/* Backdrop for click-outside */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleClickOutside}
        />
      )}

      <div
        className={`
          fixed right-0 top-1/2 -translate-y-1/2 z-50
          flex flex-col items-center gap-2
          bg-black/60 backdrop-blur-xl
          border-l border-white/10
          rounded-l-xl
          transition-all duration-200 ease-out
          ${isExpanded ? 'w-20 px-2 py-3' : 'w-4 px-1 py-3'}
        `}
        onClick={handleBezelClick}
      >
        {/* Collapsed state: mode indicators */}
        {!isExpanded && (
          <>
            <div
              className="text-[9px] font-bold text-cyan-400 cursor-pointer hover:text-cyan-300"
              onClick={(e) => {
                e.stopPropagation();
                onPhysicsModeChange(physicsMode === 'LEGACY' ? 'LABAN' : 'LEGACY');
              }}
              title={`Physics: ${physicsMode}`}
            >
              {physicsMode === 'LEGACY' ? 'L' : 'B'}
            </div>

            <div className="w-3 h-px bg-white/20" />

            <div
              className="text-[9px] font-bold text-purple-400 cursor-pointer hover:text-purple-300"
              onClick={(e) => {
                e.stopPropagation();
                onEngineModeChange(engineMode === 'PATTERN' ? 'KINETIC' : 'PATTERN');
              }}
              title={`Engine: ${engineMode}`}
            >
              {engineMode === 'PATTERN' ? 'P' : 'K'}
            </div>

            <div className="w-3 h-px bg-white/20" />

            <div className="text-[8px] font-bold text-white/50">
              {Math.round(intensity)}
            </div>

            <div className="w-3 h-px bg-white/20" />

            <div
              className={`
                w-2 h-2 rounded-full cursor-pointer
                transition-all duration-150
                ${isMixerOpen
                  ? 'bg-purple-500 shadow-[0_0_6px_rgba(139,92,246,0.8)]'
                  : 'bg-white/30 hover:bg-white/50'
                }
              `}
              onClick={(e) => {
                e.stopPropagation();
                onMixerToggle();
              }}
              title="Mixer"
            />
            {activeDeckCount > 1 && (
              <div className="text-[7px] text-purple-400 font-bold">{activeDeckCount}</div>
            )}
          </>
        )}

        {/* Expanded state: full controls */}
        {isExpanded && (
          <>
            {/* Physics Mode */}
            <div className="w-full">
              <div className="text-[8px] text-white/40 text-center mb-1 font-bold">PHYSICS</div>
              <div className="flex gap-1">
                <button
                  className={`
                    mode-btn flex-1 py-1.5 rounded-md text-[9px] font-bold
                    transition-all duration-150
                    ${physicsMode === 'LEGACY'
                      ? 'bg-cyan-500 text-black'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                    }
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPhysicsModeChange('LEGACY');
                  }}
                >
                  LEG
                </button>
                <button
                  className={`
                    mode-btn flex-1 py-1.5 rounded-md text-[9px] font-bold
                    transition-all duration-150
                    ${physicsMode === 'LABAN'
                      ? 'bg-cyan-500 text-black'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                    }
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPhysicsModeChange('LABAN');
                  }}
                >
                  LAB
                </button>
              </div>
            </div>

            <div className="w-full h-px bg-white/10" />

            {/* Engine Mode */}
            <div className="w-full">
              <div className="text-[8px] text-white/40 text-center mb-1 font-bold">ENGINE</div>
              <div className="flex gap-1">
                <button
                  className={`
                    mode-btn flex-1 py-1.5 rounded-md text-[9px] font-bold
                    transition-all duration-150
                    ${engineMode === 'PATTERN'
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                    }
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEngineModeChange('PATTERN');
                  }}
                >
                  PAT
                </button>
                <button
                  className={`
                    mode-btn flex-1 py-1.5 rounded-md text-[9px] font-bold
                    transition-all duration-150
                    ${engineMode === 'KINETIC'
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                    }
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEngineModeChange('KINETIC');
                  }}
                >
                  KIN
                </button>
              </div>
            </div>

            <div className="w-full h-px bg-white/10" />

            {/* Intensity Slider */}
            <div className="w-full">
              <div className="text-[8px] text-white/40 text-center mb-1 font-bold">INT</div>
              <input
                type="range"
                min="0"
                max="100"
                value={intensity}
                onChange={(e) => onIntensityChange(Number(e.target.value))}
                className="mode-slider w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-3
                  [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-purple-500
                  [&::-webkit-slider-thumb]:cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="text-[9px] text-white/50 text-center mt-0.5">{Math.round(intensity)}</div>
            </div>

            <div className="w-full h-px bg-white/10" />

            {/* Mixer Button */}
            <button
              className={`
                mode-btn w-full py-2 rounded-lg text-[10px] font-bold
                flex items-center justify-center gap-1
                transition-all duration-150
                ${isMixerOpen
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                }
              `}
              onClick={(e) => {
                e.stopPropagation();
                onMixerToggle();
                setIsExpanded(false);
              }}
            >
              <Sliders size={12} />
              MIX
              {activeDeckCount > 1 && (
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-[8px]">
                  {activeDeckCount}
                </span>
              )}
            </button>
          </>
        )}
      </div>
    </>
  );
};

export default ModeBezel;
