# jusDNCE Architecture Evolution

## From CVS to Kinetic Core: A Technical Journey

This document traces the evolution of the jusDNCE audio-reactive visualization architecture through four distinct phases, culminating in the current "Kinetic Core" implementation.

---

## Phase 1: Camera Video Sprites (CVS)

**Philosophy:** Environmental Reactivity over Subject Animation

### Core Concept
CVS treated the character sprite as a **static anchor** within a dynamic, audio-reactive environment. The background shader (WebGL) was the primary driver of visual interest, with the sprite serving as a grounding element.

### Technical Implementation
```typescript
// CVS: Shader-dominant approach
// Bass drives environmental "breathing"
float breathing = 1.0 + (u_audioBass * 0.4);
// Character remains largely static
```

### Strengths
- High performance (shader handles all animation)
- Immersive environmental effects
- Minimal AI generation requirements

### Weaknesses
- Character appears lifeless
- No dance synchronization
- Limited expressiveness

### Audio Mapping
| Frequency Band | Target |
|---------------|--------|
| Bass (0-5) | Fractal expansion ("breathing") |
| Mid (5-30) | Chaos parameter |
| High (30-100) | Color shift / sparkles |

---

## Phase 2: Double Frame Fluid (DFF)

**Philosophy:** Stochastic Smoothing to Mask AI Inconsistency

### Core Concept
DFF attempted to solve the "jitter" problem of AI-generated frames through **probabilistic blending** and soft transitions. The system used `Math.random()` weighted by audio energy to select between frame pools.

### Technical Implementation
```typescript
// DFF: Probabilistic frame selection
if (bass > 0.6) {
  // Trigger pose change with smooth crossfade
  triggerTransition(nextPose, 'MORPH');
}

// Stutter on high frequencies
if (high > 0.7 && Math.random() < stutterChance) {
  triggerGlitch();
}
```

### Strengths
- Fluid, dreamlike motion
- Good variety in poses
- Natural-feeling transitions

### Weaknesses
- "Teleportation" between incompatible poses
- Character "drift" off-center
- AI hallucination visible during morphs
- Lag between beat and reaction

### Audio Mapping
| Frequency Band | Target |
|---------------|--------|
| Bass (>0.6) | Pose transition trigger |
| Mid | Stutter/scratch |
| High (>0.7) | Glitch effects |

---

## Phase 3: Matrix Jaudnce (MJ)

**Philosophy:** Structural Rigidity - "Constraints Are King"

### Core Concept
MJ abandoned smoothing entirely in favor of **hard cuts** and **frame-perfect locking**. The system uses mathematically enforced constraints (strict 4x4 grid, centroid alignment, 75% scaling) to minimize perceived AI error.

### Technical Implementation
```typescript
// MJ: Beat-locked hard cuts
const beatPos = (now % beatDur) / beatDur; // Cyclic 0.0-1.0

// Impact logic - only react to strong beats
if (bass > 0.8) {
  triggerTransition(nextPose, 'CUT', 1000.0); // Instant
}

// Close-up lock prevents jarring cuts
if (isCloseupLocked) {
  // Ignore bass kicks during locked period
}
```

### Strengths
- Frame-perfect beat sync
- Consistent character appearance
- Professional "music video" feel
- Cost-efficient (mechanical multiplication)

### Weaknesses
- Can feel rigid/robotic
- Limited by graph edges
- Requires careful prompt engineering

### Audio Mapping
| Frequency Band | Threshold | Target |
|---------------|-----------|--------|
| Bass | >0.8 | IMPACT/DROP mode |
| Mid | >0.5 | VOGUE mode (hands/face) |
| High | >0.6 | FLOW/GLITCH mode |

### Key Innovations

#### 1. Mechanical Grid Prompt
```
TASK: Generate a strict 4x4 Grid Sprite Sheet (16 frames).
MECHANICAL RULES:
1. GRID: Exactly 4 columns, 4 rows.
2. CENTERING: Character centered in MIDDLE of each cell.
3. SCALE: 75% of cell (leaves 12.5% buffer).
```

#### 2. Close-up Lock
Prevents bass from forcing jarring cuts back to wide shots during intimate moments:
```typescript
if (transitioning_to_closeup) {
  closeupLockUntil = now + 2500; // 2.5 second minimum
}
```

#### 3. Virtual Frame Stitching
Expands frame pool without AI calls:
- Mirror: `N × 2` frames
- Dolly Zoom: Creates virtual closeups at 1.25x, 1.6x

---

## Phase 4: Kinetic Core (Current)

**Philosophy:** "Grid-First, Fluid-Second" - Synthesis of All Approaches

### Core Concept
Kinetic Core combines the **rigid consistency** of MJ with the **fluid variety** of DFF, driven by **predictive audio analysis** rather than reactive response.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     KINETIC CORE                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   AUDIO     │───▶│  LOOKAHEAD  │───▶│   KINETIC   │     │
│  │  ANALYZER   │    │   BUFFER    │    │   GRAPH     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                 │                   │             │
│         │            200ms ahead              │             │
│         ▼                 ▼                   ▼             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              KINETIC ENGINE                          │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐ │   │
│  │  │ BPM     │  │ PHASE   │  │ STATE MACHINE       │ │   │
│  │  │ DETECT  │  │ DETECT  │  │ (DAG Transitions)   │ │   │
│  │  └─────────┘  └─────────┘  └─────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           MECHANICAL MULTIPLIER                      │   │
│  │  ┌────────┐  ┌────────┐  ┌─────────┐  ┌─────────┐  │   │
│  │  │ MIRROR │  │ DOLLY  │  │ STUTTER │  │ MANDALA │  │   │
│  │  │ ENGINE │  │ ZOOM   │  │ ENGINE  │  │ (KIFS)  │  │   │
│  │  └────────┘  └────────┘  └─────────┘  └─────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. AudioLookaheadBuffer
Analyzes `now() + 200ms` to **anticipate** beats rather than react to them:
```typescript
class AudioLookaheadBuffer {
  analyzeFuture(lookaheadMs: number): LookaheadResult {
    // Linear regression on recent samples
    // Predicts energy trajectory
    // Estimates time to next impact
  }
}
```

#### 2. KineticGraph (DAG)
Directed Acyclic Graph prevents "teleportation" between incompatible poses:
```typescript
const graph = {
  idle: ['lean_left', 'lean_right', 'groove', 'warmup'],
  lean_left: ['idle', 'lean_right', 'crouch', 'groove'], // Must pass through
  lean_right: ['idle', 'lean_left', 'crouch', 'groove'],
  // ... Cannot go directly: lean_left → jump (must traverse)
};
```

#### 3. Rhythm Phases
Contextual phases drive graph traversal:
```typescript
type RhythmPhase =
  | 'AMBIENT'     // Energy < 0.2
  | 'WARMUP'      // Beat 0-4
  | 'SWING_LEFT'  // Beat 4-8
  | 'SWING_RIGHT' // Beat 8-12
  | 'DROP'        // Beat 12-13 OR bass > 0.8
  | 'CHAOS'       // Beat 14-16 OR high > 0.7
  | 'GROOVE'      // Bass > 0.4, mid > 0.5
  | 'VOGUE'       // High > 0.6, bass < 0.4 (vocals)
  | 'FLOW';       // Sustained mid energy
```

#### 4. MechanicalMultiplier
Expands frame pool for zero API cost:
```typescript
// Input: 16 AI frames
// Output: 32-48 frames
await MechanicalMultiplier.expandFramePool(frames, {
  enableMirror: true,     // +16 frames
  enableZoom: true,       // +high-energy × 2 zoom levels
  zoomFactors: [1.25, 1.6]
});
```

### Transition Logic

1. **Energy gates traversal**: `canTransition(from, to, energy)`
2. **Phase guides selection**: `selectBestTransition(validNodes, phase)`
3. **Lookahead informs timing**: If impact in <100ms, favor high-energy nodes
4. **Minimum duration anti-jitter**: Each node has `minDuration` lock

### Audio → State Flow

```
Audio Sample
    │
    ▼
┌───────────────┐
│ FFT Analysis  │ (256 bins, 0.8 smoothing)
└───────────────┘
    │
    ├─ Raw bands (bass, mid, high)
    │
    ▼
┌───────────────┐
│ Lookahead     │ (+200ms prediction)
│ Buffer        │
└───────────────┘
    │
    ├─ Predicted energy
    ├─ Trend (rising/falling/stable)
    ├─ Time to impact
    │
    ▼
┌───────────────┐
│ Phase         │
│ Detection     │
└───────────────┘
    │
    ├─ Current phase (DROP, GROOVE, etc.)
    │
    ▼
┌───────────────┐
│ Graph         │
│ Traversal     │
└───────────────┘
    │
    ├─ Valid transitions
    ├─ Best transition (phase-weighted)
    │
    ▼
┌───────────────┐
│ Transition    │
│ Execution     │
└───────────────┘
    │
    ├─ Mode (CUT, MORPH, ZOOM_IN, SLIDE, SMOOTH)
    ├─ Mechanical FX (none, mirror, zoom, stutter)
    │
    ▼
Frame Selection
```

---

## Comparative Summary

| Feature | CVS | DFF | MJ | Kinetic Core |
|---------|-----|-----|----|--------------|
| **Philosophy** | Shader-dominant | Smooth blending | Hard cuts | Predictive graph |
| **Beat Sync** | Loose | Reactive | Metronomic | Anticipatory |
| **Transitions** | N/A | Random morph | Hard cut | Graph-constrained |
| **Anti-Jitter** | N/A | Crossfade | Lock duration | Min duration + DAG |
| **Frame Pool** | Static | Dynamic | Mechanical | Expanded mechanical |
| **Consistency** | Low | Medium | High | High |
| **Variety** | Low | High | Medium | High (via graph) |
| **Latency** | None | ~100ms | ~0ms | -200ms (predictive) |

---

## Usage

### Basic Integration

```typescript
import { useKineticEngine } from './hooks/useKineticEngine';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';

const MyComponent = () => {
  const { getEnhancedFrequencyData } = useAudioAnalyzer();
  const { initialize, update, currentOutput } = useKineticEngine();

  // Initialize with frames
  useEffect(() => {
    if (frames.length > 0) {
      initialize(frames);
    }
  }, [frames]);

  // Animation loop
  useEffect(() => {
    const loop = () => {
      const audioData = getEnhancedFrequencyData();
      const result = update(audioData);

      if (result.shouldTransition) {
        // Apply transition with result.transitionMode
        // Apply result.mechanicalFx
      }

      // Render result.frame
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, []);
};
```

### Advanced: Custom Graph

```typescript
const engine = createKineticEngine();
const graph = engine.getGraph();

// Add custom node
graph.addNode({
  id: 'custom_spin',
  frames: [],
  possibleTransitions: ['groove', 'drop'],
  energyRequirement: 0.6,
  exitThreshold: 0.4,
  mechanicalFx: 'stutter',
  transitionMode: 'CUT',
  minDuration: 100,
  direction: 'center'
});
```

---

## Future Directions

1. **ML-based BPM detection**: Replace interval averaging with neural beat tracking
2. **Pose interpolation**: LERP between frames for smoother transitions
3. **Multi-character support**: Multiple KineticEngines synchronized
4. **Server-side rendering**: FFmpeg fallback for unsupported browsers
5. **Real-time style transfer**: Apply style during render, not generation

---

## Conclusion

The evolution from CVS → DFF → MJ → Kinetic Core represents a journey from "let the shader do everything" to "give the AI strict rules, then break those rules musically." The Kinetic Core synthesizes:

- **CVS's** environmental immersion (shader reactivity)
- **DFF's** variety (state graph traversal)
- **MJ's** consistency (mechanical constraints)
- **Novel** predictive analysis (lookahead buffer)

The result is a system that feels both **tight** (frame-perfect sync) and **fluid** (varied motion vocabulary), while maintaining **consistency** (DAG prevents teleportation) and **efficiency** (mechanical multiplication).
