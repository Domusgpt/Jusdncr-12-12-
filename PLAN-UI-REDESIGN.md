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

## Implementation Order

### Phase 1: Fix Bugs (30 min)
1. Fix `triggerFrame()` pose comparison
2. Revert KINETIC probability to 30%
3. Test pattern modes work correctly

### Phase 2: Layout Foundation (1-2 hrs)
1. Remove FXPanel modal - replace with FX Rail
2. Remove 5-column grid - replace with Control Dock
3. Create Pressure Paddle component
4. Update Step4Preview.tsx layout structure

### Phase 3: GolemMixer Drawer (1 hr)
1. Convert GolemMixerPanel to bottom sheet
2. Add swipe gesture support
3. Context-aware sections (patterns only in PATTERN mode)

### Phase 4: Polish (30 min)
1. Status bar fade behavior
2. Beat indicator animations
3. Touch feedback (scale on press)
4. FX Rail collapse/expand gesture

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

## Summary

This redesign embodies **elegance** through:

1. **Layering over modality** - Controls wrap around content, never block it
2. **Hierarchy of access** - Most-used controls require least effort
3. **Context awareness** - UI adapts to current mode
4. **Simultaneous control** - Nothing prevents multi-touch
5. **Progressive disclosure** - Complexity hidden until needed
6. **Spatial consistency** - FX always left, expression always right, transport always bottom

The dancer is the star. The UI is the stage lighting.
