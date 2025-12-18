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
// LABAN EFFORT SYSTEM
// =============================================================================

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

// =============================================================================
// ENHANCED AUDIO ANALYZER
// =============================================================================

export {
  type MultiBandOnsets,
  type SpectralFeatures,
  type PhraseState,
  type PhraseSection,
  type EnhancedAudioFeatures,
  EnhancedAudioAnalyzer
} from './EnhancedAudioAnalyzer';

// =============================================================================
// MOTION GRAMMAR
// =============================================================================

export {
  type MoveToken,
  type MoveDescriptor,
  MotionGrammar,
  ChoreographySequencer
} from './MotionGrammar';

// =============================================================================
// FRAME MANIFEST SYSTEM
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
// SONG ANALYZER
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
// CHOREOGRAPHY PLANNER
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
// DUAL-MODE ENGINE (Main Entry Point)
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

// =============================================================================
// DIRECT VIDEO EXPORTER (No Real-Time Recording Needed)
// =============================================================================

export {
  // Types
  type ExportOptions,
  type ExportProgress,
  type RenderedFrame,
  type QuickExportParams,

  // Constants
  DEFAULT_EXPORT_OPTIONS,

  // Classes
  FrameRenderer,
  DirectVideoExporter,

  // Convenience functions
  exportVideo,
  exportAndDownload
} from './DirectVideoExporter';
