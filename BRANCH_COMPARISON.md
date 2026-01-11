# jusDNCE Branch Comparison Analysis

**Date:** 2026-01-10
**Analyzed by:** Code inspection

---

## Branch Overview

| Branch | Commits | Last Activity | Base |
|--------|---------|---------------|------|
| `origin/main` | bb8f1c8 | Older | Base branch |
| `origin/claude/fix-ui-deploy-firebase-qq3V7` | ed24407 | Firebase config | main |
| `origin/codex/2026-01-07/integrate-paywall-and-monetize-system-oi97p2` | f5ef54b | Paywall features | main |
| `origin/Merge-Core` | f8e8fbf | Refactor docs | Paywall-based |
| `claude/analyze-jusdnce-architecture-j3Ah8` (current) | 1f8623b | Architecture analysis | Merge-Core |

---

## Current Branch Lineage

```
main
  │
  ├── Firebase branch (claude/fix-ui-deploy-firebase-qq3V7)
  │     └── Has: firebase.json, .firebaserc, data/, scripts/costs/
  │
  └── Paywall branch (codex/2026-01-07/...)
        │
        └── Merge-Core
              │
              └── current branch (claude/analyze-jusdnce-architecture-j3Ah8)
                    └── Has: Paywall features, refactor/ folder, docs
```

---

## What Each Branch Has

### Firebase Branch (`claude/fix-ui-deploy-firebase-qq3V7`)

**Unique Files:**
```
.firebaserc                    # Firebase project config
firebase.json                  # Firebase hosting config
data/cost-assumptions.json     # Cost model data
data/costs-dashboard.json      # Dashboard data
scripts/costs/calculator.mjs   # Cost calculator script (203 lines)
```

**playerExport.ts:** 3,021 lines (larger, different UI features)

**Key differences:**
- Touch zone controller (left/right half-screen)
- Pattern joystick (radial dial)
- Gesture gate for audio permissions
- Audio adapter pills (File/Mic/System)

### Paywall Branch (`codex/2026-01-07/...`)

**Unique Files:**
```
services/bugReporter.ts        # Bug reporting service
services/qrCodes.ts            # QR code generation
tools/pricingCalculator.mjs    # Pricing calculator (110 lines)
```

**playerExport.ts:** 2,788 lines

**Key differences:**
- Streaming audio input (URL paste)
- QR code sharing
- Smart bezel drawers
- FXRail with X/Y axis mapping

### Current Branch (Merge-Core + analysis)

**Has from Paywall:**
- ✅ `services/bugReporter.ts`
- ✅ `services/qrCodes.ts`
- ✅ `tools/pricingCalculator.mjs`
- ✅ playerExport.ts (2,788 lines - Paywall version)

**Has unique:**
- ✅ `refactor/` folder with architecture patterns
- ✅ Documentation (COMPLETE_REFACTOR_PLAN.md, etc.)

**Missing from Firebase:**
- ❌ `.firebaserc`
- ❌ `firebase.json`
- ❌ `data/cost-assumptions.json`
- ❌ `data/costs-dashboard.json`
- ❌ `scripts/costs/calculator.mjs`

---

## playerExport.ts Comparison

| Feature | Firebase (3,021 lines) | Paywall/Current (2,788 lines) |
|---------|------------------------|-------------------------------|
| Touch zones | ✅ Half-screen L/R | ❌ |
| Pattern joystick | ✅ Radial dial | ❌ |
| Gesture gate | ✅ Audio permission | ❌ |
| Adapter pills | ✅ File/Mic/System | ❌ |
| Streaming URL | ❌ | ✅ Paste input |
| Smart bezels | ❌ | ✅ Collapsible drawers |
| FX X/Y axis | ❌ | ✅ Dual axis mapping |

---

## Recommended Merge Strategy

Based on the analysis, the merge should:

### 1. Keep Current Branch as Base
The current branch (Paywall-based) has:
- Streaming audio (complex feature, multiple files)
- QR codes (integrated into export flow)
- Refactor architecture patterns
- Better documentation

### 2. Add from Firebase Branch

**Copy directly (no conflicts expected):**
```bash
git checkout origin/claude/fix-ui-deploy-firebase-qq3V7 -- \
  .firebaserc \
  firebase.json \
  data/cost-assumptions.json \
  data/costs-dashboard.json \
  scripts/costs/calculator.mjs
```

**Manually port (UI features in playerExport.ts):**
- Touch zone controller (~100 lines)
- Pattern joystick (~150 lines)
- Gesture gate (~50 lines)
- Adapter pills (~80 lines)

### 3. Fix Known Issues

From `tools/pricingCalculator.mjs`:
- Currently uses $0.017/sheet (wrong)
- Should be $0.003/sheet (correct)

---

## Immediate Actions

1. **Add Firebase config files** from Firebase branch
2. **Update pricingCalculator.mjs** with correct cost assumptions
3. **Consider porting** Firebase UI features to playerExport.ts later

---

## File Diff Summary

### Current → Firebase (what we're missing)
```
+ .firebaserc                    (Firebase project ID)
+ firebase.json                  (Hosting config)
+ data/cost-assumptions.json     (Cost model)
+ data/costs-dashboard.json      (Dashboard)
+ scripts/costs/calculator.mjs   (Cost automation)
~ services/playerExport.ts       (Different UI, +233 lines)
```

### Current → Paywall (already have)
```
= services/bugReporter.ts        (Same)
= services/qrCodes.ts            (Same)
= tools/pricingCalculator.mjs    (Same)
= services/playerExport.ts       (Same)
```

---

## Conclusion

The current branch is **Paywall-based** and missing Firebase deployment config. The merge should:

1. Add Firebase config files (simple copy)
2. Keep Paywall's playerExport.ts (streaming audio is valuable)
3. Optionally port Firebase's advanced UI controls later

**Priority:** Add Firebase config files to enable deployment.
