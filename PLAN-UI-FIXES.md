# UI FIX PLAN - Systematic Approach

## Critical Issues Identified

### 1. DIRECTOR PAGE (Step 2) - Header Layout
**Problem**: Quality toggle, cutout, morph, surprise button are placed NEXT to title, causing horizontal scroll
**Solution**: Stack controls UNDER the title in a vertical flow

```
CURRENT (BAD):
[DIRECTOR_MODE TITLE] [MORPH] [SURPRISE] [QUALITY TOGGLE] [CUTOUT]
                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                      These cause horizontal overflow!

FIXED (GOOD):
[DIRECTOR_MODE TITLE]
[Configure your quantum simulation parameters]
[MORPH] [SURPRISE ME]     <- Row 1: Action buttons
[TURBO | QUALITY | SUPER] <- Row 2: Quality mode
[CUTOUT MODE]             <- Row 3: Cutout toggle (full width)
```

### 2. STYLE PRESETS - Categories Should Be Visible
**Problem**: Presets fully collapsed, categories not visible
**Solution**: Show categories always, only collapse the style GRID

```
CURRENT (BAD):
[STYLE PRESETS (Studio Clean) ▼]  <- Everything hidden

FIXED (GOOD):
[STYLE PRESETS (Studio Clean) ▼]
[Cinematic] [Anime/2D] [Digital] [Artistic] [Abstract]  <- Always visible!
                                                          Grid collapses below
```

### 3. SURPRISE ME + MORPH Not Working
**Problem**: When morph toggle is ON, surprise me doesn't apply secondary style
**Root Cause**: The randomizeStyle function checks `surpriseMorph` but it may not be triggering `onUpdate` correctly
**Solution**: Debug and fix the morph selection logic

```typescript
// Current logic - needs verification
if (surpriseMorph) {
  const otherStyles = STYLE_PRESETS.filter(s => s.id !== randomStyle.id);
  const secondaryStyle = otherStyles[Math.floor(Math.random() * otherStyles.length)];
  const randomIntensity = Math.floor(Math.random() * 60) + 20;
  onUpdate('secondaryStyleId', secondaryStyle.id);  // <- Is this firing?
  onUpdate('morphIntensity', randomIntensity);
}
```

### 4. STEP 4 PREVIEW - Controls Positioning
**Problem**: Controls are OVER the player, not coming from screen edges over visualizer
**Solution**:
- FX Rail: Should be flush LEFT edge of SCREEN, not player
- EngineStrip: Should be flush BOTTOM edge of SCREEN
- StatusBar: Should be flush TOP edge of SCREEN
- These overlay the VISUALIZER background, not the animation player area

```
CURRENT (BAD):                    FIXED (GOOD):
+------------------+              +------------------+
|    [CONTROLS]    |              |[CTRL]            |
|  +------------+  |              |+------------+    |
|  |   PLAYER   |  |              ||   PLAYER   |    |
|  |            |  |              ||            |    |
|  +------------+  |              |+------------+    |
|    [CONTROLS]    |              |    [CTRL AT EDGE]|
+------------------+              +------------------+
Controls inside box               Controls at screen edges
```

### 5. PORTRAIT MODE
**Problem**: Layout not optimized for portrait
**Solution**:
- Use `flex-col` layouts that stack vertically on mobile
- Ensure touch targets are 44-48px minimum
- Pattern strip scrolls horizontally with momentum

### 6. JOYSTICK PATTERN SELECTION
**Problem**: Joystick pattern selection not properly spaced
**Solution**:
- PATTERN mode joystick: 15 patterns spaced evenly (360°/15 = 24° per pattern)
- KINETIC mode joystick: 6 patterns spaced evenly (360°/6 = 60° per pattern)

```
PATTERN MODE (15 patterns):          KINETIC MODE (6 patterns):
        PING_PONG                           PING_PONG
    MINIMAL   BUILD_DROP                 VOGUE     FLOW
  IMPACT        STUTTER               BUILD_DROP    STUTTER
 FOOTWORK        VOGUE                    CHAOS
  EMOTE          FLOW
   GROOVE       CHAOS
     SNARE   ABAC
       AABB ABAB
```

Each pattern gets equal angular slice of the joystick circle.

---

## Implementation Order

### Phase 1: Fix Director Page Layout (Steps.tsx)
1. Move all controls under title
2. Use vertical stacking with proper spacing
3. Remove horizontal overflow

### Phase 2: Fix Style Presets Collapse
1. Always show category tabs
2. Only collapse the style grid
3. Keep current selection visible

### Phase 3: Fix Surprise Me + Morph
1. Debug why morph isn't applying
2. Add visual feedback when morph is selected
3. Ensure Studio Controls opens when settings change

### Phase 4: Fix Step4 Controls Positioning
1. Make FXRail flush to left screen edge
2. Make EngineStrip flush to bottom screen edge
3. Make StatusBar flush to top screen edge
4. These go OVER visualizer, not inside player bounds

### Phase 5: Portrait Mode Optimization
1. Test and adjust spacing
2. Ensure no unwanted horizontal scroll
3. Verify touch targets

### Phase 6: Fix Joystick Pattern Selection
1. Calculate angle-to-pattern mapping for 15 patterns (24° each)
2. Calculate angle-to-pattern mapping for 6 patterns (60° each)
3. Update AnimationZoneController to use proper angular spacing
4. Show visual feedback of which pattern is being hovered

---

## Files to Modify

1. `components/Steps.tsx` - Director page layout, presets, surprise me
2. `components/FXRail.tsx` - Left edge positioning
3. `components/EngineStrip.tsx` - Bottom edge positioning
4. `components/AnimationZoneController.tsx` - Joystick pattern selection
5. `components/StatusBar.tsx` - Top edge positioning
6. `components/Step4Preview.tsx` - Container layout

---

## Success Criteria

- [ ] No horizontal scroll on Director page
- [ ] Category tabs always visible in Style Presets
- [ ] Surprise Me + Morph correctly selects secondary style
- [ ] Controls positioned at screen edges over visualizer
- [ ] Portrait mode works without issues
- [ ] All touch targets 44px+ minimum
- [ ] Joystick selects 15 patterns evenly spaced in PATTERN mode
- [ ] Joystick selects 6 patterns evenly spaced in KINETIC mode
