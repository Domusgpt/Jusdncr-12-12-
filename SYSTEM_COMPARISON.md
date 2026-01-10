# jusDNCE System Comparison: Web vs Flutter

**Purpose:** Determine which implementation has BEST UX/functionality for each feature
**Decision Criteria:** Working properly, intuitive UX, code maintainability

---

## AUDIO SOURCE SELECTOR

### Current Web (Step4Preview + StatusBar)
```
+-------+-------+-------+-------+
| PLAY/ | LINK  |  MIC  | ...   |
| UPLOAD|       |       |       |
+-------+-------+-------+-------+

Problems:
- Upload button REPLACES Play button when no audio
- No clear way to switch between sources
- Streaming URL hidden behind Link icon
- Confusing: which source is active?
```

### Firebase Branch playerExport.ts (Better!)
```
+-------------------------------------------+
|          GESTURE GATE (on start)          |
|   "Tap to arm audio + mic permissions"    |
+-------------------------------------------+

+--------+ +--------+ +--------+
|o File  | |o Mic   | |o System|
+--------+ +--------+ +--------+
     (Adapter Pills - always visible)

Benefits:
- Clear indication of which source is active
- All 3 options visible at once
- Gesture gate handles permission flow
- Radio-button behavior (one active at a time)
```

### RECOMMENDATION: Adapter Pill System
```
+--------------------------------------------------+
|   EXPANDABLE AUDIO SOURCE SELECTOR               |
|                                                  |
|   Collapsed: [🎵 FILE ▼]                         |
|                                                  |
|   Expanded:                                      |
|   +--------+ +--------+ +--------+ +--------+   |
|   |o FILE  | |o MIC   | |o STREAM| |o SYSTEM|   |
|   |Upload  | |Live    | |URL     | |Capture |   |
|   +--------+ +--------+ +--------+ +--------+   |
|                                                  |
|   When Stream selected: [_____URL_____] [LINK]  |
+--------------------------------------------------+

Features:
- Shows current source in collapsed state
- Tap to expand all options
- Clear visual indicator (radio dot) of active source
- Stream URL input appears when needed
- System audio capture (getDisplayMedia)
```

---

## PATTERNS: What They Actually Do

### Frame Selection Patterns (15 total)

| Pattern | Frame Pool | Selection Logic | Use Case |
|---------|------------|-----------------|----------|
| **PING_PONG** | Energy-based | L↔R on beat, follow energy | Default dance |
| **BUILD_DROP** | High energy | Hold → burst on drop | EDM builds |
| **STUTTER** | Current pool | 70% random swap | Glitch dance |
| **VOGUE** | Mid/High | Hold poses longer | Posing |
| **FLOW** | Mid energy | Smooth transitions | Melodic |
| **CHAOS** | ALL frames | Pure random | Madness |
| **ABAB** | Current pool | Alternate 2 frames | Simple |
| **AABB** | Current pool | Pairs (same 2x) | Doubling |
| **ABAC** | Current pool | Return to A | Call-response |
| **SNARE_ROLL** | Current pool | Rapid on snare | Hi-hat fills |
| **GROOVE** | Mid energy | Standard dance | Default |
| **EMOTE** | Closeups | Face focus | Reactions |
| **FOOTWORK** | L/R directed | Side to side | Footwork |
| **IMPACT** | High energy | Explosive | Hard hits |
| **MINIMAL** | Low energy | Ambient | Chill |

### Physics Styles

| Style | What It Does |
|-------|--------------|
| **LEGACY** | Direct audio→physics mapping. Bass=squash, Mid=tilt, High=rotation. Spring physics: stiffness=140, damping=8 |
| **LABAN** | Effort-based physics from audio analysis. Weight (bass), Space (high), Time (volatility), Flow (stability). More human-like motion. |

### Engine Modes

| Mode | What It Does |
|------|--------------|
| **PATTERN** | Frame selection based on pattern algorithm + audio. Physics auto-driven. |
| **KINETIC** | Direct touch/joystick control of position, scale, rotation. Frame selection still on beat but position is manual. |

---

## JOYSTICK CONTROL

### Web playerExport.ts (Firebase)
```
+-----------------------------------+-----------------------------------+
|           LEFT HALF               |          RIGHT HALF               |
|                                   |                                   |
|    Touch activates PATTERN mode   |    Touch activates KINETIC mode   |
|                                   |                                   |
|    Drag shows Pattern Joystick:   |    Drag shows Kinetic Joystick:   |
|                                   |                                   |
|         (radial dial)             |         (position control)        |
|        P   D   S                  |              ^                    |
|      V   [O]   F                  |          <   O   >                |
|        C   A   S                  |              v                    |
|                                   |                                   |
|    Patterns arranged in circle    |    X/Y mapped to char position    |
+-----------------------------------+-----------------------------------+

Joystick Labels (8 directions):
- Top: PING_PONG
- Top-Right: BUILD_DROP
- Right: STUTTER
- Bottom-Right: VOGUE
- Bottom: FLOW
- Bottom-Left: CHAOS
- Left: ABAB
- Top-Left: SNARE_ROLL
```

### Flutter Implementation
```
TouchZone widget:
- Left half → EngineMode.pattern
- Right half → EngineMode.kinetic

PatternJoystick widget:
- Radial dial with 15 patterns
- Drag to select
- Visual feedback on selection
```

### VERDICT: Both implementations are similar
- Web has more patterns in joystick (only 8 visible)
- Flutter has all 15 accessible
- Both use left/right zone split correctly

---

## TRIGGER PADS

| Trigger | Key | Effect |
|---------|-----|--------|
| **STUTTER** | Q | Force rapid frame swaps + skew |
| **REVERSE** | W | Swap source↔target poses |
| **GLITCH** | E | Random X displacement + hue shift |
| **BURST** | R | Flash + scale up |

### Web: Hold keys Q/W/E/R
### Flutter: setTrigger('name', true/false)

---

## VISUAL EFFECTS (FX)

### Toggle Effects
| Effect | What It Does |
|--------|--------------|
| RGB Split | Chromatic aberration (R/G/B offset) |
| Glitch | Random slice displacement |
| Pixelate | Reduce resolution |
| Bloom | Glow effect |
| Invert | Color inversion |
| VHS | Noise + scan lines |
| Scanlines | CRT lines |
| Mirror | Horizontal flip |
| Kaleidoscope | Radial symmetry |
| Strobe | Flash on beat |
| Grayscale | Remove color |

### Slider Effects
| Effect | Range | What It Does |
|--------|-------|--------------|
| Hue | 0-360 | Color rotation |
| Saturation | 0-200 | Color intensity |
| Contrast | 50-150 | Light/dark range |

---

## EXPORT SYSTEM

### Current Web (playerExport.ts)
- Generates 2,788-line standalone HTML
- Embeds all frames as base64
- Includes full engine + shader
- File size: 5-20MB per character

### Proposed: DKG + Flutter
```
character.dkg (ZIP, ~500KB-2MB)
├── meta.json      # name, category, created
├── atlas.webp     # sprite sheet (compressed)
└── manifest.json  # frame positions + metadata

Flutter App:
- Opens .dkg files
- Loads sprite atlas
- Plays with any audio source
- Exports MP4 with watermark
```

### MP4 Export Settings
```
┌─────────────────────────────────────┐
│         EXPORT VIDEO                │
├─────────────────────────────────────┤
│ PRESET: [QUICK] [HD] [SQUARE]       │
│                                     │
│ ASPECT: [9:16] [16:9] [1:1] [4:5]   │
│                                     │
│ QUALITY: [=========●==] 80%         │
│                                     │
│ WATERMARK: [✓] jusDNCE              │
│                                     │
│ DURATION: [15s ▼]                   │
│                                     │
│ EST. SIZE: ~12 MB                   │
├─────────────────────────────────────┤
│        [ EXPORT MP4 ]               │
└─────────────────────────────────────┘
```

---

## DECISIONS

### 1. Audio Source Selector
**USE:** Adapter Pill system (expandable, clear active state)
- Collapsible to save space
- Radio-button behavior
- Shows URL input when Stream selected

### 2. Pattern System
**USE:** Both patterns AND physics patterns
- 15 choreography patterns (frame selection)
- LEGACY/LABAN physics (how frames move)
- Trigger pads for manual effects

### 3. Joystick
**USE:** Left/Right zone split with radial joystick
- Left = PATTERN mode with pattern selector
- Right = KINETIC mode with position control
- All 15 patterns accessible

### 4. Export
**USE:** DKG format + MP4 export with watermark
- .dkg for sharing character data
- MP4 for sharing video content
- Watermark enabled by default
- Quick share preset as default

---

## ACTION ITEMS

1. ✅ Update GolemMixer with correct 15 patterns
2. ✅ Add LABAN physics
3. ✅ Add video exporter with watermark
4. ⬜ Create expandable AudioSourceSelector component
5. ⬜ Update StatusBar to use AudioSourceSelector
6. ⬜ Fix HTML export issues
7. ⬜ Add timeline/duration control for exports
8. ⬜ Test all patterns work correctly

---

**Last Updated:** 2026-01-10
