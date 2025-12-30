/**
 * FXPanel - Premium Visual Effects Control
 *
 * Redesigned with:
 * - Clear visual hierarchy and sections
 * - Better collapse/expand UX
 * - Fun, tactile interactions
 * - Category-based FX organization
 * - XY Pad for dual-axis control
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  X, Layers, Zap, Ghost, Contrast, CircleDot,
  ScanLine, Activity, Move3D, Radio, Sparkles,
  ChevronDown, ChevronUp, Maximize2, Minimize2,
  RotateCcw, Grip
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
  onPaddlePress?: (intensity: number) => void;
  onPaddleRelease?: () => void;
}

// Organized by category for better UX
const FX_CATEGORIES = {
  color: {
    label: 'COLOR',
    items: [
      { key: 'rgbSplit' as keyof FXState, label: 'RGB', icon: Layers, color: 'from-red-500 to-blue-500' },
      { key: 'invert' as keyof FXState, label: 'INVERT', icon: Contrast, color: 'from-cyan-500 to-cyan-300' },
      { key: 'bw' as keyof FXState, label: 'B&W', icon: CircleDot, color: 'from-gray-500 to-gray-300' },
    ]
  },
  temporal: {
    label: 'TEMPORAL',
    items: [
      { key: 'strobe' as keyof FXState, label: 'STROBE', icon: Zap, color: 'from-yellow-500 to-yellow-300' },
      { key: 'ghost' as keyof FXState, label: 'GHOST', icon: Ghost, color: 'from-purple-500 to-purple-300' },
    ]
  },
  distort: {
    label: 'DISTORT',
    items: [
      { key: 'glitch' as keyof FXState, label: 'GLITCH', icon: Activity, color: 'from-pink-500 to-pink-300' },
      { key: 'shake' as keyof FXState, label: 'SHAKE', icon: Radio, color: 'from-orange-500 to-orange-300' },
      { key: 'zoom' as keyof FXState, label: 'ZOOM', icon: Move3D, color: 'from-blue-500 to-blue-300' },
      { key: 'scanlines' as keyof FXState, label: 'SCAN', icon: ScanLine, color: 'from-green-500 to-green-300' },
    ]
  }
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
  const [xyPadActive, setXyPadActive] = useState(false);
  const [xyPosition, setXyPosition] = useState({ x: 0.5, y: 0.5 });
  const xyPadRef = useRef<HTMLDivElement>(null);

  const activeCount = Object.values(effects).filter(Boolean).length;

  // XY Pad handler for dual-axis control
  const handleXYPadMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!xyPadRef.current) return;

    const rect = xyPadRef.current.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    setXyPosition({ x, y });
    // Y controls intensity, X could control another parameter
    onPaddlePress?.(1 - y);
  }, [onPaddlePress]);

  const handleXYPadStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setXyPadActive(true);
    handleXYPadMove(e);
  };

  const handleXYPadEnd = () => {
    setXyPadActive(false);
    setXyPosition({ x: 0.5, y: 0.5 });
    onPaddleRelease?.();
  };

  // ============ CLOSED STATE - Minimal tab ============
  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="fixed bottom-2 right-2 z-40 group
                   bg-gradient-to-r from-pink-500/20 to-purple-500/20
                   border border-pink-500/40 text-pink-400
                   rounded-2xl px-4 py-2.5
                   flex items-center gap-3
                   hover:scale-105 hover:border-pink-400/60 active:scale-95
                   transition-all duration-200
                   backdrop-blur-xl font-rajdhani
                   shadow-lg shadow-pink-500/10"
      >
        <div className="relative">
          <Sparkles size={18} className="group-hover:animate-pulse" />
          {activeCount > 0 && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
          )}
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs font-bold tracking-wider leading-none">FX</span>
          {activeCount > 0 && (
            <span className="text-[9px] text-pink-300/70">{activeCount} active</span>
          )}
        </div>
        <Maximize2 size={12} className="text-white/30 group-hover:text-white/60" />
      </button>
    );
  }

  // ============ OPEN STATE ============
  return (
    <div
      className={`fixed bottom-2 right-2 z-40
                 bg-gradient-to-b from-black/95 to-black/90 backdrop-blur-xl
                 border border-pink-500/30 rounded-2xl
                 font-rajdhani text-white
                 transition-all duration-300 ease-out
                 shadow-2xl shadow-pink-500/20
                 ${isExpanded ? 'w-[340px]' : 'w-[220px]'}`}
      style={{ maxHeight: isExpanded ? '50vh' : '140px' }}
    >
      {/* ===== HEADER ===== */}
      <div className="relative">
        {/* Glow line at top */}
        <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />

        <div className="flex items-center justify-between px-3 py-2.5">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-500/30
                          flex items-center justify-center border border-pink-500/30">
              <Sparkles size={16} className="text-pink-400" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-wider text-white flex items-center gap-2">
                FX
                {activeCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-pink-500/30 text-pink-300 rounded-md">
                    {activeCount}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-white/40">Effects Control</div>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-1">
            {/* Expand/Collapse */}
            <button
              onClick={onToggleExpand}
              className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white
                       transition-all active:scale-90"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            {/* Close */}
            <button
              onClick={onToggleOpen}
              className="p-2 rounded-xl hover:bg-red-500/20 text-white/50 hover:text-red-400
                       transition-all active:scale-90"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ===== COMPACT MODE ===== */}
      {!isExpanded && (
        <div className="px-3 pb-3">
          {/* Quick toggle row */}
          <div className="flex gap-1.5 justify-center">
            {Object.values(FX_CATEGORIES).flatMap(cat => cat.items).slice(0, 6).map(({ key, icon: Icon, color }) => {
              const isActive = effects[key];
              return (
                <button
                  key={key}
                  onClick={() => onToggleEffect(key)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center
                             transition-all duration-150 active:scale-90
                             ${isActive
                               ? `bg-gradient-to-br ${color} text-white shadow-lg`
                               : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
                             }`}
                >
                  <Icon size={15} />
                </button>
              );
            })}
          </div>

          {/* Mini intensity bar */}
          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all"
              style={{ width: `${activeCount / 9 * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ===== EXPANDED MODE ===== */}
      {isExpanded && (
        <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(50vh - 70px)' }}>

          {/* XY Control Pad */}
          <div className="px-3 pt-1 pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/40 font-bold tracking-wider">XY PAD</span>
              <span className="text-[9px] text-pink-400/60 font-mono">
                {Math.round(xyPosition.x * 100)}% / {Math.round((1-xyPosition.y) * 100)}%
              </span>
            </div>
            <div
              ref={xyPadRef}
              className={`relative h-20 rounded-xl border-2 cursor-crosshair select-none
                        transition-all overflow-hidden
                        ${xyPadActive
                          ? 'border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.4)]'
                          : 'border-white/20 hover:border-pink-500/40'
                        }`}
              style={{
                background: xyPadActive
                  ? `radial-gradient(circle at ${xyPosition.x * 100}% ${xyPosition.y * 100}%, rgba(236,72,153,0.4), transparent 50%)`
                  : 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.08))'
              }}
              onMouseDown={handleXYPadStart}
              onMouseMove={(e) => xyPadActive && handleXYPadMove(e)}
              onMouseUp={handleXYPadEnd}
              onMouseLeave={handleXYPadEnd}
              onTouchStart={handleXYPadStart}
              onTouchMove={(e) => xyPadActive && handleXYPadMove(e)}
              onTouchEnd={handleXYPadEnd}
            >
              {/* Grid lines */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/10" />
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/10" />
              </div>

              {/* Position indicator */}
              <div
                className={`absolute w-4 h-4 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2
                           transition-all ${xyPadActive ? 'border-pink-400 bg-pink-500/50 scale-125' : 'border-white/40 bg-white/20'}`}
                style={{ left: `${xyPosition.x * 100}%`, top: `${xyPosition.y * 100}%` }}
              />

              {/* Labels */}
              <span className="absolute bottom-1 left-2 text-[8px] text-white/30">CHAOS</span>
              <span className="absolute bottom-1 right-2 text-[8px] text-white/30">ORDER</span>
              <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] text-white/30">MAX</span>
            </div>
          </div>

          {/* FX Categories */}
          {Object.entries(FX_CATEGORIES).map(([catKey, category]) => (
            <div key={catKey} className="px-3 pb-3">
              <div className="text-[10px] text-white/40 font-bold tracking-wider mb-2 flex items-center gap-2">
                <div className="w-1 h-3 rounded-full bg-gradient-to-b from-pink-500 to-purple-500" />
                {category.label}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {category.items.map(({ key, label, icon: Icon, color }) => {
                  const isActive = effects[key];
                  return (
                    <button
                      key={key}
                      onClick={() => onToggleEffect(key)}
                      className={`relative flex flex-col items-center justify-center gap-1
                                py-3 rounded-xl border
                                transition-all duration-150 select-none
                                active:scale-95 touch-manipulation overflow-hidden
                                ${isActive
                                  ? 'border-white/30 text-white'
                                  : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                                }`}
                    >
                      {/* Active background gradient */}
                      {isActive && (
                        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-30`} />
                      )}
                      <Icon size={18} className="relative z-10" />
                      <span className="text-[9px] font-bold tracking-wider relative z-10">{label}</span>
                      {/* Active indicator dot */}
                      {isActive && (
                        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Reset Button */}
          <div className="px-3 pb-3">
            <button
              onClick={onResetAll}
              disabled={activeCount === 0}
              className={`w-full py-2.5 rounded-xl border flex items-center justify-center gap-2
                        transition-all text-xs font-bold tracking-wider
                        ${activeCount > 0
                          ? 'border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50'
                          : 'border-white/10 text-white/20 cursor-not-allowed'
                        }`}
            >
              <RotateCcw size={12} />
              RESET ALL
            </button>
          </div>
        </div>
      )}

      {/* Bottom glow */}
      <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
    </div>
  );
};

export default FXPanel;
