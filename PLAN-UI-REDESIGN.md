# jusDNCE UI/UX Redesign Plan

## Research Foundation

### Key Insights from Professional DJ/VJ Software

**From Traktor DJ (Native Instruments):**
- Layer-based interface, NOT pages - everything accessible from everywhere
- Waveform-centric approach - the content is the hero, UI wraps around it
- X/Y pads for effects with touch-lock capability
- Controls can be tapped to reset to center/default

**From TouchOSC/Ableton Integration:**
- Multi-touch enables simultaneous control of multiple parameters
- Pass-through touch for strummable/surfable designs
- OSC addressing allows fine-grain control routing

**From Mobile Touch Research:**
- Touch targets: minimum 44x44px, ideal 48x48px (reduces accidental taps by 30%)
- Thumb zones: most users are right-handed, right thumb blocks bottom-right
- Latency under 100ms boosts interaction efficiency by 40%
- Haptic/visual feedback confirms actions

---

## Core Design Philosophy: "Elegant Layering"

### Principle 1: The Animation is Sacred
The dancer/character animation is the product. UI should NEVER occlude it with opaque modals. All panels must be:
- Semi-transparent (bg-black/60 max)
- Positioned at edges
- Collapsible/dismissible with single tap

### Principle 2: Hierarchy of Access
Controls organized by frequency of use:
1. **Always Visible** - Play, essential status
2. **One Tap Away** - FX, Mixer toggle, Mic
3. **Intentional Access** - Deep settings, patterns, deck management

### Principle 3: Simultaneous Control
User must be able to:
- Hold FX paddle while tapping triggers
- Adjust mixer while animation plays
- Toggle multiple effects at once

---

## Proposed Layout Architecture

```
┌─────────────────────────────────────────────────────────┐
│  [STATUS BAR - minimal, semi-transparent]               │
│  FPS: 60 | BPM: 128 | ENGINE: KINETIC | NODE: groove    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                                                         │
│              ┌─────────────────────┐                    │
│              │                     │                    │
│              │   ANIMATION ZONE    │                    │
│              │   (UNTOUCHABLE)     │                    │
│              │                     │                    │
│              └─────────────────────┘                    │
│                                                         │
│  ┌──────┐                                    ┌──────┐   │
│  │ FX   │    (floating, left edge)           │PADDLE│   │
│  │ RAIL │                                    │      │   │
│  │      │                                    │      │   │
│  └──────┘                                    └──────┘   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [CONTROL DOCK - persistent bottom bar]                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ▶️ PLAY │ 🎤 MIC │ 🎚️ MIX │ 📷 CAM │ ⬆️ MORE    │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Status Bar (Top)
**Purpose:** Ambient awareness without demanding attention
**Position:** Top, full width, 40px height
**Content:**
- FPS counter (debug, toggleable)
- BPM display (prominent when audio active)
- Engine mode indicator (KINETIC/PATTERN)
- Current node/pattern name
- Physics mode (LABAN/LEGACY)

**Elegance:** Fades to 30% opacity after 3s of no interaction, full opacity on touch anywhere

---

### 2. FX Rail (Left Edge)
**Purpose:** Quick-access effects without blocking animation
**Position:** Left edge, vertical strip, 56px wide
**Design:**
```
┌────────┐
│  RGB   │  <- Icon + label, 48x48 touch target
├────────┤
│ STROBE │
├────────┤
│ GHOST  │
├────────┤
│ INVERT │
├────────┤
│  B&W   │
├────────┤
│ SCAN   │
├────────┤
│ GLITCH │
├────────┤
│ SHAKE  │
├────────┤
│ ZOOM   │
└────────┘
```

**Behavior:**
- Single tap toggles effect (stays on until tapped again)
- Visual: Active effects glow with their signature color
- Rail can be swiped left to hide completely
- Collapsed state shows only a thin 8px "grip" to pull out

**Elegance:** Effects are arranged by intensity - subtle (top) to aggressive (bottom). User learns the "temperature" of the rail.

---

### 3. Pressure Paddle (Right Edge)
**Purpose:** Expressive, pressure-sensitive FX control
**Position:** Right edge, 64px wide, 200px tall
**Design:**
```
┌─────────┐
│         │
│  PADDLE │  <- Vertical touch zone
│         │
│  ████   │  <- Fill level indicator
│  ████   │
│         │
└─────────┘
```

**Behavior:**
- Touch anywhere on paddle activates
- Y-position = intensity (0-1)
- Hold duration = effect accumulation
- Affects: RGB split, flash, glitch based on intensity
- Release = natural decay (handled by animation loop)

**Elegance:** The paddle is the "expression pedal" - it's for FEEL, not precision. Position affects ALL active FX proportionally.

---

### 4. Control Dock (Bottom)
**Purpose:** Primary controls always within thumb reach
**Position:** Bottom, full width, 72px height + safe area
**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │      │ │      │ │      │ │      │ │      │          │
│  │ PLAY │ │ MIC  │ │MIXER │ │ CAM  │ │ MORE │          │
│  │ 64px │ │ 48px │ │ 48px │ │ 48px │ │ 48px │          │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘          │
│                                                         │
│  [BEAT INDICATOR: ████ ████ ████ ████]                 │
└─────────────────────────────────────────────────────────┘
```

**Button Hierarchy:**
1. **PLAY** (64x64px) - Largest, center-left, always visible
   - States: Play/Pause/Upload (if no audio)
   - Glow effect when playing

2. **MIC** (48x48px) - Live input toggle
   - Red pulse when active

3. **MIXER** (48x48px) - Opens GolemMixer drawer (swipe up)
   - Badge shows active deck count

4. **CAM** (48x48px) - SuperCam toggle
   - Blue when active

5. **MORE** (48x48px) - Opens secondary menu
   - Contains: LABAN/LEGACY, FRAMES, NEW, SAVE, REC

**Beat Indicator:** 4 bars showing phrase position, pulses with bass

---

### 5. GolemMixer Drawer (Swipe-Up Panel)
**Purpose:** Deep mixing controls for power users
**Trigger:** Tap MIXER button or swipe up from bottom
**Position:** Bottom sheet, slides up to 60% screen height
**Design:**

```
┌─────────────────────────────────────────────────────────┐
│  ═══════════════ [drag handle] ═══════════════         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ENGINE: [KINETIC] [PATTERN]                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ DECK 1 ─────────────────────────────────────────┐  │
│  │ [Current Rig] 12 frames    [SEQ] [LAY] [OFF]    │  │
│  │ ▼ Expand for thumbnails                          │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌─ DECK 2 ─────────────────────────────────────────┐  │
│  │ [Empty]                    [LOAD RIG]            │  │
│  └──────────────────────────────────────────────────┘  │
│  ... DECK 3, 4 ...                                     │
│                                                         │
│  ┌─ PATTERNS ───────────────────────────────────────┐  │
│  │ (Only visible in PATTERN mode)                   │  │
│  │ [PING-PONG] [ABAB] [AABB] [STUTTER] [FLOW] ...  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ TRIGGERS ───────────────────────────────────────┐  │
│  │ [STUTTER] [REVERSE] [GLITCH] [BURST]            │  │
│  │    (hold-to-activate pads, 56px each)            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ BPM ────────────────────────────────────────────┐  │
│  │ [AUTO] ════════════════════════════ 128 BPM     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Elegance:**
- The drawer DOES NOT block the animation - top 40% of screen always shows the dancer
- Deck strips are compact until expanded
- Pattern selection only appears in PATTERN mode (context-aware)
- Triggers are at the bottom where thumbs naturally rest

---

### 6. Secondary Menu (MORE)
**Purpose:** Less frequent actions
**Trigger:** Tap MORE button
**Design:** Compact floating menu above the dock

```
┌───────────────────────────────┐
│  ┌──────┐ ┌──────┐ ┌──────┐  │
│  │LABAN │ │FRAMES│ │ NEW  │  │
│  └──────┘ └──────┘ └──────┘  │
│  ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ SAVE │ │ REC  │ │EXPORT│  │
│  └──────┘ └──────┘ └──────┘  │
└───────────────────────────────┘
```

**Elegance:**
- Appears as floating pill, dismisses on outside tap
- LABAN/LEGACY shows current state
- FRAMES opens the frame deck viewer as overlay
- REC changes to STOP REC when recording

---

## Bug Fixes Required

### Critical: Pattern Engine Frame Selection
**File:** `engine/GolemMixer.ts:945`
**Problem:** `triggerFrame()` compares object references, not pose strings
**Current:**
```typescript
if (!frame || frame === this.currentFrame) return;
```
**Fix:**
```typescript
if (!frame || frame.pose === this.currentFrame?.pose) return;
```

### KINETIC Mode Over-Correction
**Action:** Revert transition probability from 60% back to 30%
**Reason:** User said "Kinetic was working decently"

---

## Implementation Order (REVISED based on screenshots analysis)

### Current State Problems (from screenshots):
1. **FX Panel** - 300px wide with 4 pressure paddles + 9 toggles + MAP buttons = TOO BIG
2. **Engine Panel** - 280px wide with MODE/SEQUENCE/PHYSICS/INTENSITY = TOO BIG
3. **Deck Panel** - Shows all 4 decks expanded at once = BLOCKS ANIMATION
4. **Stacking** - FX + Engine both on left side = 60% screen blocked
5. **No layers** - Panels are blocky modals, not thin overlays

### Phase 1: Slim Down Panels (CRITICAL)

**1a. FX Rail (56px wide max)**
- Remove 4 pressure paddles entirely from FXPanel
- Keep ONLY the 9 FX toggle buttons in a vertical strip
- 56px wide, left edge, 9 buttons stacked (48px each)
- Collapsed state: 8px grip handle
- NO "TAP TO TOGGLE FX" expanded view - just icons

**1b. Single X/Y Pressure Pad (right edge)**
- Create new `PressurePadXY.tsx` component
- 80px wide x 200px tall on right edge
- X-axis = FX intensity (0-1)
- Y-axis = which FX cluster (top=subtle, bottom=aggressive)
- Touch position controls ACTIVE FX from the rail

**1c. Engine Strip (top, not left)**
- Convert EnginePanel to horizontal strip at TOP
- 100% width, 48px height max
- Layout: `[KIN|PAT] [GRV|EMT|IMP|FT] [LABAN|LEG] [slider]`
- Collapsed: Just shows current mode as pill (e.g., "KINETIC • GRV")
- Tap to expand momentarily, auto-collapse after 3s

### Phase 2: Bottom Drawer for Mixer

**2a. Deck Mixer as Bottom Sheet**
- Remove DeckMixerPanel as floating panel
- Create `MixerDrawer.tsx` - swipe up from dock
- Peek state: Shows 0px (hidden)
- Half state: 40% screen - shows deck strips (compact)
- Full state: 60% screen - shows deck thumbnails
- NEVER covers more than 60% of screen

**2b. Deck Strip Design (compact)**
```
┌─────────────────────────────────────────┐
│ D1 [SEQ] ████████░░ 1/112  [▼ expand]   │
│ D2 [OFF] -- empty --       [+ LOAD]     │
│ D3 [OFF] -- empty --       [+ LOAD]     │
│ D4 [OFF] -- empty --       [+ LOAD]     │
└─────────────────────────────────────────┘
```
Each deck: 48px height, expands to 120px when tapped

### Phase 3: Pattern Grid (Only when needed)

**3a. Pattern Selection**
- Only visible in PATTERN engine mode
- Appears as overlay grid (3x5) when "PAT" is selected
- 15 patterns in compact 48px buttons
- Tap selects, then grid auto-dismisses
- Current pattern shown in Engine Strip pill

### Phase 4: Control Dock Refinements

Keep current ControlDock but ensure:
- Play button: 64px (larger, left side)
- Other buttons: 48px
- Beat indicator below buttons
- MORE menu stays as floating pill popup

### Files to Modify (in order):

1. `components/FXPanel.tsx` → Completely rewrite as thin rail
2. NEW: `components/PressurePadXY.tsx` → X/Y expression controller
3. `components/EnginePanel.tsx` → Convert to horizontal strip
4. `components/DeckMixerPanel.tsx` → Convert to bottom sheet drawer
5. `components/Step4Preview.tsx` → Update layout to use new components
6. `components/ControlDock.tsx` → Minor refinements

### Layout After Implementation (REVISED):
```
┌─────────────────────────────────────────────────────────────┐
│  [▶] [🎤] [BPM:128] ══════ beat ══════ [📷] [⋯]            │  <- STATUS BAR (top)
├────┬────────────────────────────────────────────────┬──────┤
│ FX │                                                │      │
│ ── │                                                │ PAT  │
│ RGB│            A N I M A T I O N                   │ JOY  │  <- PATTERN JOYSTICK
│ STR│               Z O N E                          │  ●   │     (X/Y radial)
│ GHO│                                                │      │
│ INV│         (85% of screen - SACRED)               │──────│
│ B&W│                                                │ FX   │
│ SCN│                                                │ PAD  │  <- FX X/Y PAD
│ GLI│                                                │  ◎   │     (quadrant effects)
│ SHK│                                                │      │
│ ZOO│                                                │      │
├────┴────────────────────────────────────────────────┴──────┤
│  [KIN|PAT] [GRV|EMT|IMP|FT] ════════ intensity ════════    │  <- ENGINE STRIP (bottom)
│  [🎚 MIXER]  (tap to open drawer)                          │
└─────────────────────────────────────────────────────────────┘
```

### X/Y Controllers Explained:

**Pattern Joystick (right edge, top)**
```
         VOGUE
    FLOW   ↑   STUTTER
       ╲   │   ╱
        ╲  │  ╱
  MINIMAL ─●─ CHAOS     <- drag toward pattern, snaps back
        ╱  │  ╲
       ╱   │   ╲
   BUILD   ↓   PING
         DROP
```
- PATTERN mode: All 15 patterns, CYAN glow
- KINETIC mode: 6 patterns only, MAGENTA glow, smaller

**FX X/Y Pad (right edge, bottom)**
```
        SUBTLE (ghost, bw, scan)
              ↑
    MOTION ←  ●  → COLOR
  (shake,zoom)    (rgb,invert)
              ↓
       AGGRESSIVE (strobe, glitch)
```
- Position = which FX cluster
- Distance from center = intensity
- Multi-touch for layered FX

### MIXER Drawer (swipe up from bottom):
```
┌─────────────────────────────────────────────────────────────┐
│  ═════════════ drag handle ═════════════                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │     D1          D2          D3          D4          │   │
│  │    ┌──┐        ┌──┐        ┌──┐        ┌──┐        │   │
│  │    │● │        │  │        │  │        │  │        │   │  <- DECK X/Y (optional)
│  │    └──┘        └──┘        └──┘        └──┘        │   │     drag toward deck
│  │   [SEQ]       [OFF]       [OFF]       [OFF]        │   │
│  │   112fr        ---         ---         ---         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [+ LOAD D2] [+ LOAD D3] [+ LOAD D4]                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

1. `engine/GolemMixer.ts` - Bug fixes
2. `components/Step4Preview.tsx` - Main layout restructure
3. `components/FXPanel.tsx` - Replace with FXRail
4. `components/GolemMixerPanel.tsx` - Convert to drawer
5. New: `components/ControlDock.tsx`
6. New: `components/PressurePaddle.tsx`
7. New: `components/FXRail.tsx`

---

## Design Tokens

```typescript
// Touch targets
const TOUCH_PRIMARY = 64;   // Play button
const TOUCH_STANDARD = 48;  // Most buttons
const TOUCH_COMPACT = 40;   // Dense areas

// Transparency
const BG_PANEL = 'bg-black/60';
const BG_CONTROL = 'bg-black/80';
const BG_OVERLAY = 'bg-black/40';

// Status bar fade
const STATUS_ACTIVE_OPACITY = 1.0;
const STATUS_IDLE_OPACITY = 0.3;
const STATUS_FADE_DELAY = 3000; // ms
```

---

## Feature Checklist (MUST preserve all)

### Engine System (EnginePanel)
- [ ] ENGINE MODE toggle: KINETIC / PATTERN
- [ ] 15 patterns: PING_PONG, BUILD_DROP, STUTTER, VOGUE, FLOW, CHAOS, MINIMAL, ABAB, AABB, ABAC, SNARE_ROLL, GROOVE, EMOTE, FOOTWORK, IMPACT
- [ ] 4 sequence modes: GROOVE, EMOTE, IMPACT, FOOTWORK
- [ ] PHYSICS toggle: LEGACY / LABAN
- [ ] INTENSITY slider (0-100%)
- [ ] BPM display

### FX System (FXPanel)
- [ ] 9 effects: RGB, STROBE, GHOST, INVERT, B&W, SCANLINES, GLITCH, SHAKE, ZOOM
- [ ] Toggle on/off for each effect
- [ ] Pressure intensity control (via new X/Y pad)
- [ ] Visual feedback when active

### Deck Mixer (DeckMixerPanel)
- [ ] 4 deck channels (D1, D2, D3, D4)
- [ ] Mode per deck: OFF / SEQUENCER / LAYER
- [ ] Opacity slider per deck (0-100%)
- [ ] Frame count display
- [ ] Rig name display
- [ ] LOAD button to import frames
- [ ] Deck thumbnail preview (expanded state)

### Control Dock
- [ ] PLAY/PAUSE button
- [ ] MIC toggle
- [ ] MIXER toggle (opens drawer)
- [ ] CAM toggle (SuperCam)
- [ ] MORE menu
- [ ] Beat indicator (4 bars)

### MORE Menu
- [ ] FRAMES viewer
- [ ] NEW (create new)
- [ ] SAVE
- [ ] REC (record)
- [ ] CLOSE

---

## Summary

This redesign embodies **elegance** through:

1. **Layering over modality** - Controls wrap around content, never block it
2. **Hierarchy of access** - Most-used controls require least effort
3. **Context awareness** - UI adapts to current mode
4. **Simultaneous control** - Nothing prevents multi-touch
5. **Progressive disclosure** - Complexity hidden until needed
6. **Spatial consistency** - FX always left, expression always right, transport always bottom

The dancer is the star. The UI is the stage lighting.

---

## Research Sources

- [Traktor DJ iPad Review](https://djworx.com/review-1-traktor-dj-app-for-ipad/) - Layer-based interface design
- [TouchOSC for Resolume](https://vjgalaxy.com/blogs/resolume-tutorials/how-to-control-resolume-via-touchosc) - Modular control surfaces
- [TKFX Traktor Controller](https://apps.apple.com/us/app/tkfx-traktor-dj-controller/id898838871) - X/Y pad for effects
- [Mobile UI Best Practices 2025](https://nextnative.dev/blog/mobile-app-ui-design-best-practices) - 44px touch targets
- [Game UI Database](https://www.gameuidatabase.com/) - Reference for rhythm game UI
