/**
 * Kinetic Core Engine - Module Exports
 *
 * The Kinetic Core is a synthesis of three architectural philosophies:
 * - CVS: Environmental reactivity via shaders
 * - DFF: Stochastic rhythm gating
 * - MJ: Structural rigidity and hard cuts
 *
 * Enhanced with:
 * - Laban Effort System for movement quality analysis
 * - Enhanced Audio Analyzer with multi-band onset detection
 * - Motion Grammar for procedural choreography
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

// Laban Effort System exports
export {
  type LabanEffort,
  type DanceStyle,
  type EffortFactors,
  type MovementQualities,
  type AudioSignature,
  type PhysicsModifiers,
  type FramePoolWeights,
  audioToEffortFactors,
  factorsToEffort,
  effortToDanceStyle,
  analyzeMovementQualities,
  effortToTransitionMode,
  effortToPhysics,
  danceStyleToPoolWeights
} from './LabanEffortSystem';

// Enhanced Audio Analyzer exports
export {
  type MultiBandOnsets,
  type SpectralFeatures,
  type PhraseState,
  type PhraseSection,
  type EnhancedAudioFeatures,
  EnhancedAudioAnalyzer
} from './EnhancedAudioAnalyzer';

// Motion Grammar exports
export {
  type MoveToken,
  type MoveDescriptor,
  MotionGrammar,
  ChoreographySequencer
} from './MotionGrammar';
