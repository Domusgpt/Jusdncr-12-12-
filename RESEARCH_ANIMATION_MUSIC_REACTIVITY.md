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

## Part 5: Full Song Pre-Analysis (Recommended Approach)

### 5.1 The Problem with Real-Time Lookahead

The current 200ms lookahead buffer attempts to predict the future from limited data.
But for **file-based playback**, we already have the entire song - why guess?

**Real-time lookahead only makes sense for:**
- Live microphone input
- Streaming audio where future is unknown

**For file playback, we should:**
- Pre-analyze the ENTIRE song before playback starts
- Build a complete "song map" with all beats, sections, and patterns
- During playback, simply look up what's coming from the pre-computed map

### 5.2 Song Structure Analysis Pipeline

```typescript
interface SongMap {
  // Timing & Rhythm
  bpm: number;
  timeSignature: [number, number];  // e.g., [4, 4]
  beats: BeatMarker[];              // Every beat with timestamp + strength
  downbeats: number[];              // First beat of each bar (ms timestamps)

  // Structural Sections
  sections: SongSection[];          // Intro, Verse, Chorus, Bridge, etc.

  // Repeated Patterns (for signature moves)
  patterns: RepeatedPattern[];      // Chorus hook, recurring riff, etc.

  // Energy Curve
  energyProfile: EnergyPoint[];     // Energy value at each beat

  // Key Moments
  drops: DropMarker[];              // High-impact moments
  breakdowns: BreakdownMarker[];    // Low-energy valleys
  buildups: BuildupMarker[];        // Energy ramps before drops
}

interface SongSection {
  type: 'intro' | 'verse' | 'prechorus' | 'chorus' | 'bridge' | 'breakdown' | 'drop' | 'outro';
  startTime: number;      // ms
  endTime: number;        // ms
  startBeat: number;      // beat index
  endBeat: number;
  energy: number;         // average energy 0-1
  isRepeat: boolean;      // true if this section repeats earlier content
  repeatOf?: number;      // index of first occurrence (for choreography sync)
}

interface RepeatedPattern {
  id: string;
  occurrences: { startTime: number; endTime: number }[];
  signature: number[];    // Audio fingerprint for matching
  choreographyId?: string; // Assigned signature move sequence
}
```

### 5.3 Pre-Analysis Implementation

```typescript
class SongAnalyzer {
  private audioContext: OfflineAudioContext;

  async analyzeSong(audioBuffer: AudioBuffer): Promise<SongMap> {
    console.time('Song Analysis');

    // Run all analysis in parallel
    const [
      beats,
      sections,
      patterns,
      energyProfile
    ] = await Promise.all([
      this.detectBeats(audioBuffer),
      this.detectSections(audioBuffer),
      this.findRepeatedPatterns(audioBuffer),
      this.computeEnergyProfile(audioBuffer)
    ]);

    // Derive additional markers
    const drops = this.findDrops(sections, energyProfile);
    const breakdowns = this.findBreakdowns(sections, energyProfile);
    const buildups = this.findBuildups(energyProfile, drops);

    console.timeEnd('Song Analysis');

    return {
      bpm: this.estimateBPM(beats),
      timeSignature: this.detectTimeSignature(beats),
      beats,
      downbeats: beats.filter(b => b.isDownbeat).map(b => b.time),
      sections,
      patterns,
      energyProfile,
      drops,
      breakdowns,
      buildups
    };
  }

  private async detectBeats(buffer: AudioBuffer): Promise<BeatMarker[]> {
    // Use onset detection + tempo estimation
    const onsets = await this.detectOnsets(buffer);
    const tempo = this.estimateTempo(onsets);

    // Quantize onsets to grid
    const beats: BeatMarker[] = [];
    const beatInterval = 60000 / tempo; // ms per beat

    let beatIndex = 0;
    for (let t = 0; t < buffer.duration * 1000; t += beatInterval) {
      // Find nearest onset
      const nearestOnset = this.findNearestOnset(onsets, t);
      const strength = nearestOnset ? nearestOnset.strength : 0.3;

      beats.push({
        time: t,
        index: beatIndex,
        strength,
        isDownbeat: beatIndex % 4 === 0,  // Assuming 4/4
        frequency: nearestOnset?.dominantFrequency || 'bass'
      });

      beatIndex++;
    }

    return beats;
  }

  private async detectSections(buffer: AudioBuffer): Promise<SongSection[]> {
    // Compute chroma features (harmonic content)
    const chromagram = await this.computeChromagram(buffer);

    // Compute self-similarity matrix
    const ssm = this.computeSelfSimilarityMatrix(chromagram);

    // Find section boundaries via novelty detection
    const boundaries = this.detectNoveltyPeaks(ssm);

    // Classify each section
    const sections: SongSection[] = [];
    for (let i = 0; i < boundaries.length - 1; i++) {
      const startTime = boundaries[i];
      const endTime = boundaries[i + 1];

      const sectionEnergy = this.computeSectionEnergy(buffer, startTime, endTime);
      const sectionType = this.classifySection(
        sectionEnergy,
        i,
        boundaries.length,
        ssm
      );

      // Check if this section is a repeat
      const repeatInfo = this.findRepeatOf(ssm, i, sections);

      sections.push({
        type: sectionType,
        startTime,
        endTime,
        startBeat: Math.round(startTime / (60000 / this.bpm)),
        endBeat: Math.round(endTime / (60000 / this.bpm)),
        energy: sectionEnergy,
        isRepeat: repeatInfo.isRepeat,
        repeatOf: repeatInfo.repeatOf
      });
    }

    return sections;
  }

  private async findRepeatedPatterns(buffer: AudioBuffer): Promise<RepeatedPattern[]> {
    // Use audio fingerprinting to find repeated melodic/rhythmic patterns
    const fingerprints = await this.computeFingerprints(buffer, {
      windowSize: 2000,  // 2 second windows
      hopSize: 500       // Check every 500ms
    });

    // Find matching fingerprint clusters
    const clusters = this.clusterFingerprints(fingerprints);

    // Filter to significant repetitions (at least 2 occurrences)
    return clusters
      .filter(c => c.occurrences.length >= 2)
      .map((c, i) => ({
        id: `pattern_${i}`,
        occurrences: c.occurrences,
        signature: c.centroid
      }));
  }

  private classifySection(
    energy: number,
    index: number,
    totalSections: number,
    ssm: number[][]
  ): SongSection['type'] {
    // Heuristic classification based on position and energy
    const relativePosition = index / totalSections;

    if (relativePosition < 0.1) return 'intro';
    if (relativePosition > 0.9) return 'outro';

    if (energy > 0.8) return 'drop';
    if (energy > 0.65) return 'chorus';
    if (energy < 0.3) return 'breakdown';
    if (energy < 0.5) return 'verse';

    // Check if building up (energy increasing rapidly)
    const isBuilding = this.isEnergyRising(ssm, index);
    if (isBuilding) return 'prechorus';

    return 'verse';
  }
}
```

### 5.4 Choreography Map (Pre-Computed Dance Decisions)

Once we have the song structure, we can **pre-assign choreography** for the entire song:

```typescript
interface ChoreographyMap {
  // Beat-level assignments
  beatAssignments: BeatChoreography[];

  // Section-level moods
  sectionMoods: Map<number, ChoreographyMood>;

  // Signature moves for repeated patterns
  signatureMoves: Map<string, MoveSequence>;
}

interface BeatChoreography {
  beatIndex: number;
  timestamp: number;

  // Pre-selected frame
  targetFrame: string;        // Frame ID to show
  transitionMode: InterpMode; // How to transition

  // Pre-computed physics targets
  targetRotation: Vector3;
  targetSquash: number;
  targetBounce: number;

  // Effects
  fx: FXMode;
  rgbSplit: number;
  flash: number;
}

interface ChoreographyMood {
  energyLevel: 'ambient' | 'groove' | 'hype' | 'peak';
  framePool: string[];        // Which frames to use
  transitionSpeed: number;    // Base transition speed
  stutterProbability: number; // Likelihood of stutter effects
  closeupProbability: number; // Likelihood of closeup
}

class ChoreographyPlanner {
  planEntireSong(songMap: SongMap, frames: GeneratedFrame[]): ChoreographyMap {
    const beatAssignments: BeatChoreography[] = [];
    const sectionMoods = new Map<number, ChoreographyMood>();
    const signatureMoves = new Map<string, MoveSequence>();

    // 1. Assign moods to each section
    for (const section of songMap.sections) {
      sectionMoods.set(section.startBeat, this.moodForSection(section, frames));
    }

    // 2. Create signature move sequences for repeated patterns
    for (const pattern of songMap.patterns) {
      if (pattern.occurrences.length >= 2) {
        // First occurrence: generate a memorable sequence
        const sequence = this.generateSignatureSequence(pattern, frames);
        signatureMoves.set(pattern.id, sequence);
      }
    }

    // 3. Plan each beat
    let currentSection = songMap.sections[0];
    let patternSequenceIndex = new Map<string, number>();

    for (const beat of songMap.beats) {
      // Update current section
      currentSection = this.getSectionAt(songMap.sections, beat.time);
      const mood = sectionMoods.get(currentSection.startBeat)!;

      // Check if we're in a repeated pattern
      const activePattern = this.getActivePattern(songMap.patterns, beat.time);

      let choreography: BeatChoreography;

      if (activePattern && signatureMoves.has(activePattern.id)) {
        // Use signature move sequence (same moves every time pattern occurs)
        const sequence = signatureMoves.get(activePattern.id)!;
        const seqIndex = patternSequenceIndex.get(activePattern.id) || 0;
        choreography = sequence.moves[seqIndex % sequence.moves.length];
        patternSequenceIndex.set(activePattern.id, seqIndex + 1);
      } else {
        // Generate based on section mood + beat strength
        choreography = this.planBeat(beat, mood, frames, songMap.energyProfile);
      }

      beatAssignments.push(choreography);
    }

    return { beatAssignments, sectionMoods, signatureMoves };
  }

  private generateSignatureSequence(
    pattern: RepeatedPattern,
    frames: GeneratedFrame[]
  ): MoveSequence {
    // Create a memorable, repeatable sequence for this pattern
    // This is what plays EVERY time the chorus hook hits, for example

    const duration = pattern.occurrences[0].endTime - pattern.occurrences[0].startTime;
    const beatCount = Math.round(duration / (60000 / this.bpm));

    const moves: BeatChoreography[] = [];

    // Use high-energy frames for patterns (they're usually hooks/choruses)
    const highFrames = frames.filter(f => f.energy === 'high');

    for (let i = 0; i < beatCount; i++) {
      const frameIndex = i % highFrames.length;
      moves.push({
        beatIndex: i,
        timestamp: 0, // Relative to pattern start
        targetFrame: highFrames[frameIndex].pose,
        transitionMode: i % 4 === 0 ? 'CUT' : 'SLIDE',
        targetRotation: { x: 20, y: 0, z: 0 },
        targetSquash: 0.9,
        targetBounce: -30,
        fx: 'NORMAL',
        rgbSplit: i % 4 === 0 ? 0.5 : 0,
        flash: i % 4 === 0 ? 0.3 : 0
      });
    }

    return { moves, patternId: pattern.id };
  }
}
```

### 5.5 Runtime: Simple Lookup Instead of Computation

During playback, the choreography brain becomes **trivially simple**:

```typescript
class PreComputedChoreography {
  private map: ChoreographyMap;
  private currentBeatIndex: number = 0;

  constructor(map: ChoreographyMap) {
    this.map = map;
  }

  // Called every frame during playback
  update(currentTimeMs: number): BeatChoreography | null {
    // Binary search to find current beat
    const beatIndex = this.findBeatIndex(currentTimeMs);

    if (beatIndex !== this.currentBeatIndex) {
      this.currentBeatIndex = beatIndex;
      return this.map.beatAssignments[beatIndex];
    }

    return null; // No beat change, continue interpolating
  }

  // Look ahead with 100% accuracy
  peekAhead(beats: number): BeatChoreography[] {
    const start = this.currentBeatIndex;
    const end = Math.min(start + beats, this.map.beatAssignments.length);
    return this.map.beatAssignments.slice(start, end);
  }

  // Get current section info
  getCurrentSection(): SongSection {
    return this.getSectionAt(this.currentBeatIndex);
  }

  // Check if upcoming pattern is a repeat (for anticipation)
  isSignatureMovecoming(withinBeats: number): { pattern: string; inBeats: number } | null {
    // Look through upcoming beats for pattern starts
    for (let i = 0; i < withinBeats; i++) {
      const beat = this.map.beatAssignments[this.currentBeatIndex + i];
      if (beat?.patternId) {
        return { pattern: beat.patternId, inBeats: i };
      }
    }
    return null;
  }
}
```

### 5.6 Hybrid Mode: Pre-Analysis + Real-Time Fine-Tuning

The best approach combines **pre-analysis for structure** with **real-time for nuance**:

```typescript
class HybridChoreographyEngine {
  private preComputed: PreComputedChoreography;  // Song structure
  private realTimeAnalyzer: AudioAnalyzer;       // Live audio feed

  update(currentTimeMs: number, liveAudio: AudioData): ChoreographyDecision {
    // Get pre-computed decision
    const planned = this.preComputed.update(currentTimeMs);

    if (!planned) {
      // Between beats: use real-time audio for micro-expressions
      return this.microExpressions(liveAudio);
    }

    // On beat: use pre-computed frame, but modulate with live energy
    const liveIntensity = liveAudio.energy;
    const plannedIntensity = planned.energy;

    // If live is much stronger than expected, amplify effects
    const intensityRatio = liveIntensity / (plannedIntensity + 0.01);

    return {
      ...planned,
      // Amplify physics if live audio is hitting harder
      targetSquash: planned.targetSquash * Math.min(intensityRatio, 1.5),
      targetBounce: planned.targetBounce * Math.min(intensityRatio, 1.5),
      flash: planned.flash * intensityRatio,

      // Keep frame selection from pre-computed (structure)
      targetFrame: planned.targetFrame,
      transitionMode: planned.transitionMode
    };
  }

  private microExpressions(audio: AudioData): ChoreographyDecision {
    // Small physics movements between beats based on live audio
    return {
      targetFrame: null,  // Don't change frame

      // Subtle movements from live frequencies
      additionalRotation: {
        x: audio.bass * 5,
        y: audio.mid * 3,
        z: audio.high * 2
      },
      breathe: audio.energy * 0.1  // Subtle scale pulse
    };
  }
}
```

### 5.7 Benefits of Pre-Analysis

| Aspect | Real-Time Only | Pre-Analysis |
|--------|----------------|--------------|
| **Accuracy** | Guessing from 200ms | 100% knowledge |
| **Section Detection** | Energy heuristics | Actual structure |
| **Repeated Patterns** | Cannot detect | Exact matches |
| **Signature Moves** | Impossible | Same move every chorus |
| **Build-ups** | React when heard | Anticipate and prep |
| **CPU Usage** | Constant analysis | One-time + simple lookup |
| **Choreography Quality** | Reactive | Intentional |

### 5.8 When to Use Real-Time Lookahead

**Use Pre-Analysis For:**
- All file-based playback
- Known/uploaded audio

**Use Real-Time Lookahead For:**
- Microphone input (live DJ, karaoke)
- Streaming audio where full song unavailable
- "Jam mode" with live instruments

```typescript
// Mode detection
function getChoreographyEngine(audioSource: AudioSource): ChoreographyEngine {
  if (audioSource.type === 'file' && audioSource.buffer) {
    // Pre-analyze and use lookup
    const songMap = await analyzer.analyzeSong(audioSource.buffer);
    const choreoMap = planner.planEntireSong(songMap, frames);
    return new PreComputedChoreography(choreoMap);
  } else {
    // Fall back to real-time
    return new RealTimeLookahead();
  }
}

---

## Part 5B: Mechanical Frame Pipeline (Pre-Computed Derivatives)

### 5B.1 The Problem

Mechanical frames (mirror, zoom, stutter variants) are currently created in multiple places:
- Some during generation (`mirrorFrame()` in gemini.ts)
- Some during runtime (virtual zoom in Step4Preview)
- Some implicitly (stutter mode just replays frames)

This creates uncertainty about what frames exist and their properties.

### 5B.2 Solution: Frame Manifest at Generation Time

**ALL frame variants should be computed ONCE at generation time** and stored in a manifest:

```typescript
interface FrameManifest {
  // Source frames (from Gemini)
  sourceFrames: SourceFrame[];

  // All derived frames (mechanical operations)
  derivedFrames: DerivedFrame[];

  // Complete pool (source + derived)
  allFrames: ManifestFrame[];

  // Quick lookup indices
  byEnergy: Record<EnergyLevel, ManifestFrame[]>;
  byDirection: Record<MoveDirection, ManifestFrame[]>;
  byType: Record<FrameType, ManifestFrame[]>;
  byMechanical: Record<MechanicalFX, ManifestFrame[]>;
}

interface SourceFrame {
  id: string;               // e.g., "base_0"
  url: string;              // Data URL or blob URL
  role: SheetRole;          // 'base' | 'alt' | 'flourish' | 'smooth'
  gridPosition: number;     // 0-15 position in sprite sheet
  energy: EnergyLevel;
  direction: MoveDirection;
  type: FrameType;
}

interface DerivedFrame {
  id: string;               // e.g., "base_0_mirror" or "base_0_zoom_1.6"
  sourceId: string;         // Which source frame this derived from
  url: string;              // Pre-computed data URL
  operation: MechanicalOperation;
  energy: EnergyLevel;      // Inherited or modified
  direction: MoveDirection; // Flipped for mirror
  type: FrameType;
}

type MechanicalOperation =
  | { type: 'mirror'; axis: 'horizontal' | 'vertical' }
  | { type: 'zoom'; factor: number; offsetY: number }
  | { type: 'crop'; region: 'face' | 'hands' | 'upper' | 'lower' }
  | { type: 'rotate'; degrees: number }
  | { type: 'stutter'; metadata: true };  // Same URL, different playback

interface ManifestFrame {
  id: string;
  url: string;
  isSource: boolean;
  sourceId?: string;
  operation?: MechanicalOperation;
  energy: EnergyLevel;
  direction: MoveDirection;
  type: FrameType;

  // Pre-computed for choreography
  weight: number;           // How often to use (0-1)
  preferredTransitions: string[];  // IDs of frames that flow well after this
  bestForPhases: RhythmPhase[];    // When to use this frame
}
```

### 5B.3 Frame Generation Pipeline

```typescript
class FrameManifestBuilder {
  async buildManifest(
    sourceSheets: SpriteSheet[],
    subjectCategory: SubjectCategory
  ): Promise<FrameManifest> {
    const sourceFrames: SourceFrame[] = [];
    const derivedFrames: DerivedFrame[] = [];

    // 1. Extract and tag all source frames
    for (const sheet of sourceSheets) {
      const frames = await this.sliceAndTagSheet(sheet);
      sourceFrames.push(...frames);
    }

    // 2. Generate ALL mechanical derivatives upfront
    for (const source of sourceFrames) {
      const derivatives = await this.generateDerivatives(source, subjectCategory);
      derivedFrames.push(...derivatives);
    }

    // 3. Build unified pool with indices
    const allFrames = [
      ...sourceFrames.map(f => ({ ...f, isSource: true })),
      ...derivedFrames.map(f => ({ ...f, isSource: false }))
    ];

    // 4. Pre-compute choreography weights
    this.assignWeights(allFrames);
    this.computeTransitionAffinities(allFrames);

    // 5. Build lookup indices
    return {
      sourceFrames,
      derivedFrames,
      allFrames,
      byEnergy: this.indexBy(allFrames, 'energy'),
      byDirection: this.indexBy(allFrames, 'direction'),
      byType: this.indexBy(allFrames, 'type'),
      byMechanical: this.indexByOperation(derivedFrames)
    };
  }

  private async generateDerivatives(
    source: SourceFrame,
    category: SubjectCategory
  ): Promise<DerivedFrame[]> {
    const derivatives: DerivedFrame[] = [];

    // === MIRROR ===
    // Only for CHARACTER type (not TEXT/SYMBOL)
    if (category === 'CHARACTER' && source.type === 'body') {
      const mirroredUrl = await this.mirrorFrame(source.url);
      derivatives.push({
        id: `${source.id}_mirror`,
        sourceId: source.id,
        url: mirroredUrl,
        operation: { type: 'mirror', axis: 'horizontal' },
        energy: source.energy,
        direction: this.flipDirection(source.direction),
        type: source.type
      });
    }

    // === ZOOM VARIANTS ===
    // High energy frames get closeup zoom
    if (source.energy === 'high' && source.type === 'body') {
      const zoom160 = await this.zoomFrame(source.url, 1.6, 0.2);
      derivatives.push({
        id: `${source.id}_zoom_1.6`,
        sourceId: source.id,
        url: zoom160,
        operation: { type: 'zoom', factor: 1.6, offsetY: 0.2 },
        energy: 'high',
        direction: source.direction,
        type: 'closeup'  // Becomes closeup
      });
    }

    // Mid energy frames get subtle zoom
    if (source.energy === 'mid' && source.type === 'body') {
      const zoom125 = await this.zoomFrame(source.url, 1.25, 0.1);
      derivatives.push({
        id: `${source.id}_zoom_1.25`,
        sourceId: source.id,
        url: zoom125,
        operation: { type: 'zoom', factor: 1.25, offsetY: 0.1 },
        energy: source.energy,
        direction: source.direction,
        type: source.type
      });
    }

    // === MIRRORED ZOOMS ===
    // If we made a mirror AND a zoom, make mirrored zoom too
    if (category === 'CHARACTER' && source.type === 'body' && source.energy !== 'low') {
      const mirrorZoom = await this.mirrorFrame(
        derivatives.find(d => d.operation.type === 'zoom')?.url || source.url
      );
      // Add mirrored zoom variant...
    }

    return derivatives;
  }

  private async mirrorFrame(url: string): Promise<string> {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;

    // Flip horizontally
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.85);
  }

  private async zoomFrame(url: string, factor: number, offsetY: number): Promise<string> {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;

    // Calculate crop region
    const cropW = img.width / factor;
    const cropH = img.height / factor;
    const cropX = (img.width - cropW) / 2;
    const cropY = (img.height - cropH) / 2 - (offsetY * img.height);

    // Draw cropped and scaled
    ctx.drawImage(
      img,
      cropX, cropY, cropW, cropH,  // Source region
      0, 0, canvas.width, canvas.height  // Dest (full canvas)
    );

    return canvas.toDataURL('image/jpeg', 0.85);
  }

  private flipDirection(dir: MoveDirection): MoveDirection {
    if (dir === 'left') return 'right';
    if (dir === 'right') return 'left';
    return dir;  // 'center' stays center
  }
}
```

### 5B.4 Frame Weighting System

Pre-compute how often each frame should be used:

```typescript
private assignWeights(frames: ManifestFrame[]): void {
  for (const frame of frames) {
    let weight = 1.0;

    // Source frames preferred over derivatives (more authentic)
    if (!frame.isSource) weight *= 0.7;

    // Mirror frames slightly less common (variety, not dominance)
    if (frame.operation?.type === 'mirror') weight *= 0.8;

    // Zoom frames only for specific moments
    if (frame.operation?.type === 'zoom') {
      weight *= 0.5;  // Less common overall
      frame.bestForPhases = ['DROP', 'CHAOS', 'CLOSEUP_LOCK'];
    }

    // High energy frames reserved for high moments
    if (frame.energy === 'high') {
      frame.bestForPhases = ['DROP', 'CHAOS', 'SWING_LEFT', 'SWING_RIGHT'];
    }

    // Closeups for vocal sections
    if (frame.type === 'closeup') {
      frame.bestForPhases = ['VOGUE', 'CLOSEUP_LOCK'];
      weight *= 0.4;  // Rare, special
    }

    frame.weight = weight;
  }
}

private computeTransitionAffinities(frames: ManifestFrame[]): void {
  for (const frame of frames) {
    frame.preferredTransitions = [];

    // Prefer transitions to opposite direction (ping-pong)
    const opposite = this.flipDirection(frame.direction);
    const oppositeFrames = frames.filter(f =>
      f.direction === opposite &&
      f.energy === frame.energy &&
      f.id !== frame.id
    );
    frame.preferredTransitions.push(...oppositeFrames.map(f => f.id));

    // Also allow same-direction with different pose
    const sameDir = frames.filter(f =>
      f.direction === frame.direction &&
      f.sourceId !== frame.sourceId &&
      f.id !== frame.id
    );
    frame.preferredTransitions.push(...sameDir.slice(0, 3).map(f => f.id));
  }
}
```

### 5B.5 Choreography Uses Manifest

The pre-computed choreography planner now has **complete knowledge** of all frames:

```typescript
class ChoreographyPlanner {
  constructor(private manifest: FrameManifest) {}

  selectFrameForBeat(
    beat: BeatMarker,
    phase: RhythmPhase,
    previousFrameId: string | null
  ): ManifestFrame {
    // Get candidate pool based on phase
    let pool = this.manifest.allFrames.filter(f =>
      f.bestForPhases?.includes(phase) || !f.bestForPhases
    );

    // Filter by energy
    const targetEnergy = this.energyForPhase(phase);
    pool = pool.filter(f => f.energy === targetEnergy);

    // Prefer frames that flow well from previous
    if (previousFrameId) {
      const prev = this.manifest.allFrames.find(f => f.id === previousFrameId);
      if (prev?.preferredTransitions.length) {
        const preferred = pool.filter(f => prev.preferredTransitions.includes(f.id));
        if (preferred.length > 0) pool = preferred;
      }
    }

    // Weighted random selection
    const totalWeight = pool.reduce((sum, f) => sum + f.weight, 0);
    let r = Math.random() * totalWeight;
    for (const frame of pool) {
      r -= frame.weight;
      if (r <= 0) return frame;
    }

    return pool[0];  // Fallback
  }
}
```

### 5B.6 Benefits of Pre-Computed Manifest

| Without Manifest | With Manifest |
|-----------------|---------------|
| Mirror frames created on-demand | All mirrors pre-computed |
| Virtual zoom applied at render time | Zoom frames pre-rendered |
| Frame properties guessed from grid position | Properties explicitly tagged |
| No transition preferences | Pre-computed flow affinities |
| Mechanical frames scattered in code | Single source of truth |
| Runtime image processing | Zero runtime processing |
| Inconsistent frame pool across sessions | Deterministic frame pool |

### 5B.7 Storage Efficiency

```typescript
interface CompactManifest {
  // Store URLs separately (can be blob URLs or CDN)
  urls: string[];

  // Compact frame data (indexes into urls array)
  frames: CompactFrame[];
}

interface CompactFrame {
  u: number;      // URL index
  e: 0|1|2;       // Energy (low=0, mid=1, high=2)
  d: 0|1|2;       // Direction (left=0, center=1, right=2)
  t: 0|1;         // Type (body=0, closeup=1)
  s?: number;     // Source frame index (for derivatives)
  o?: number;     // Operation type
  w: number;      // Weight (0-100, stored as int)
  p: number[];    // Preferred transition indices
}

// Serialize/deserialize for caching
function serializeManifest(m: FrameManifest): string {
  return JSON.stringify(toCompact(m));
}

function deserializeManifest(json: string): FrameManifest {
  return fromCompact(JSON.parse(json));
}
```

---

## Part 5C: Dual-Mode Architecture (Pre-Analysis + Real-Time)

### 5C.1 Why Both Systems Are Needed

You're absolutely right - we need **BOTH** systems:

| Input Type | Pre-Analysis | Real-Time | Why |
|------------|--------------|-----------|-----|
| Uploaded audio file | ✅ Primary | ✅ Fine-tuning | Pre-analyze structure, real-time for live energy |
| Streaming audio | ❌ Not possible | ✅ Only option | Can't analyze what we don't have yet |
| Live microphone | ❌ Not possible | ✅ Only option | Truly unpredictable |
| Pre-analyzed + playing | ✅ Structure | ✅ Modulation | Best of both worlds |

### 5C.2 Unified Engine Architecture

```typescript
class DualModeChoreographyEngine {
  private preComputed: PreComputedChoreography | null = null;
  private realTime: RealTimeAnalyzer;
  private manifest: FrameManifest;
  private mode: 'file' | 'stream' | 'mic';

  constructor(manifest: FrameManifest) {
    this.manifest = manifest;
    this.realTime = new RealTimeAnalyzer();
  }

  async initialize(audioSource: AudioSource): Promise<void> {
    if (audioSource.type === 'file' && audioSource.buffer) {
      // File mode: pre-analyze entire song
      this.mode = 'file';
      const songMap = await this.analyzeSong(audioSource.buffer);
      const choreoMap = this.planChoreography(songMap);
      this.preComputed = new PreComputedChoreography(choreoMap);
      console.log('Pre-analyzed song:', songMap.sections.length, 'sections');
    } else if (audioSource.type === 'stream') {
      // Streaming: real-time only, but accumulate for partial analysis
      this.mode = 'stream';
      this.preComputed = null;
    } else {
      // Mic: pure real-time
      this.mode = 'mic';
      this.preComputed = null;
    }
  }

  update(currentTimeMs: number, liveAudio: AudioData): ChoreographyDecision {
    // Always update real-time analyzer (maintains history)
    this.realTime.update(liveAudio);

    if (this.preComputed && this.mode === 'file') {
      // === FILE MODE: Pre-computed + real-time modulation ===
      return this.fileMode(currentTimeMs, liveAudio);
    } else {
      // === LIVE MODE: Real-time only ===
      return this.liveMode(liveAudio);
    }
  }

  private fileMode(timeMs: number, liveAudio: AudioData): ChoreographyDecision {
    const planned = this.preComputed!.getBeatAt(timeMs);

    if (!planned) {
      // Between beats: micro-expressions from live audio
      return {
        frameId: null,  // Keep current frame
        physics: this.realTime.getMicroPhysics(liveAudio),
        fx: null
      };
    }

    // On beat: use pre-planned frame, modulate physics with live energy
    const liveEnergy = liveAudio.energy;
    const plannedEnergy = planned.expectedEnergy;
    const energyRatio = liveEnergy / (plannedEnergy + 0.01);

    return {
      frameId: planned.frameId,
      transitionMode: planned.transitionMode,
      physics: {
        rotX: planned.physics.rotX * Math.min(energyRatio, 1.3),
        rotY: planned.physics.rotY * Math.min(energyRatio, 1.3),
        squash: planned.physics.squash * energyRatio,
        bounce: planned.physics.bounce * energyRatio
      },
      fx: {
        flash: planned.fx.flash * energyRatio,
        rgbSplit: planned.fx.rgbSplit,
        mode: planned.fx.mode
      }
    };
  }

  private liveMode(audio: AudioData): ChoreographyDecision {
    // Fully real-time: detect beats, select frames dynamically
    const analysis = this.realTime.analyze(audio);

    if (analysis.beatDetected) {
      // Select frame based on current state
      const phase = this.realTime.getCurrentPhase();
      const frame = this.selectFrameRealTime(phase, audio);

      return {
        frameId: frame.id,
        transitionMode: this.realTime.selectTransition(phase, audio),
        physics: this.realTime.getPhysics(audio),
        fx: this.realTime.getFX(phase, audio)
      };
    }

    // No beat: micro-expressions
    return {
      frameId: null,
      physics: this.realTime.getMicroPhysics(audio),
      fx: null
    };
  }

  private selectFrameRealTime(phase: RhythmPhase, audio: AudioData): ManifestFrame {
    // Use manifest for frame selection even in real-time mode
    const pool = this.manifest.byEnergy[this.energyForPhase(phase)];
    const filtered = pool.filter(f => f.bestForPhases?.includes(phase) || !f.bestForPhases);

    // Weighted random from manifest weights
    return this.weightedSelect(filtered);
  }
}
```

### 5C.3 Streaming Mode: Progressive Analysis

For streaming audio, we can **progressively build** a partial song map:

```typescript
class ProgressiveAnalyzer {
  private accumulator: AudioSample[] = [];
  private partialSongMap: Partial<SongMap> = {};
  private lastAnalysisTime: number = 0;

  // Call every frame with new audio data
  accumulate(sample: AudioSample): void {
    this.accumulator.push(sample);

    // Re-analyze every 10 seconds of accumulated audio
    if (this.accumulator.length > this.lastAnalysisTime + 600) { // 10s at 60fps
      this.reanalyze();
      this.lastAnalysisTime = this.accumulator.length;
    }
  }

  private reanalyze(): void {
    // Detect BPM from accumulated data
    if (!this.partialSongMap.bpm) {
      const intervals = this.detectBeatIntervals(this.accumulator);
      if (intervals.length > 8) {
        this.partialSongMap.bpm = this.estimateBPM(intervals);
      }
    }

    // Detect any repeated patterns
    const patterns = this.findRepeats(this.accumulator);
    if (patterns.length > 0) {
      this.partialSongMap.patterns = patterns;
    }

    // Estimate current section based on energy curve
    const energyCurve = this.accumulator.map(s => s.energy);
    this.partialSongMap.currentSection = this.classifySection(energyCurve);
  }

  // Returns whatever we know so far
  getPartialMap(): Partial<SongMap> {
    return this.partialSongMap;
  }
}
```

### 5C.4 Mode Transitions

Handle switching between modes gracefully:

```typescript
class DualModeChoreographyEngine {
  // ... previous code ...

  // Called when user switches from mic to file, etc.
  async switchSource(newSource: AudioSource): Promise<void> {
    const previousMode = this.mode;

    await this.initialize(newSource);

    // Smooth transition: keep current frame briefly
    if (previousMode !== this.mode) {
      this.transitionGracePeriod = 500; // ms
    }
  }

  // For streaming that becomes a complete file (e.g., YouTube video loads fully)
  async upgradeToFullAnalysis(completeBuffer: AudioBuffer): Promise<void> {
    if (this.mode === 'stream') {
      console.log('Upgrading stream to pre-analyzed mode');
      const songMap = await this.analyzeSong(completeBuffer);
      const choreoMap = this.planChoreography(songMap);
      this.preComputed = new PreComputedChoreography(choreoMap);
      this.mode = 'file';
    }
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
