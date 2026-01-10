import type { AudioSource } from '../core/Step4Coordinator';

export class AudioEngine {
  loadSource(_source: AudioSource) {
    // Placeholder for unified audio loading.
  }

  createReactivityChannel() {
    return {
      bpm: 120,
      sensitivity: 0.5
    };
  }

  getAnalyzer() {
    return null;
  }

  getStream() {
    return null;
  }
}
