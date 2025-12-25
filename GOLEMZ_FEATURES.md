# Frequency Golemz - Feature Specification

## Rebrand Overview

| Old Term | New Term |
|----------|----------|
| Rig | **Golem** / **Frequency Golem** |
| Frame set | **Golem Deck** |
| Export file | **.DKG** (Deterministic Kinetic Gif) |
| Animation type | **Frequency Golemz** |
| App subtitle | "Summon Your Frequency Golem" |

---

## Feature 1: Track Change in Preview

**Current:** Audio must be uploaded before entering preview
**New:** Add audio upload button directly in Step4Preview

### UI Changes
- Add "🎵 CHANGE TRACK" button next to LIVE INPUT
- Opens file picker for audio
- Seamlessly switches without leaving preview

---

## Feature 2: Multi-Deck Support

**Current:** Single deck of frames
**New:** Multiple decks that can be toggled

### Deck Structure
```typescript
interface GolemDeck {
  id: string;
  name: string;           // LLM-generated name
  frames: GeneratedFrame[];
  isActive: boolean;      // Currently playing
  createdAt: number;
}
```

### UI Changes
- Deck panel shows tabs for each loaded deck
- "NEW VARIATIONS" adds to new deck slot (keeps old)
- "IMPORT GOLEM" button to load saved .DKG files
- Toggle switches to activate/deactivate decks
- Blend slider when multiple decks active

### Deck Limits
- Free tier: 2 decks max
- Pro tier: 8 decks max

---

## Feature 3: LLM Naming for Exports

Use Gemini to generate creative names based on:
- Subject category (CHARACTER, TEXT, SYMBOL)
- Style preset used
- Detected mood from audio (if available)

### Naming Format
```
[Adjective]_[Noun]_[Style]_[Timestamp]
```

### Examples
- `Neon_Phantom_Cyberpunk_1702934123.dkg`
- `Groovy_Shadow_Vaporwave_1702934456.dkg`
- `Electric_Dreamer_Oil_1702934789.dkg`

### Fallback (if LLM unavailable)
- `Golem_[StyleID]_[Timestamp].dkg`

---

## Feature 4: .DKG File Format

### Structure
```json
{
  "version": "1.0",
  "type": "FrequencyGolem",
  "name": "Neon_Phantom_Cyberpunk",
  "created": 1702934123,
  "subject": {
    "category": "CHARACTER",
    "originalImageHash": "abc123"
  },
  "style": {
    "id": "neon-cyber",
    "name": "Neon Cyberpunk"
  },
  "frames": [
    {
      "pose": "dance_high_left",
      "energy": "high",
      "direction": "left",
      "type": "body",
      "dataUrl": "data:image/jpeg;base64,..."
    }
  ],
  "hologramParams": {
    "geometryType": 0,
    "hue": 280,
    "chaos": 0.3
  },
  "metadata": {
    "frameCount": 16,
    "hasCloseups": true,
    "generationCredits": 1
  }
}
```

---

## Feature 5: Style Preset Expansion

### Current Issues
- Some styles don't maintain background consistency
- Subject can blend into inconsistent backgrounds

### Style Design Principles
1. **Background must be simple/abstract** - Avoids competing with subject
2. **Color palette should complement subject** - Not clash
3. **Texture should be uniform** - No complex scenes
4. **Style should affect subject AND background cohesively**

### Good Examples (Keep)
- Dreamy Oil ✓
- Vaporwave ✓
- Neon Cyberpunk ✓

### Styles to Add

#### Cinematic (4 new)
| ID | Name | Background | Subject Style |
|----|------|------------|---------------|
| `golden-hour` | Golden Hour | Warm gradient blur | Soft golden rim light |
| `moonlit` | Moonlit | Deep blue gradient | Silver edge highlights |
| `neon-rain` | Neon Rain | Dark with rain streaks | Wet reflections |
| `hologram` | Hologram | Grid pattern | Scan lines, blue tint |

#### Anime/2D (4 new)
| ID | Name | Background | Subject Style |
|----|------|------------|---------------|
| `manga-ink` | Manga Ink | White/cream paper | Bold ink outlines |
| `synthwave` | Synthwave | Grid + sunset | Chrome/neon |
| `chibi-pop` | Chibi Pop | Pastel solid | Soft cel-shade |
| `lineart` | Clean Lineart | Solid color | Black outlines only |

#### Digital/Glitch (4 new)
| ID | Name | Background | Subject Style |
|----|------|------------|---------------|
| `matrix` | Matrix Code | Falling green code | Green tint, code overlay |
| `corrupted` | Corrupted Data | Static noise | Glitch artifacts |
| `thermal` | Thermal Vision | Black | Heat map colors |
| `xray` | X-Ray | Dark blue | Inverted, skeletal |

#### Artistic (4 new)
| ID | Name | Background | Subject Style |
|----|------|------------|---------------|
| `watercolor` | Watercolor | Paper texture, washes | Soft edges, bleeds |
| `charcoal` | Charcoal Sketch | Gray paper | Smudged, textured |
| `pop-art` | Pop Art | Halftone dots | Bold colors, Warhol |
| `stained-glass` | Stained Glass | Black leading | Jewel tones, segments |

#### New Category: Abstract (4 new)
| ID | Name | Background | Subject Style |
|----|------|------------|---------------|
| `geometric` | Geometric | Triangles/polygons | Low-poly effect |
| `liquid-metal` | Liquid Metal | Reflective void | Chrome, mercury |
| `smoke` | Smoke Form | Dark gradient | Wispy, ethereal |
| `crystal` | Crystal | Prismatic | Faceted, refractive |

**Total: 16 current + 20 new = 36 style presets**

---

## Feature 6: Effects Buttons

Real-time effects the user can toggle:

### Effect Panel UI
```
┌─────────────────────────────────────┐
│ ⚡ EFFECTS                          │
├─────────────────────────────────────┤
│ [RGB SPLIT] [STROBE] [GHOST]       │
│ [INVERT]    [B&W]    [SCAN]        │
│ [GLITCH]    [ZOOM]   [SHAKE]       │
└─────────────────────────────────────┘
```

### Effect Definitions
| Effect | Description | Parameter |
|--------|-------------|-----------|
| RGB SPLIT | Chromatic aberration | Intensity 0-1 |
| STROBE | Flash on beat | Rate |
| GHOST | Motion trails | Opacity |
| INVERT | Color invert | On/Off |
| B&W | Grayscale | On/Off |
| SCAN | Scan lines | Density |
| GLITCH | Random disruption | Frequency |
| ZOOM | Pulse zoom | Amount |
| SHAKE | Camera shake | Intensity |

---

## Feature 7: Direct Video Export

**Current:** Only available via MediaRecorder (real-time)
**New:** Add "RENDER VIDEO" button that uses DirectVideoExporter

### UI
- Add "RENDER VIDEO" button in export menu
- Shows progress bar during render
- Faster than real-time recording
- Better quality (frame-perfect)

### DirectVideoExporter Integration
```typescript
// Already exists in engine/DirectVideoExporter.ts
const exporter = new DirectVideoExporter(manifest, choreographyPlan);
await exporter.export({
  width: 1080,
  height: 1920,
  fps: 30,
  duration: songDuration,
  onProgress: (p) => setProgress(p)
});
```

---

## Feature 8: Rig Import & Swap in Player

### Exported HTML Widget Changes
- Add "LOAD GOLEM" button
- File picker for .dkg files
- Seamlessly swaps frame set
- Preserves audio and hologram settings

### Import Flow
```
[LOAD GOLEM] → File Picker → Parse .DKG → Validate → Load Frames → Ready
```

---

## Implementation Priority

1. **High Priority (Core UX)**
   - Rebrand to Golemz
   - Multi-deck support
   - Track change in preview
   - .DKG file format

2. **Medium Priority (Enhancement)**
   - LLM naming
   - Effects buttons
   - Direct video export

3. **Lower Priority (Polish)**
   - Style preset expansion
   - Rig swap in player

---

## File Changes Required

| File | Changes |
|------|---------|
| `constants.ts` | Add 20 new style presets |
| `types.ts` | Add GolemDeck, DKGFile types |
| `Step4Preview.tsx` | Multi-deck, effects panel, track change |
| `playerExport.ts` | .DKG export, rig import support |
| `services/geminiNaming.ts` | NEW - LLM name generation |
| `components/EffectsPanel.tsx` | NEW - Effects UI |
| `components/DeckManager.tsx` | NEW - Multi-deck UI |

---

## Terminology Updates

Search and replace throughout codebase:
- "Neural Rig" → "Frequency Golem"
- "rig" → "golem" (in user-facing text)
- "SAVE RIG" → "SAVE GOLEM"
- "NEW VARIATIONS" → "SUMMON MORE"
- ".html widget" → ".dkg file"
