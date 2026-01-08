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

export interface Step4Services {
  audioEngine: { loadSource: (source: AudioSource) => void };
  exportService: { requestExport: (request: ExportRequest) => void };
  engineAdapter: { applyInput: (vector: { x: number; y: number }, mode: EngineMode) => void };
}

export class Step4Coordinator {
  private services: Step4Services;
  state: Step4State = {
    isPlaying: false,
    engineMode: 'pattern'
  };

  constructor(services: Step4Services) {
    this.services = services;
  }

  setAudioSource(source: AudioSource) {
    this.state.audioSource = source;
    this.services.audioEngine.loadSource(source);
  }

  setEngineMode(mode: EngineMode) {
    this.state.engineMode = mode;
  }

  setEngineInput(vector: { x: number; y: number }) {
    this.services.engineAdapter.applyInput(vector, this.state.engineMode);
  }

  togglePlayback() {
    this.state.isPlaying = !this.state.isPlaying;
  }

  requestExport(request: ExportRequest) {
    this.services.exportService.requestExport(request);
  }
}
