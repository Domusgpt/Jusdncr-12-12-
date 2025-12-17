/**
 * MOTION GRAMMAR SYSTEM
 *
 * Procedural choreography generation using grammar rules.
 * Generates dance sequences without hardcoding specific moves.
 *
 * Grammar structure:
 * - Phrase → Sequences of Moves
 * - Move → [Direction] + [Energy] + [Transition]
 * - Moves follow probability rules based on:
 *   - Current audio state (effort)
 *   - Previous move (Markov chain)
 *   - Phrase position (musical structure)
 */

import { LabanEffort, DanceStyle, TransitionMode, effortToTransitionMode } from './LabanEffortSystem';
import { PhraseSection } from './EnhancedAudioAnalyzer';
import { MoveDirection, EnergyLevel } from '../types';

// =============================================================================
// GRAMMAR TOKENS
// =============================================================================

export type MoveToken =
  | 'HOLD'      // Stay on current frame
  | 'STEP_L'    // Move to left direction
  | 'STEP_R'    // Move to right direction
  | 'CENTER'    // Return to center
  | 'BOUNCE'    // Stay but add bounce physics
  | 'POP'       // Quick hit (CUT transition)
  | 'FLOW'      // Smooth transition
  | 'FREEZE'    // Hold pose longer
  | 'BREAK'     // Break pattern (chaos)
  | 'RISE'      // Increase energy
  | 'DROP'      // Decrease energy
  | 'ZOOM'      // Camera push in
  | 'VOGUE';    // Extended pose hold

export interface MoveDescriptor {
  token: MoveToken;
  direction: MoveDirection;
  energy: EnergyLevel;
  transitionMode: TransitionMode;
  holdBeats: number;    // How many beats to hold this move
  physicsBoost: number; // 0-1 extra physics intensity
}

// =============================================================================
// MARKOV TRANSITION MATRIX
// =============================================================================

type TransitionProbability = Record<MoveToken, number>;
type TransitionMatrix = Record<MoveToken, TransitionProbability>;

/**
 * Base Markov transition probabilities
 * These are modified by current Laban effort and phrase position
 */
const BASE_TRANSITIONS: TransitionMatrix = {
  HOLD: {
    HOLD: 0.1, STEP_L: 0.15, STEP_R: 0.15, CENTER: 0.1,
    BOUNCE: 0.15, POP: 0.1, FLOW: 0.1, FREEZE: 0.05,
    BREAK: 0.02, RISE: 0.05, DROP: 0.03, ZOOM: 0.02, VOGUE: 0.02
  },
  STEP_L: {
    HOLD: 0.1, STEP_L: 0.05, STEP_R: 0.25, CENTER: 0.2,
    BOUNCE: 0.1, POP: 0.08, FLOW: 0.1, FREEZE: 0.05,
    BREAK: 0.02, RISE: 0.03, DROP: 0.02, ZOOM: 0.01, VOGUE: 0.02
  },
  STEP_R: {
    HOLD: 0.1, STEP_L: 0.25, STEP_R: 0.05, CENTER: 0.2,
    BOUNCE: 0.1, POP: 0.08, FLOW: 0.1, FREEZE: 0.05,
    BREAK: 0.02, RISE: 0.03, DROP: 0.02, ZOOM: 0.01, VOGUE: 0.02
  },
  CENTER: {
    HOLD: 0.15, STEP_L: 0.2, STEP_R: 0.2, CENTER: 0.05,
    BOUNCE: 0.1, POP: 0.1, FLOW: 0.1, FREEZE: 0.03,
    BREAK: 0.02, RISE: 0.03, DROP: 0.02, ZOOM: 0.02, VOGUE: 0.02
  },
  BOUNCE: {
    HOLD: 0.1, STEP_L: 0.15, STEP_R: 0.15, CENTER: 0.1,
    BOUNCE: 0.2, POP: 0.08, FLOW: 0.08, FREEZE: 0.02,
    BREAK: 0.04, RISE: 0.04, DROP: 0.02, ZOOM: 0.02, VOGUE: 0.02
  },
  POP: {
    HOLD: 0.15, STEP_L: 0.12, STEP_R: 0.12, CENTER: 0.15,
    BOUNCE: 0.1, POP: 0.1, FLOW: 0.1, FREEZE: 0.08,
    BREAK: 0.03, RISE: 0.02, DROP: 0.03, ZOOM: 0.02, VOGUE: 0.02
  },
  FLOW: {
    HOLD: 0.1, STEP_L: 0.15, STEP_R: 0.15, CENTER: 0.1,
    BOUNCE: 0.1, POP: 0.05, FLOW: 0.2, FREEZE: 0.03,
    BREAK: 0.02, RISE: 0.05, DROP: 0.03, ZOOM: 0.02, VOGUE: 0.03
  },
  FREEZE: {
    HOLD: 0.2, STEP_L: 0.1, STEP_R: 0.1, CENTER: 0.1,
    BOUNCE: 0.08, POP: 0.15, FLOW: 0.1, FREEZE: 0.05,
    BREAK: 0.05, RISE: 0.03, DROP: 0.02, ZOOM: 0.02, VOGUE: 0.03
  },
  BREAK: {
    HOLD: 0.05, STEP_L: 0.15, STEP_R: 0.15, CENTER: 0.1,
    BOUNCE: 0.1, POP: 0.15, FLOW: 0.05, FREEZE: 0.05,
    BREAK: 0.1, RISE: 0.05, DROP: 0.03, ZOOM: 0.02, VOGUE: 0.02
  },
  RISE: {
    HOLD: 0.05, STEP_L: 0.1, STEP_R: 0.1, CENTER: 0.1,
    BOUNCE: 0.15, POP: 0.15, FLOW: 0.1, FREEZE: 0.05,
    BREAK: 0.05, RISE: 0.1, DROP: 0.02, ZOOM: 0.03, VOGUE: 0.03
  },
  DROP: {
    HOLD: 0.15, STEP_L: 0.1, STEP_R: 0.1, CENTER: 0.15,
    BOUNCE: 0.05, POP: 0.1, FLOW: 0.15, FREEZE: 0.08,
    BREAK: 0.02, RISE: 0.05, DROP: 0.03, ZOOM: 0.02, VOGUE: 0.03
  },
  ZOOM: {
    HOLD: 0.15, STEP_L: 0.08, STEP_R: 0.08, CENTER: 0.15,
    BOUNCE: 0.08, POP: 0.1, FLOW: 0.15, FREEZE: 0.1,
    BREAK: 0.02, RISE: 0.03, DROP: 0.03, ZOOM: 0.03, VOGUE: 0.03
  },
  VOGUE: {
    HOLD: 0.1, STEP_L: 0.1, STEP_R: 0.1, CENTER: 0.1,
    BOUNCE: 0.05, POP: 0.1, FLOW: 0.15, FREEZE: 0.15,
    BREAK: 0.02, RISE: 0.03, DROP: 0.03, ZOOM: 0.05, VOGUE: 0.05
  }
};

// =============================================================================
// EFFORT-BASED MODIFIERS
// =============================================================================

/**
 * Modify transition probabilities based on Laban effort
 */
function getEffortModifiers(effort: LabanEffort): Partial<TransitionProbability> {
  switch (effort) {
    case 'PUNCH':
      return { POP: 2.0, BREAK: 1.5, BOUNCE: 1.5, FLOW: 0.3 };
    case 'SLASH':
      return { STEP_L: 1.5, STEP_R: 1.5, POP: 1.3, FLOW: 0.5 };
    case 'DAB':
      return { POP: 1.8, FREEZE: 1.5, CENTER: 1.3 };
    case 'FLICK':
      return { BOUNCE: 1.5, STEP_L: 1.3, STEP_R: 1.3 };
    case 'PRESS':
      return { ZOOM: 2.0, HOLD: 1.5, FREEZE: 1.3, POP: 0.3 };
    case 'WRING':
      return { FLOW: 1.8, VOGUE: 1.5, BOUNCE: 0.5 };
    case 'GLIDE':
      return { FLOW: 2.0, STEP_L: 1.3, STEP_R: 1.3, POP: 0.2 };
    case 'FLOAT':
      return { FLOW: 2.0, HOLD: 1.5, VOGUE: 1.5, POP: 0.1, BREAK: 0.1 };
  }
}

/**
 * Modify transition probabilities based on phrase section
 */
function getPhraseModifiers(section: PhraseSection): Partial<TransitionProbability> {
  switch (section) {
    case 'INTRO':
      return { HOLD: 1.5, FLOW: 1.3, RISE: 1.5, POP: 0.5 };
    case 'VERSE_A':
      return { STEP_L: 1.3, STEP_R: 1.3, BOUNCE: 1.2, CENTER: 1.2 };
    case 'VERSE_B':
      return { STEP_L: 1.2, STEP_R: 1.2, POP: 1.2, VOGUE: 1.3 };
    case 'CHORUS':
      return { POP: 1.5, BOUNCE: 1.5, RISE: 1.3, BREAK: 1.2 };
    case 'DROP':
      return { POP: 2.0, BREAK: 2.0, ZOOM: 1.5, FREEZE: 0.3 };
  }
}

// =============================================================================
// MOTION GRAMMAR CLASS
// =============================================================================

export class MotionGrammar {
  private currentMove: MoveToken = 'CENTER';
  private moveHistory: MoveToken[] = [];
  private historySize: number = 8;

  // Repetition penalty to avoid stuck patterns
  private repetitionPenalty: number = 0.5;

  /**
   * Generate next move based on current state
   */
  generateNextMove(
    effort: LabanEffort,
    phraseSection: PhraseSection,
    beatInPhrase: number,
    isDownbeat: boolean
  ): MoveDescriptor {
    // Get base probabilities for current move
    const baseProbs = { ...BASE_TRANSITIONS[this.currentMove] };

    // Apply effort modifiers
    const effortMods = getEffortModifiers(effort);
    for (const [token, mod] of Object.entries(effortMods)) {
      if (baseProbs[token as MoveToken] !== undefined) {
        baseProbs[token as MoveToken] *= mod;
      }
    }

    // Apply phrase modifiers
    const phraseMods = getPhraseModifiers(phraseSection);
    for (const [token, mod] of Object.entries(phraseMods)) {
      if (baseProbs[token as MoveToken] !== undefined) {
        baseProbs[token as MoveToken] *= mod;
      }
    }

    // Apply repetition penalty
    const recentMoves = this.moveHistory.slice(-3);
    for (const recentMove of recentMoves) {
      if (baseProbs[recentMove] !== undefined) {
        baseProbs[recentMove] *= this.repetitionPenalty;
      }
    }

    // Normalize probabilities
    const total = Object.values(baseProbs).reduce((a, b) => a + b, 0);
    for (const token of Object.keys(baseProbs) as MoveToken[]) {
      baseProbs[token] /= total;
    }

    // Sample next move
    const nextMove = this.sampleMove(baseProbs);

    // Update history
    this.moveHistory.push(nextMove);
    if (this.moveHistory.length > this.historySize) {
      this.moveHistory.shift();
    }
    this.currentMove = nextMove;

    // Convert token to full descriptor
    return this.tokenToDescriptor(nextMove, effort, isDownbeat, beatInPhrase);
  }

  /**
   * Sample a move from probability distribution
   */
  private sampleMove(probs: TransitionProbability): MoveToken {
    const rand = Math.random();
    let cumulative = 0;

    for (const [token, prob] of Object.entries(probs)) {
      cumulative += prob;
      if (rand < cumulative) {
        return token as MoveToken;
      }
    }

    return 'CENTER'; // Fallback
  }

  /**
   * Convert move token to full descriptor
   */
  private tokenToDescriptor(
    token: MoveToken,
    effort: LabanEffort,
    isDownbeat: boolean,
    beatInPhrase: number
  ): MoveDescriptor {
    let direction: MoveDirection = 'center';
    let energy: EnergyLevel = 'mid';
    let transitionMode: TransitionMode = effortToTransitionMode(effort);
    let holdBeats = 1;
    let physicsBoost = 0;

    switch (token) {
      case 'HOLD':
        direction = 'center';
        energy = 'low';
        transitionMode = 'SMOOTH';
        holdBeats = 2;
        break;

      case 'STEP_L':
        direction = 'left';
        energy = 'mid';
        transitionMode = 'SLIDE';
        break;

      case 'STEP_R':
        direction = 'right';
        energy = 'mid';
        transitionMode = 'SLIDE';
        break;

      case 'CENTER':
        direction = 'center';
        energy = 'mid';
        break;

      case 'BOUNCE':
        direction = 'center';
        energy = 'mid';
        physicsBoost = 0.5;
        break;

      case 'POP':
        direction = ['left', 'center', 'right'][Math.floor(Math.random() * 3)] as MoveDirection;
        energy = 'high';
        transitionMode = 'CUT';
        physicsBoost = 0.8;
        break;

      case 'FLOW':
        direction = 'center';
        energy = 'mid';
        transitionMode = 'SMOOTH';
        holdBeats = 2;
        break;

      case 'FREEZE':
        energy = 'high';
        transitionMode = 'CUT';
        holdBeats = 3;
        break;

      case 'BREAK':
        direction = ['left', 'right'][Math.floor(Math.random() * 2)] as MoveDirection;
        energy = 'high';
        transitionMode = 'CUT';
        physicsBoost = 1.0;
        break;

      case 'RISE':
        energy = 'high';
        transitionMode = 'MORPH';
        break;

      case 'DROP':
        energy = 'low';
        transitionMode = 'SMOOTH';
        holdBeats = 2;
        break;

      case 'ZOOM':
        transitionMode = 'ZOOM_IN';
        energy = 'high';
        holdBeats = 2;
        break;

      case 'VOGUE':
        energy = 'high';
        transitionMode = 'MORPH';
        holdBeats = 4;
        break;
    }

    // Downbeat emphasis
    if (isDownbeat) {
      physicsBoost = Math.min(1, physicsBoost + 0.3);
      if (transitionMode === 'SMOOTH') {
        transitionMode = 'CUT';
      }
    }

    return {
      token,
      direction,
      energy,
      transitionMode,
      holdBeats,
      physicsBoost
    };
  }

  /**
   * Reset grammar state
   */
  reset(): void {
    this.currentMove = 'CENTER';
    this.moveHistory = [];
  }

  /**
   * Get current move for inspection
   */
  getCurrentMove(): MoveToken {
    return this.currentMove;
  }

  /**
   * Get move history for inspection
   */
  getHistory(): MoveToken[] {
    return [...this.moveHistory];
  }
}

// =============================================================================
// CHOREOGRAPHY SEQUENCER
// =============================================================================

/**
 * High-level choreography sequencer that combines
 * Motion Grammar with audio analysis
 */
export class ChoreographySequencer {
  private grammar: MotionGrammar;
  private currentSequence: MoveDescriptor[] = [];
  private sequencePosition: number = 0;
  private lastMoveTime: number = 0;
  private beatDuration: number = 500; // ms per beat (120 BPM default)

  constructor() {
    this.grammar = new MotionGrammar();
  }

  /**
   * Update beat duration based on BPM
   */
  setBPM(bpm: number): void {
    this.beatDuration = 60000 / bpm;
  }

  /**
   * Get next choreography move
   */
  getNextMove(
    effort: LabanEffort,
    phraseSection: PhraseSection,
    beatInPhrase: number,
    isDownbeat: boolean,
    currentTime: number
  ): MoveDescriptor | null {
    // Check if we should advance to next move
    const currentMove = this.currentSequence[this.sequencePosition];
    const moveDuration = currentMove
      ? currentMove.holdBeats * this.beatDuration
      : 0;

    if (!currentMove || (currentTime - this.lastMoveTime) >= moveDuration) {
      // Generate next move
      const nextMove = this.grammar.generateNextMove(
        effort,
        phraseSection,
        beatInPhrase,
        isDownbeat
      );

      this.currentSequence.push(nextMove);
      if (this.currentSequence.length > 32) {
        this.currentSequence.shift();
      }
      this.sequencePosition = this.currentSequence.length - 1;
      this.lastMoveTime = currentTime;

      return nextMove;
    }

    return null; // No new move yet
  }

  /**
   * Force a specific move (for manual triggers)
   */
  forceMove(move: MoveDescriptor, currentTime: number): void {
    this.currentSequence.push(move);
    this.sequencePosition = this.currentSequence.length - 1;
    this.lastMoveTime = currentTime;
  }

  /**
   * Get current active move
   */
  getCurrentMove(): MoveDescriptor | null {
    return this.currentSequence[this.sequencePosition] || null;
  }

  /**
   * Reset sequencer
   */
  reset(): void {
    this.grammar.reset();
    this.currentSequence = [];
    this.sequencePosition = 0;
    this.lastMoveTime = 0;
  }
}
