export type EngineMode = 'pattern' | 'kinetic';

export interface AudioSource {
  type: 'file' | 'url' | 'mic';
  url?: string;
  label?: string;
}

export interface ExportRequest {
  format: 'mp4' | 'webm' | 'html' | 'dkg';
}

export interface Step4State {
  isPlaying: boolean;
  engineMode: EngineMode;
  audioSource?: AudioSource;
}

export class Step4Coordinator {
  state: Step4State = {
    isPlaying: false,
    engineMode: 'pattern'
  };

  setAudioSource(source: AudioSource) {
    this.state.audioSource = source;
  }

  setEngineMode(mode: EngineMode) {
    this.state.engineMode = mode;
  }

  togglePlayback() {
    this.state.isPlaying = !this.state.isPlaying;
  }

  requestExport(_request: ExportRequest) {
    // Placeholder for export orchestration.
  }
}
