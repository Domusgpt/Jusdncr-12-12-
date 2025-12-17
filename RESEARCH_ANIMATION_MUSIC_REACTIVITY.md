# Deep Research: Animation & Music Reactivity Enhancement

## Executive Summary

After comprehensive analysis of jusDNCE's architecture, this document details the current systems, identifies enhancement opportunities, and proposes strategies for achieving greater dance variety without hardcoding prompts.

---

## Part 1: Current Architecture Analysis

### 1.1 The Choreography Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AUDIO INPUT LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│  File Audio → MediaElementSource → AnalyserNode (FFT 256)          │
│  Mic Input  → MediaStreamSource  → AnalyserNode (FFT 256)          │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  FREQUENCY DECOMPOSITION                            │
├───────────────┬─────────────────┬───────────────────────────────────┤
│ BASS (0-5)    │ MID (5-30)      │ HIGH (30-100)                     │
│ Kick drums    │ Snare/Vocals    │ Hi-hats/Cymbals                   │
│ Weight: 50%   │ Weight: 30%     │ Weight: 20%                       │
└───────┬───────┴────────┬────────┴───────────────┬───────────────────┘
        │                │                        │
        ▼                ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  CHOREOGRAPHY BRAIN                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Beat Detection → Phase Assignment → Frame Selection → Transition   │
│  (300ms debounce)  (16-beat cycle)   (energy pools)    (5 modes)   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   PHYSICS ENGINE                                    │
├─────────────────────────────────────────────────────────────────────┤
│  Spring Solver (stiffness=140, damping=8)                          │
│  Bass → RotX (pitch) | Mid → RotY (yaw) | High → RotZ (roll)       │
│  Squash/Stretch | Bounce | Skew | Tilt                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   RENDER PIPELINE                                   │
├────────────────────┬────────────────────────────────────────────────┤
│ WebGL Background   │ Canvas 2D Character                           │
│ KIFS Raymarcher    │ Multi-layer compositing                       │
│ Quantum Foam       │ Effects: RGB split, ghost, stutter            │
└────────────────────┴────────────────────────────────────────────────┘
```

### 1.2 Current Variety Mechanisms (21 Dimensions)

| Dimension | Current Implementation | Limitation |
|-----------|----------------------|------------|
| Subject Category | TEXT/CHARACTER/SYMBOL | Fixed 3 categories |
| Style Presets | 16 visual styles | Static prompts |
| Motion Presets | 4 types (bounce/flow/glitch/auto) | Hardcoded descriptions |
| Beat Phases | 16-beat cycle | Fixed phase mapping |
| Energy Pools | Low/Mid/High | Binary classification |
| Direction | Left/Right/Center | Only 3 directions |
| Stutter | 35% probability on high freq | Single probability |
| Transitions | 5 modes (CUT/SLIDE/MORPH/etc.) | Fixed speeds |
| Virtual Zoom | 1.25x/1.6x synthetic | Fixed zoom levels |
| Mirroring | Automatic horizontal flip | Only horizontal |

---

## Part 2: Enhancement Opportunities

### 2.1 Procedural Dance Style Generation

**Problem:** Current motion presets are hardcoded ("bouncy, energetic" etc.)

**Solution: Parametric Dance Space**

Instead of discrete presets, define dance as a multi-dimensional parameter space:

```typescript
interface DanceParameters {
  // Movement Quality (Laban Movement Analysis inspired)
  weight: number;       // 0=light/floating → 1=heavy/grounded
  time: number;         // 0=sustained/slow → 1=sudden/quick
  space: number;        // 0=indirect/flexible → 1=direct/linear
  flow: number;         // 0=bound/controlled → 1=free/released

  // Spatial Parameters
  verticalBias: number; // -1=floor work → 0=standing → 1=aerial
  lateralRange: number; // 0=centered → 1=wide side-to-side
  depthRange: number;   // 0=flat → 1=forward/back movement

  // Rhythm Parameters
  syncopation: number;  // 0=on-beat → 1=off-beat emphasis
  polyrhythm: number;   // 0=simple → 1=complex subdivisions
  pauseDensity: number; // 0=continuous → 1=staccato/poses
}
```

**Auto-Generation from Audio:**

```typescript
function analyzeSongStyle(audioBuffer: AudioBuffer): DanceParameters {
  // Analyze entire song to extract macro characteristics
  const spectralCentroid = computeSpectralCentroid(audioBuffer);
  const rhythmComplexity = analyzeRhythmComplexity(audioBuffer);
  const dynamicRange = computeDynamicRange(audioBuffer);

  return {
    weight: map(spectralCentroid, [1000, 8000], [1, 0]),  // Low freq = heavy
    time: map(bpm, [60, 180], [0, 1]),
    space: rhythmComplexity > 0.6 ? 0.3 : 0.8,  // Complex = indirect
    flow: dynamicRange > 0.7 ? 0.8 : 0.4,
    verticalBias: map(bassRatio, [0.2, 0.6], [-0.5, 0.5]),
    // ... etc
  };
}
```

### 2.2 Dynamic Prompt Construction

**Current:** Static template + style modifier + motion preset

**Enhanced:** Procedural prompt synthesis

```typescript
function generateDancePrompt(params: DanceParameters, genre?: string): string {
  const qualityWords = [];

  // Weight dimension
  if (params.weight > 0.7) qualityWords.push("grounded", "heavy", "powerful");
  else if (params.weight < 0.3) qualityWords.push("light", "airy", "floating");
  else qualityWords.push("balanced", "controlled");

  // Time dimension
  if (params.time > 0.7) qualityWords.push("quick", "sharp", "explosive");
  else if (params.time < 0.3) qualityWords.push("sustained", "flowing", "gradual");

  // Space dimension
  if (params.space > 0.7) qualityWords.push("direct", "linear", "focused");
  else qualityWords.push("indirect", "curved", "meandering");

  // Combine with detected genre
  const genreInfluence = GENRE_MODIFIERS[genre] || "";

  return `${qualityWords.join(", ")} movement. ${genreInfluence}`;
}

const GENRE_MODIFIERS = {
  'hip-hop': 'Emphasize isolations, hits, and grooves. Urban swagger.',
  'electronic': 'Robotic precision with organic flow. Geometric patterns.',
  'latin': 'Hip movement, footwork complexity, partner-ready positions.',
  'classical': 'Balletic extensions, graceful port de bras, turned out feet.',
  'rock': 'Raw energy, headbanging potential, power stance.',
};
```

### 2.3 Enhanced Beat Detection: Multi-Band Onset Detection

**Current:** Single bass threshold (0.5)

**Enhanced:** Per-band onset detection with adaptive thresholds

```typescript
interface MultiOnset {
  kick: boolean;      // Bass drum hit
  snare: boolean;     // Snare/clap
  hihat: boolean;     // Hi-hat/cymbal
  vocal: boolean;     // Vocal onset
  melodic: boolean;   // Melodic change
}

function detectOnsets(current: FreqData, history: FreqData[]): MultiOnset {
  const avgBass = average(history.map(h => h.bass));
  const avgMid = average(history.map(h => h.mid));
  const avgHigh = average(history.map(h => h.high));

  // Spectral flux (change detection)
  const bassFlux = current.bass - avgBass;
  const midFlux = current.mid - avgMid;
  const highFlux = current.high - avgHigh;

  // Adaptive thresholds based on song dynamics
  const bassThreshold = avgBass * 1.5 + 0.2;
  const midThreshold = avgMid * 1.8 + 0.15;
  const highThreshold = avgHigh * 2.0 + 0.1;

  return {
    kick: bassFlux > bassThreshold,
    snare: midFlux > midThreshold && current.mid > 0.4,
    hihat: highFlux > highThreshold,
    vocal: current.mid > 0.5 && current.high > 0.3 && current.bass < 0.4,
    melodic: detectMelodicChange(current, history)
  };
}
```

### 2.4 Phrase-Aware Choreography

**Current:** 16-beat cycle resets continuously

**Enhanced:** Detect musical phrases and structure

```typescript
interface MusicalPhrase {
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'drop' | 'breakdown' | 'outro';
  intensity: number;      // 0-1 energy level
  duration: number;       // beats
  startBeat: number;
}

// Maintain phrase context
class PhraseTracker {
  private energyHistory: number[] = [];
  private currentPhrase: MusicalPhrase;

  update(energy: number, beatCount: number) {
    this.energyHistory.push(energy);

    // Detect phrase boundaries via energy transitions
    const recentAvg = average(this.energyHistory.slice(-16));
    const olderAvg = average(this.energyHistory.slice(-32, -16));

    if (recentAvg > olderAvg * 1.5) {
      // Energy spike = likely chorus/drop
      this.currentPhrase = { type: 'chorus', intensity: recentAvg, ... };
    } else if (recentAvg < olderAvg * 0.6) {
      // Energy drop = breakdown/verse
      this.currentPhrase = { type: 'breakdown', intensity: recentAvg, ... };
    }
  }

  getChoreographyHint(): ChoreographyHint {
    switch (this.currentPhrase.type) {
      case 'chorus': return { energy: 'high', repeatability: 0.8, signature: true };
      case 'verse': return { energy: 'mid', repeatability: 0.3, narrative: true };
      case 'drop': return { energy: 'peak', freeze: true, impact: true };
      case 'breakdown': return { energy: 'low', smooth: true, breathe: true };
    }
  }
}
```

### 2.5 Movement Grammar System

**Concept:** Define dance as a formal grammar, not random frame selection

```typescript
// Dance primitives
type MovePrimitive =
  | 'STEP_L' | 'STEP_R' | 'STEP_FWD' | 'STEP_BACK'
  | 'ARM_UP' | 'ARM_OUT' | 'ARM_CROSS'
  | 'HIP_L' | 'HIP_R' | 'HIP_CIRCLE'
  | 'HEAD_NOD' | 'HEAD_TILT'
  | 'FREEZE' | 'PULSE';

// Movement phrases (combinations)
interface MovePhrase {
  id: string;
  sequence: MovePrimitive[];
  energy: 'low' | 'mid' | 'high';
  beats: number;       // Duration in beats
  transitions: string[]; // Valid next phrases
}

// Grammar rules
const DANCE_GRAMMAR: MovePhrase[] = [
  { id: 'groove_basic', sequence: ['STEP_L', 'HIP_R', 'STEP_R', 'HIP_L'],
    energy: 'mid', beats: 4, transitions: ['groove_basic', 'arm_combo', 'step_turn'] },

  { id: 'arm_combo', sequence: ['ARM_UP', 'ARM_OUT', 'ARM_CROSS', 'PULSE'],
    energy: 'mid', beats: 4, transitions: ['groove_basic', 'freeze_pose'] },

  { id: 'freeze_pose', sequence: ['FREEZE'],
    energy: 'high', beats: 2, transitions: ['groove_basic', 'explosive_burst'] },

  { id: 'explosive_burst', sequence: ['ARM_UP', 'STEP_FWD', 'ARM_OUT', 'STEP_BACK'],
    energy: 'high', beats: 2, transitions: ['groove_basic', 'freeze_pose'] },
];

// Map frames to primitives during generation
function mapFramesToGrammar(frames: GeneratedFrame[]): Map<MovePrimitive, GeneratedFrame[]> {
  const mapping = new Map();

  for (const frame of frames) {
    // Use frame metadata + visual analysis
    if (frame.direction === 'left' && frame.energy === 'mid') {
      mapping.get('STEP_L')?.push(frame) || mapping.set('STEP_L', [frame]);
    }
    // ... more sophisticated mapping
  }

  return mapping;
}
```

### 2.6 Anticipation & Recovery System

**Current:** Reactive only (responds after beat)

**Enhanced:** Pre-beat anticipation + post-beat recovery

```typescript
interface ChoreographyTiming {
  anticipation: number;  // ms before beat to start moving
  attack: number;        // ms to reach peak position
  sustain: number;       // ms to hold peak
  release: number;       // ms to return to neutral
}

// ADSR-like envelope for each movement
function applyMovementEnvelope(
  progress: number,  // 0-1 through the beat
  timing: ChoreographyTiming,
  targetTransform: Transform
): Transform {
  const { anticipation, attack, sustain, release } = timing;
  const total = anticipation + attack + sustain + release;

  const t = progress * total;

  if (t < anticipation) {
    // Wind-up phase (slight opposite movement)
    const p = t / anticipation;
    return lerpTransform(NEUTRAL, scaleTransform(targetTransform, -0.2), easeIn(p));
  } else if (t < anticipation + attack) {
    // Attack phase (snap to target)
    const p = (t - anticipation) / attack;
    return lerpTransform(scaleTransform(targetTransform, -0.2), targetTransform, easeOut(p));
  } else if (t < anticipation + attack + sustain) {
    // Sustain (hold at peak)
    return targetTransform;
  } else {
    // Release (return to neutral)
    const p = (t - anticipation - attack - sustain) / release;
    return lerpTransform(targetTransform, NEUTRAL, easeInOut(p));
  }
}
```

### 2.7 Multi-Character Choreography (Future)

**Concept:** Extend system for group dances

```typescript
interface FormationRule {
  pattern: 'line' | 'circle' | 'v-shape' | 'scattered' | 'mirror';
  spacing: number;
  facing: 'audience' | 'center' | 'partner';
}

interface GroupChoreography {
  characters: CharacterState[];
  formation: FormationRule;
  leader: number;           // Index of lead dancer
  delayPerCharacter: number; // Canon/wave effect timing
  synchronization: number;   // 0=canon → 1=unison
}

// Wave effect: each character delayed by offset
function updateGroupChoreography(
  group: GroupChoreography,
  beat: number,
  audio: AudioData
) {
  const leaderFrame = selectFrame(group.characters[group.leader], beat, audio);

  for (let i = 0; i < group.characters.length; i++) {
    const delay = i * group.delayPerCharacter * (1 - group.synchronization);
    const delayedBeat = beat - delay;

    if (i === group.leader) {
      group.characters[i].currentFrame = leaderFrame;
    } else {
      // Either follow leader (high sync) or independent (low sync)
      if (group.synchronization > 0.8) {
        group.characters[i].currentFrame = leaderFrame;
      } else {
        group.characters[i].currentFrame = selectFrame(
          group.characters[i],
          delayedBeat,
          audio
        );
      }
    }
  }
}
```

---

## Part 3: Shader Enhancement Opportunities

### 3.1 Current Shader Limitations

The HolographicVisualizer uses a single KIFS raymarcher with:
- 6 geometry types
- 3 audio bands feeding uniforms
- Basic volumetric glow

### 3.2 Proposed: Audio-Reactive Particle System

Add particle overlay that responds to audio transients:

```glsl
// Particle field driven by audio
vec3 audioParticles(vec3 ro, vec3 rd, float bass, float mid, float high) {
    vec3 col = vec3(0.0);

    // Spawn particles on beat
    float beatIntensity = smoothstep(0.4, 0.8, bass);

    for (int i = 0; i < 32; i++) {
        // Particle position based on hash + time
        vec3 particlePos = hash3(float(i)) * 4.0 - 2.0;

        // Move particles outward on beat
        particlePos *= 1.0 + beatIntensity * 2.0;

        // Rotate with mid frequencies
        particlePos.xy *= rot(mid * 3.14159);

        // Distance to particle
        float d = length(cross(rd, particlePos - ro));

        // Color based on high frequencies
        vec3 particleCol = mix(
            vec3(0.0, 1.0, 1.0),  // Cyan
            vec3(1.0, 0.0, 1.0),  // Magenta
            high
        );

        col += particleCol * 0.01 / (d * d + 0.01);
    }

    return col;
}
```

### 3.3 Proposed: Waveform Visualization Layer

```glsl
// Audio waveform ring around fractal
float audioRing(vec2 uv, float bass, float mid, float high) {
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);

    // Base ring radius
    float ringR = 0.8 + bass * 0.2;

    // Waveform displacement
    float wave = sin(angle * 8.0 + u_time) * mid * 0.1;
    wave += sin(angle * 16.0 - u_time * 2.0) * high * 0.05;

    float ring = smoothstep(0.02, 0.0, abs(radius - ringR - wave));

    return ring;
}
```

---

## Part 4: Frame Generation Enhancement

### 4.1 Current Frame Categories

```
BASE (16 frames):     Row 1=Idle, Row 2=Left, Row 3=Right, Row 4=Power
ALT (16 frames):      Jump, Crouch, Spin, Kick variations
FLOURISH (16 frames): Face closeups, hand gestures
SMOOTH (16 frames):   In-between interpolation frames
```

**Total: 64 frames maximum (with mirrors: ~100)**

### 4.2 Proposed: Semantic Frame Tagging

Instead of fixed grid positions determining frame properties, use AI-assisted semantic analysis:

```typescript
interface SemanticFrameTag {
  // Movement Quality
  effort: {
    weight: 'light' | 'heavy';
    time: 'sustained' | 'sudden';
    space: 'direct' | 'indirect';
    flow: 'bound' | 'free';
  };

  // Body State
  bodyPart: ('arms' | 'legs' | 'torso' | 'head' | 'hands' | 'face')[];
  level: 'floor' | 'low' | 'mid' | 'high' | 'aerial';
  facing: 'front' | 'side' | 'back' | '3/4';

  // Emotional Quality
  emotion: 'neutral' | 'joy' | 'intensity' | 'cool' | 'fierce';

  // Compositional
  visualWeight: number;  // 0-1, where is attention drawn
  stability: number;     // 0=dynamic/off-balance → 1=stable/grounded
}

// Use Gemini to analyze generated frames
async function analyzeFrameSemantics(frameBase64: string): Promise<SemanticFrameTag> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: frameBase64 }},
        { text: `Analyze this dance frame. Return JSON with:
          - effort qualities (weight, time, space, flow)
          - prominent body parts
          - level (floor/low/mid/high/aerial)
          - emotional quality
          - visual stability (0-1)` }
      ]
    }]
  });

  return JSON.parse(response.text);
}
```

### 4.3 Proposed: Iterative Refinement Generation

```typescript
async function generateWithRefinement(
  baseImage: string,
  style: StylePreset,
  danceParams: DanceParameters
): Promise<GeneratedFrame[]> {
  // Phase 1: Generate base frames
  const baseFrames = await generateSpriteSheet('base', baseImage, style);

  // Phase 2: Analyze what's missing
  const frameTags = await Promise.all(baseFrames.map(analyzeFrameSemantics));

  const gaps = identifyChoreographyGaps(frameTags, danceParams);
  // e.g., "No floor work frames", "Missing 3/4 facing", "No arm-focused poses"

  // Phase 3: Generate targeted supplementary frames
  for (const gap of gaps) {
    const supplementPrompt = generateGapFillingPrompt(gap, style);
    const supplementFrames = await generateSpriteSheet('supplement', baseImage, {
      ...style,
      promptModifier: style.promptModifier + ` FOCUS: ${gap.description}`
    });

    baseFrames.push(...supplementFrames);
  }

  return baseFrames;
}
```

---

## Part 5: Lookahead System Enhancement

### 5.1 Current: 200ms Linear Regression

Simple slope-based prediction of energy trend.

### 5.2 Proposed: Multi-Scale Lookahead

```typescript
class MultiScaleLookahead {
  private microBuffer: AudioSample[] = [];   // 50ms - transient prediction
  private mesoBuffer: AudioSample[] = [];    // 500ms - phrase prediction
  private macroBuffer: AudioSample[] = [];   // 4000ms - section prediction

  analyzeFuture(): MultiScalePrediction {
    return {
      micro: this.predictMicro(),   // "Beat about to hit in 30ms"
      meso: this.predictMeso(),     // "Building to chorus"
      macro: this.predictMacro()    // "In verse section, drop in ~30s"
    };
  }

  private predictMicro(): MicroPrediction {
    // Fast onset detection for immediate reactions
    const flux = computeSpectralFlux(this.microBuffer);
    return {
      imminentKick: flux.bass > this.adaptiveThreshold.bass,
      imminentSnare: flux.mid > this.adaptiveThreshold.mid,
      imminentCymbal: flux.high > this.adaptiveThreshold.high,
      confidence: this.computeConfidence(flux)
    };
  }

  private predictMeso(): MesoPrediction {
    // Medium-term phrase detection
    const energyCurve = this.mesoBuffer.map(s => s.energy);
    const trend = linearRegression(energyCurve);
    const curvature = quadraticFit(energyCurve);

    return {
      energyDirection: trend.slope > 0.01 ? 'rising' : trend.slope < -0.01 ? 'falling' : 'stable',
      acceleration: curvature > 0 ? 'accelerating' : 'decelerating',
      peakDistance: estimatePeakDistance(energyCurve, trend, curvature)
    };
  }

  private predictMacro(): MacroPrediction {
    // Long-term section detection
    const segments = segmentByEnergy(this.macroBuffer);
    const pattern = detectPattern(segments);

    return {
      currentSection: pattern.current,
      nextSection: pattern.predicted,
      timeToTransition: pattern.transitionTime,
      overallEnergy: average(this.macroBuffer.map(s => s.energy))
    };
  }
}
```

---

## Part 6: Concrete Implementation Recommendations

### Priority 1: Procedural Dance Parameters (High Impact, Medium Effort)

**Files to modify:**
- `/services/gemini.ts` - Add parametric prompt generation
- `/constants.ts` - Add DanceParameters type and presets
- `/components/Steps.tsx` - Add parameter sliders instead of dropdown

**Implementation:**
1. Add DanceParameters interface
2. Create `generateDancePrompt(params)` function
3. Add UI sliders for weight/time/space/flow
4. Map audio analysis to default parameters

### Priority 2: Multi-Band Onset Detection (High Impact, Low Effort)

**Files to modify:**
- `/hooks/useAudioAnalyzer.ts` - Add onset detection
- `/components/Step4Preview.tsx` - Use onsets instead of thresholds

**Implementation:**
1. Add spectral flux calculation
2. Implement per-band adaptive thresholds
3. Return `MultiOnset` object from hook
4. Update choreography brain to use specific onsets

### Priority 3: Phrase-Aware Choreography (Medium Impact, Medium Effort)

**Files to create:**
- `/engine/PhraseTracker.ts` - Musical phrase detection

**Files to modify:**
- `/components/Step4Preview.tsx` - Integrate phrase context

**Implementation:**
1. Create PhraseTracker class
2. Feed energy history during playback
3. Use phrase type to influence frame selection intensity
4. Add "signature move" repetition during choruses

### Priority 4: Movement Grammar System (High Impact, High Effort)

**Files to create:**
- `/engine/DanceGrammar.ts` - Grammar definitions and parser
- `/engine/FrameMapper.ts` - Map frames to grammar primitives

**Implementation:**
1. Define MovePrimitive and MovePhrase types
2. Create grammar rules for different dance styles
3. Implement frame-to-primitive mapping using metadata
4. Replace random frame selection with grammar-guided selection

### Priority 5: Shader Particle System (Medium Impact, Medium Effort)

**Files to modify:**
- `/components/Visualizer/HolographicVisualizer.ts` - Add particle layer

**Implementation:**
1. Add particle uniforms (count, speed, color)
2. Implement audioParticles() function in shader
3. Blend particle layer with existing raymarcher
4. Drive particle behavior from beat detection

---

## Part 7: Dance Variety Without Hardcoding

### The Core Problem

Current system relies on:
1. Hardcoded motion presets ("bouncy", "flowing", etc.)
2. Fixed prompt templates per sheet role
3. Static phase-to-frame-pool mapping

### The Solution: Emergent Choreography

**Principle:** Dance variety should emerge from:
1. Audio characteristics (not user selection)
2. Frame semantic properties (not grid position)
3. Movement grammar rules (not random selection)
4. Phrase context (not fixed 16-beat cycle)

### Implementation Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│ AUDIO ANALYSIS (Song-Level)                                         │
│ ─────────────────────────────                                       │
│ Input: Full audio file                                              │
│ Output: DanceParameters { weight, time, space, flow, ... }          │
│ Method: Spectral analysis, rhythm detection, dynamic range          │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PROMPT SYNTHESIS (Per Generation)                                   │
│ ─────────────────────────────────                                   │
│ Input: DanceParameters + StylePreset                                │
│ Output: Natural language prompt with movement qualities             │
│ Method: Parameter-to-adjective mapping + genre modifiers            │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ FRAME SEMANTIC TAGGING (Post Generation)                            │
│ ─────────────────────────────────────────                           │
│ Input: Generated frames                                             │
│ Output: SemanticFrameTag per frame                                  │
│ Method: AI analysis of effort/level/emotion/stability               │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│ GRAMMAR-GUIDED SELECTION (Real-Time)                                │
│ ───────────────────────────────────────                             │
│ Input: Current phrase context + audio onsets + frame tags           │
│ Output: Next frame + transition mode                                │
│ Method: Grammar rules + semantic matching + phrase awareness        │
└─────────────────────────────────────────────────────────────────────┘
```

### Result

Instead of:
```typescript
// Old: Hardcoded
if (phase === 'DROP') pool = framesByEnergy.high;
```

You get:
```typescript
// New: Emergent
const desiredQualities = {
  effort: { weight: 'heavy', time: 'sudden' },
  level: 'mid',
  stability: 0.3  // Off-balance for impact
};
pool = frames.filter(f => matchesQualities(f.semanticTag, desiredQualities));
```

---

## Conclusion

The jusDNCE system has a solid foundation with its beat detection, physics engine, and frame choreography. The key enhancements center on:

1. **Removing hardcoded presets** → Parametric dance space
2. **Better beat detection** → Multi-band onset detection
3. **Musical awareness** → Phrase tracking and section detection
4. **Semantic frames** → AI-tagged movement qualities
5. **Structured variety** → Grammar-based selection

These changes would transform the system from "reactive animation player" to "intelligent dance choreographer" while maintaining the real-time performance characteristics.

---

*Generated by Claude Code - Animation & Music Reactivity Research*
*Date: 2025-12-17*
