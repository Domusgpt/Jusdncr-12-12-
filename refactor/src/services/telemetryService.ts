export interface TelemetryEvent {
  type: 'export' | 'playback' | 'engine';
  payload: Record<string, unknown>;
  timestamp: string;
}

export class TelemetryService {
  private events: TelemetryEvent[] = [];

  track(event: TelemetryEvent) {
    this.events.push(event);
  }

  flush() {
    const copy = [...this.events];
    this.events = [];
    return copy;
  }
}
