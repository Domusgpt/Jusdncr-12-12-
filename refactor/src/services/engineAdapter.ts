import type { EngineMode } from '../core/Step4Coordinator';

export interface EngineVector {
  x: number;
  y: number;
}

export interface EngineTelemetry {
  bpm: number;
  beat: number;
}

export interface EngineState {
  mode: EngineMode;
  vector: EngineVector;
}

export class EngineAdapter {
  private state: EngineState = {
    mode: 'pattern',
    vector: { x: 0, y: 0 }
  };

  applyInput(vector: EngineVector, mode: EngineMode) {
    this.state = { mode, vector };
    return this.state;
  }

  getTelemetry(): EngineTelemetry {
    return { bpm: 120, beat: 0 };
  }
}
