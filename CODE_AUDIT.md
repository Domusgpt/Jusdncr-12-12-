# jusDNCE Codebase Audit Report

**Date:** 2026-01-07
**Auditor:** Claude Code
**Branch:** `claude/fix-ui-deploy-firebase-qq3V7`

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Configuration & Build](#configuration--build)
3. [Type System](#type-system)
4. [Components](#components)
5. [Engine Architecture](#engine-architecture)
6. [Services](#services)
7. [Hooks](#hooks)
8. [Testing](#testing)
9. [Security Considerations](#security-considerations)
10. [Performance Considerations](#performance-considerations)
11. [Code Quality Issues](#code-quality-issues)
12. [Recommendations](#recommendations)

---

## Executive Summary

The jusDNCE codebase is a sophisticated AI-powered dance animation studio built with React 19, TypeScript, and WebGL. The architecture is well-structured with clear separation of concerns between UI components, engine logic, and services.

### Overall Health: **Good with Areas for Improvement**

**Strengths:**
- Well-documented engine files with JSDoc comments
- Clean separation between choreography systems (LABAN, KINETIC, PATTERN)
- Comprehensive type definitions
- Good test coverage structure with Playwright E2E tests

**Areas Needing Attention:**
- Several components exceed 1000+ lines (needs refactoring)
- Duplicate type definitions across files
- Some unused imports and dead code
- Missing error boundaries in certain areas
- Potential memory leaks in audio/WebGL cleanup

---

## Configuration & Build

### package.json

**Status:** Good

**Findings:**
- React 19.2.0 is latest (good)
- Dependencies are up to date
- Scripts are well-organized

**Potential Issues:**
```json
// No peer dependency conflicts detected
// However, @google/genai 1.30.0 may have updates
```

**Recommendations:**
- [ ] Add `engines` field to specify Node.js version
- [ ] Consider adding `resolutions` for potential dependency conflicts
- [ ] Add `lint-staged` for pre-commit hooks

### vite.config.ts

**Status:** Good

**Findings:**
- Proper chunk splitting (vendor, ai, icons)
- Base path configurable via env var
- Dev server on port 3000

**Potential Issues:**
- Line 15-22: Manual chunk splitting may need tuning for bundle size optimization

### tsconfig.json

**Status:** Good

**Findings:**
- Strict mode enabled (good)
- ES2022 target appropriate
- Path aliases configured

---

## Type System

### types.ts

**Status:** Needs Review

**Findings:**
- Comprehensive type definitions
- Good use of union types for state management

**Issues to Double-Check:**
1. **Line 15-20:** `EnergyLevel` and `MoveDirection` are defined here but also redefined in several engine files. This creates potential inconsistency.

2. **Line 45-60:** `GeneratedFrame` interface has optional fields that are sometimes used as required:
   ```typescript
   // In types.ts
   direction?: MoveDirection;  // Optional

   // But in frameProcessor.ts it's required
   direction: MoveDirection;   // Required
   ```

3. **Missing Types:**
   - No explicit type for deck state transitions
   - FX intensity mapping types could be more specific

**Recommendations:**
- [ ] Consolidate duplicate type definitions into a single source
- [ ] Create a `types/index.ts` barrel file
- [ ] Add stricter types for state machine transitions

---

## Components

### Step4Preview.tsx

**Status:** Needs Refactoring

**File Size:** ~1,500+ lines (too large)

**Issues:**
1. **Lines 1-30:** Many imports - component is doing too much
2. **Lines 98-150:** Heavy use of refs (12+) - consider custom hooks
3. **Lines 400-600:** Animation loop logic should be extracted
4. **Lines 1200-1400:** Effect application logic duplicated with playerExport.ts

**Potential Bugs:**
- **Line ~350:** `useEffect` cleanup for animation frame might not properly cancel:
  ```typescript
  // Current
  return () => { cancelAnimationFrame(rafId); }

  // Should verify rafId is still valid
  ```

- **Line ~800:** BPM detection might drift over time without periodic reset

**Memory Leak Risk:**
- Audio context connections may not be properly cleaned up on unmount
- Canvas contexts should be explicitly nullified

**Recommendations:**
- [ ] Extract animation loop into `useAnimationLoop` hook
- [ ] Extract FX application into separate component
- [ ] Create `useGolemState` hook for mixer state
- [ ] Add error boundary wrapper

### AnimationZoneController.tsx

**Status:** Good

**File Size:** 463 lines (acceptable)

**Findings:**
- Clean touch/mouse event handling
- Good pattern selection logic
- Proper use of useCallback

**Minor Issues:**
- **Line 210-230:** Flick detection could be more robust (consider velocity-based detection)

### FXBezel.tsx & ModeBezel.tsx

**Status:** Good (Recently Created)

**Findings:**
- Clean component structure
- Proper click-outside handling
- Good accessibility with title attributes

**Minor Issues:**
- Missing keyboard navigation support (Tab, Enter, Escape)
- Could benefit from `aria-label` attributes

### Modals.tsx

**Status:** Needs Review

**Issues:**
1. **Line 234:** Recent fix for `imageGenCost` - verify calculations are correct
2. **Large file** - contains multiple modal types that could be split

### GlobalBackground.tsx

**Status:** Good

**Findings:**
- Clean WebGL lifecycle management
- Proper resize handling

---

## Engine Architecture

### GolemMixer.ts

**Status:** Good with Minor Issues

**File Size:** 1,200+ lines (complex but acceptable for core engine)

**Architecture:**
- Clean 4-channel deck system
- Good separation of BPM detection, pattern selection, and physics

**Issues to Double-Check:**

1. **Lines 166-252 (BPMDetector):**
   ```typescript
   // Line 191: Dynamic threshold calculation may be too sensitive
   const dynamicThreshold = Math.min(
     avg * 1.3, // 30% above average
     avg + (this.peakHoldValue - avg) * 0.35
   );
   // Consider making these values configurable
   ```

2. **Lines 400-500 (Pattern Selection):**
   - STUTTER pattern may fire too frequently with high BPM
   - No debounce on rapid pattern changes

3. **Lines 700-800 (Physics State):**
   - Physics values could accumulate/drift over long sessions
   - Consider periodic normalization

**Potential Bugs:**
- **Line ~450:** `getFrameForBeat` might return null if no frames match criteria
- **Line ~650:** Crossfader position not bounded to 0-1 range

### KineticEngine.ts

**Status:** Good

**Findings:**
- Well-documented DAG state machine
- Clean node transition logic
- Good energy-based frame assignment

**Issues:**
- **Lines 294-299:** Fallback logic could leave nodes with no frames if `allFrames` is also empty:
  ```typescript
  if (node.frames.length === 0 && allFrames.length > 0) {
    node.frames.push(allFrames[0]);
  }
  // What if allFrames.length === 0?
  ```

### LabanEffortSystem.ts

**Status:** Excellent

**Findings:**
- Clean implementation of Laban Movement Analysis
- Well-documented effort factors
- Good mapping functions

**No significant issues found.**

### MotionGrammar.ts

**Status:** Not Read - Recommend Review

---

## Services

### gemini.ts

**Status:** Good with Security Notes

**Findings:**
- Proper API key handling via environment variable
- Good retry logic with exponential backoff
- Image resizing to 384px (as per CLAUDE.md guidelines)

**Security Issues:**
1. **Line 7:** API key accessed directly - should validate existence:
   ```typescript
   const API_KEY = process.env.API_KEY;
   // Should be:
   if (!process.env.API_KEY) {
     console.error('API_KEY not configured');
   }
   ```

2. **Lines 329-340:** User-provided prompts sent to API without sanitization
   - Low risk but consider input validation

**Performance Issues:**
- **Lines 509-520:** Alt/Flourish sheets generated in parallel is good
- **Line 546:** `Promise.allSettled` correctly handles partial failures

### playerExport.ts

**Status:** Needs Refactoring

**File Size:** 3,500+ lines (TOO LARGE)

**Issues:**
1. **Massive file** containing all HTML export logic
2. **Lines 1-500:** CSS embedded as template literals
3. **Lines 500-1500:** HTML structure embedded
4. **Lines 1500-3500:** JavaScript embedded

**Recommendations:**
- [ ] Split into separate template files (CSS, HTML, JS)
- [ ] Use a template engine or build-time processing
- [ ] Extract common logic shared with Step4Preview

**Recent Bug Fix (verified):**
- **Line 1371:** Template literal escaping fixed with string concatenation

### backgroundRemoval.ts

**Status:** Good

**Findings:**
- Clean chroma key implementation
- Efficient flood-fill from edges
- Good edge softness handling

**Minor Issues:**
- **Line 111-127:** BFS flood fill could be optimized with typed arrays
- Large images may cause performance issues

---

## Hooks

### useAudioAnalyzer.ts

**Status:** Good

**Findings:**
- Clean audio context management
- Proper mic stream cleanup
- Good beat detection logic

**Issues:**
- **Line 269-278:** Cleanup effect only runs on unmount. If component remounts rapidly (StrictMode), could create orphaned audio contexts.

**Recommendations:**
- Add ref to track if audio context is still needed
- Consider using `AudioWorklet` for better performance

### useEnhancedChoreography.ts

**Status:** Good

**Findings:**
- Clean integration with multiple engine systems
- Lazy initialization of analyzers
- Good frame pool management

**Minor Issues:**
- **Line 230:** Frame pool update creates new arrays on every call
  ```typescript
  // Consider memoization or structural sharing
  ```

---

## Testing

### E2E Tests (app.spec.ts)

**Status:** Good Structure

**Coverage:**
- Initial load
- Step navigation
- Header/Footer components
- Sign-in modal
- WebGL canvas
- Responsive design
- Accessibility basics

**Missing Tests:**
- [ ] Audio file upload and analysis
- [ ] Frame generation flow
- [ ] Export functionality
- [ ] Pattern/Mode switching
- [ ] Deck mixer interactions
- [ ] Error states and recovery

**Recommendations:**
- Add visual regression tests
- Add performance benchmarks
- Add WebGL rendering tests

### Unit Tests

**Status:** Limited Coverage

**Findings:**
- Only `KineticEngine.test.ts` exists
- No tests for GolemMixer, LabanEffortSystem, or services

**Recommendations:**
- [ ] Add unit tests for BPMDetector
- [ ] Add unit tests for frame processing
- [ ] Add unit tests for Gemini service (with mocks)

---

## Security Considerations

### API Key Handling

**Status:** Acceptable

**Findings:**
- API key from environment variable (good)
- Not exposed to client bundle (good)

**Recommendations:**
- [ ] Add rate limiting on client-side API calls
- [ ] Implement API key rotation support
- [ ] Add request signing for production

### Input Validation

**Status:** Needs Improvement

**Findings:**
1. **Image uploads:** Size validated (384px max) but no format validation
2. **Audio files:** No explicit format/size validation
3. **User prompts:** Passed directly to Gemini API

**Recommendations:**
- [ ] Add MIME type validation for uploads
- [ ] Add max file size limits
- [ ] Sanitize user-provided prompts

### XSS Prevention

**Status:** Good (React handles)

**Findings:**
- React's JSX escaping provides protection
- No `dangerouslySetInnerHTML` found in main components

**Potential Risk:**
- playerExport.ts generates HTML strings - ensure user data is escaped

---

## Performance Considerations

### Memory Management

**Issues Found:**

1. **WebGL Contexts:**
   - HolographicVisualizer doesn't have explicit cleanup
   - Multiple visualizer instances could exhaust GPU memory

2. **Audio Contexts:**
   - Proper cleanup in useAudioAnalyzer but edge cases exist

3. **Canvas Elements:**
   - Frame processing creates many canvas elements
   - Should be pooled or explicitly released

4. **Image URLs:**
   - `URL.createObjectURL` used but `URL.revokeObjectURL` not always called

**Recommendations:**
- [ ] Implement WebGL context cleanup
- [ ] Add canvas element pooling
- [ ] Audit all createObjectURL calls

### Bundle Size

**Current Status:**
- Vendor chunk: React/ReactDOM
- AI chunk: @google/genai
- Icons chunk: lucide-react

**Recommendations:**
- [ ] Analyze bundle with `vite-bundle-visualizer`
- [ ] Consider dynamic imports for modals
- [ ] Tree-shake unused lucide icons

### Rendering Performance

**Findings:**
- Animation loop properly uses RAF
- WebGL rendering is efficient

**Potential Issues:**
- Heavy state updates during animation could cause React re-renders
- Consider using refs for frequently-updated values (already done in many places)

---

## Code Quality Issues

### Dead Code

**Files to Check:**
1. `ControlDock.tsx` - May be unused (replaced by StatusBar/EngineStrip)
2. `FXRail.tsx` - Replaced by FXBezel
3. `LiveDeckMixer.tsx` - Check if still used
4. `DeckMixerPanel.tsx` - Check if still used

### Duplicate Code

**Locations:**
1. FX application logic in Step4Preview.tsx and playerExport.ts
2. BPM detection in GolemMixer.ts and useAudioAnalyzer.ts
3. Pattern definitions in multiple files

### Unused Imports

**Run `eslint --fix` to clean up:**
- Several components have unused icon imports
- Some engine files import unused types

### Console Logs

**Found in:**
- gemini.ts (acceptable for debugging)
- frameProcessor.ts (should be removed or use proper logging)
- backgroundRemoval.ts (should be debug-only)

**Recommendation:**
- [ ] Implement proper logging system with levels (debug, info, warn, error)

---

## Recommendations

### High Priority

1. **Refactor Step4Preview.tsx** - Split into smaller components
2. **Refactor playerExport.ts** - Extract templates, reduce file size
3. **Consolidate type definitions** - Single source of truth
4. **Add error boundaries** - Prevent full app crashes
5. **Memory leak audit** - WebGL/Audio cleanup

### Medium Priority

6. **Expand test coverage** - Add unit tests for engines
7. **Remove dead code** - Clean up unused components
8. **Implement proper logging** - Replace console.logs
9. **Add keyboard navigation** - Bezel components
10. **Input validation** - File uploads and prompts

### Low Priority

11. **Bundle optimization** - Analyze and reduce
12. **Documentation** - Add API docs for engine files
13. **Performance profiling** - Identify bottlenecks
14. **Accessibility audit** - Full WCAG compliance

---

## File-by-File Quick Reference

| File | Status | Priority | Notes |
|------|--------|----------|-------|
| Step4Preview.tsx | Needs Refactor | High | Too large, extract hooks |
| playerExport.ts | Needs Refactor | High | Split templates |
| GolemMixer.ts | Good | Low | Minor threshold tuning |
| KineticEngine.ts | Good | Low | Add fallback handling |
| gemini.ts | Good | Medium | Add input validation |
| types.ts | Needs Cleanup | Medium | Consolidate duplicates |
| FXBezel.tsx | Good | Low | Add keyboard nav |
| ModeBezel.tsx | Good | Low | Add keyboard nav |
| useAudioAnalyzer.ts | Good | Low | Edge case cleanup |
| backgroundRemoval.ts | Good | Low | Optimize for large images |
| tests/e2e/*.ts | Good | Medium | Add more coverage |

---

## Conclusion

The jusDNCE codebase is well-architected with sophisticated audio-reactive animation capabilities. The main areas requiring attention are:

1. **Code organization** - Large files need splitting
2. **Type consistency** - Duplicate definitions need consolidation
3. **Memory management** - WebGL/Audio cleanup needs verification
4. **Test coverage** - Expand beyond E2E to include unit tests

The codebase is production-ready but would benefit from the recommended refactoring to improve maintainability and reduce technical debt.

---

*Report generated by Claude Code audit on 2026-01-07*
