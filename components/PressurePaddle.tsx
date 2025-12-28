/**
 * PressurePaddle - Right edge expression controller
 *
 * A vertical touch zone where Y-position = intensity (0-1).
 * Affects RGB split, flash, and glitch proportionally.
 * The "expression pedal" for live performance.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface PressurePaddleProps {
  onPressureChange: (intensity: number) => void;
  onRelease: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const PressurePaddle: React.FC<PressurePaddleProps> = ({
  onPressureChange,
  onRelease,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [intensity, setIntensity] = useState(0);
  const paddleRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  // Calculate intensity from Y position (inverted: top = 1, bottom = 0)
  const calculateIntensity = useCallback((clientY: number) => {
    if (!paddleRef.current) return 0;
    const rect = paddleRef.current.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const normalizedY = Math.max(0, Math.min(1, relativeY / rect.height));
    // Invert so top of paddle = max intensity
    return 1 - normalizedY;
  }, []);

  // Touch/Mouse handlers
  const handleStart = useCallback((clientY: number) => {
    setIsPressed(true);
    const newIntensity = calculateIntensity(clientY);
    setIntensity(newIntensity);
    onPressureChange(newIntensity);
  }, [calculateIntensity, onPressureChange]);

  const handleMove = useCallback((clientY: number) => {
    if (!isPressed) return;
    const newIntensity = calculateIntensity(clientY);
    setIntensity(newIntensity);
    onPressureChange(newIntensity);
  }, [isPressed, calculateIntensity, onPressureChange]);

  const handleEnd = useCallback(() => {
    setIsPressed(false);
    setIntensity(0);
    onRelease();
  }, [onRelease]);

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handleStart(e.touches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientY);
  };

  const onTouchEnd = () => handleEnd();

  // Mouse events (for desktop testing)
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientY);
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => { if (isPressed) handleEnd(); };

  // Collapsed state - just a thin grip
  if (isCollapsed) {
    return (
      <div
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 w-3 h-32
                   bg-white/10 rounded-l-full cursor-pointer
                   hover:w-4 hover:bg-white/20 transition-all
                   flex items-center justify-center"
        onClick={onToggleCollapse}
      >
        <div className="w-1 h-8 bg-white/30 rounded-full" />
      </div>
    );
  }

  // Glow color based on intensity
  const glowColor = intensity > 0.7
    ? 'shadow-[0_0_30px_rgba(239,68,68,0.6)]'  // Red at high
    : intensity > 0.3
      ? 'shadow-[0_0_20px_rgba(168,85,247,0.5)]'  // Purple at mid
      : 'shadow-[0_0_10px_rgba(139,92,246,0.3)]';  // Brand at low

  return (
    <div
      ref={paddleRef}
      className={`fixed right-2 top-1/2 -translate-y-1/2 z-40
                 w-16 h-52 rounded-2xl overflow-hidden
                 bg-black/60 backdrop-blur-xl
                 border-2 transition-all duration-100
                 cursor-pointer select-none touch-none
                 ${isPressed
                   ? `border-white/50 ${glowColor}`
                   : 'border-white/20 hover:border-white/30'
                 }`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-500/20 via-purple-500/10 to-red-500/20 opacity-50" />

      {/* Fill indicator (from bottom) */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-all duration-75
                   ${isPressed ? 'opacity-100' : 'opacity-0'}`}
        style={{ height: `${intensity * 100}%` }}
      >
        <div className={`w-full h-full bg-gradient-to-t
                        ${intensity > 0.7
                          ? 'from-red-500/60 to-red-400/40'
                          : intensity > 0.3
                            ? 'from-purple-500/60 to-purple-400/40'
                            : 'from-brand-500/60 to-brand-400/40'
                        }`}
        />
      </div>

      {/* Center line */}
      <div className="absolute inset-x-4 top-1/2 h-px bg-white/20" />

      {/* Labels */}
      <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none">
        <span className="text-[9px] font-bold text-red-400/70 text-center tracking-wider">MAX</span>
        <span className="text-[10px] font-bold text-white/80 text-center tracking-widest">FX</span>
        <span className="text-[9px] font-bold text-brand-400/70 text-center tracking-wider">MIN</span>
      </div>

      {/* Intensity readout when pressed */}
      {isPressed && (
        <div className="absolute -left-12 top-1/2 -translate-y-1/2
                       bg-black/80 px-2 py-1 rounded text-xs font-mono text-white">
          {Math.round(intensity * 100)}%
        </div>
      )}
    </div>
  );
};

export default PressurePaddle;
