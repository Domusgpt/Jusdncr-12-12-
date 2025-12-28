/**
 * FXPanel - Mobile-first effects control panel
 *
 * Features:
 * - Large touch-friendly buttons (min 48px)
 * - Paddle control for pressure-sensitive effects
 * - Non-occluding slide-out design
 * - Bigger, more ergonomic controls
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  X, Layers, Zap, Ghost, Contrast, CircleDot,
  ScanLine, Activity, Move3D, Radio, Sparkles
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
  onClose: () => void;
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
  onClose,
  onPaddlePress,
  onPaddleRelease
}) => {
  const [paddleActive, setPaddleActive] = useState(false);
  const paddleRef = useRef<HTMLDivElement>(null);

  // Handle paddle touch/mouse events
  const handlePaddleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setPaddleActive(true);

    // Calculate intensity based on position within paddle
    if (paddleRef.current) {
      const rect = paddleRef.current.getBoundingClientRect();
      let clientY: number;

      if ('touches' in e) {
        clientY = e.touches[0].clientY;
      } else {
        clientY = e.clientY;
      }

      // Intensity is higher at top of paddle
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

  if (!isOpen) return null;

  const activeCount = Object.values(effects).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />

      {/* Panel - slides from right on desktop, bottom on mobile */}
      <div className="absolute bottom-0 left-0 right-0 sm:right-4 sm:left-auto sm:bottom-4 sm:top-auto
                      w-full sm:w-80 max-h-[70vh] sm:max-h-none
                      bg-black/95 backdrop-blur-xl border-t sm:border border-white/20
                      sm:rounded-2xl overflow-hidden pointer-events-auto
                      animate-in slide-in-from-bottom sm:slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10
                        bg-gradient-to-r from-pink-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-pink-400" />
            <span className="text-lg font-bold font-rajdhani tracking-wider text-white">
              EFFECTS
            </span>
            {activeCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-pink-500/30 text-pink-300 rounded-full">
                {activeCount} ON
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(70vh-60px)] sm:max-h-[400px]">

          {/* FX Grid - Large touch targets */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {FX_BUTTONS.map(({ key, label, icon: Icon, color }) => {
              const isActive = effects[key];
              const colorClass = COLOR_CLASSES[color];

              return (
                <button
                  key={key}
                  onClick={() => onToggleEffect(key)}
                  className={`flex flex-col items-center justify-center gap-2
                              min-h-[72px] sm:min-h-[80px] rounded-xl border-2
                              transition-all duration-200 select-none
                              active:scale-95 touch-manipulation
                              ${isActive
                                ? `${colorClass.active} shadow-lg`
                                : `bg-white/5 border-white/10 text-white/50 ${colorClass.inactive}`
                              }`}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                  <span className="text-xs font-bold tracking-wider">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Paddle Control */}
          <div className="mb-4">
            <div className="text-xs text-white/40 mb-2 font-bold tracking-wider">
              PRESSURE PADDLE (hold & slide)
            </div>
            <div
              ref={paddleRef}
              className={`h-20 rounded-xl border-2 transition-all cursor-pointer select-none
                          touch-manipulation relative overflow-hidden
                          ${paddleActive
                            ? 'bg-gradient-to-t from-purple-500/50 to-pink-500/50 border-pink-400 shadow-[0_0_30px_rgba(236,72,153,0.4)]'
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
              {/* Intensity indicator lines */}
              <div className="absolute inset-0 flex flex-col justify-between py-2 px-4 pointer-events-none">
                {[100, 75, 50, 25, 0].map(level => (
                  <div key={level} className="flex items-center gap-2">
                    <div className="w-full h-[1px] bg-white/10" />
                    <span className="text-[10px] text-white/30 w-8">{level}%</span>
                  </div>
                ))}
              </div>

              {/* Center label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`text-sm font-bold tracking-wider transition-all
                                  ${paddleActive ? 'text-white scale-110' : 'text-white/40'}`}>
                  {paddleActive ? 'ACTIVE' : 'HOLD TO ACTIVATE'}
                </span>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={onResetAll}
            className="w-full py-3 rounded-xl border border-white/10
                       text-white/60 hover:text-white hover:bg-white/10
                       transition-all text-sm font-bold tracking-wider"
          >
            RESET ALL EFFECTS
          </button>
        </div>
      </div>
    </div>
  );
};

export default FXPanel;
