/**
 * FXPanel - Collapsible Visual Effects Control
 *
 * Non-occluding, collapsible FX controls:
 * - Positioned at bottom-right
 * - Quick toggle buttons in compact mode
 * - Full controls in expanded mode
 * - Paddle for pressure-sensitive effects
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  X, Layers, Zap, Ghost, Contrast, CircleDot,
  ScanLine, Activity, Move3D, Radio, Sparkles,
  ChevronDown, ChevronUp
} from 'lucide-react';

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

interface FXPanelProps {
  effects: FXState;
  onToggleEffect: (effect: keyof FXState) => void;
  onResetAll: () => void;
  isOpen: boolean;
  isExpanded: boolean;
  onToggleOpen: () => void;
  onToggleExpand: () => void;
  // Paddle callback - intensity 0-1
  onPaddlePress?: (intensity: number) => void;
  onPaddleRelease?: () => void;
}

const FX_BUTTONS: { key: keyof FXState; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'rgbSplit', label: 'RGB', icon: Layers, color: 'red' },
  { key: 'strobe', label: 'STROBE', icon: Zap, color: 'yellow' },
  { key: 'ghost', label: 'GHOST', icon: Ghost, color: 'purple' },
  { key: 'invert', label: 'INVERT', icon: Contrast, color: 'cyan' },
  { key: 'bw', label: 'B&W', icon: CircleDot, color: 'gray' },
  { key: 'scanlines', label: 'SCAN', icon: ScanLine, color: 'green' },
  { key: 'glitch', label: 'GLITCH', icon: Activity, color: 'pink' },
  { key: 'zoom', label: 'ZOOM', icon: Move3D, color: 'blue' },
  { key: 'shake', label: 'SHAKE', icon: Radio, color: 'orange' }
];

const COLOR_CLASSES: Record<string, { active: string; inactive: string }> = {
  red: { active: 'bg-red-500/40 border-red-400 text-red-200', inactive: 'hover:border-red-500/50' },
  yellow: { active: 'bg-yellow-500/40 border-yellow-400 text-yellow-200', inactive: 'hover:border-yellow-500/50' },
  purple: { active: 'bg-purple-500/40 border-purple-400 text-purple-200', inactive: 'hover:border-purple-500/50' },
  cyan: { active: 'bg-cyan-500/40 border-cyan-400 text-cyan-200', inactive: 'hover:border-cyan-500/50' },
  gray: { active: 'bg-gray-500/40 border-gray-400 text-gray-200', inactive: 'hover:border-gray-500/50' },
  green: { active: 'bg-green-500/40 border-green-400 text-green-200', inactive: 'hover:border-green-500/50' },
  pink: { active: 'bg-pink-500/40 border-pink-400 text-pink-200', inactive: 'hover:border-pink-500/50' },
  blue: { active: 'bg-blue-500/40 border-blue-400 text-blue-200', inactive: 'hover:border-blue-500/50' },
  orange: { active: 'bg-orange-500/40 border-orange-400 text-orange-200', inactive: 'hover:border-orange-500/50' }
};

export const FXPanel: React.FC<FXPanelProps> = ({
  effects,
  onToggleEffect,
  onResetAll,
  isOpen,
  isExpanded,
  onToggleOpen,
  onToggleExpand,
  onPaddlePress,
  onPaddleRelease
}) => {
  const [paddleActive, setPaddleActive] = useState(false);
  const paddleRef = useRef<HTMLDivElement>(null);

  // Handle paddle touch/mouse events
  const handlePaddleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPaddleActive(true);

    if (paddleRef.current) {
      const rect = paddleRef.current.getBoundingClientRect();
      let clientY: number;

      if ('touches' in e) {
        clientY = e.touches[0].clientY;
      } else {
        clientY = e.clientY;
      }

      const intensity = 1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      onPaddlePress?.(intensity);
    }
  }, [onPaddlePress]);

  const handlePaddleMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!paddleActive) return;

    if (paddleRef.current) {
      const rect = paddleRef.current.getBoundingClientRect();
      let clientY: number;

      if ('touches' in e) {
        clientY = e.touches[0].clientY;
      } else {
        clientY = e.clientY;
      }

      const intensity = 1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      onPaddlePress?.(intensity);
    }
  }, [paddleActive, onPaddlePress]);

  const handlePaddleEnd = useCallback(() => {
    setPaddleActive(false);
    onPaddleRelease?.();
  }, [onPaddleRelease]);

  const activeCount = Object.values(effects).filter(Boolean).length;

  // Closed state - just a tab
  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="fixed bottom-2 right-2 z-40
                   bg-pink-500/20 border border-pink-500/50 text-pink-400
                   rounded-xl px-3 py-2
                   flex items-center gap-2
                   hover:scale-105 active:scale-95
                   transition-all duration-200
                   backdrop-blur-xl font-rajdhani"
      >
        <Sparkles size={16} />
        <span className="text-xs font-bold tracking-wider">FX</span>
        {activeCount > 0 && (
          <span className="w-4 h-4 bg-pink-500 rounded-full text-[9px] font-bold text-white
                          flex items-center justify-center">
            {activeCount}
          </span>
        )}
        <ChevronUp size={14} />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-2 right-2 z-40
                 bg-black/90 backdrop-blur-xl
                 border border-pink-500/50 rounded-2xl
                 font-rajdhani text-white
                 transition-all duration-200 ease-out
                 ${isExpanded
                   ? 'w-[320px] shadow-[0_0_30px_rgba(236,72,153,0.3)]'
                   : 'w-[200px]'
                 }`}
      style={{ maxHeight: isExpanded ? '45vh' : '100px' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-white/10
                   cursor-pointer select-none"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-pink-400" />
          <span className="text-sm font-bold tracking-wider text-pink-400">FX</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-pink-500/30 text-pink-300 rounded-full">
              {activeCount}
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
        <div className="p-2 flex gap-1 justify-center flex-wrap">
          {FX_BUTTONS.slice(0, 5).map(({ key, icon: Icon, color }) => {
            const isActive = effects[key];
            const colorClass = COLOR_CLASSES[color];
            return (
              <button
                key={key}
                onClick={() => onToggleEffect(key)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center
                           transition-all active:scale-90
                           ${isActive
                             ? `${colorClass.active} border`
                             : 'bg-white/5 border border-white/10 text-white/40'
                           }`}
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>
      )}

      {/* Expanded Mode - Full controls */}
      {isExpanded && (
        <div className="p-3 overflow-y-auto" style={{ maxHeight: 'calc(45vh - 50px)' }}>
          {/* FX Grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {FX_BUTTONS.map(({ key, label, icon: Icon, color }) => {
              const isActive = effects[key];
              const colorClass = COLOR_CLASSES[color];

              return (
                <button
                  key={key}
                  onClick={() => onToggleEffect(key)}
                  className={`flex flex-col items-center justify-center gap-1
                              min-h-[56px] rounded-xl border-2
                              transition-all duration-200 select-none
                              active:scale-95 touch-manipulation
                              ${isActive
                                ? `${colorClass.active} shadow-lg`
                                : `bg-white/5 border-white/10 text-white/50 ${colorClass.inactive}`
                              }`}
                >
                  <Icon size={18} />
                  <span className="text-[9px] font-bold tracking-wider">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Paddle Control */}
          <div className="mb-3">
            <div className="text-[10px] text-white/40 mb-1 font-bold tracking-wider">
              PRESSURE PADDLE
            </div>
            <div
              ref={paddleRef}
              className={`h-16 rounded-xl border-2 transition-all cursor-pointer select-none
                          touch-manipulation relative overflow-hidden
                          ${paddleActive
                            ? 'bg-gradient-to-t from-purple-500/50 to-pink-500/50 border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.4)]'
                            : 'bg-gradient-to-t from-white/5 to-white/10 border-white/20 hover:border-pink-500/50'
                          }`}
              onMouseDown={handlePaddleStart}
              onMouseMove={handlePaddleMove}
              onMouseUp={handlePaddleEnd}
              onMouseLeave={handlePaddleEnd}
              onTouchStart={handlePaddleStart}
              onTouchMove={handlePaddleMove}
              onTouchEnd={handlePaddleEnd}
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`text-xs font-bold tracking-wider transition-all
                                  ${paddleActive ? 'text-white scale-110' : 'text-white/40'}`}>
                  {paddleActive ? 'ACTIVE' : 'HOLD'}
                </span>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={onResetAll}
            className="w-full py-2 rounded-xl border border-white/10
                       text-white/60 hover:text-white hover:bg-white/10
                       transition-all text-xs font-bold tracking-wider"
          >
            RESET ALL
          </button>
        </div>
      )}
    </div>
  );
};

export default FXPanel;
