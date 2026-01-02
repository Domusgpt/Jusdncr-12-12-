/**
 * AnimationZoneController - Touch overlay for animation zone
 *
 * Handles all touch interactions in the animation area:
 * - Left half: LEGACY mode activation + pattern joystick
 * - Right half: KINETIC mode activation + pattern joystick
 * - Quadrants: Deck control (tap=on/off, flick up/down=mode cycle)
 * - Touch position: FX intensity (X/Y axes)
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { PatternType, MixMode } from '../engine/GolemMixer';

// Pattern arrangements for joystick
const KINETIC_PATTERNS: PatternType[] = [
  'PING_PONG', 'FLOW', 'STUTTER', 'CHAOS', 'VOGUE', 'BUILD_DROP'
];

const ALL_PATTERNS: PatternType[] = [
  'PING_PONG', 'BUILD_DROP', 'STUTTER', 'VOGUE', 'FLOW', 'CHAOS',
  'MINIMAL', 'ABAB', 'AABB', 'ABAC', 'SNARE_ROLL', 'GROOVE',
  'EMOTE', 'FOOTWORK', 'IMPACT'
];

interface DeckState {
  id: number;
  mixMode: MixMode;
  isActive: boolean;
}

interface AnimationZoneControllerProps {
  // Physics/Engine mode
  onPhysicsModeChange: (mode: 'LEGACY' | 'LABAN') => void;
  currentPhysicsMode: 'LEGACY' | 'LABAN';

  // Pattern selection
  onPatternChange: (pattern: PatternType) => void;
  currentPattern: PatternType;
  engineMode: 'KINETIC' | 'PATTERN';

  // Deck control
  decks: DeckState[];
  onDeckToggle: (deckId: number) => void;
  onDeckModeChange: (deckId: number, mode: MixMode) => void;

  // FX intensity
  onFXIntensityChange: (intensity: { x: number; y: number }) => void;

  // Touch active state (for visual feedback in parent)
  onTouchStateChange?: (state: {
    isActive: boolean;
    side: 'left' | 'right' | null;
    patternAngle: number;
    quadrant: number | null;
  }) => void;
}

export const AnimationZoneController: React.FC<AnimationZoneControllerProps> = ({
  onPhysicsModeChange,
  currentPhysicsMode,
  onPatternChange,
  currentPattern,
  engineMode,
  decks,
  onDeckToggle,
  onDeckModeChange,
  onFXIntensityChange,
  onTouchStateChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchState, setTouchState] = useState<{
    isActive: boolean;
    startX: number;
    startY: number;
    startTime: number;
    side: 'left' | 'right' | null;
    quadrant: number | null;
    hasMoved: boolean;
  }>({
    isActive: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    side: null,
    quadrant: null,
    hasMoved: false
  });

  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [showJoystick, setShowJoystick] = useState(false);

  // Get patterns based on current engine mode
  const patterns = engineMode === 'KINETIC' ? KINETIC_PATTERNS : ALL_PATTERNS;

  // Calculate pattern from joystick position
  const getPatternFromAngle = useCallback((x: number, y: number): PatternType => {
    const angle = Math.atan2(y, x);
    const normalizedAngle = (angle + Math.PI) / (2 * Math.PI); // 0-1
    const index = Math.floor(normalizedAngle * patterns.length) % patterns.length;
    return patterns[index];
  }, [patterns]);

  // Get quadrant from position (0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right)
  const getQuadrant = useCallback((clientX: number, clientY: number): number => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;
    const isRight = relX > rect.width / 2;
    const isBottom = relY > rect.height / 2;
    return (isBottom ? 2 : 0) + (isRight ? 1 : 0);
  }, []);

  // Get side (left/right) from position
  const getSide = useCallback((clientX: number): 'left' | 'right' => {
    if (!containerRef.current) return 'left';
    const rect = containerRef.current.getBoundingClientRect();
    return (clientX - rect.left) < rect.width / 2 ? 'left' : 'right';
  }, []);

  // Calculate FX intensity from touch position
  const calculateFXIntensity = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    return { x, y };
  }, []);

  // Handle touch/mouse start
  const handleStart = useCallback((clientX: number, clientY: number) => {
    const side = getSide(clientX);
    const quadrant = getQuadrant(clientX, clientY);

    setTouchState({
      isActive: true,
      startX: clientX,
      startY: clientY,
      startTime: Date.now(),
      side,
      quadrant,
      hasMoved: false
    });

    // Activate physics mode based on side
    if (side === 'left') {
      onPhysicsModeChange('LEGACY');
    } else {
      onPhysicsModeChange('LABAN');
    }

    // Set initial FX intensity
    onFXIntensityChange(calculateFXIntensity(clientX, clientY));

    // Show joystick
    setShowJoystick(true);
    setJoystickPos({ x: 0, y: 0 });
  }, [getSide, getQuadrant, onPhysicsModeChange, onFXIntensityChange, calculateFXIntensity]);

  // Handle touch/mouse move
  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!touchState.isActive) return;

    const deltaX = clientX - touchState.startX;
    const deltaY = clientY - touchState.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Mark as moved if distance > threshold
    if (distance > 10 && !touchState.hasMoved) {
      setTouchState(s => ({ ...s, hasMoved: true }));
    }

    // Update joystick position (clamped to radius)
    const maxRadius = 60;
    const clampedDistance = Math.min(distance, maxRadius);
    const angle = Math.atan2(deltaY, deltaX);
    const joyX = Math.cos(angle) * clampedDistance;
    const joyY = Math.sin(angle) * clampedDistance;
    setJoystickPos({ x: joyX, y: joyY });

    // Update pattern based on joystick direction (only if moved significantly)
    if (distance > 30) {
      const pattern = getPatternFromAngle(deltaX, deltaY);
      if (pattern !== currentPattern) {
        onPatternChange(pattern);
      }
    }

    // Update FX intensity
    onFXIntensityChange(calculateFXIntensity(clientX, clientY));

    // Notify parent of touch state
    onTouchStateChange?.({
      isActive: true,
      side: touchState.side,
      patternAngle: angle,
      quadrant: touchState.quadrant
    });
  }, [touchState, getPatternFromAngle, currentPattern, onPatternChange, onFXIntensityChange, calculateFXIntensity, onTouchStateChange]);

  // Handle touch/mouse end
  const handleEnd = useCallback((clientX: number, clientY: number) => {
    if (!touchState.isActive) return;

    const deltaX = clientX - touchState.startX;
    const deltaY = clientY - touchState.startY;
    const deltaTime = Date.now() - touchState.startTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Check for tap (short duration, minimal movement)
    if (deltaTime < 300 && distance < 20) {
      // Tap - toggle deck
      if (touchState.quadrant !== null) {
        onDeckToggle(touchState.quadrant);
      }
    }
    // Check for flick (fast movement in Y direction)
    else if (deltaTime < 400 && Math.abs(deltaY) > 50 && Math.abs(deltaY) > Math.abs(deltaX)) {
      // Flick up or down - cycle deck mode
      if (touchState.quadrant !== null) {
        const deck = decks[touchState.quadrant];
        if (deck) {
          const modes: MixMode[] = ['off', 'sequencer', 'layer'];
          const currentIndex = modes.indexOf(deck.mixMode);
          const direction = deltaY < 0 ? 1 : -1; // Up = forward, down = backward
          const newIndex = (currentIndex + direction + modes.length) % modes.length;
          onDeckModeChange(touchState.quadrant, modes[newIndex]);
        }
      }
    }

    // Reset
    setTouchState({
      isActive: false,
      startX: 0,
      startY: 0,
      startTime: 0,
      side: null,
      quadrant: null,
      hasMoved: false
    });
    setShowJoystick(false);
    setJoystickPos({ x: 0, y: 0 });
    onFXIntensityChange({ x: 0, y: 0 });

    onTouchStateChange?.({
      isActive: false,
      side: null,
      patternAngle: 0,
      quadrant: null
    });
  }, [touchState, decks, onDeckToggle, onDeckModeChange, onFXIntensityChange, onTouchStateChange]);

  // Touch event handlers
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    handleEnd(touch.clientX, touch.clientY);
  };

  // Mouse event handlers (for desktop)
  const onMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const onMouseUp = (e: React.MouseEvent) => {
    handleEnd(e.clientX, e.clientY);
  };

  const onMouseLeave = () => {
    if (touchState.isActive) {
      handleEnd(touchState.startX, touchState.startY);
    }
  };

  // Deck mode colors
  const getModeColor = (mode: MixMode) => {
    switch (mode) {
      case 'sequencer': return 'bg-cyan-500/40 border-cyan-500';
      case 'layer': return 'bg-purple-500/40 border-purple-500';
      default: return 'bg-white/5 border-white/20';
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-10 touch-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={touchState.isActive ? onMouseMove : undefined}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {/* Visual feedback - side zones */}
      <div className="absolute inset-0 pointer-events-none flex">
        <div className={`flex-1 transition-colors duration-150
                        ${touchState.side === 'left' ? 'bg-amber-500/10' : ''}`}>
          {touchState.side === 'left' && (
            <div className="absolute top-2 left-1/4 -translate-x-1/2
                           text-[10px] text-amber-400/80 font-bold">
              LEGACY
            </div>
          )}
        </div>
        <div className="w-px bg-white/5" />
        <div className={`flex-1 transition-colors duration-150
                        ${touchState.side === 'right' ? 'bg-purple-500/10' : ''}`}>
          {touchState.side === 'right' && (
            <div className="absolute top-2 right-1/4 translate-x-1/2
                           text-[10px] text-purple-400/80 font-bold">
              KINETIC
            </div>
          )}
        </div>
      </div>

      {/* Deck quadrant indicators */}
      <div className="absolute inset-0 pointer-events-none grid grid-cols-2 grid-rows-2 gap-px opacity-30">
        {decks.map((deck, i) => (
          <div
            key={deck.id}
            className={`flex items-center justify-center transition-all duration-150
                       ${touchState.quadrant === i ? 'opacity-100' : 'opacity-50'}
                       ${getModeColor(deck.mixMode)} border rounded-lg m-2`}
          >
            <div className="text-center">
              <div className="text-[10px] font-bold text-white/70">D{deck.id + 1}</div>
              <div className="text-[8px] text-white/50 uppercase">
                {deck.mixMode === 'off' ? 'OFF' : deck.mixMode === 'sequencer' ? 'SEQ' : 'LAY'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Joystick visualization */}
      {showJoystick && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: touchState.startX - (containerRef.current?.getBoundingClientRect().left || 0),
            top: touchState.startY - (containerRef.current?.getBoundingClientRect().top || 0),
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Base ring */}
          <div className={`w-32 h-32 rounded-full border-2
                          ${touchState.side === 'left' ? 'border-amber-500/30' : 'border-purple-500/30'}
                          flex items-center justify-center`}>
            {/* Pattern labels around the ring */}
            {patterns.slice(0, 8).map((p, i) => {
              const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
              const x = Math.cos(angle) * 50;
              const y = Math.sin(angle) * 50;
              return (
                <div
                  key={p}
                  className={`absolute text-[7px] font-bold transition-opacity
                             ${currentPattern === p ? 'text-white opacity-100' : 'text-white/40 opacity-60'}`}
                  style={{ transform: `translate(${x}px, ${y}px)` }}
                >
                  {p.slice(0, 4)}
                </div>
              );
            })}

            {/* Joystick knob */}
            <div
              className={`w-8 h-8 rounded-full shadow-lg transition-colors
                         ${touchState.side === 'left'
                           ? 'bg-amber-500 shadow-amber-500/50'
                           : 'bg-purple-500 shadow-purple-500/50'}`}
              style={{
                transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
              }}
            />
          </div>
        </div>
      )}

      {/* Current pattern display */}
      {showJoystick && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className={`px-4 py-2 rounded-xl text-sm font-bold
                          ${touchState.side === 'left'
                            ? 'bg-amber-500/80 text-white'
                            : 'bg-purple-500/80 text-white'
                          }`}>
            {currentPattern.replace('_', ' ')}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimationZoneController;
