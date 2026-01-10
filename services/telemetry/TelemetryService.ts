export type TelemetryPayload = Record<string, string | number | boolean | null | undefined>;

interface TelemetryEvent {
  name: string;
  timestamp: string;
  sessionId: string;
  url: string;
  userAgent: string;
  payload?: TelemetryPayload;
}

const SESSION_STORAGE_KEY = 'jusdnce_telemetry_session_id';

const getSessionId = () => {
  if (typeof window === 'undefined') return 'server';
  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const sessionId = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
};

const buildEvent = (name: string, payload?: TelemetryPayload): TelemetryEvent => ({
  name,
  timestamp: new Date().toISOString(),
  sessionId: getSessionId(),
  url: typeof window === 'undefined' ? 'unknown' : window.location.href,
  userAgent: typeof navigator === 'undefined' ? 'unknown' : navigator.userAgent,
  payload
});

const sendToEndpoint = async (endpoint: string, event: TelemetryEvent) => {
  try {
    const body = JSON.stringify(event);
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      const ok = navigator.sendBeacon(endpoint, blob);
      if (ok) return;
    }
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true
    });
  } catch (error) {
    console.debug('Telemetry endpoint error', error);
  }
};

const buildFirestoreDocument = (event: TelemetryEvent) => ({
  fields: {
    name: { stringValue: event.name },
    timestamp: { stringValue: event.timestamp },
    sessionId: { stringValue: event.sessionId },
    url: { stringValue: event.url },
    userAgent: { stringValue: event.userAgent },
    payload: { stringValue: JSON.stringify(event.payload ?? {}) }
  }
});

const sendToFirestore = async (event: TelemetryEvent) => {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) return;
  const collection = import.meta.env.VITE_FIREBASE_TELEMETRY_COLLECTION || 'telemetry_events';
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const url = new URL(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}`
  );
  if (apiKey) {
    url.searchParams.set('key', apiKey);
  }
  try {
    await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildFirestoreDocument(event)),
      keepalive: true
    });
  } catch (error) {
    console.debug('Telemetry Firestore error', error);
  }
};

const sendTelemetry = (event: TelemetryEvent) => {
  const endpoint = import.meta.env.VITE_TELEMETRY_ENDPOINT;
  if (endpoint) {
    void sendToEndpoint(endpoint, event);
    return;
  }
  if (import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    void sendToFirestore(event);
    return;
  }
  console.debug('Telemetry event', event);
};

export const TelemetryService = {
  trackEvent(name: string, payload?: TelemetryPayload) {
    sendTelemetry(buildEvent(name, payload));
  },
  trackGenerationStart(payload?: TelemetryPayload) {
    sendTelemetry(buildEvent('generation_start', payload));
  },
  trackGenerationEnd(payload?: TelemetryPayload) {
    sendTelemetry(buildEvent('generation_end', payload));
  },
  trackExportResult(payload?: TelemetryPayload) {
    sendTelemetry(buildEvent('export_result', payload));
  },
  trackAudioStreamError(payload?: TelemetryPayload) {
    sendTelemetry(buildEvent('audio_stream_error', payload));
  },
  trackError(payload?: TelemetryPayload) {
    sendTelemetry(buildEvent('ui_error', payload));
  }
};
