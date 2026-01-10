# jusDNCE Branch Merge + Flutter Player - Development Track

**Started:** 2026-01-10
**Branch:** claude/analyze-jusdnce-architecture-j3Ah8

---

## TASK OVERVIEW

From the user's requirements:

### Part 1: Branch Merge
- **FROM:** `claude/fix-ui-deploy-firebase-qq3V7` (Firebase - better touch UI)
- **INTO:** Current branch (Paywall base - streaming audio, QR, MP4)

**Keep from Paywall:**
- [x] Streaming audio URL input (paste Spotify/SoundCloud/YouTube)
- [x] QR code generation for sharing
- [x] MP4 codec selection with fallbacks
- [x] FXBezel with full axis controls

**Port from Firebase:**
- [x] Touch Zone Controller (left half = PATTERN, right half = KINETIC)
- [x] Pattern Joystick (radial dial at touch point)
- [x] Gesture Gate (tap to unlock audio/mic)
- [x] Audio Adapter Pills (File/Mic/System)
- [x] Firebase config files (.firebaserc, firebase.json, data/*, scripts/costs/*)

**Fix:**
- [x] `tools/pricingCalculator.mjs` - Change $0.017 → $0.003/sheet

**UI Consistency:**
- [ ] Touch zones and joystick must work identically in Step4Preview.tsx AND playerExport.ts

### Part 2: .dkg File Format
Replace 2,788-line HTML export with simple ZIP:
```
character.dkg (ZIP)
├── meta.json      # name, category, created
├── atlas.webp     # sprite sheet
└── manifest.json  # frame positions + metadata
```
- [x] Create dkgExport.ts service
- [x] NO audio in .dkg - player handles audio

### Part 3: Flutter DKG Player App
Native app that:
- [x] Opens .dkg files (file picker or share intent)
- [x] Loads sprite atlas and frame manifest
- [x] Plays audio from file picker OR microphone
- [x] Runs GolemMixer engine (port from TypeScript)
- [x] Renders frames to canvas with physics
- [x] Has same touch zones + pattern joystick as web
- [ ] Exports video to camera roll via FFmpeg (scaffolded, needs implementation)

---

## PROGRESS LOG

### 2026-01-10 - Session Start

**Completed:**
- [x] Added Firebase config files from Firebase branch
  - .firebaserc
  - firebase.json
  - data/cost-assumptions.json
  - data/costs-dashboard.json
  - scripts/costs/calculator.mjs
- [x] Created dkgExport.ts service
- [x] Updated playerExport.ts with Firebase touch UI
  - Touch zones (left=PATTERN, right=KINETIC)
  - Pattern joystick (radial dial)
  - Gesture gate (audio/mic permissions modal)
  - Audio adapter pills (File/Mic/System)
- [x] Fixed pricingCalculator.mjs ($0.017 → $0.003/sheet)

### 2026-01-10 - Flutter App Complete

**Completed Flutter App Structure:**
- [x] pubspec.yaml with all dependencies
- [x] Models:
  - dkg_file.dart (DKGMeta, DKGManifest, FrameData, DKGFile)
- [x] Services:
  - dkg_loader.dart (ZIP extraction, atlas decoding, recent files)
  - audio_analyzer.dart (FFT analysis, beat detection, BPM)
- [x] Engine:
  - golem_mixer.dart (15 patterns, physics, kinetic mode)
- [x] Widgets:
  - touch_zone.dart (left/right mode switching)
  - pattern_joystick.dart (radial pattern selector)
  - dkg_canvas.dart (frame renderer with physics)
- [x] Screens:
  - home_screen.dart (file picker, recent files)
  - player_screen.dart (main playback UI)
- [x] main.dart (app entry, theming)

**Not Yet Implemented:**
- [ ] Update Step4Preview.tsx with touch UI (for UI consistency)
- [ ] Video export to camera roll (scaffolded)
- [ ] Android/iOS permission configs
- [ ] Font assets (Rajdhani)

---

## FILE CHANGES TRACKING

### Added:
- `.firebaserc` - Firebase project config
- `firebase.json` - Firebase hosting config
- `data/cost-assumptions.json` - Cost model
- `data/costs-dashboard.json` - Dashboard data
- `scripts/costs/calculator.mjs` - Cost automation
- `services/dkgExport.ts` - DKG file export
- `templates/player/styles.css` - Player styles template
- `templates/player/runtime.js` - Player runtime template
- `templates/player/index.html` - Player HTML template
- `templates/player/build.ts` - Player build script
- `dkg_player/pubspec.yaml` - Flutter dependencies
- `dkg_player/lib/main.dart` - App entry point
- `dkg_player/lib/models/dkg_file.dart` - DKG data models
- `dkg_player/lib/services/dkg_loader.dart` - DKG file loader
- `dkg_player/lib/services/audio_analyzer.dart` - Audio analysis
- `dkg_player/lib/engine/golem_mixer.dart` - Animation engine
- `dkg_player/lib/widgets/touch_zone.dart` - Touch zone widget
- `dkg_player/lib/widgets/pattern_joystick.dart` - Pattern selector
- `dkg_player/lib/widgets/dkg_canvas.dart` - Frame renderer
- `dkg_player/lib/screens/home_screen.dart` - Home screen
- `dkg_player/lib/screens/player_screen.dart` - Player screen
- `DEVTRACK.md` - This file
- `BRANCH_COMPARISON.md` - Branch analysis
- `ARCHITECTURE_ANALYSIS_VERIFIED.md` - Architecture review

### Modified:
- `services/playerExport.ts` - Added touch zones, joystick, gesture gate, adapter pills
- `tools/pricingCalculator.mjs` - Fixed costs ($0.017 → $0.003/sheet)

---

## NEXT ACTIONS

1. **Update Step4Preview.tsx** - Add touch UI components for preview consistency
2. **Add font assets** - Rajdhani font files for Flutter
3. **Android/iOS configs** - Permissions for mic, storage, photos
4. **Video export** - Implement FFmpeg-based export to camera roll
5. **Testing** - Test DKG export/import flow end-to-end

---

## BLOCKERS

None currently.

---

## DECISIONS MADE

1. **Keep Paywall as base** - streaming audio is complex and valuable
2. **Port Firebase UI** - touch zones are better UX
3. **DKG format uses WebP** - good compression, wide support
4. **No audio in DKG** - player handles all audio sources
5. **Flutter over PWA** - native permissions, background audio, app store
6. **GolemMixer ported to Dart** - same 15 patterns, physics, kinetic mode
7. **Simplified audio analysis** - Time-domain for now, FFT can be added later
