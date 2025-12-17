import { describe, it, expect, beforeEach } from 'vitest';
import {
  KineticEngine,
  KineticGraph,
  AudioLookaheadBuffer,
  MechanicalMultiplier,
  createKineticEngine,
} from '../../engine/KineticEngine';
import { GeneratedFrame } from '../../types';

describe('KineticGraph', () => {
  let graph: KineticGraph;

  beforeEach(() => {
    graph = new KineticGraph();
  });

  it('should initialize with default nodes', () => {
    const nodes = graph.getAllNodes();
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes.some(n => n.id === 'idle')).toBe(true);
    expect(nodes.some(n => n.id === 'groove')).toBe(true);
    expect(nodes.some(n => n.id === 'drop')).toBe(true);
  });

  it('should validate transitions', () => {
    // idle can transition to lean_left
    expect(graph.canTransition('idle', 'lean_left')).toBe(true);

    // idle cannot directly transition to chaos
    expect(graph.canTransition('idle', 'chaos')).toBe(false);
  });

  it('should filter transitions by energy', () => {
    // Low energy should not allow high-energy transitions
    const lowEnergyTransitions = graph.getValidTransitions('idle', 0.1);
    expect(lowEnergyTransitions).not.toContain('drop');

    // High energy should allow more transitions
    const highEnergyTransitions = graph.getValidTransitions('groove', 0.8);
    expect(highEnergyTransitions.length).toBeGreaterThan(0);
  });

  it('should assign frames to nodes', () => {
    const mockFrames: GeneratedFrame[] = [
      { url: 'test1.jpg', pose: 'base_0', energy: 'low', direction: 'center', type: 'body' },
      { url: 'test2.jpg', pose: 'base_1', energy: 'high', direction: 'left', type: 'body' },
      { url: 'test3.jpg', pose: 'flourish_0', energy: 'high', direction: 'center', type: 'closeup' },
    ];

    graph.assignFramesToNodes(mockFrames);

    const idleNode = graph.getNode('idle');
    expect(idleNode?.frames.length).toBeGreaterThan(0);
  });
});

describe('AudioLookaheadBuffer', () => {
  let buffer: AudioLookaheadBuffer;

  beforeEach(() => {
    buffer = new AudioLookaheadBuffer(200, 60);
  });

  it('should store audio data', () => {
    buffer.push({ bass: 0.5, mid: 0.3, high: 0.2, energy: 0.4 });
    buffer.push({ bass: 0.6, mid: 0.4, high: 0.3, energy: 0.5 });

    const history = buffer.getHistory(2);
    expect(history.length).toBe(2);
  });

  it('should analyze future trends', () => {
    // Push increasing energy values
    for (let i = 0; i < 10; i++) {
      buffer.push({ bass: i * 0.1, mid: 0.3, high: 0.2, energy: i * 0.1 });
    }

    const result = buffer.analyzeFuture(200);
    expect(result.trend).toBe('rising');
  });

  it('should detect falling trends', () => {
    // Push decreasing energy values
    for (let i = 10; i > 0; i--) {
      buffer.push({ bass: i * 0.1, mid: 0.3, high: 0.2, energy: i * 0.1 });
    }

    const result = buffer.analyzeFuture(200);
    expect(result.trend).toBe('falling');
  });

  it('should calculate average energy', () => {
    buffer.push({ bass: 0.5, mid: 0.3, high: 0.2, energy: 0.5 });
    buffer.push({ bass: 0.5, mid: 0.3, high: 0.2, energy: 0.5 });

    const avg = buffer.getAverageEnergy(500);
    expect(avg).toBeCloseTo(0.5, 1);
  });
});

describe('KineticEngine', () => {
  let engine: KineticEngine;

  beforeEach(() => {
    engine = createKineticEngine();
  });

  it('should initialize with default state', () => {
    const state = engine.getState();
    expect(state.currentNode).toBe('idle');
    expect(state.phase).toBe('AMBIENT');
  });

  it('should initialize with frames', () => {
    const mockFrames: GeneratedFrame[] = [
      { url: 'test1.jpg', pose: 'base_0', energy: 'low', direction: 'center', type: 'body' },
      { url: 'test2.jpg', pose: 'base_1', energy: 'mid', direction: 'left', type: 'body' },
    ];

    engine.initialize(mockFrames);

    const state = engine.getState();
    expect(state.currentFrame).not.toBeNull();
  });

  it('should update with audio data', () => {
    const mockFrames: GeneratedFrame[] = [
      { url: 'test1.jpg', pose: 'base_0', energy: 'low', direction: 'center', type: 'body' },
    ];

    engine.initialize(mockFrames);

    const result = engine.update(performance.now(), {
      bass: 0.5,
      mid: 0.3,
      high: 0.2,
      energy: 0.4,
    });

    expect(result).toHaveProperty('frame');
    expect(result).toHaveProperty('phase');
    expect(result).toHaveProperty('lookahead');
  });

  it('should set BPM', () => {
    engine.setBPM(140);
    // Engine should accept the BPM without error
    expect(true).toBe(true);
  });

  it('should force transition', () => {
    const mockFrames: GeneratedFrame[] = [
      { url: 'test1.jpg', pose: 'base_0', energy: 'low', direction: 'center', type: 'body' },
      { url: 'test2.jpg', pose: 'groove_0', energy: 'mid', direction: 'center', type: 'body' },
    ];

    engine.initialize(mockFrames);
    engine.forceTransition('groove');

    const state = engine.getState();
    expect(state.currentNode).toBe('groove');
  });
});

describe('MechanicalMultiplier', () => {
  it('should create stutter metadata', () => {
    const frame: GeneratedFrame = {
      url: 'test.jpg',
      pose: 'base_0',
      energy: 'mid',
      direction: 'center',
      type: 'body',
    };

    const result = MechanicalMultiplier.createStutterMetadata(frame, 0.5);

    expect(result.pose).toBe('base_0_stutter');
    expect(result.mechanicalFx).toBe('stutter');
    expect(result.isVirtual).toBe(true);
  });
});
