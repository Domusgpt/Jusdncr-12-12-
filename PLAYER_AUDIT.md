# jusDNCE Player - Complete UI & Functionality Audit

**File:** `services/playerExport.ts` (~2,800 lines)
**Purpose:** Generates standalone HTML player with embedded choreography engine

---

## SCREEN LAYOUT (ASCII)

```
+--------------------------------------------------------------------------------+
|                              STATUS BAR (TOP)                                   |
|  +------+ +------+ +------+    [120 BPM] [||||]    +------+ +------+           |
|  | PLAY | |  MIC | |UPLOAD|                        |  CAM | | MORE |           |
|  +------+ +------+ +------+                        +------+ +------+           |
+--------------------------------------------------------------------------------+
|       ADAPTER TRAY (top-right floating)                                        |
|                                        +--------+ +--------+ +--------+        |
|                                        |  File  | |  Mic   | | System |        |
|                                        +--------+ +--------+ +--------+        |
|                                                                                 |
+----+                                                                      +----+
|    |                                                                      |    |
|    |                                                                      | R  |
| L  |                                                                      | I  |
| E  |                                                                      | G  |
| F  |              +------------------------------------+                  | H  |
| T  |              |                                    |                  | T  |
|    |              |      QUANTUM VISUALIZER            |                  |    |
| B  |              |         (WebGL Canvas)             |                  | B  |
| E  |              |                                    |                  | E  |
| Z  |              |      CHARACTER OVERLAY             |                  | Z  |
| E  |              |        (2D Canvas)                 |                  | E  |
| L  |              |                                    |                  | L  |
|    |              +------------------------------------+                  |    |
| F  |                                                                      | M  |
| X  |              +------------------------------------+                  | O  |
|    |              |    TOUCH ZONE CONTROLLER           |                  | D  |
+----+              |  LEFT=PATTERN    |   RIGHT=KINETIC |                  | E  |
|                   +------------------------------------+                  +----+
|                                                                                 |
|                         [ PATTERN INDICATOR ]                                   |
|                                                                                 |
+--------------------------------------------------------------------------------+
|                            ENGINE STRIP (BOTTOM)                                |
|  [PING][DROP][STUT][VOGU][FLOW][CHAOS][ABAB][AABB][ABAC][SNARE][GROOV]...      |
|                                                                                 |
|  [LEGACY|LABAN]  [PATTERN|KINETIC]  [====INTENSITY====]  [MIXER]              |
+--------------------------------------------------------------------------------+
```

---

## LAYERED OVERLAYS

```
+----------------------------------------------+
|           GESTURE GATE (z-index 600)         |
|  +----------------------------------------+  |
|  |        jusDNCE                         |  |
|  |  Tap to arm audio + mic permissions    |  |
|  |          [ START ]                     |  |
|  +----------------------------------------+  |
+----------------------------------------------+

+----------------------------------------------+
|        PATTERN JOYSTICK (z-index 15)         |
|       Appears at touch point                 |
|                                              |
|           P   D   S                          |
|         .   +-+   .                          |
|        V  / XXX \  F                         |
|        . |  O    | .                         |
|        C  \ XXX /  A                         |
|         .   +-+   .                          |
|           A   A   S                          |
|                                              |
|      (Radial dial around touch point)        |
+----------------------------------------------+

+----------------------------------------------+
|        MIXER DRAWER (z-index 100)            |
|  +----------------------------------------+  |
|  |========= handle bar ==========         |  |
|  |  [DECKS]  [ENGINE]  [FX]              |  |
|  |                                        |  |
|  |  Tab Content varies by selection       |  |
|  +----------------------------------------+  |
+----------------------------------------------+

+----------------------------------------------+
|         HELP OVERLAY (z-index 400)           |
|  +----------------------------------------+  |
|  |  KEYBOARD SHORTCUTS                    |  |
|  |  SPACE  - Play/Pause                   |  |
|  |  M      - Mixer                        |  |
|  |  D      - Deck                         |  |
|  |  C      - Camera                       |  |
|  |  Q W E R - Trigger pads                |  |
|  |  1-0    - Patterns                     |  |
|  |  L      - LEGACY/LABAN                 |  |
|  |  K      - PATTERN/KINETIC              |  |
|  |  S      - Shuffle                      |  |
|  |  ?      - Help                         |  |
|  +----------------------------------------+  |
+----------------------------------------------+
```

---

## COMPONENT BREAKDOWN

### 1. STATUS BAR (Top)
```
+-----------------------------------------------------------------------+
| [PLAY] [MIC] [UPLOAD]     [120 BPM] [|...|]     [CAM] [MORE]          |
+-----------------------------------------------------------------------+

Buttons:
- btnPlay2: Play/Pause audio
- btnMic2: Toggle microphone (with synthetic fallback)
- btnUpload2: Upload audio file
- btnCam2: Toggle dynamic camera
- btnMore: Open help

Display:
- bpmValue2: Current BPM (auto-detected)
- beatBars: 4-beat visual indicator (downbeat highlighted cyan)
```

### 2. LEFT BEZEL (FX Controls)
```
Collapsed:          Expanded:
+-------+           +---------------+
| o RGB |           | [RGB SPLIT]   |
| o GLCH|           | [GLITCH]      |
| o PXLT|           | [PIXELATE]    |
| o BLOOM           | [BLOOM]       |
| o INVT|           | [INVERT]      |
| o VHS |           | [VHS]         |
| o SCAN|           | [SCANLINES]   |
| o MIRR|           | [MIRROR]      |
| o KALD|           | [KALEID]      |
|-------|           |---------------|
|[==x==]|           | FX Intensity  |
|[==y==]|           | [====slider===]|
+-------+           +---------------+

FX Effects Available:
- RGB Split: Chromatic aberration
- Glitch: Random slice displacement
- Pixelate: Reduce resolution
- Bloom: Glow effect
- Invert: Color inversion
- VHS: Retro video look
- Scanlines: CRT effect
- Mirror: Horizontal flip
- Kaleidoscope: Radial symmetry
```

### 3. RIGHT BEZEL (Mode Controls)
```
Collapsed:          Expanded:
+-------+           +---------------+
|   L   |           | [LEG] [LAB]   |
|-------|           |---------------|
|   P   |           | [PAT] [KIN]   |
|-------|           |---------------|
|  50   |           | INT           |
|-------|           | [====slider===]|
|   o   |           | [MIX]         |
+-------+           +---------------+

Controls:
- Physics: LEGACY / LABAN
- Engine: PATTERN / KINETIC
- Intensity slider (0-100)
- Mixer toggle
```

### 4. ENGINE STRIP (Bottom)
```
+-----------------------------------------------------------------------+
|  PATTERN ROW (horizontal scroll):                                      |
|  [PING PONG] [BUILD DROP] [STUTTER] [VOGUE] [FLOW] [CHAOS]            |
|  [ABAB] [AABB] [ABAC] [SNARE ROLL] [GROOVE] [EMOTE] [FOOTWORK]        |
|  [IMPACT] [MINIMAL]                                                    |
|-----------------------------------------------------------------------|
|  [LEGACY|LABAN]  [PATTERN|KINETIC]  [=====INTENSITY=====]  [MIXER]    |
+-----------------------------------------------------------------------+
```

### 5. TOUCH ZONE CONTROLLER
```
+-----------------------------------+-----------------------------------+
|           LEFT HALF               |          RIGHT HALF               |
|                                   |                                   |
|         PATTERN MODE              |         KINETIC MODE              |
|                                   |                                   |
|    Touch here to:                 |    Touch here to:                 |
|    - Set mode to PATTERN          |    - Set mode to KINETIC          |
|    - Show pattern joystick        |    - Show kinetic joystick        |
|    - Select pattern by drag       |    - Control via drag             |
|                                   |                                   |
+-----------------------------------+-----------------------------------+
```

### 6. ADAPTER TRAY (Audio Sources)
```
+--------+ +--------+ +--------+
|o File  | |o Mic   | |o System|
+--------+ +--------+ +--------+

Adapters:
- File: Load audio from file picker (audio/*, video/*)
- Mic: Microphone input (with secure context detection)
- System: System audio capture (getDisplayMedia)
```

### 7. MIXER DRAWER (Pull-up Panel)
```
+-----------------------------------------------------------------------+
|                    ======== HANDLE ========                            |
|  [DECKS]    [ENGINE]    [FX]                                          |
|-----------------------------------------------------------------------|
|  DECKS TAB:                                                            |
|  +--------+ +--------+ +--------+ +--------+                          |
|  |  CH 1  | |  CH 2  | |  CH 3  | |  CH 4  |                          |
|  | [SEQ v]| |[OFF v] | |[OFF v] | |[OFF v] |                          |
|  +--------+ +--------+ +--------+ +--------+                          |
|                                                                        |
|  BPM / BAR:                                                            |
|  [120 BPM]  [||||||||||||||||] (16-beat bar counter)                  |
|                                                                        |
|  TRIGGER PADS (hold to activate):                                     |
|  [STUTTER Q] [REVERSE W] [GLITCH E] [BURST R]                         |
|-----------------------------------------------------------------------|
|  ENGINE TAB:                                                           |
|  Physics: [LEGACY] [LABAN]                                            |
|  Engine:  [PATTERN] [KINETIC]                                         |
|                                                                        |
|  LABAN Effort (when LABAN active):                                    |
|  WEIGHT: 0.50  SPACE: 0.50  TIME: 0.50  FLOW: 0.50                    |
|                                                                        |
|  Sequence Mode:                                                        |
|  [GROOVE] [EMOTE] [IMPACT] [FOOTWORK]                                 |
|                                                                        |
|  Patterns (15 total):                                                  |
|  [PING] [DROP] [STUT] [VOGUE] [FLOW]                                  |
|  [CHAOS] [ABAB] [AABB] [ABAC] [SNARE]                                 |
|  [GROOVE] [EMOTE] [FOOT] [IMPACT] [MIN]                               |
|                                                                        |
|  Intensity Sliders:                                                    |
|  Energy  [================]                                            |
|  Stutter [================]                                            |
|-----------------------------------------------------------------------|
|  FX TAB:                                                               |
|  FX SLIDERS:                                                           |
|  RGB [||]  FLASH [||]  GLITCH [||]  ZOOM [||]                         |
|                                                                        |
|  FX TOGGLES:                                                           |
|  [INVERT] [B+W] [MIRROR] [STROBE] [PIXEL] [SCAN]                      |
|                                                                        |
|  FILTER:                                                               |
|  Hue        [================] 0-360                                   |
|  Saturation [================] 0-200                                   |
|  Contrast   [================] 50-150                                  |
+-----------------------------------------------------------------------+
```

---

## ENGINE STATE MACHINE

```
STATE Object:
{
  // Camera/Physics
  masterRot: {x, y, z},        // Current rotation
  masterVel: {x, y, z},        // Rotation velocity
  camZoom: 1.15,               // Camera zoom
  camPanX: 0,                  // Camera pan
  charSquash: 1.0,             // Vertical squash
  charSkew: 0.0,               // Horizontal skew
  charTilt: 0.0,               // Tilt angle
  charBounceY: 0.0,            // Vertical bounce
  dynamicCam: true,            // Camera enabled

  // Frame Transitions
  sourcePose: 'base',          // Previous frame
  targetPose: 'base',          // Current frame
  transitionProgress: 1.0,     // 0-1 transition
  transitionSpeed: 10.0,       // Transition rate
  transitionMode: 'CUT',       // CUT/MORPH/SLIDE/ZOOM_IN/SMOOTH

  // Choreography Engine
  physicsStyle: 'LEGACY',      // LEGACY or LABAN
  engineMode: 'PATTERN',       // PATTERN or KINETIC
  pattern: 'PING_PONG',        // Current pattern
  sequenceMode: 'GROOVE',      // GROOVE/EMOTE/IMPACT/FOOTWORK
  energyMultiplier: 1.0,       // Energy sensitivity
  stutterChance: 0.3,          // Stutter probability

  // LABAN Effort (calculated from audio)
  labanEffort: {
    weight: 0.5,               // Bass = strong
    space: 0.5,                // High = direct
    time: 0.5,                 // Volatility = sudden
    flow: 0.5                  // Mid stability = bound
  },

  // 4-Channel Deck
  deckModes: ['sequencer', 'off', 'off', 'off'],
  activeDeck: 0,

  // BPM/Beat Tracking
  bpm: 120,
  beatInBar: 0,                // 0-15 (16 beats)
  barCount: 0,
  lastBeatTime: 0,
  beatIntervals: [],           // For BPM calculation

  // Trigger Pads
  triggers: {
    stutter: false,
    reverse: false,
    glitch: false,
    burst: false
  },

  // FX State
  fx: {
    rgb: 0, flash: 0, glitch: 0, zoom: 0,
    invert: false, grayscale: false, mirror: false,
    strobe: false, pixelate: false, scanlines: false,
    hue: 0, saturation: 100, contrast: 100
  },

  // Synthetic Beat (fallback)
  syntheticBeat: false,
  synthBPM: 120,
  synthPhase: 0
}
```

---

## PATTERNS (15 Total)

```
+-------------+----------------------------------------+
| Pattern     | Behavior                               |
+-------------+----------------------------------------+
| PING_PONG   | Alternates left/right on beat          |
| BUILD_DROP  | Builds energy then drops               |
| STUTTER     | Rapid frame swaps                      |
| VOGUE       | Pose-focused, dramatic holds           |
| FLOW        | Smooth mid-energy transitions          |
| CHAOS       | Random all-energy mix                  |
| ABAB        | Alternates 2 frames                    |
| AABB        | Pairs of frames                        |
| ABAC        | Pattern with return to A               |
| SNARE_ROLL  | Rapid on snare hits                    |
| GROOVE      | Mid-energy dance focus                 |
| EMOTE       | Closeup/face focus                     |
| FOOTWORK    | Left/right directional                 |
| IMPACT      | High-energy impacts                    |
| MINIMAL     | Low-energy, ambient                    |
+-------------+----------------------------------------+
```

---

## PHYSICS STYLES

```
LEGACY (Default):
- Spring-based physics: stiffness=140, damping=8
- Direct audio mapping to rotation
- Standard squash/stretch on beat

LABAN (Movement Quality):
- Effort-based physics calculated from audio:
  * Weight = bass level (strong/light)
  * Space = high frequency (direct/indirect)
  * Time = energy volatility (sudden/sustained)
  * Flow = mid stability (bound/free)
- Modifies stiffness/damping based on effort
- More expressive, human-like motion
```

---

## KEYBOARD SHORTCUTS

```
+-------+--------------------------------+
| Key   | Action                         |
+-------+--------------------------------+
| SPACE | Play/Pause audio               |
| M     | Toggle mixer panel             |
| D     | Toggle frame deck              |
| C     | Toggle dynamic camera          |
| Q     | Trigger: STUTTER (hold)        |
| W     | Trigger: REVERSE (hold)        |
| E     | Trigger: GLITCH (hold)         |
| R     | Trigger: BURST (hold)          |
| 1-0   | Select patterns 1-10           |
| L     | Toggle LEGACY/LABAN            |
| K     | Toggle PATTERN/KINETIC         |
| S     | Toggle pattern shuffle         |
| ?     | Show/hide help                 |
+-------+--------------------------------+
```

---

## AUDIO SOURCES

```
1. FILE UPLOAD
   - Input: audio/*, video/*
   - Uses MediaElementSource
   - Connected to analyser

2. MICROPHONE
   - Requires HTTPS or localhost
   - getUserMedia with:
     * echoCancellation: false
     * noiseSuppression: false
     * autoGainControl: false
   - Falls back to synthetic beat if blocked

3. SYSTEM AUDIO
   - Uses getDisplayMedia({ audio: true })
   - Captures system/tab audio
   - Video track immediately stopped

4. STREAMING URL
   - Paste any streaming URL
   - Clipboard paste support
   - Loads into audio element

5. SYNTHETIC BEAT
   - Fallback when no audio
   - Generates rhythmic patterns:
     * Kick on beats 1, 3
     * Snare on beats 2, 4
     * Hi-hat on 8ths
   - Configurable BPM (default 120)
```

---

## TRANSITION MODES

```
+----------+------------------------------+
| Mode     | Description                  |
+----------+------------------------------+
| CUT      | Instant switch (speed 1000)  |
| MORPH    | Crossfade blend (speed 5)    |
| SLIDE    | Horizontal slide (speed 8)   |
| ZOOM_IN  | Zoom into new (speed 6)      |
| SMOOTH   | Gentle fade (speed 1.5)      |
+----------+------------------------------+
```

---

## VISUAL EFFECTS PIPELINE

```
1. Background (bgCanvas - WebGL):
   - Quantum Visualizer shader
   - Audio-reactive color/motion
   - Camera rotation from physics

2. Character (charCanvas - 2D):
   - Frame rendering with transforms
   - Squash/stretch/skew/bounce
   - Filter pipeline:
     * Invert
     * Grayscale
     * Hue rotate
     * Saturate
     * Contrast
   - Glitch slices
   - Flash overlay

3. FX Processing:
   - RGB Split (chromatic aberration)
   - Pixelate (resolution reduction)
   - Bloom (glow)
   - VHS (noise + scan)
   - Scanlines (CRT effect)
   - Mirror (horizontal flip)
   - Kaleidoscope (radial)
   - Strobe (beat flash)
```

---

## FRAME ORGANIZATION

```
FRAMES_BY_ENERGY:
  low:  []  // Idle, subtle poses
  mid:  []  // Standard dance poses
  high: []  // Intense, dynamic poses

CLOSEUPS: []  // Face/detail shots

Virtual Frames (auto-generated):
  *_vzoom: Zoomed version of high-energy body
  *_vmid:  Zoomed version of mid-energy body

Direction Filtering:
  left:   []  // Left-facing poses
  right:  []  // Right-facing poses
  center: []  // Neutral poses
```

---

## BEAT DETECTION ALGORITHM

```javascript
function updateBPM(bass, now) {
  // Onset detection
  if (bass > 0.5 && (now - lastBeatTime) > 200) {
    interval = now - lastBeatTime;
    lastBeatTime = now;

    if (interval > 200 && interval < 2000) {
      beatIntervals.push(interval);
      if (beatIntervals.length > 8) beatIntervals.shift();

      if (beatIntervals.length >= 4) {
        avgInterval = sum(beatIntervals) / length;
        bpm = 60000 / avgInterval;
        bpm = clamp(bpm, 60, 200);
      }
    }

    // Bar tracking (16 beats per bar)
    beatInBar = (beatInBar + 1) % 16;
    if (beatInBar === 0) barCount++;
  }
}
```

---

## MISSING FROM CURRENT IMPLEMENTATION

Based on review, the following need verification:

### MP4 Export System
- [ ] Watermark system
- [ ] Codec selection with fallbacks
- [ ] Portrait/Landscape aspect ratio options
- [ ] Quality settings
- [ ] Timeline for song position
- [ ] Record function for streaming

### QR Code System
- [ ] Generation for sharing
- [ ] Embedding in exports

### Advanced Audio Features
- [ ] Streaming URL record function
- [ ] Timeline scrubbing
- [ ] Track position selection

---

## FILE DEPENDENCIES

```
External:
- Google Fonts: Rajdhani (400, 600, 700, 900)
- WebGL shaders: VERTEX_SHADER, FRAGMENT_SHADER

Internal:
- GeneratedFrame type
- SubjectCategory type
- HolographicParams type
```

---

**Last Updated:** 2026-01-10
**Auditor:** Claude AI (claude/analyze-jusdnce-architecture-j3Ah8)
