# jusDNCE Complete Refactor Plan

**Date:** 2026-01-08  
**Status:** Current architecture is not production-ready  

---

## THE REAL PROBLEMS

### 1. God Files
| File | Lines | Problem |
|------|-------|---------|
| `playerExport.ts` | **2,788** | Single template literal with embedded HTML/CSS/JS |
| `Step4Preview.tsx` | **1,727** | 30+ refs, 20+ useState, animation + recording + QR + streaming all in one |
| `GolemMixer.ts` | 1,369 | Acceptable for engine but could use cleanup |
| `LiveMixer.ts` | 1,172 | Same |

### 2. No Architecture
- **34 useState calls** scattered across App.tsx and Step4Preview
- **0 error boundaries** - any crash takes down the whole app
- **0 telemetry/observability** - no way to know what's happening in production
- **No service layer** - recording, streaming, exporting are embedded in components

### 3. Scaling Blockers
- Can't add features without making god files bigger
- Can't test individual features in isolation
- Can't swap implementations (e.g., different export format)
- Can't monitor usage or debug production issues

---

## TARGET ARCHITECTURE

```
src/
├── components/
│   ├── Step4Preview/
│   │   ├── index.tsx              # Slim orchestrator (<200 lines)
│   │   ├── ExportMenu.tsx         # Export UI
│   │   ├── RecordingOverlay.tsx   # Recording UI
│   │   ├── StreamingInput.tsx     # Audio streaming UI
│   │   └── QRSharePanel.tsx       # QR code UI
│   ├── Steps/
│   │   ├── Step1Assets.tsx
│   │   └── Step2Director.tsx
│   └── common/
│       └── ErrorBoundary.tsx
│
├── hooks/
│   ├── useRecording.ts            # MediaRecorder, codec selection
│   ├── useStreamingAudio.ts       # Audio URL loading, CORS, status
│   ├── useQRSharing.ts            # QR generation, share links
│   ├── useAnimationLoop.ts        # RAF, frame timing, rendering
│   ├── useGolemState.ts           # Golem mixer state management
│   └── existing hooks...
│
├── services/
│   ├── recording/
│   │   ├── RecordingService.ts    # Recording logic
│   │   └── CodecDetector.ts       # MP4/WebM detection
│   ├── export/
│   │   ├── PlayerExporter.ts      # Orchestrates export
│   │   ├── PlayerBundler.ts       # Bundles templates
│   │   └── templates/
│   │       ├── player.html
│   │       ├── player.css
│   │       └── player.js
│   ├── audio/
│   │   └── StreamingAudioService.ts
│   ├── telemetry/
│   │   ├── TelemetryService.ts    # Event tracking
│   │   ├── AgentMetrics.ts        # Agentic observability
│   │   └── types.ts
│   └── existing services...
│
├── state/
│   ├── AppContext.tsx             # Global state context
│   ├── useAppState.ts             # State hook
│   └── actions.ts                 # State actions
│
├── templates/
│   └── player/
│       ├── index.html             # Player HTML template
│       ├── styles.css             # Player CSS
│       ├── runtime.js             # Player JS runtime
│       └── build.mjs              # Template bundler
│
└── types/
    ├── index.ts                   # Consolidated types
    ├── recording.ts
    ├── export.ts
    └── telemetry.ts
```

---

## PHASE 1: BRANCH MERGE (Day 1)

Use Paywall branch as base. Add from Firebase:

```bash
# Copy standalone files
cp .firebaserc firebase.json ./
mkdir -p data scripts/costs
cp data/cost-assumptions.json data/costs-dashboard.json data/
cp scripts/costs/calculator.mjs scripts/costs/

# Add to package.json
"costs:generate": "node scripts/costs/calculator.mjs",
"deploy:firebase": "npm run build && npx firebase-tools deploy --only hosting"
```

Add CostInsightsModal back to Modals.tsx (~100 lines).

**Deliverable:** Working merged branch with all features.

---

## PHASE 2: EXTRACT HOOKS FROM STEP4PREVIEW (Days 2-3)

### 2.1 useRecording Hook
Extract from Step4Preview lines 474-520, 1314-1410:

```typescript
// hooks/useRecording.ts
interface UseRecordingReturn {
  isRecording: boolean;
  recordingTime: number;
  startRecording: (canvas: HTMLCanvasElement, ratio: AspectRatio, res: Resolution) => void;
  stopRecording: () => void;
  detectedCodec: { mimeType: string; ext: string };
}

export function useRecording(): UseRecordingReturn {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const detectedCodec = useMemo(() => {
    const formats = [
      { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
      { mimeType: 'video/webm;codecs=vp9,opus', ext: 'webm' },
      { mimeType: 'video/webm;codecs=vp8,opus', ext: 'webm' }
    ];
    return formats.find(f => MediaRecorder.isTypeSupported(f.mimeType)) || formats[1];
  }, []);

  // ... rest of recording logic
}
```

### 2.2 useStreamingAudio Hook
Extract from Step4Preview lines 103-106, 286-328, 540-580:

```typescript
// hooks/useStreamingAudio.ts
interface UseStreamingAudioReturn {
  streamLink: string;
  setStreamLink: (url: string) => void;
  streamStatus: string | null;
  isLoading: boolean;
  loadStream: () => void;
  pasteFromClipboard: () => Promise<void>;
}

export function useStreamingAudio(
  audioRef: RefObject<HTMLAudioElement>,
  onSetAudioLink: (url: string) => void
): UseStreamingAudioReturn {
  // ... streaming logic
}
```

### 2.3 useQRSharing Hook
Extract from Step4Preview lines 94-99, 192-228:

```typescript
// hooks/useQRSharing.ts
interface UseQRSharingReturn {
  qrTarget: QRTarget;
  setQrTarget: (target: QRTarget) => void;
  shareLink: string;
  qrDataUrl: string | null;
  qrStatus: string | null;
  qrError: string | null;
  isLoading: boolean;
  refreshQr: () => Promise<void>;
  copyLink: () => Promise<void>;
}

export function useQRSharing(userId?: string): UseQRSharingReturn {
  // ... QR logic
}
```

### 2.4 useAnimationLoop Hook
Extract animation frame logic:

```typescript
// hooks/useAnimationLoop.ts
interface UseAnimationLoopReturn {
  start: () => void;
  stop: () => void;
  isRunning: boolean;
}

export function useAnimationLoop(
  onFrame: (deltaTime: number, timestamp: number) => void,
  fps?: number
): UseAnimationLoopReturn {
  // ... RAF logic with proper cleanup
}
```

**Deliverable:** Step4Preview reduced to ~500 lines, hooks are testable.

---

## PHASE 3: SPLIT PLAYEREXPORT (Days 4-5)

### 3.1 Create Template Files

```html
<!-- templates/player/index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>jusDNCE // Standalone Player</title>
    <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700;900&display=swap" rel="stylesheet">
    <style>{{STYLES}}</style>
</head>
<body>
    {{BODY}}
    <script>
        const FRAMES = {{FRAMES_JSON}};
        const PARAMS = {{PARAMS_JSON}};
        const CATEGORY = '{{CATEGORY}}';
        {{RUNTIME}}
    </script>
</body>
</html>
```

### 3.2 Create Template Bundler

```typescript
// services/export/PlayerBundler.ts
import fs from 'fs';
import path from 'path';

export class PlayerBundler {
  private templateDir: string;
  
  constructor(templateDir: string = './templates/player') {
    this.templateDir = templateDir;
  }
  
  async bundle(frames: GeneratedFrame[], params: HolographicParams, category: SubjectCategory): Promise<string> {
    const html = await fs.promises.readFile(path.join(this.templateDir, 'index.html'), 'utf-8');
    const css = await fs.promises.readFile(path.join(this.templateDir, 'styles.css'), 'utf-8');
    const js = await fs.promises.readFile(path.join(this.templateDir, 'runtime.js'), 'utf-8');
    
    return html
      .replace('{{STYLES}}', css)
      .replace('{{BODY}}', this.generateBody())
      .replace('{{FRAMES_JSON}}', JSON.stringify(frames))
      .replace('{{PARAMS_JSON}}', JSON.stringify(params))
      .replace('{{CATEGORY}}', category)
      .replace('{{RUNTIME}}', js);
  }
}
```

**Deliverable:** playerExport.ts reduced to ~100 lines, templates are editable.

---

## PHASE 4: STATE MANAGEMENT (Day 6)

### 4.1 Create App Context

```typescript
// state/AppContext.tsx
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // Computed
  hasAudio: boolean;
  hasImage: boolean;
  canGenerate: boolean;
  
  // Actions
  setStep: (step: AppStep) => void;
  uploadImage: (file: File) => void;
  uploadAudio: (file: File) => void;
  setAudioLink: (url: string) => void;
  clearAudio: () => void;
  spendCredit: (amount: number) => boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, DEFAULT_STATE);
  
  // ... computed values and actions
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
```

### 4.2 Refactor App.tsx

```typescript
// App.tsx - Now slim
export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <GlobalBackground />
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const { state, setStep } = useApp();
  
  return (
    <div className="relative z-10 flex flex-col h-screen flex-1">
      <Modals />
      <Header />
      <main className="flex-1 overflow-auto">
        {state.step === AppStep.ASSETS && <Step1Assets />}
        {state.step === AppStep.DIRECTOR && <Step2Director />}
        {state.step === AppStep.PREVIEW && <Step4Preview />}
      </main>
      <Footer />
    </div>
  );
}
```

**Deliverable:** Clean state management, components use hooks not props drilling.

---

## PHASE 5: TELEMETRY & OBSERVABILITY (Day 7)

### 5.1 Telemetry Service

```typescript
// services/telemetry/TelemetryService.ts
export interface TelemetryEvent {
  event: string;
  timestamp: string;
  sessionId: string;
  userId?: string;
  metadata: Record<string, unknown>;
}

export class TelemetryService {
  private sessionId: string;
  private buffer: TelemetryEvent[] = [];
  private flushInterval: number;
  
  constructor() {
    this.sessionId = crypto.randomUUID();
    this.flushInterval = window.setInterval(() => this.flush(), 30000);
  }
  
  track(event: string, metadata: Record<string, unknown> = {}) {
    this.buffer.push({
      event,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      metadata: {
        ...metadata,
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    });
  }
  
  // Key events for agentic monitoring
  trackGeneration(mode: 'turbo' | 'quality' | 'super', frameCount: number, durationMs: number) {
    this.track('generation', { mode, frameCount, durationMs, costUsd: this.calculateCost(mode) });
  }
  
  trackExport(format: 'mp4' | 'webm' | 'html', durationMs: number) {
    this.track('export', { format, durationMs });
  }
  
  trackError(error: Error, context: string) {
    this.track('error', { message: error.message, stack: error.stack, context });
  }
  
  // Agentic-accessible metrics endpoint
  getMetrics(): AgentMetrics {
    return {
      sessionId: this.sessionId,
      eventsBuffered: this.buffer.length,
      generations: this.buffer.filter(e => e.event === 'generation').length,
      exports: this.buffer.filter(e => e.event === 'export').length,
      errors: this.buffer.filter(e => e.event === 'error').length
    };
  }
  
  private async flush() {
    if (this.buffer.length === 0) return;
    const events = [...this.buffer];
    this.buffer = [];
    
    // Send to Firestore or analytics endpoint
    try {
      await fetch('/api/telemetry', {
        method: 'POST',
        body: JSON.stringify(events)
      });
    } catch (e) {
      // Re-add to buffer on failure
      this.buffer = [...events, ...this.buffer];
    }
  }
}

export const telemetry = new TelemetryService();
```

### 5.2 Error Boundary

```typescript
// components/common/ErrorBoundary.tsx
interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    telemetry.trackError(error, info.componentStack || 'unknown');
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-500">Something went wrong</h2>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Deliverable:** Production-ready error handling and observability.

---

## PHASE 6: TESTING (Day 8)

### 6.1 Unit Tests for Extracted Hooks

```typescript
// tests/unit/useRecording.test.ts
describe('useRecording', () => {
  it('detects MP4 codec when supported', () => {
    // Mock MediaRecorder.isTypeSupported
    vi.spyOn(MediaRecorder, 'isTypeSupported').mockImplementation(
      (type) => type.includes('mp4')
    );
    
    const { result } = renderHook(() => useRecording());
    expect(result.current.detectedCodec.ext).toBe('mp4');
  });
  
  it('falls back to WebM when MP4 not supported', () => {
    vi.spyOn(MediaRecorder, 'isTypeSupported').mockImplementation(
      (type) => type.includes('vp9')
    );
    
    const { result } = renderHook(() => useRecording());
    expect(result.current.detectedCodec.ext).toBe('webm');
  });
});
```

### 6.2 Integration Tests for Export

```typescript
// tests/integration/export.test.ts
describe('PlayerExporter', () => {
  it('generates valid HTML with embedded frames', async () => {
    const exporter = new PlayerExporter();
    const html = await exporter.export(mockFrames, mockParams, 'CHARACTER');
    
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain(JSON.stringify(mockFrames));
    expect(html).not.toContain('{{'); // No unresolved placeholders
  });
});
```

**Deliverable:** Test coverage for critical paths.

---

## EXECUTION TIMELINE

| Day | Phase | Key Deliverables |
|-----|-------|------------------|
| 1 | Branch Merge | Working merged branch |
| 2-3 | Extract Hooks | useRecording, useStreamingAudio, useQRSharing, useAnimationLoop |
| 4-5 | Split playerExport | Template files, PlayerBundler, slim playerExport.ts |
| 6 | State Management | AppContext, useApp hook, refactored App.tsx |
| 7 | Telemetry | TelemetryService, ErrorBoundary, agent metrics |
| 8 | Testing | Unit tests for hooks, integration tests for export |

---

## SUCCESS CRITERIA

### Before Refactor
- Step4Preview.tsx: 1,727 lines
- playerExport.ts: 2,788 lines
- 34 scattered useState calls
- 0 error boundaries
- 0 telemetry

### After Refactor
- Step4Preview.tsx: <500 lines
- playerExport.ts: <100 lines (templates separate)
- Centralized state with useReducer
- Error boundaries on all major sections
- Full telemetry with agentic metrics endpoint
- Test coverage for critical hooks

---

## COST OF NOT DOING THIS

1. **Every new feature makes it worse** - Adding to god files increases complexity exponentially
2. **Can't hire** - No one can onboard to 2,788 line files
3. **Can't debug production** - No visibility into what's happening
4. **Can't test** - Everything is coupled
5. **Can't pivot** - Locked into current implementation

---

Ready to start with Phase 1?
