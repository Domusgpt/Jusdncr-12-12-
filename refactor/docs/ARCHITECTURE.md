# Refactor Architecture Notes

## Core principles
1) Coordinator‑driven state (Step 4 orchestration owns all state and delegates to UI modules).
2) Service boundaries for audio, export, paywall, help, and telemetry.
3) Engine adapters so Claude branch kinetic improvements can be plugged in without UI rewrites.

## Proposed module contracts

### `Step4Coordinator`
- Owns: playback state, audio source, engine mode, export flows, paywall gating.
- Exposes: `onEngineInput`, `onPatternChange`, `onExport`, `onStreamLink`.

### `audioEngine`
- `loadSource(audioSource)`
- `getAnalyzer()`
- `getStream()`
- `createReactivityChannel()` → returns bpm/sensitivity snapshot

### `paywallPolicy`
- `canExportVideo(userTier)`
- `canDownloadHtml(userTier)`
- `canUseFx(userTier)`

### `engineAdapter`
- `applyInput(vector, mode)` → returns animation state
- `getTelemetry()` → bpm, beat counter, etc

### `telemetryService`
- `track(event)` → enqueue events
- `flush()` → return and clear events

## Integration priorities
1) Stabilize engine adapter and coordinator contract.
2) Port Claude joystick UI into `EngineSurface` module.
3) Re‑attach current QR/help/stream/export features as services.
4) Validate `Step4Shell` composition as the refactor integration surface.
