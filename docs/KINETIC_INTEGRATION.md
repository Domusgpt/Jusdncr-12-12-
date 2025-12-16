# Kinetic Core Integration Guide

This guide demonstrates how to integrate the Kinetic Core architecture into the jusDNCE Step4Preview component.

## Quick Start

### 1. Import Dependencies

```typescript
// In Step4Preview.tsx
import { useKineticEngine, getPhaseColor, isHighEnergyPhase } from '../hooks/useKineticEngine';
import { EnhancedAudioAnalysis } from '../hooks/useAudioAnalyzer';
```

### 2. Initialize Hooks

```typescript
const Step4Preview: React.FC<Props> = ({ state }) => {
  // Existing audio hook (now with enhanced methods)
  const {
    getEnhancedFrequencyData,
    // ... other methods
  } = useAudioAnalyzer();

  // New Kinetic Engine hook
  const {
    isInitialized,
    currentOutput,
    expandedFrames,
    initialize,
    update,
    forceTransition,
    setBPM
  } = useKineticEngine();
```

### 3. Initialize Engine with Frames

```typescript
useEffect(() => {
  if (state.generatedFrames.length > 0) {
    initialize(state.generatedFrames);
  }
}, [state.generatedFrames, initialize]);
```

### 4. Update Animation Loop

```typescript
const loop = useCallback((time: number) => {
  // Get enhanced audio data with lookahead
  const audioData = getEnhancedFrequencyData();

  // Update Kinetic Engine
  const kineticOutput = update(audioData);

  // Use output for rendering
  if (kineticOutput.shouldTransition) {
    // Handle transition
    triggerTransition(
      kineticOutput.frame?.pose || 'idle',
      kineticOutput.transitionMode
    );
  }

  // Apply mechanical effects based on phase
  if (kineticOutput.mechanicalFx === 'stutter') {
    applyStutterEffect();
  }

  // Use lookahead for anticipatory effects
  if (kineticOutput.lookahead.impactIn > 0 && kineticOutput.lookahead.impactIn < 100) {
    // Start zoom in before the beat hits
    startAnticipationZoom();
  }

  // Continue loop
  requestAnimationFrame(loop);
}, [getEnhancedFrequencyData, update]);
```

## Detailed Integration

### Replacing the Existing Choreography Logic

The current Step4Preview has choreography logic spread across the main loop. Here's how to refactor:

#### Before (MJ-style inline logic):

```typescript
// Current: Inline beat detection
if (bass > beatThreshold) {
  lastBeatTimeRef.current = now;
  beatCounterRef.current = (beatCounterRef.current + 1) % 16;

  const beat = beatCounterRef.current;
  let phase: RhythmPhase = 'WARMUP';
  if (beat >= 4 && beat < 8) phase = 'SWING_LEFT';
  // ... more phase logic
}
```

#### After (Kinetic Core):

```typescript
// Kinetic Core handles phase detection automatically
const kineticOutput = update(audioData);

// Phase is pre-computed with lookahead
const { phase, shouldTransition, frame } = kineticOutput;

// Just respond to the engine's decisions
if (shouldTransition && frame) {
  // Engine has already validated this transition via DAG
  triggerTransition(frame.pose, kineticOutput.transitionMode);
}
```

### Using the DAG for Variety

The Kinetic Graph prevents "teleportation" while enabling variety:

```typescript
// Manual override example: User clicks a frame in the deck
const handleFrameClick = (frame: GeneratedFrame) => {
  // Find which node this frame belongs to
  const targetNode = findNodeForFrame(frame);

  // Force transition (bypasses energy requirements)
  forceTransition(targetNode);
};

// The graph still constrains what comes NEXT
// Even after a forced jump, subsequent transitions follow the DAG
```

### Integrating Lookahead

The lookahead buffer enables **anticipatory** effects:

```typescript
const loop = useCallback((time: number) => {
  const audioData = getEnhancedFrequencyData();
  const kineticOutput = update(audioData);
  const { lookahead } = kineticOutput;

  // ANTICIPATORY ZOOM
  // Start zooming 100ms before predicted impact
  if (lookahead.impactIn > 0 && lookahead.impactIn < 100) {
    const anticipationProgress = 1 - (lookahead.impactIn / 100);
    camZoomRef.current = BASE_ZOOM + (anticipationProgress * 0.2);
  }

  // ANTICIPATORY CAMERA MOVEMENT
  // Start moving camera towards expected direction
  if (lookahead.trend === 'rising' && lookahead.predictedBass > 0.7) {
    // Build tension before the drop
    targetTiltRef.current = (Math.random() - 0.5) * 10;
  }

  // ANTICIPATORY COLOR SHIFT
  // Shift background hue before high-energy section
  if (lookahead.trend === 'rising' && lookahead.predictedEnergy > 0.6) {
    const hueShift = lookahead.predictedEnergy * 60;
    hologramRef.current?.setHueOffset(hueShift);
  }
}, []);
```

### Using Mechanical Multipliers in Rendering

The `expandedFrames` array contains all mechanical variants:

```typescript
// Expanded frames include:
// - Original frames
// - Mirrored frames (pose_name + '_mirror')
// - Zoom variants (pose_name + '_zoom125', '_zoom160')

const renderFrame = (poseName: string) => {
  // Find the frame (could be original or mechanical)
  const frame = expandedFrames.find(f => f.pose === poseName);

  if (frame && frame.isVirtual) {
    // Apply virtual zoom offset
    const effectiveZoom = camZoomRef.current * (frame.virtualZoom || 1);
    const offsetY = frame.virtualOffsetY || 0;

    ctx.save();
    ctx.scale(effectiveZoom, effectiveZoom);
    ctx.translate(0, offsetY * canvasHeight);
    ctx.drawImage(img, ...);
    ctx.restore();
  } else {
    // Standard render
    ctx.drawImage(img, ...);
  }
};
```

### BPM Synchronization

The engine auto-detects BPM from audio, but you can also set it manually:

```typescript
// Auto-detection via audio analysis
const audioData = getEnhancedFrequencyData();
// audioData.bpm is automatically estimated

// Manual override (e.g., from user input)
const handleBPMChange = (bpm: number) => {
  setBPM(bpm);
};
```

## UI Integration

### Displaying Phase Information

```typescript
// In the render JSX
<div className="neural-status">
  <div
    className="phase-indicator"
    style={{ backgroundColor: getPhaseColor(currentOutput?.phase || 'AMBIENT') }}
  >
    {currentOutput?.phase}
  </div>
  <div className="bpm-display">
    {audioData.bpm} BPM
  </div>
  <div className="lookahead-indicator">
    {currentOutput?.lookahead.trend === 'rising' ? '↑' : '↓'}
    {currentOutput?.lookahead.impactIn > 0
      ? `Impact in ${Math.round(currentOutput.lookahead.impactIn)}ms`
      : 'No impact detected'}
  </div>
</div>
```

### Frame Deck with Kinetic Metadata

```typescript
// Enhanced frame deck showing mechanical variants
{expandedFrames.map((frame, i) => (
  <div
    key={frame.pose}
    className={`frame-card ${frame.isVirtual ? 'virtual' : ''}`}
    onClick={() => forceTransition(findNodeForFrame(frame))}
  >
    <img src={frame.url} alt={frame.pose} />
    <div className="frame-meta">
      <span className={`energy-badge ${frame.energy}`}>{frame.energy}</span>
      {frame.isVirtual && (
        <span className="virtual-badge">{frame.mechanicalFx}</span>
      )}
    </div>
  </div>
))}
```

## Performance Considerations

### 1. Memoize Engine Output

```typescript
const memoizedOutput = useMemo(() => {
  if (!currentOutput) return null;
  return {
    framePose: currentOutput.frame?.pose,
    phase: currentOutput.phase,
    shouldAnticipate: currentOutput.lookahead.impactIn > 0 &&
                       currentOutput.lookahead.impactIn < 100
  };
}, [currentOutput?.frame?.pose, currentOutput?.phase, currentOutput?.lookahead.impactIn]);
```

### 2. Batch State Updates

```typescript
// Instead of multiple setState calls
const [renderState, setRenderState] = useState({
  currentPose: '',
  phase: 'AMBIENT' as RhythmPhase,
  zoom: BASE_ZOOM
});

// Update once per frame
setRenderState({
  currentPose: kineticOutput.frame?.pose || '',
  phase: kineticOutput.phase,
  zoom: calculateZoom(kineticOutput)
});
```

### 3. Throttle Non-Critical Updates

```typescript
// Throttle UI updates (phase display, BPM) to 10fps
const lastUIUpdateRef = useRef(0);

if (now - lastUIUpdateRef.current > 100) {
  setBrainState({
    phase: kineticOutput.phase,
    bpm: audioData.bpm,
    // ...
  });
  lastUIUpdateRef.current = now;
}
```

## Migration Checklist

- [ ] Import `useKineticEngine` hook
- [ ] Initialize engine with `state.generatedFrames`
- [ ] Replace inline phase detection with `kineticOutput.phase`
- [ ] Replace random frame selection with `kineticOutput.frame`
- [ ] Use `kineticOutput.transitionMode` for transition decisions
- [ ] Implement lookahead-based anticipation
- [ ] Update frame deck to show `expandedFrames`
- [ ] Add phase indicator to UI
- [ ] Test with various music genres

## Debugging

### Visualize the Graph

```typescript
// Log graph state
const engine = useRef(createKineticEngine());

console.log('All nodes:', engine.current.getGraph().getAllNodes());
console.log('Current state:', engine.current.getState());
console.log('Valid transitions:', engine.current.getGraph()
  .getValidTransitions(currentNode, currentEnergy));
```

### Monitor Lookahead Accuracy

```typescript
// Track prediction accuracy
const predictionAccuracyRef = useRef<{ predicted: number; actual: number }[]>([]);

// On impact detection
if (audioData.beatDetected) {
  const lastPrediction = predictionAccuracyRef.current.slice(-1)[0];
  if (lastPrediction) {
    console.log(`Predicted impact: ${lastPrediction.predicted}ms, Actual: ${Date.now() - lastPrediction.timestamp}ms`);
  }
}

// On new prediction
if (lookahead.impactIn > 0) {
  predictionAccuracyRef.current.push({
    predicted: lookahead.impactIn,
    timestamp: Date.now()
  });
}
```
