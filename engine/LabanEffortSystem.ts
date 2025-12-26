/**
 * LABAN EFFORT SYSTEM
 *
 * Based on Rudolf Laban's Movement Analysis framework.
 * Maps audio characteristics to 8 fundamental movement efforts.
 *
 * Each effort is defined by three factors:
 * - Time: Sudden (sharp) vs Sustained (gradual)
 * - Weight: Strong (heavy) vs Light (delicate)
 * - Space: Direct (linear) vs Indirect (flexible)
 */

export type LabanEffort =
  | 'PUNCH'   // Sudden + Strong + Direct   → Hard hits, bass drops
  | 'SLASH'   // Sudden + Strong + Indirect → Sweeping power moves
  | 'DAB'     // Sudden + Light + Direct    → Quick precise hits (snare)
  | 'FLICK'   // Sudden + Light + Indirect  → Quick flourishes (hihat)
  | 'PRESS'   // Sustained + Strong + Direct → Slow powerful moves
  | 'WRING'   // Sustained + Strong + Indirect → Twisting tension
  | 'GLIDE'   // Sustained + Light + Direct  → Smooth flowing
  | 'FLOAT';  // Sustained + Light + Indirect → Ambient, ethereal

export type DanceStyle =
  | 'POPPING'       // Isolations, hits, robot
  | 'LOCKING'       // Freezes, points, wrist rolls
  | 'HOUSE'         // Jacking, footwork, fluid
  | 'VOGUING'       // Poses, dips, catwalks
  | 'BREAKING'      // Toprock, freezes, power
  | 'CONTEMPORARY'  // Flow, breath, release
  | 'KRUMP'         // Chest pops, stomps, buck
  | 'TUTTING';      // Geometric angles, hands

export interface EffortFactors {
  time: number;      // 0 = sustained, 1 = sudden
  weight: number;    // 0 = light, 1 = strong
  space: number;     // 0 = indirect, 1 = direct
}

export interface MovementQualities {
  effort: LabanEffort;
  factors: EffortFactors;
  intensity: number; // 0-1 overall movement intensity
  danceStyle: DanceStyle;
}

export interface AudioSignature {
  bass: number;
  mid: number;
  high: number;
  energy: number;
  // Enhanced analysis
  bassOnset: number;      // 0-1 kick detected
  snareOnset: number;     // 0-1 snare detected
  hihatOnset: number;     // 0-1 hihat detected
  spectralCentroid: number; // Brightness (Hz normalized to 0-1)
  spectralFlux: number;   // Rate of spectral change
  rmsEnergy: number;      // Root mean square energy
}

/**
 * Maps audio characteristics to Laban effort factors
 */
export function audioToEffortFactors(audio: AudioSignature): EffortFactors {
  // TIME: Sudden vs Sustained
  // High spectral flux + transients = sudden
  // Low flux + sustained energy = sustained
  const time = Math.min(1,
    (audio.spectralFlux * 0.4) +
    (audio.bassOnset * 0.3) +
    (audio.snareOnset * 0.2) +
    (audio.hihatOnset * 0.1)
  );

  // WEIGHT: Strong vs Light
  // Bass + energy = strong
  // High frequencies + low energy = light
  const weight = Math.min(1,
    (audio.bass * 0.5) +
    (audio.rmsEnergy * 0.3) +
    (audio.mid * 0.2) -
    (audio.high * 0.1)
  );

  // SPACE: Direct vs Indirect
  // High spectral centroid = more direct (focused)
  // Low centroid + high variance = indirect (spread out)
  const space = Math.min(1,
    (audio.spectralCentroid * 0.4) +
    (audio.bassOnset * 0.3) +
    (1 - audio.hihatOnset * 0.3)
  );

  return { time, weight, space };
}

/**
 * Determine Laban effort from factors
 */
export function factorsToEffort(factors: EffortFactors): LabanEffort {
  const { time, weight, space } = factors;

  const isSudden = time > 0.5;
  const isStrong = weight > 0.5;
  const isDirect = space > 0.5;

  if (isSudden && isStrong && isDirect) return 'PUNCH';
  if (isSudden && isStrong && !isDirect) return 'SLASH';
  if (isSudden && !isStrong && isDirect) return 'DAB';
  if (isSudden && !isStrong && !isDirect) return 'FLICK';
  if (!isSudden && isStrong && isDirect) return 'PRESS';
  if (!isSudden && isStrong && !isDirect) return 'WRING';
  if (!isSudden && !isStrong && isDirect) return 'GLIDE';
  return 'FLOAT';
}

/**
 * Map effort to most appropriate dance style
 */
export function effortToDanceStyle(effort: LabanEffort, energy: number): DanceStyle {
  // Higher energy tends toward more explosive styles
  const highEnergy = energy > 0.6;

  switch (effort) {
    case 'PUNCH':
      return highEnergy ? 'KRUMP' : 'POPPING';
    case 'SLASH':
      return highEnergy ? 'BREAKING' : 'HOUSE';
    case 'DAB':
      return 'POPPING'; // Dab = classic pop hit
    case 'FLICK':
      return 'TUTTING'; // Quick precise angles
    case 'PRESS':
      return highEnergy ? 'LOCKING' : 'CONTEMPORARY';
    case 'WRING':
      return 'CONTEMPORARY'; // Tension, release
    case 'GLIDE':
      return 'HOUSE'; // Smooth footwork
    case 'FLOAT':
      return highEnergy ? 'VOGUING' : 'CONTEMPORARY';
  }
}

/**
 * Get full movement qualities from audio
 */
export function analyzeMovementQualities(audio: AudioSignature): MovementQualities {
  const factors = audioToEffortFactors(audio);
  const effort = factorsToEffort(factors);
  const intensity = Math.min(1, audio.energy * 1.2);
  const danceStyle = effortToDanceStyle(effort, audio.energy);

  return {
    effort,
    factors,
    intensity,
    danceStyle
  };
}

/**
 * Effort-to-Transition mode mapping
 * Each effort has preferred visual transition styles
 */
export type TransitionMode = 'CUT' | 'SLIDE' | 'MORPH' | 'SMOOTH' | 'ZOOM_IN';

export function effortToTransitionMode(effort: LabanEffort): TransitionMode {
  switch (effort) {
    case 'PUNCH':
      return 'CUT';       // Hard cut on impact
    case 'SLASH':
      return 'SLIDE';     // Sweeping motion
    case 'DAB':
      return 'CUT';       // Quick hit
    case 'FLICK':
      return 'MORPH';     // Quick but soft
    case 'PRESS':
      return 'ZOOM_IN';   // Slow push in
    case 'WRING':
      return 'MORPH';     // Organic transform
    case 'GLIDE':
      return 'SMOOTH';    // Gentle ease
    case 'FLOAT':
      return 'SMOOTH';    // Very gentle
  }
}

/**
 * Physics parameters based on effort
 * These drive spring-damper values for camera/character
 */
export interface PhysicsModifiers {
  stiffness: number;    // Spring stiffness (higher = snappier)
  damping: number;      // Damping ratio (higher = less bounce)
  maxRotation: number;  // Maximum camera rotation degrees
  bounceIntensity: number; // Character bounce multiplier
  squashAmount: number; // Character squash on impact
}

export function effortToPhysics(effort: LabanEffort, intensity: number): PhysicsModifiers {
  const base = {
    stiffness: 140,
    damping: 8,
    maxRotation: 25,
    bounceIntensity: 1.0,
    squashAmount: 0.1
  };

  switch (effort) {
    case 'PUNCH':
      return {
        stiffness: 300 * intensity,
        damping: 4,
        maxRotation: 40,
        bounceIntensity: 1.5,
        squashAmount: 0.2
      };
    case 'SLASH':
      return {
        stiffness: 200 * intensity,
        damping: 6,
        maxRotation: 35,
        bounceIntensity: 1.3,
        squashAmount: 0.15
      };
    case 'DAB':
      return {
        stiffness: 250 * intensity,
        damping: 10,
        maxRotation: 20,
        bounceIntensity: 0.8,
        squashAmount: 0.05
      };
    case 'FLICK':
      return {
        stiffness: 180 * intensity,
        damping: 12,
        maxRotation: 15,
        bounceIntensity: 0.6,
        squashAmount: 0.03
      };
    case 'PRESS':
      return {
        stiffness: 80,
        damping: 6,
        maxRotation: 30,
        bounceIntensity: 0.4,
        squashAmount: 0.12
      };
    case 'WRING':
      return {
        stiffness: 100,
        damping: 5,
        maxRotation: 25,
        bounceIntensity: 0.5,
        squashAmount: 0.08
      };
    case 'GLIDE':
      return {
        stiffness: 60,
        damping: 10,
        maxRotation: 15,
        bounceIntensity: 0.3,
        squashAmount: 0.02
      };
    case 'FLOAT':
      return {
        stiffness: 40,
        damping: 14,
        maxRotation: 10,
        bounceIntensity: 0.2,
        squashAmount: 0.01
      };
  }
}

/**
 * Frame pool selection based on dance style
 */
export interface FramePoolWeights {
  lowEnergy: number;
  midEnergy: number;
  highEnergy: number;
  closeup: number;
  preferLeft: boolean;
  preferRight: boolean;
}

export function danceStyleToPoolWeights(style: DanceStyle, beatPosition: number): FramePoolWeights {
  // Beat position affects some styles (e.g., house jacking is on 1-2-3-4)
  const onBeat = beatPosition < 0.15 || (beatPosition > 0.48 && beatPosition < 0.52);

  switch (style) {
    case 'POPPING':
      return {
        lowEnergy: 0.1,
        midEnergy: 0.3,
        highEnergy: 0.6,
        closeup: 0.2,
        preferLeft: Math.random() > 0.5,
        preferRight: Math.random() > 0.5
      };
    case 'LOCKING':
      return {
        lowEnergy: 0.2,
        midEnergy: 0.5,
        highEnergy: onBeat ? 0.8 : 0.3,
        closeup: 0.1,
        preferLeft: false,
        preferRight: false
      };
    case 'HOUSE':
      return {
        lowEnergy: 0.3,
        midEnergy: 0.5,
        highEnergy: 0.2,
        closeup: 0.0,
        preferLeft: beatPosition < 0.25,
        preferRight: beatPosition > 0.75
      };
    case 'VOGUING':
      return {
        lowEnergy: 0.2,
        midEnergy: 0.3,
        highEnergy: 0.5,
        closeup: 0.4, // Voguing loves closeups
        preferLeft: false,
        preferRight: false
      };
    case 'BREAKING':
      return {
        lowEnergy: 0.1,
        midEnergy: 0.2,
        highEnergy: 0.7,
        closeup: 0.1,
        preferLeft: Math.random() > 0.5,
        preferRight: Math.random() > 0.5
      };
    case 'CONTEMPORARY':
      return {
        lowEnergy: 0.5,
        midEnergy: 0.4,
        highEnergy: 0.1,
        closeup: 0.2,
        preferLeft: false,
        preferRight: false
      };
    case 'KRUMP':
      return {
        lowEnergy: 0.0,
        midEnergy: 0.2,
        highEnergy: 0.8,
        closeup: 0.3,
        preferLeft: Math.random() > 0.5,
        preferRight: Math.random() > 0.5
      };
    case 'TUTTING':
      return {
        lowEnergy: 0.3,
        midEnergy: 0.5,
        highEnergy: 0.2,
        closeup: 0.4, // Hands/face important
        preferLeft: true,
        preferRight: true
      };
  }
}
