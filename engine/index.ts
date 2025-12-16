/**
 * Kinetic Core Engine - Module Exports
 *
 * The Kinetic Core is a synthesis of three architectural philosophies:
 * - CVS: Environmental reactivity via shaders
 * - DFF: Stochastic rhythm gating
 * - MJ: Structural rigidity and hard cuts
 *
 * Export all engine components for external use.
 */

export {
  // Types
  type KineticNodeId,
  type TransitionMode,
  type MechanicalFX,
  type RhythmPhase,
  type KineticNode,
  type AudioData,
  type LookaheadResult,
  type KineticState,
  type MechanicalFrame,

  // Classes
  KineticGraph,
  AudioLookaheadBuffer,
  MechanicalMultiplier,
  KineticEngine,

  // Factory
  createKineticEngine
} from './KineticEngine';
