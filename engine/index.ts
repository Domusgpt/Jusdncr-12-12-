/**
 * Kinetic Core Engine - Module Exports
 *
 * The Kinetic Core is a synthesis of three architectural philosophies:
 * - CVS: Environmental reactivity via shaders
 * - DFF: Stochastic rhythm gating
 * - MJ: Structural rigidity and hard cuts
 *
 * Enhanced with:
 * - Full song pre-analysis
 * - Frame manifest system
 * - Dual-mode choreography (pre-computed + real-time)
 *
 * Export all engine components for external use.
 */

// =============================================================================
// KINETIC ENGINE (Original)
// =============================================================================

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

// =============================================================================
// FRAME MANIFEST SYSTEM (New)
// =============================================================================

export {
  // Types
  type MechanicalOperationType,
  type MechanicalOperation,
  type SourceFrame,
  type DerivedFrame,
  type ManifestFrame,
  type FrameManifest,
  type CompactManifest,
  type CompactFrame,

  // Classes
  FrameManifestBuilder,

  // Utilities
  serializeManifest,
  deserializeManifest
} from './FrameManifest';

// =============================================================================
// SONG ANALYZER (New)
// =============================================================================

export {
  // Types
  type SectionType,
  type BeatMarker,
  type SongSection,
  type RepeatedPattern,
  type EnergyPoint,
  type DropMarker,
  type BuildupMarker,
  type SongMap,

  // Classes
  SongAnalyzer,

  // Utilities
  getSectionAtTime,
  getBeatAtTime,
  getPatternAtTime,
  isInBuildup
} from './SongAnalyzer';

// =============================================================================
// CHOREOGRAPHY PLANNER (New)
// =============================================================================

export {
  // Types
  type BeatChoreography,
  type ChoreographyMood,
  type MoveSequence,
  type ChoreographyMap,

  // Classes
  ChoreographyPlanner,
  PreComputedChoreography
} from './ChoreographyPlanner';

// =============================================================================
// DUAL-MODE ENGINE (New - Main Entry Point)
// =============================================================================

export {
  // Types
  type EngineMode,
  type AudioSource,
  type ChoreographyDecision,
  type RealTimeAnalysisResult,

  // Classes
  RealTimeAnalyzer,
  DualModeChoreographyEngine,

  // Factory
  createDualModeEngine
} from './DualModeEngine';
