/**
 * FXRail - Thin vertical strip for FX toggles with X/Y axis mapping
 *
 * Left edge, 56px wide, 9 effect buttons
 * - Tap: Toggle effect on/off
 * - Long-press: Open axis assignment (X, Y, or both)
 * - Effects mapped to X/Y respond to touch position in animation zone
 */

import React, { useState, useRef } from 'react';
import {
  Layers, Zap, Ghost, Contrast, CircleDot,
  ScanLine, Activity, Radio, Move3D, ChevronRight
} from 'lucide-react';

export type FXKey = 'rgbSplit' | 'strobe' | 'ghost' | 'invert' | 'bw' | 'scanlines' | 'glitch' | 'shake' | 'zoom';

export interface FXAxisMapping {
  x: FXKey[];
  y: FXKey[];
}

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

interface FXRailProps {
  effects: FXState;
  onToggleEffect: (effect: FXKey) => void;
  onResetAll: () => void;
  axisMapping: FXAxisMapping;
  onAxisMappingChange: (mapping: FXAxisMapping) => void;
  fxIntensity: { x: number; y: number };
}

const FX_CONFIG: { key: FXKey; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'rgbSplit', label: 'RGB', icon: Layers, color: 'from-red-500 to-blue-500' },
  { key: 'strobe', label: 'STR', icon: Zap, color: 'from-yellow-500 to-orange-500' },
  { key: 'ghost', label: 'GHO', icon: Ghost, color: 'from-purple-500 to-pink-500' },
  { key: 'invert', label: 'INV', icon: Contrast, color: 'from-cyan-500 to-teal-500' },
  { key: 'bw', label: 'B&W', icon: CircleDot, color: 'from-gray-400 to-gray-600' },
  { key: 'scanlines', label: 'SCN', icon: ScanLine, color: 'from-green-500 to-emerald-500' },
  { key: 'glitch', label: 'GLI', icon: Activity, color: 'from-pink-500 to-red-500' },
  { key: 'shake', label: 'SHK', icon: Radio, color: 'from-orange-500 to-amber-500' },
  { key: 'zoom', label: 'ZOM', icon: Move3D, color: 'from-blue-500 to-indigo-500' }
];

export const FXRail: React.FC<FXRailProps> = ({
  effects,
  onToggleEffect,
  onResetAll,
  axisMapping,
  onAxisMappingChange,
  fxIntensity
}) => {
  const [showAxisMenu, setShowAxisMenu] = useState<FXKey | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeCount = Object.values(effects).filter(Boolean).length;

  const handleTouchStart = (key: FXKey) => {
    longPressTimer.current = setTimeout(() => {
      setShowAxisMenu(key);
    }, 500);
  };

  const handleTouchEnd = (key: FXKey) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!showAxisMenu) {
      onToggleEffect(key);
    }
  };

  const clearTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const toggleAxis = (key: FXKey, axis: 'x' | 'y') => {
    const newMapping = { ...axisMapping };
    const index = newMapping[axis].indexOf(key);
    if (index >= 0) {
      newMapping[axis] = newMapping[axis].filter(k => k !== key);
    } else {
      newMapping[axis] = [...newMapping[axis], key];
    }
    onAxisMappingChange(newMapping);
  };

  const isOnAxis = (key: FXKey, axis: 'x' | 'y') => axisMapping[axis].includes(key);

  // Collapsed state - just a grip handle
  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-[55]
                   w-3 h-28 bg-gradient-to-b from-cyan-500/50 to-purple-500/50
                   rounded-r-lg hover:w-4 transition-all
                   border-y border-r border-white/20
                   flex items-center justify-center"
      >
        <ChevronRight size={12} className="text-white/70" />
      </button>
    );
  }

  return (
    <>
      {/* Axis menu overlay */}
      {showAxisMenu && (
        <div
          className="fixed inset-0 z-[100] bg-black/50"
          onClick={() => setShowAxisMenu(null)}
        >
          <div
            className="absolute left-16 top-1/2 -translate-y-1/2
                       bg-black/95 backdrop-blur-xl rounded-xl border border-white/20
                       p-3 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-[10px] text-white/60 font-bold mb-2 text-center uppercase">
              Map {FX_CONFIG.find(f => f.key === showAxisMenu)?.label} to Axis
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toggleAxis(showAxisMenu, 'x')}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all
                           ${isOnAxis(showAxisMenu, 'x')
                             ? 'bg-cyan-500 text-white shadow-[0_0_10px_rgba(0,255,255,0.5)]'
                             : 'bg-white/10 text-white/60 border border-white/20'
                           }`}
              >
                X-Axis
              </button>
              <button
                onClick={() => toggleAxis(showAxisMenu, 'y')}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all
                           ${isOnAxis(showAxisMenu, 'y')
                             ? 'bg-pink-500 text-white shadow-[0_0_10px_rgba(255,0,255,0.5)]'
                             : 'bg-white/10 text-white/60 border border-white/20'
                           }`}
              >
                Y-Axis
              </button>
            </div>
            <button
              onClick={() => setShowAxisMenu(null)}
              className="mt-3 w-full py-1.5 text-[10px] text-white/60 hover:text-white
                        bg-white/5 rounded-lg border border-white/10"
            >
              DONE
            </button>
          </div>
        </div>
      )}

      {/* Main rail */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-[55]
                     flex flex-col items-center
                     bg-black/80 backdrop-blur-xl
                     border-y border-r border-white/10 rounded-r-xl
                     py-1.5 px-1 shadow-xl">

        {/* FX buttons */}
        {FX_CONFIG.map(({ key, label, icon: Icon, color }) => {
          const isActive = effects[key];
          const onX = isOnAxis(key, 'x');
          const onY = isOnAxis(key, 'y');
          const intensity = Math.min(1, (onX ? fxIntensity.x : 0) * 0.5 + (onY ? fxIntensity.y : 0) * 0.5);

          return (
            <button
              key={key}
              onTouchStart={() => handleTouchStart(key)}
              onTouchEnd={() => handleTouchEnd(key)}
              onTouchCancel={clearTimer}
              onMouseDown={() => handleTouchStart(key)}
              onMouseUp={() => handleTouchEnd(key)}
              onMouseLeave={clearTimer}
              className={`relative w-11 h-9 rounded-lg flex flex-col items-center justify-center
                         transition-all active:scale-95 touch-manipulation mb-0.5
                         ${isActive
                           ? `bg-gradient-to-br ${color} text-white shadow-lg`
                           : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                         }`}
              style={isActive && intensity > 0 ? {
                boxShadow: `0 0 ${8 + intensity * 15}px rgba(255,255,255,${0.15 + intensity * 0.25})`
              } : undefined}
            >
              <Icon size={14} />
              <span className="text-[7px] font-bold mt-0.5">{label}</span>

              {/* Axis indicators */}
              {(onX || onY) && (
                <div className="absolute -right-0.5 top-0.5 flex flex-col gap-px">
                  {onX && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_4px_rgba(0,255,255,0.8)]" />}
                  {onY && <div className="w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_4px_rgba(255,0,255,0.8)]" />}
                </div>
              )}
            </button>
          );
        })}

        {/* Reset all */}
        {activeCount > 0 && (
          <button
            onClick={onResetAll}
            className="w-11 h-6 mt-1 rounded-md bg-red-500/20 border border-red-500/30
                       text-red-400 text-[7px] font-bold tracking-wider
                       hover:bg-red-500/30 active:scale-95 transition-all"
          >
            RESET
          </button>
        )}

        {/* X/Y intensity bars */}
        <div className="mt-2 pt-2 border-t border-white/10 w-full px-0.5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <span className="text-[7px] text-cyan-400 font-bold w-2">X</span>
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-75"
                  style={{ width: `${fxIntensity.x * 100}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[7px] text-pink-400 font-bold w-2">Y</span>
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-400 transition-all duration-75"
                  style={{ width: `${fxIntensity.y * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setIsCollapsed(true)}
          className="mt-1 w-8 h-3 flex items-center justify-center
                     text-white/30 hover:text-white/60"
        >
          <div className="w-4 h-0.5 bg-white/30 rounded-full" />
        </button>
      </div>
    </>
  );
};

export default FXRail;
