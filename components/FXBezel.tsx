/**
 * FXBezel - Simplified bezel drawer for FX toggles
 *
 * Thin edge strip that expands on tap. No X/Y axis mapping - just simple toggles.
 * Matches the HTML export player bezel style.
 */

import React, { useState, useCallback } from 'react';
import {
  Layers, Zap, Ghost, Contrast, CircleDot,
  ScanLine, Activity, Radio, Move3D
} from 'lucide-react';

export type FXKey = 'rgbSplit' | 'strobe' | 'ghost' | 'invert' | 'bw' | 'scanlines' | 'glitch' | 'shake' | 'zoom';

export interface FXState {
  rgbSplit: boolean;
  strobe: boolean;
  ghost: boolean;
  invert: boolean;
  bw: boolean;
  scanlines: boolean;
  glitch: boolean;
  shake: boolean;
  zoom: boolean;
}

interface FXBezelProps {
  effects: FXState;
  onToggleEffect: (effect: FXKey) => void;
  onResetAll: () => void;
}

const FX_CONFIG: { key: FXKey; label: string; icon: React.ElementType }[] = [
  { key: 'rgbSplit', label: 'RGB', icon: Layers },
  { key: 'strobe', label: 'STR', icon: Zap },
  { key: 'ghost', label: 'GHO', icon: Ghost },
  { key: 'invert', label: 'INV', icon: Contrast },
  { key: 'bw', label: 'B&W', icon: CircleDot },
  { key: 'scanlines', label: 'SCN', icon: ScanLine },
  { key: 'glitch', label: 'GLI', icon: Activity },
  { key: 'shake', label: 'SHK', icon: Radio },
  { key: 'zoom', label: 'ZOM', icon: Move3D }
];

export const FXBezel: React.FC<FXBezelProps> = ({
  effects,
  onToggleEffect,
  onResetAll
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeCount = Object.values(effects).filter(Boolean).length;

  const handleToggle = useCallback((key: FXKey, e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleEffect(key);
  }, [onToggleEffect]);

  const handleBezelClick = useCallback((e: React.MouseEvent) => {
    // Only toggle expand if clicking on the bezel itself, not on buttons
    if ((e.target as HTMLElement).closest('.fx-btn')) return;
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  // Click outside to collapse
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
          fixed left-0 top-1/2 -translate-y-1/2 z-50
          flex flex-col items-center gap-1.5
          bg-black/60 backdrop-blur-xl
          border-r border-white/10
          rounded-r-xl
          transition-all duration-200 ease-out
          ${isExpanded ? 'w-16 px-2 py-3' : 'w-4 px-1 py-3'}
        `}
        onClick={handleBezelClick}
      >
        {/* Collapsed state: status dots */}
        {!isExpanded && (
          <>
            {FX_CONFIG.map(({ key }) => (
              <div
                key={key}
                className={`
                  w-2 h-2 rounded-full cursor-pointer
                  transition-all duration-150
                  ${effects[key]
                    ? 'bg-purple-500 shadow-[0_0_6px_rgba(139,92,246,0.8)]'
                    : 'bg-white/20 hover:bg-white/30'
                  }
                `}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleEffect(key);
                }}
                title={key}
              />
            ))}
            <div className="w-3 h-px bg-white/20 my-1" />
            <div className="text-[8px] text-white/40 font-bold" style={{ writingMode: 'vertical-rl' }}>
              FX
            </div>
          </>
        )}

        {/* Expanded state: full buttons */}
        {isExpanded && (
          <>
            {FX_CONFIG.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                className={`
                  fx-btn w-full py-1.5 px-1 rounded-lg
                  flex flex-col items-center gap-0.5
                  text-[9px] font-bold
                  transition-all duration-150
                  ${effects[key]
                    ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.4)]'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 border border-white/10'
                  }
                `}
                onClick={(e) => handleToggle(key, e)}
              >
                <Icon size={12} />
                <span>{label}</span>
              </button>
            ))}

            {activeCount > 0 && (
              <>
                <div className="w-full h-px bg-white/10 my-1" />
                <button
                  className="w-full py-1 text-[8px] text-red-400/70 hover:text-red-400 font-bold"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResetAll();
                  }}
                >
                  CLEAR
                </button>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default FXBezel;
