/**
 * FXPanel - BOTTOM FX Paddles Control
 *
 * Features:
 * - Column-style paddles (lower=less, higher=more intensity)
 * - Map any of 9 effects to each of 4 paddles
 * - Multiple effects can be mapped to same paddle
 * - Positioned at bottom, above ControlDock
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  X, Layers, Zap, Ghost, Contrast, CircleDot,
  ScanLine, Activity, Move3D, Radio, Sparkles,
  ChevronUp, ChevronDown, Settings, Plus
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
  onPaddlePress?: (intensity: number, effects: (keyof FXState)[]) => void;
  onPaddleRelease?: () => void;
}

// All 9 effects with their visual properties
const ALL_FX: { key: keyof FXState; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'rgbSplit', label: 'RGB', icon: Layers, color: 'from-red-500 to-blue-500' },
  { key: 'strobe', label: 'STROBE', icon: Zap, color: 'from-yellow-500 to-orange-500' },
  { key: 'ghost', label: 'GHOST', icon: Ghost, color: 'from-purple-500 to-pink-500' },
  { key: 'invert', label: 'INVERT', icon: Contrast, color: 'from-cyan-500 to-teal-500' },
  { key: 'bw', label: 'B&W', icon: CircleDot, color: 'from-gray-400 to-gray-600' },
  { key: 'scanlines', label: 'SCAN', icon: ScanLine, color: 'from-green-500 to-emerald-500' },
  { key: 'glitch', label: 'GLITCH', icon: Activity, color: 'from-pink-500 to-red-500' },
  { key: 'shake', label: 'SHAKE', icon: Radio, color: 'from-orange-500 to-amber-500' },
  { key: 'zoom', label: 'ZOOM', icon: Move3D, color: 'from-blue-500 to-indigo-500' }
];

// Default paddle mappings (each paddle can have multiple effects)
const DEFAULT_PADDLE_MAPPINGS: (keyof FXState)[][] = [
  ['rgbSplit', 'glitch'],     // Paddle 1: Visual distortion
  ['strobe', 'shake'],         // Paddle 2: Energy effects
  ['ghost', 'zoom'],           // Paddle 3: Motion blur
  ['scanlines', 'invert'],     // Paddle 4: Filter effects
];

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
  const [paddleMappings, setPaddleMappings] = useState<(keyof FXState)[][]>(DEFAULT_PADDLE_MAPPINGS);
  const [activePaddle, setActivePaddle] = useState<number | null>(null);
  const [paddleIntensity, setPaddleIntensity] = useState<number[]>([0, 0, 0, 0]);
  const [editingPaddle, setEditingPaddle] = useState<number | null>(null);

  const activeCount = Object.values(effects).filter(Boolean).length;

  // Handle paddle touch/mouse
  const handlePaddleStart = useCallback((paddleIndex: number, e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setActivePaddle(paddleIndex);

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    let clientY: number;

    if ('touches' in e) {
      clientY = e.touches[0].clientY;
    } else {
      clientY = e.clientY;
    }

    // Intensity: higher position = more intensity
    const intensity = 1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const newIntensities = [...paddleIntensity];
    newIntensities[paddleIndex] = intensity;
    setPaddleIntensity(newIntensities);

    onPaddlePress?.(intensity, paddleMappings[paddleIndex]);
  }, [paddleIntensity, paddleMappings, onPaddlePress]);

  const handlePaddleMove = useCallback((paddleIndex: number, e: React.TouchEvent | React.MouseEvent) => {
    if (activePaddle !== paddleIndex) return;

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    let clientY: number;

    if ('touches' in e) {
      clientY = e.touches[0].clientY;
    } else {
      clientY = e.clientY;
    }

    const intensity = 1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const newIntensities = [...paddleIntensity];
    newIntensities[paddleIndex] = intensity;
    setPaddleIntensity(newIntensities);

    onPaddlePress?.(intensity, paddleMappings[paddleIndex]);
  }, [activePaddle, paddleIntensity, paddleMappings, onPaddlePress]);

  const handlePaddleEnd = useCallback(() => {
    setActivePaddle(null);
    setPaddleIntensity([0, 0, 0, 0]);
    onPaddleRelease?.();
  }, [onPaddleRelease]);

  // Toggle effect in paddle mapping
  const togglePaddleEffect = (paddleIndex: number, effectKey: keyof FXState) => {
    const newMappings = [...paddleMappings];
    const currentEffects = newMappings[paddleIndex];
    if (currentEffects.includes(effectKey)) {
      newMappings[paddleIndex] = currentEffects.filter(e => e !== effectKey);
    } else {
      newMappings[paddleIndex] = [...currentEffects, effectKey];
    }
    setPaddleMappings(newMappings);
  };

  // ============ CLOSED STATE - Small tab on LEFT edge (above EnginePanel) ============
  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="fixed left-0 top-1/3 z-[60]
                   w-10 h-16
                   bg-gradient-to-b from-pink-500/60 to-purple-500/60
                   border-y-2 border-r-2 border-pink-400 rounded-r-xl
                   flex flex-col items-center justify-center gap-0.5
                   hover:w-12 hover:bg-pink-500/70
                   active:scale-95 transition-all duration-200
                   backdrop-blur-md font-rajdhani
                   shadow-xl shadow-pink-500/40"
      >
        <Sparkles size={16} className="text-pink-200" />
        <span className="text-[9px] font-black text-pink-200">FX</span>
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 text-[8px] font-bold bg-pink-500 text-white rounded-full flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>
    );
  }

  // ============ OPEN STATE - Vertical panel on LEFT edge (above EnginePanel) ============
  return (
    <div
      className={`fixed left-0 top-1/3 -translate-y-1/4 z-[60]
                 bg-black/95 backdrop-blur-xl
                 border-y-2 border-r-2 border-pink-400 rounded-r-2xl
                 font-rajdhani text-white
                 transition-all duration-300 ease-out
                 shadow-2xl shadow-pink-500/30
                 ${isExpanded ? 'w-[280px]' : 'w-[200px]'}`}
      style={{ maxHeight: '40vh' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-pink-400" />
          <span className="text-sm font-bold text-pink-400">FX PADDLES</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-pink-500/30 text-pink-300 rounded">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleExpand}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button
            onClick={onToggleOpen}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-all"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 4 Column Paddles */}
      <div className="p-3">
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((paddleIndex) => {
            const mappedEffects = paddleMappings[paddleIndex];
            const isActive = activePaddle === paddleIndex;
            const intensity = paddleIntensity[paddleIndex];

            return (
              <div key={paddleIndex} className="flex flex-col items-center">
                {/* Paddle Column - Compact */}
                <div
                  className={`relative w-full h-20 rounded-lg border-2 cursor-pointer select-none
                            overflow-hidden transition-all
                            ${isActive
                              ? 'border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.4)]'
                              : 'border-white/20 hover:border-pink-500/40'
                            }`}
                  onMouseDown={(e) => handlePaddleStart(paddleIndex, e)}
                  onMouseMove={(e) => handlePaddleMove(paddleIndex, e)}
                  onMouseUp={handlePaddleEnd}
                  onMouseLeave={handlePaddleEnd}
                  onTouchStart={(e) => handlePaddleStart(paddleIndex, e)}
                  onTouchMove={(e) => handlePaddleMove(paddleIndex, e)}
                  onTouchEnd={handlePaddleEnd}
                >
                  {/* Intensity fill (from bottom up) */}
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-pink-500/60 to-purple-500/60 transition-all"
                    style={{ height: `${intensity * 100}%` }}
                  />

                  {/* Grid lines for intensity levels */}
                  <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none">
                    {[100, 75, 50, 25, 0].map(level => (
                      <div key={level} className="flex items-center px-1">
                        <div className="flex-1 h-[1px] bg-white/10" />
                        <span className="text-[7px] text-white/20 ml-0.5">{level}</span>
                      </div>
                    ))}
                  </div>

                  {/* Mapped effect icons */}
                  <div className="absolute top-1 left-0 right-0 flex justify-center gap-0.5 pointer-events-none">
                    {mappedEffects.slice(0, 3).map(effectKey => {
                      const fx = ALL_FX.find(f => f.key === effectKey);
                      if (!fx) return null;
                      const Icon = fx.icon;
                      return (
                        <div key={effectKey} className={`w-4 h-4 rounded bg-gradient-to-br ${fx.color} flex items-center justify-center`}>
                          <Icon size={10} className="text-white" />
                        </div>
                      );
                    })}
                  </div>

                  {/* Center intensity display */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className={`text-lg font-bold transition-all ${isActive ? 'text-white scale-125' : 'text-white/30'}`}>
                      {Math.round(intensity * 100)}
                    </span>
                  </div>
                </div>

                {/* Edit button */}
                <button
                  onClick={() => setEditingPaddle(editingPaddle === paddleIndex ? null : paddleIndex)}
                  className={`mt-1.5 px-2 py-1 rounded-lg text-[9px] font-bold transition-all
                             ${editingPaddle === paddleIndex
                               ? 'bg-pink-500/40 text-pink-300'
                               : 'bg-white/5 text-white/40 hover:bg-white/10'
                             }`}
                >
                  {editingPaddle === paddleIndex ? 'DONE' : 'MAP'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Effect Mapping Editor (when editing a paddle) */}
        {editingPaddle !== null && (
          <div className="mt-3 p-2 bg-white/5 rounded-xl border border-pink-500/30">
            <div className="text-[9px] text-pink-400 font-bold mb-2">
              TAP FX TO MAP TO PADDLE {editingPaddle + 1}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {ALL_FX.map(({ key, label, icon: Icon, color }) => {
                const isMapped = paddleMappings[editingPaddle].includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => togglePaddleEffect(editingPaddle, key)}
                    className={`py-2.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5
                               transition-all border overflow-hidden relative
                               ${isMapped
                                 ? 'border-pink-400 text-white shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                                 : 'border-white/20 text-white/50 hover:border-pink-500/40'
                               }`}
                  >
                    {isMapped && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-40`} />
                    )}
                    <Icon size={14} className="relative z-10" />
                    <span className="relative z-10">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3x3 FX Grid - Always visible when expanded */}
        {isExpanded && editingPaddle === null && (
          <div className="mt-3 p-2 bg-white/5 rounded-xl border border-white/10">
            <div className="text-[9px] text-white/40 font-bold mb-2">TAP TO TOGGLE FX</div>
            <div className="grid grid-cols-3 gap-1.5">
              {ALL_FX.map(({ key, label, icon: Icon, color }) => {
                const isActive = effects[key];
                return (
                  <button
                    key={key}
                    onClick={() => onToggleEffect(key)}
                    className={`py-2.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5
                               transition-all border overflow-hidden relative
                               ${isActive
                                 ? 'border-white/40 text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                                 : 'border-white/10 text-white/40 hover:border-white/25'
                               }`}
                  >
                    {isActive && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-40`} />
                    )}
                    <Icon size={14} className="relative z-10" />
                    <span className="relative z-10">{label}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={onResetAll}
              className="mt-2 w-full py-1.5 rounded-lg text-[9px] font-bold
                        bg-red-500/20 text-red-400 border border-red-500/30
                        hover:bg-red-500/30 transition-all"
            >
              RESET ALL FX
            </button>
          </div>
        )}

      </div>

      {/* Glow accent */}
      <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
    </div>
  );
};

export default FXPanel;
