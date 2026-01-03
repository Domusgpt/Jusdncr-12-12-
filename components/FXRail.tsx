/**
 * FXRail - Left edge vertical FX strip
 *
 * Elegant, always-accessible effects control that never blocks the animation.
 * Swipe left to collapse, swipe right to expand.
 */

import React, { useState, useRef } from 'react';
import {
  Sparkles, Zap, Ghost, Contrast, Circle,
  ScanLine, Wand2, Move, ZoomIn, ChevronLeft, ChevronRight
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

interface FXRailProps {
  effects: FXState;
  onToggleEffect: (effect: keyof FXState) => void;
  onResetAll: () => void;
}

const FX_CONFIG: { id: keyof FXState; icon: React.ElementType; label: string; color: string }[] = [
  { id: 'rgbSplit', icon: Sparkles, label: 'RGB', color: 'text-pink-400 bg-pink-500/30 border-pink-500' },
  { id: 'strobe', icon: Zap, label: 'STRB', color: 'text-yellow-400 bg-yellow-500/30 border-yellow-500' },
  { id: 'ghost', icon: Ghost, label: 'GHST', color: 'text-purple-400 bg-purple-500/30 border-purple-500' },
  { id: 'invert', icon: Contrast, label: 'INV', color: 'text-white bg-white/30 border-white' },
  { id: 'bw', icon: Circle, label: 'B&W', color: 'text-gray-400 bg-gray-500/30 border-gray-500' },
  { id: 'scanlines', icon: ScanLine, label: 'SCAN', color: 'text-green-400 bg-green-500/30 border-green-500' },
  { id: 'glitch', icon: Wand2, label: 'GLTC', color: 'text-red-400 bg-red-500/30 border-red-500' },
  { id: 'shake', icon: Move, label: 'SHKE', color: 'text-orange-400 bg-orange-500/30 border-orange-500' },
  { id: 'zoom', icon: ZoomIn, label: 'ZOOM', color: 'text-cyan-400 bg-cyan-500/30 border-cyan-500' },
];

export const FXRail: React.FC<FXRailProps> = ({ effects, onToggleEffect, onResetAll }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);

  // Count active effects
  const activeCount = Object.values(effects).filter(Boolean).length;

  // Touch handlers for swipe gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX < -50) setIsCollapsed(true);  // Swipe left to collapse
    if (deltaX > 50) setIsCollapsed(false);  // Swipe right to expand
  };

  // Collapsed state - just a thin grip
  if (isCollapsed) {
    return (
      <div
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 w-3 h-32
                   bg-white/10 rounded-r-full cursor-pointer
                   hover:w-4 hover:bg-white/20 transition-all
                   flex items-center justify-center"
        onClick={() => setIsCollapsed(false)}
      >
        <ChevronRight className="w-3 h-3 text-white/50" />
      </div>
    );
  }

  return (
    <div
      ref={railRef}
      className="fixed left-2 top-1/2 -translate-y-1/2 z-40
                 flex flex-col gap-1.5 p-2
                 bg-black/60 backdrop-blur-xl rounded-2xl
                 border border-white/10 shadow-2xl
                 transition-all duration-200"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Collapse handle */}
      <button
        onClick={() => setIsCollapsed(true)}
        className="w-full py-1 flex items-center justify-center
                   text-white/30 hover:text-white/60 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* FX buttons */}
      {FX_CONFIG.map(({ id, icon: Icon, label, color }) => {
        const isActive = effects[id];
        return (
          <button
            key={id}
            onClick={() => onToggleEffect(id)}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center
                       transition-all duration-150 border-2 touch-manipulation
                       active:scale-90 select-none
                       ${isActive
                         ? `${color} shadow-lg`
                         : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
                       }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[8px] font-bold mt-0.5 tracking-wider">{label}</span>
          </button>
        );
      })}

      {/* Reset all - only show when effects are active */}
      {activeCount > 0 && (
        <button
          onClick={onResetAll}
          className="w-12 h-8 mt-1 rounded-lg bg-red-500/20 border border-red-500/30
                     text-red-400 text-[9px] font-bold tracking-wider
                     hover:bg-red-500/30 active:scale-95 transition-all"
        >
          RESET
        </button>
      )}
    </div>
  );
};

export default FXRail;
