/**
 * KINETIC CORE ARCHITECTURE
 *
 * The "Kinetic Core" represents a synthesis of three architectural philosophies:
 * - CVS (Camera Video Sprites): Environmental reactivity - shader-dominant world
 * - DFF (Double Frame Fluid): Stochastic rhythm gating - probabilistic blending
 * - MJ (Matrix Jaudnce): Structural rigidity - hard cuts & grid enforcement
 *
 * This engine combines:
 * 1. Rigid Grid from MJ (consistency via mechanical structure)
 * 2. Fluid Transitions from DFF (variety via state graph)
 * 3. Shader Environment from CVS (immersion via WebGL coupling)
 * 4. Predictive Audio Analysis (anticipation via lookahead buffer)
 */

import { GeneratedFrame, EnergyLevel, MoveDirection, FrameType } from '../types';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type KineticNodeId = string;
export type TransitionMode = 'CUT' | 'SLIDE' | 'MORPH' | 'SMOOTH' | 'ZOOM_IN';
export type MechanicalFX = 'none' | 'zoom' | 'mirror' | 'stutter' | 'mandala';
export type RhythmPhase = 'AMBIENT' | 'WARMUP' | 'SWING_LEFT' | 'SWING_RIGHT' | 'DROP' | 'CHAOS' | 'GROOVE' | 'VOGUE' | 'FLOW';

export interface KineticNode {
  id: KineticNodeId;
  frames: GeneratedFrame[];
  possibleTransitions: KineticNodeId[];
  energyRequirement: number; // 0.0 - 1.0 needed to enter this node
  exitThreshold: number;     // Energy level to exit this node
  mechanicalFx: MechanicalFX;
  transitionMode: TransitionMode;
  minDuration: number;       // Minimum ms to stay in this node (anti-jitter)
  direction: MoveDirection;
}

export interface AudioData {
  bass: number;
  mid: number;
  high: number;
  energy: number;
}

export interface LookaheadResult {
  predictedEnergy: number;
  predictedBass: number;
  predictedMid: number;
  predictedHigh: number;
  impactIn: number; // ms until next predicted impact
  trend: 'rising' | 'falling' | 'stable';
}

export interface KineticState {
  currentNode: KineticNodeId;
  currentFrame: GeneratedFrame | null;
  phase: RhythmPhase;
  beatPosition: number;      // 0.0 - 1.0 cyclic beat position
  beatCounter: number;       // Global beat count
  lastTransitionTime: number;
  isStuttering: boolean;
  isCloseupLocked: boolean;
  closeupLockUntil: number;
}

export interface MechanicalFrame {
  url: string;
  pose: string;
  energy: EnergyLevel;
  direction: MoveDirection;
  type: FrameType;
  isVirtual: boolean;
  virtualZoom?: number;
  virtualOffsetY?: number;
  mechanicalFx: MechanicalFX;
}

// =============================================================================
// KINETIC GRAPH (DAG for State Transitions)
// =============================================================================

export class KineticGraph {
  private nodes: Map<KineticNodeId, KineticNode> = new Map();
  private adjacencyList: Map<KineticNodeId, Set<KineticNodeId>> = new Map();

  constructor() {
    this.initializeDefaultGraph();
  }

  private initializeDefaultGraph(): void {
    // Define the core movement nodes
    const defaultNodes: KineticNode[] = [
      {
        id: 'idle',
        frames: [],
        possibleTransitions: ['lean_left', 'lean_right', 'groove', 'warmup'],
        energyRequirement: 0.0,
        exitThreshold: 0.3,
        mechanicalFx: 'none',
        transitionMode: 'SMOOTH',
        minDuration: 500,
        direction: 'center'
      },
      {
        id: 'warmup',
        frames: [],
        possibleTransitions: ['idle', 'groove', 'lean_left'],
        energyRequirement: 0.2,
        exitThreshold: 0.5,
        mechanicalFx: 'none',
        transitionMode: 'SLIDE',
        minDuration: 300,
        direction: 'center'
      },
      {
        id: 'lean_left',
        frames: [],
        possibleTransitions: ['idle', 'lean_right', 'crouch', 'groove'],
        energyRequirement: 0.3,
        exitThreshold: 0.4,
        mechanicalFx: 'none',
        transitionMode: 'SLIDE',
        minDuration: 200,
        direction: 'left'
      },
      {
        id: 'lean_right',
        frames: [],
        possibleTransitions: ['idle', 'lean_left', 'crouch', 'groove'],
        energyRequirement: 0.3,
        exitThreshold: 0.4,
        mechanicalFx: 'mirror',
        transitionMode: 'SLIDE',
        minDuration: 200,
        direction: 'right'
      },
      {
        id: 'groove',
        frames: [],
        possibleTransitions: ['lean_left', 'lean_right', 'drop', 'vogue'],
        energyRequirement: 0.4,
        exitThreshold: 0.6,
        mechanicalFx: 'none',
        transitionMode: 'CUT',
        minDuration: 150,
        direction: 'center'
      },
      {
        id: 'crouch',
        frames: [],
        possibleTransitions: ['idle', 'groove', 'jump'],
        energyRequirement: 0.3,
        exitThreshold: 0.5,
        mechanicalFx: 'zoom',
        transitionMode: 'ZOOM_IN',
        minDuration: 300,
        direction: 'center'
      },
      {
        id: 'jump',
        frames: [],
        possibleTransitions: ['idle', 'groove', 'drop'],
        energyRequirement: 0.6,
        exitThreshold: 0.4,
        mechanicalFx: 'none',
        transitionMode: 'CUT',
        minDuration: 100,
        direction: 'center'
      },
      {
        id: 'drop',
        frames: [],
        possibleTransitions: ['groove', 'chaos', 'vogue'],
        energyRequirement: 0.7,
        exitThreshold: 0.5,
        mechanicalFx: 'zoom',
        transitionMode: 'CUT',
        minDuration: 100,
        direction: 'center'
      },
      {
        id: 'vogue',
        frames: [],
        possibleTransitions: ['groove', 'drop', 'closeup'],
        energyRequirement: 0.5,
        exitThreshold: 0.4,
        mechanicalFx: 'none',
        transitionMode: 'MORPH',
        minDuration: 400,
        direction: 'center'
      },
      {
        id: 'closeup',
        frames: [],
        possibleTransitions: ['vogue', 'groove'],
        energyRequirement: 0.4,
        exitThreshold: 0.3,
        mechanicalFx: 'zoom',
        transitionMode: 'ZOOM_IN',
        minDuration: 2000, // Lock closeups longer
        direction: 'center'
      },
      {
        id: 'chaos',
        frames: [],
        possibleTransitions: ['groove', 'drop', 'lean_left', 'lean_right'],
        energyRequirement: 0.8,
        exitThreshold: 0.6,
        mechanicalFx: 'stutter',
        transitionMode: 'CUT',
        minDuration: 50,
        direction: 'center'
      }
    ];

    // Build the graph
    for (const node of defaultNodes) {
      this.addNode(node);
    }
  }

  addNode(node: KineticNode): void {
    this.nodes.set(node.id, node);
    this.adjacencyList.set(node.id, new Set(node.possibleTransitions));
  }

  getNode(id: KineticNodeId): KineticNode | undefined {
    return this.nodes.get(id);
  }

  canTransition(from: KineticNodeId, to: KineticNodeId): boolean {
    const adjacencies = this.adjacencyList.get(from);
    return adjacencies ? adjacencies.has(to) : false;
  }

  getValidTransitions(from: KineticNodeId, energy: number): KineticNodeId[] {
    const adjacencies = this.adjacencyList.get(from);
    if (!adjacencies) return [];

    return Array.from(adjacencies).filter(nodeId => {
      const node = this.nodes.get(nodeId);
      return node && energy >= node.energyRequirement;
    });
  }

  getAllNodes(): KineticNode[] {
    return Array.from(this.nodes.values());
  }

  assignFramesToNodes(frames: GeneratedFrame[]): void {
    // Clear existing frames
    for (const node of this.nodes.values()) {
      node.frames = [];
    }

    // Assign frames based on energy and direction
    for (const frame of frames) {
      let targetNodeIds: KineticNodeId[] = [];

      // Map frame properties to node IDs
      if (frame.type === 'closeup') {
        targetNodeIds = ['closeup', 'vogue'];
      } else if (frame.energy === 'high') {
        if (frame.direction === 'left') {
          targetNodeIds = ['lean_left', 'chaos'];
        } else if (frame.direction === 'right') {
          targetNodeIds = ['lean_right', 'chaos'];
        } else {
          targetNodeIds = ['drop', 'jump', 'chaos', 'groove'];
        }
      } else if (frame.energy === 'mid') {
        if (frame.direction === 'left') {
          targetNodeIds = ['lean_left', 'groove'];
        } else if (frame.direction === 'right') {
          targetNodeIds = ['lean_right', 'groove'];
        } else {
          targetNodeIds = ['groove', 'warmup', 'vogue'];
        }
      } else { // low energy
        targetNodeIds = ['idle', 'warmup', 'crouch'];
      }

      // Add frame to all matching nodes
      for (const nodeId of targetNodeIds) {
        const node = this.nodes.get(nodeId);
        if (node) {
          node.frames.push(frame);
        }
      }
    }

    // Ensure all nodes have at least one frame (fallback)
    const allFrames = frames.filter(f => f.type === 'body');
    for (const node of this.nodes.values()) {
      if (node.frames.length === 0 && allFrames.length > 0) {
        node.frames.push(allFrames[0]);
      }
    }
  }
}

// =============================================================================
// LOOKAHEAD AUDIO BUFFER
// =============================================================================

export class AudioLookaheadBuffer {
  private buffer: AudioData[] = [];
  private bufferSize: number;
  private sampleRate: number; // How many samples per second
  private lookaheadMs: number;

  constructor(lookaheadMs: number = 200, sampleRateHz: number = 60) {
    this.lookaheadMs = lookaheadMs;
    this.sampleRate = sampleRateHz;
    this.bufferSize = Math.ceil((lookaheadMs / 1000) * sampleRateHz);
    this.buffer = [];
  }

  push(data: AudioData): void {
    this.buffer.push({ ...data });
    if (this.buffer.length > this.bufferSize * 2) {
      this.buffer.shift();
    }
  }

  /**
   * Analyze future energy based on current trajectory
   * Uses linear regression on recent samples to predict ahead
   */
  analyzeFuture(lookaheadMs: number = this.lookaheadMs): LookaheadResult {
    if (this.buffer.length < 5) {
      return {
        predictedEnergy: 0,
        predictedBass: 0,
        predictedMid: 0,
        predictedHigh: 0,
        impactIn: -1,
        trend: 'stable'
      };
    }

    // Get recent samples for trend analysis
    const recentCount = Math.min(10, this.buffer.length);
    const recent = this.buffer.slice(-recentCount);

    // Calculate average and trend
    const avgEnergy = recent.reduce((a, b) => a + b.energy, 0) / recent.length;
    const avgBass = recent.reduce((a, b) => a + b.bass, 0) / recent.length;
    const avgMid = recent.reduce((a, b) => a + b.mid, 0) / recent.length;
    const avgHigh = recent.reduce((a, b) => a + b.high, 0) / recent.length;

    // Simple linear regression for energy trend
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < recent.length; i++) {
      sumX += i;
      sumY += recent[i].energy;
      sumXY += i * recent[i].energy;
      sumX2 += i * i;
    }
    const n = recent.length;
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Predict future values
    const samplesAhead = (lookaheadMs / 1000) * this.sampleRate;
    const predictedEnergy = Math.max(0, Math.min(1, avgEnergy + slope * samplesAhead));
    const predictedBass = Math.max(0, Math.min(1, avgBass + slope * samplesAhead * 0.8));
    const predictedMid = Math.max(0, Math.min(1, avgMid + slope * samplesAhead * 0.6));
    const predictedHigh = Math.max(0, Math.min(1, avgHigh + slope * samplesAhead * 0.4));

    // Determine trend
    let trend: 'rising' | 'falling' | 'stable' = 'stable';
    if (slope > 0.01) trend = 'rising';
    else if (slope < -0.01) trend = 'falling';

    // Estimate time to next impact (bass spike)
    let impactIn = -1;
    if (trend === 'rising' && predictedBass > 0.6) {
      impactIn = lookaheadMs * (0.6 - avgBass) / (predictedBass - avgBass);
    }

    return {
      predictedEnergy,
      predictedBass,
      predictedMid,
      predictedHigh,
      impactIn,
      trend
    };
  }

  getHistory(count: number = 30): AudioData[] {
    return this.buffer.slice(-count);
  }

  getAverageEnergy(windowMs: number = 500): number {
    const windowSamples = Math.ceil((windowMs / 1000) * this.sampleRate);
    const window = this.buffer.slice(-windowSamples);
    if (window.length === 0) return 0;
    return window.reduce((a, b) => a + b.energy, 0) / window.length;
  }
}

// =============================================================================
// MECHANICAL MULTIPLIER
// =============================================================================

export class MechanicalMultiplier {
  /**
   * Create a mirrored version of a frame (horizontal flip)
   * Doubles the frame pool for zero API cost
   */
  static async mirror(frame: GeneratedFrame): Promise<MechanicalFrame> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0);

          let mirroredDirection: MoveDirection = frame.direction || 'center';
          if (mirroredDirection === 'left') mirroredDirection = 'right';
          else if (mirroredDirection === 'right') mirroredDirection = 'left';

          resolve({
            url: canvas.toDataURL('image/jpeg', 0.85),
            pose: frame.pose + '_mirror',
            energy: frame.energy,
            direction: mirroredDirection,
            type: frame.type || 'body',
            isVirtual: true,
            mechanicalFx: 'mirror'
          });
        } else {
          resolve({
            url: frame.url,
            pose: frame.pose + '_mirror_fail',
            energy: frame.energy,
            direction: frame.direction || 'center',
            type: frame.type || 'body',
            isVirtual: false,
            mechanicalFx: 'none'
          });
        }
      };
      img.onerror = () => resolve({
        url: frame.url,
        pose: frame.pose,
        energy: frame.energy,
        direction: frame.direction || 'center',
        type: frame.type || 'body',
        isVirtual: false,
        mechanicalFx: 'none'
      });
      img.src = frame.url;
    });
  }

  /**
   * Create a dolly zoom (virtual camera crop)
   * Simulates camera pushing in without AI regeneration
   */
  static async dollyZoom(frame: GeneratedFrame, zoomFactor: number = 1.4): Promise<MechanicalFrame> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          const cropW = img.width / zoomFactor;
          const cropH = img.height / zoomFactor;
          const cropX = (img.width - cropW) / 2;
          const cropY = (img.height - cropH) / 2;

          ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

          resolve({
            url: canvas.toDataURL('image/jpeg', 0.85),
            pose: frame.pose + `_zoom${Math.round(zoomFactor * 100)}`,
            energy: 'high',
            direction: frame.direction || 'center',
            type: 'closeup',
            isVirtual: true,
            virtualZoom: zoomFactor,
            virtualOffsetY: 0.1,
            mechanicalFx: 'zoom'
          });
        } else {
          resolve({
            url: frame.url,
            pose: frame.pose,
            energy: frame.energy,
            direction: frame.direction || 'center',
            type: frame.type || 'body',
            isVirtual: false,
            mechanicalFx: 'none'
          });
        }
      };
      img.onerror = () => resolve({
        url: frame.url,
        pose: frame.pose,
        energy: frame.energy,
        direction: frame.direction || 'center',
        type: frame.type || 'body',
        isVirtual: false,
        mechanicalFx: 'none'
      });
      img.src = frame.url;
    });
  }

  /**
   * Create a virtual frame with metadata for stutter effect
   * The actual stutter is handled by the render loop
   */
  static createStutterMetadata(frame: GeneratedFrame, stutterIntensity: number = 0.5): MechanicalFrame {
    return {
      url: frame.url,
      pose: frame.pose + '_stutter',
      energy: frame.energy,
      direction: frame.direction || 'center',
      type: frame.type || 'body',
      isVirtual: true,
      mechanicalFx: 'stutter'
    };
  }

  /**
   * Expand a frame pool with mechanical multiplications
   * Input: N frames -> Output: N * multiplier frames
   */
  static async expandFramePool(
    frames: GeneratedFrame[],
    options: {
      enableMirror?: boolean;
      enableZoom?: boolean;
      zoomFactors?: number[];
    } = {}
  ): Promise<MechanicalFrame[]> {
    const {
      enableMirror = true,
      enableZoom = true,
      zoomFactors = [1.25, 1.6]
    } = options;

    const expanded: MechanicalFrame[] = [];

    for (const frame of frames) {
      // Add original frame
      expanded.push({
        url: frame.url,
        pose: frame.pose,
        energy: frame.energy,
        direction: frame.direction || 'center',
        type: frame.type || 'body',
        isVirtual: false,
        mechanicalFx: 'none'
      });

      // Add mirrored version (for non-closeup, non-centered frames)
      if (enableMirror && frame.type !== 'closeup') {
        const mirrored = await this.mirror(frame);
        expanded.push(mirrored);
      }

      // Add zoom variants for high-energy body frames
      if (enableZoom && frame.energy === 'high' && frame.type === 'body') {
        for (const zoom of zoomFactors) {
          const zoomed = await this.dollyZoom(frame, zoom);
          expanded.push(zoomed);
        }
      }
    }

    return expanded;
  }
}

// =============================================================================
// KINETIC ENGINE (Main Orchestrator)
// =============================================================================

export class KineticEngine {
  private graph: KineticGraph;
  private lookaheadBuffer: AudioLookaheadBuffer;
  private state: KineticState;
  private bpm: number = 120;
  private beatDuration: number; // ms per beat
  private lastUpdateTime: number = 0;

  constructor() {
    this.graph = new KineticGraph();
    this.lookaheadBuffer = new AudioLookaheadBuffer(200, 60);
    this.beatDuration = (60 / this.bpm) * 1000;

    this.state = {
      currentNode: 'idle',
      currentFrame: null,
      phase: 'AMBIENT',
      beatPosition: 0,
      beatCounter: 0,
      lastTransitionTime: 0,
      isStuttering: false,
      isCloseupLocked: false,
      closeupLockUntil: 0
    };
  }

  /**
   * Initialize the engine with generated frames
   */
  initialize(frames: GeneratedFrame[]): void {
    this.graph.assignFramesToNodes(frames);

    // Select initial frame
    const idleNode = this.graph.getNode('idle');
    if (idleNode && idleNode.frames.length > 0) {
      this.state.currentFrame = idleNode.frames[0];
    }
  }

  /**
   * Set BPM for beat synchronization
   */
  setBPM(bpm: number): void {
    this.bpm = Math.max(60, Math.min(200, bpm));
    this.beatDuration = (60 / this.bpm) * 1000;
  }

  /**
   * Main update loop - call this every frame
   */
  update(now: number, audioData: AudioData): {
    frame: GeneratedFrame | null;
    transitionMode: TransitionMode;
    shouldTransition: boolean;
    mechanicalFx: MechanicalFX;
    phase: RhythmPhase;
    lookahead: LookaheadResult;
  } {
    const deltaTime = now - this.lastUpdateTime;
    this.lastUpdateTime = now;

    // Push audio data to lookahead buffer
    this.lookaheadBuffer.push(audioData);

    // Analyze future
    const lookahead = this.lookaheadBuffer.analyzeFuture(200);

    // Update beat position (cyclic 0-1)
    this.state.beatPosition = (now % this.beatDuration) / this.beatDuration;

    // Check closeup lock
    this.state.isCloseupLocked = now < this.state.closeupLockUntil;

    // Determine phase based on audio and beat
    this.state.phase = this.determinePhase(audioData, lookahead);

    // Check if we should transition
    let shouldTransition = false;
    let targetNode: KineticNode | null = null;
    let transitionMode: TransitionMode = 'CUT';

    const currentNode = this.graph.getNode(this.state.currentNode);
    if (!currentNode) {
      return {
        frame: this.state.currentFrame,
        transitionMode: 'CUT',
        shouldTransition: false,
        mechanicalFx: 'none',
        phase: this.state.phase,
        lookahead
      };
    }

    // Check minimum duration (anti-jitter)
    const timeSinceTransition = now - this.state.lastTransitionTime;
    const canTransition = timeSinceTransition >= currentNode.minDuration;

    if (canTransition && !this.state.isCloseupLocked) {
      // Get valid transitions based on energy
      const validTransitions = this.graph.getValidTransitions(
        this.state.currentNode,
        audioData.energy
      );

      if (validTransitions.length > 0) {
        // Determine best transition based on phase
        const bestNodeId = this.selectBestTransition(
          validTransitions,
          audioData,
          lookahead
        );

        if (bestNodeId && bestNodeId !== this.state.currentNode) {
          targetNode = this.graph.getNode(bestNodeId);
          if (targetNode) {
            shouldTransition = true;
            transitionMode = this.determineTransitionMode(
              currentNode,
              targetNode,
              audioData,
              lookahead
            );
          }
        }
      }
    }

    // Execute transition if needed
    if (shouldTransition && targetNode) {
      this.state.currentNode = targetNode.id;
      this.state.lastTransitionTime = now;

      // Select frame from target node
      if (targetNode.frames.length > 0) {
        const frameIndex = Math.floor(Math.random() * targetNode.frames.length);
        this.state.currentFrame = targetNode.frames[frameIndex];
      }

      // Handle closeup lock
      if (targetNode.id === 'closeup') {
        this.state.closeupLockUntil = now + targetNode.minDuration;
        this.state.isCloseupLocked = true;
      }
    }

    // Handle stutter mode
    this.state.isStuttering = this.shouldStutter(audioData, currentNode);

    return {
      frame: this.state.currentFrame,
      transitionMode: shouldTransition ? transitionMode : 'CUT',
      shouldTransition,
      mechanicalFx: currentNode.mechanicalFx,
      phase: this.state.phase,
      lookahead
    };
  }

  /**
   * Determine current rhythm phase based on audio analysis
   */
  private determinePhase(audioData: AudioData, lookahead: LookaheadResult): RhythmPhase {
    const { bass, mid, high, energy } = audioData;
    const beatCounter = this.state.beatCounter % 16;

    // Update beat counter on bass hits
    if (bass > 0.6 && this.state.beatPosition < 0.1) {
      this.state.beatCounter++;
    }

    // Phase logic based on audio characteristics
    if (energy < 0.2) return 'AMBIENT';
    if (bass > 0.8 && energy > 0.7) return 'DROP';
    if (high > 0.7 && mid > 0.5) return 'CHAOS';
    if (high > 0.6 && bass < 0.4) return 'VOGUE';
    if (mid > 0.5 && bass > 0.4) return 'GROOVE';

    // Beat-based phases
    if (beatCounter >= 4 && beatCounter < 8) return 'SWING_LEFT';
    if (beatCounter >= 8 && beatCounter < 12) return 'SWING_RIGHT';
    if (beatCounter >= 12 && beatCounter < 14) return 'DROP';
    if (beatCounter >= 14) return 'CHAOS';

    return 'WARMUP';
  }

  /**
   * Select the best transition based on current state and predictions
   */
  private selectBestTransition(
    validTransitions: KineticNodeId[],
    audioData: AudioData,
    lookahead: LookaheadResult
  ): KineticNodeId | null {
    if (validTransitions.length === 0) return null;

    const { bass, mid, high } = audioData;
    const phase = this.state.phase;

    // Phase-based selection weights
    let preferredNodes: KineticNodeId[] = [];

    switch (phase) {
      case 'AMBIENT':
        preferredNodes = ['idle', 'warmup'];
        break;
      case 'WARMUP':
        preferredNodes = ['groove', 'lean_left'];
        break;
      case 'SWING_LEFT':
        preferredNodes = ['lean_left', 'groove'];
        break;
      case 'SWING_RIGHT':
        preferredNodes = ['lean_right', 'groove'];
        break;
      case 'GROOVE':
        preferredNodes = ['groove', 'drop', 'vogue'];
        break;
      case 'DROP':
        preferredNodes = ['drop', 'chaos', 'jump'];
        break;
      case 'VOGUE':
        preferredNodes = ['vogue', 'closeup'];
        break;
      case 'CHAOS':
        preferredNodes = ['chaos', 'drop', 'jump'];
        break;
      default:
        preferredNodes = validTransitions;
    }

    // Find intersection of preferred and valid
    const candidates = validTransitions.filter(t => preferredNodes.includes(t));

    if (candidates.length > 0) {
      // Predictive selection: if impact coming, favor high-energy nodes
      if (lookahead.impactIn > 0 && lookahead.impactIn < 100) {
        const highEnergyNodes = candidates.filter(id => {
          const node = this.graph.getNode(id);
          return node && node.energyRequirement >= 0.6;
        });
        if (highEnergyNodes.length > 0) {
          return highEnergyNodes[Math.floor(Math.random() * highEnergyNodes.length)];
        }
      }

      return candidates[Math.floor(Math.random() * candidates.length)];
    }

    return validTransitions[Math.floor(Math.random() * validTransitions.length)];
  }

  /**
   * Determine transition mode based on context
   */
  private determineTransitionMode(
    from: KineticNode,
    to: KineticNode,
    audioData: AudioData,
    lookahead: LookaheadResult
  ): TransitionMode {
    // Default to target node's preferred mode
    let mode = to.transitionMode;

    // Override based on audio intensity
    if (audioData.bass > 0.8) {
      mode = 'CUT'; // Hard cut on strong beats
    } else if (audioData.high > 0.6 && audioData.bass < 0.4) {
      mode = 'MORPH'; // Soft morph on vocals/high frequencies
    } else if (to.id === 'closeup') {
      mode = 'ZOOM_IN'; // Always zoom into closeups
    } else if (lookahead.trend === 'falling') {
      mode = 'SMOOTH'; // Smooth transitions during falloffs
    }

    return mode;
  }

  /**
   * Determine if we should enter stutter mode
   */
  private shouldStutter(audioData: AudioData, currentNode: KineticNode): boolean {
    if (currentNode.mechanicalFx !== 'stutter') return false;

    const stutterChance = 0.35;
    return (audioData.mid > 0.6 || audioData.high > 0.6) && Math.random() < stutterChance;
  }

  /**
   * Get current state for external inspection
   */
  getState(): KineticState {
    return { ...this.state };
  }

  /**
   * Get the graph for frame assignment
   */
  getGraph(): KineticGraph {
    return this.graph;
  }

  /**
   * Get lookahead buffer for advanced analysis
   */
  getLookaheadBuffer(): AudioLookaheadBuffer {
    return this.lookaheadBuffer;
  }

  /**
   * Force transition to a specific node (for manual control)
   */
  forceTransition(nodeId: KineticNodeId): void {
    const node = this.graph.getNode(nodeId);
    if (node && node.frames.length > 0) {
      this.state.currentNode = nodeId;
      this.state.currentFrame = node.frames[Math.floor(Math.random() * node.frames.length)];
      this.state.lastTransitionTime = performance.now();
    }
  }
}

// Export singleton-style factory
export const createKineticEngine = (): KineticEngine => new KineticEngine();
