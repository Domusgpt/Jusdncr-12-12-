/**
 * Kinetic Core Engine - Module Exports
 *
 * The Kinetic Core is a synthesis of three architectural philosophies:
 * - CVS: Environmental reactivity via shaders
 * - DFF: Stochastic rhythm gating
 * - MJ: Structural rigidity and hard cuts
 *
 * Enhanced with:
 * - Laban Effort System (real-time movement quality analysis)
 * - Enhanced Audio Analyzer (multi-band onset detection)
 * - Motion Grammar (procedural choreography)
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
// LABAN EFFORT SYSTEM (Real-time movement quality)
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
// ENHANCED AUDIO ANALYZER (Multi-band onset detection)
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
// MOTION GRAMMAR (Procedural choreography)
// =============================================================================

export {
  type MoveToken,
  type MoveDescriptor,
  MotionGrammar,
  ChoreographySequencer
} from './MotionGrammar';

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

// =============================================================================
// DIRECT VIDEO EXPORTER (New - No Real-Time Recording Needed)
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

// =============================================================================
// LIVE MIXER (VJ-Style Hot-Swap System)
// =============================================================================

export {
  // Types
  type AudioData as MixerAudioData,
  type ChoreographyOutput,
  type TransitionMode as MixerTransitionMode,
  type PhysicsState,
  type EffectsState,
  type PatternType,
  type EngineType,
  type IChoreographyEngine,
  type EffectsRackState,
  type DeckState,
  type LiveMixerState,
  type MixedOutput,

  // Engine Implementations
  ReactiveEngine,
  ChaosEngine,
  MinimalEngine,
  FlowEngine,
  FluidEngine,
  SequenceEngine,
  PatternEngine,

  // Additional types
  type StutterStyle,

  // Classes
  EffectsRack,
  Deck,
  LiveMixer,

  // Factory
  createLiveMixer,
  createEngine
} from './LiveMixer';
