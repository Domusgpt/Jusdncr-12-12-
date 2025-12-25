# jusDNCE Choreography Systems Documentation

This document explains the different choreography engines and how they work together.

---

## Overview

jusDNCE has **two choreography systems** that can work independently or together:

| System | Purpose | When to Use |
|--------|---------|-------------|
| **Laban Effort System** | Real-time, reactive dance | Live mic input, responsive playback |
| **Pre-Computed Choreography** | Pre-analyzed song choreography | Full song export, consistent output |

---

## System 1: Laban Effort System (Real-Time)

**Files:** `engine/LabanEffortSystem.ts`, `engine/EnhancedAudioAnalyzer.ts`, `engine/MotionGrammar.ts`

### How It Works

Based on Rudolf Laban's Movement Analysis framework, this system analyzes audio in real-time and maps it to movement qualities.

#### Audio Analysis Pipeline

```
Audio Input → FFT → Multi-Band Detection → Laban Effort → Dance Style → Frame Selection
```

1. **Multi-Band Onset Detection** separates:
   - **Kick** (20-344 Hz) - Bass hits, drops
   - **Snare** (430-1290 Hz) - Mid hits, accents
   - **Hihat** (2580-6880 Hz) - High energy, flourishes

2. **Spectral Features**:
   - **Centroid**: Brightness/mood (low = dark, high = bright)
   - **Flux**: Rate of change (high = chaotic, low = stable)

3. **32-Beat Phrase Tracking**:
   ```
   Beats 0-7:   INTRO     (build anticipation)
   Beats 8-15:  VERSE_A   (establish groove)
   Beats 16-23: VERSE_B   (variation)
   Beats 24-27: CHORUS    (peak energy)
   Beats 28-31: DROP      (impact)
   ```

#### Laban 8 Efforts

Audio characteristics map to 8 movement efforts:

| Effort | Time | Weight | Space | Audio Trigger | Dance Feel |
|--------|------|--------|-------|---------------|------------|
| **PUNCH** | Sudden | Strong | Direct | Bass drop + high flux | Hard hits, krump |
| **SLASH** | Sudden | Strong | Indirect | Bass + mid sweep | Sweeping power |
| **DAB** | Sudden | Light | Direct | Snare hit | Quick pops |
| **FLICK** | Sudden | Light | Indirect | Hihat flutter | Quick flourishes |
| **PRESS** | Sustained | Strong | Direct | Sustained bass | Slow powerful |
| **WRING** | Sustained | Strong | Indirect | Low + tension | Twisting |
| **GLIDE** | Sustained | Light | Direct | Smooth mid | Flowing |
| **FLOAT** | Sustained | Light | Indirect | Ambient, low energy | Ethereal |

#### Dance Style Mapping

Each effort maps to dance styles:

| Effort | Low Energy Style | High Energy Style |
|--------|------------------|-------------------|
| PUNCH | Popping | Krump |
| SLASH | House | Breaking |
| DAB | Popping | Popping |
| FLICK | Tutting | Tutting |
| PRESS | Contemporary | Locking |
| WRING | Contemporary | Contemporary |
| GLIDE | House | House |
| FLOAT | Contemporary | Voguing |

#### Motion Grammar

Procedural choreography using Markov chains:

**Move Tokens:**
- `HOLD` - Stay on frame
- `STEP_L` / `STEP_R` - Direction change
- `POP` - Hard cut transition
- `FLOW` - Smooth transition
- `FREEZE` - Extended hold
- `BOUNCE` - Physics emphasis
- `VOGUE` - Extended pose

**Transition Probabilities** are modified by:
1. Current Laban effort
2. Phrase position (INTRO vs DROP)
3. Repetition penalty (avoid stuck patterns)

---

## System 2: Pre-Computed Choreography

**Files:** `engine/SongAnalyzer.ts`, `engine/ChoreographyPlanner.ts`, `engine/DualModeEngine.ts`

### How It Works

Analyzes the entire song upfront and creates a beat-by-beat choreography map.

#### Song Analysis Pipeline

```
Audio File → Full FFT Analysis → Beat Detection → Section Mapping → Choreography Plan
```

1. **SongAnalyzer** detects:
   - BPM and beat grid
   - Song sections (intro, verse, chorus, drop, breakdown)
   - Build-ups and drops
   - Repeated patterns

2. **ChoreographyPlanner** creates:
   - Beat-by-beat frame assignments
   - Transition timing
   - Energy curves
   - "Mood" zones

#### Section Types

| Section | Energy | Transition Style | Frame Pool |
|---------|--------|------------------|------------|
| INTRO | Low | SMOOTH | Low energy |
| VERSE | Mid | SLIDE | Mid energy, directional |
| BUILD | Rising | MORPH | Increasing energy |
| CHORUS | High | Mixed | High energy |
| DROP | Peak | CUT | High energy, closeups |
| BREAKDOWN | Low | SMOOTH | Low energy |

---

## System 3: Dual-Mode Engine

**File:** `engine/DualModeEngine.ts`

Combines both systems:

```typescript
// Pre-computed mode: Uses song analysis
engine.setMode('precomputed');

// Real-time mode: Uses Laban analysis
engine.setMode('realtime');

// Hybrid mode: Pre-computed base + real-time modifications
engine.setMode('hybrid');
```

---

## Frame Generation (Prompts)

### Energy Levels

| Energy | Prompt Keywords | Pose Characteristics |
|--------|-----------------|---------------------|
| **Low** | "subtle", "relaxed", "standing" | Neutral poses, minimal movement |
| **Mid** | "dynamic", "moving", "groove" | Directional leans, arm movements |
| **High** | "explosive", "jumping", "intense" | Full body extension, dramatic poses |

### Direction

| Direction | Prompt Keywords | Visual |
|-----------|-----------------|--------|
| **Left** | "leaning left", "arm extended left" | Weight shifted left |
| **Right** | "leaning right", "arm extended right" | Weight shifted right |
| **Center** | "centered", "symmetrical" | Balanced pose |

### Frame Types

| Type | Purpose | Generation |
|------|---------|------------|
| **body** | Full body poses | Standard generation |
| **closeup** | Face/upper body | Cropped or zoom prompt |
| **virtual** | Camera crops | No generation (mechanical) |

---

## Transition Modes

| Mode | Speed | Effect | When Used |
|------|-------|--------|-----------|
| **CUT** | Instant | Hard switch | Bass drops, PUNCH effort |
| **SLIDE** | Fast | Horizontal slide | Direction changes |
| **MORPH** | Medium | Crossfade | Builds, WRING effort |
| **SMOOTH** | Slow | Gentle blend | Ambient, FLOAT effort |
| **ZOOM_IN** | Medium | Push-in + crossfade | Closeups, PRESS effort |

---

## Physics Parameters

Each Laban effort has physics modifiers:

```typescript
// PUNCH effort (snappy)
stiffness: 300, damping: 4, maxRotation: 40

// FLOAT effort (smooth)
stiffness: 40, damping: 14, maxRotation: 10
```

These affect:
- Camera spring motion
- Character bounce
- Squash/stretch intensity

---

## Configuration

### Enable/Disable Enhanced Mode

In `Step4Preview.tsx`:
```typescript
const useEnhancedModeRef = useRef<boolean>(true); // true = Laban, false = legacy
```

### BPM Override

The system auto-detects BPM, but you can override:
```typescript
sequencer.setBPM(128);
```

---

## Files Summary

| File | System | Purpose |
|------|--------|---------|
| `LabanEffortSystem.ts` | Real-time | Effort analysis, dance styles |
| `EnhancedAudioAnalyzer.ts` | Real-time | Multi-band detection, spectral |
| `MotionGrammar.ts` | Real-time | Markov chain choreography |
| `useEnhancedChoreography.ts` | Real-time | React hook combining above |
| `SongAnalyzer.ts` | Pre-computed | Full song analysis |
| `ChoreographyPlanner.ts` | Pre-computed | Beat-by-beat planning |
| `DualModeEngine.ts` | Both | Hybrid mode controller |
| `KineticEngine.ts` | Core | Base state machine |
| `FrameManifest.ts` | Core | Frame pool management |
| `DirectVideoExporter.ts` | Export | Non-realtime video rendering |

---

## Which System is Active?

Check the **Neural Status** panel in the preview:

```
FPS: 60 | BPM: 128
POSE: dance_high_left
EFFORT: PUNCH          ← Shows current Laban effort
STYLE: KRUMP | DROP    ← Shows dance style + phrase
```

If EFFORT shows, the Laban system is active.
