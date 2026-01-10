# jusDNCE Refactor & Release Plan

**Date:** 2026-01-08  
**Base Branch:** `claude/fix-ui-deploy-firebase-qq3V7` (124 commits)  
**Merge Source:** `codex/2026-01-07/integrate-paywall-and-monetize-system-oi97p2` (109 commits)

---

## 1. ACTUAL COST ARCHITECTURE (Verified from Code)

Your sprite sheet approach is **13x more cost-efficient** than single-image generation:

| Mode | API Calls | Model Cost | Total w/ Infra | Frames Output |
|------|-----------|------------|----------------|---------------|
| **Turbo** | 2 sheets | $0.006 | **$0.0077** | 32+ frames |
| Quality | 3 sheets | $0.009 | $0.0107 | 48+ frames |
| Super | 4 sheets | $0.012 | $0.0137 | 64+ frames |

**Per-frame cost:** $0.006 ÷ 32 = **$0.0001875/frame** (vs $0.003+ per-image elsewhere)

### Margin Analysis (Your Current Model)

| Price Point | Margin/Gen | Gross Margin | Break-even |
|-------------|------------|--------------|------------|
| $0.20/gen | $0.19 | **96.1%** | 781 gens |
| $0.50/gen | $0.49 | **98.5%** | 305 gens |
| $1.00/export | $0.99 | **99.2%** | 152 gens |

---

## 2. BRANCH COMPARISON & MERGE STRATEGY

### Firebase Branch (Use as Base) ✅
- 124 commits (more recent)
- Has: `.firebaserc`, `firebase.json`, cost automation (`npm run costs:generate`)
- Has: `data/cost-assumptions.json`, `data/costs-dashboard.json`
- Has: `CODE_AUDIT.md` with detailed findings
- Has: Complete pricing documentation

### Paywall Branch (Cherry-pick Features)
- 109 commits
- Has: `tools/` directory (missing from Firebase branch)
- Missing: Firebase config, cost automation, data folder
- Likely has: Paywall modal implementations, credit system wiring

### Merge Strategy
```bash
# 1. Create unified release branch from Firebase base
git checkout claude/fix-ui-deploy-firebase-qq3V7
git checkout -b release/v1.0-unified

# 2. Cherry-pick paywall features
git cherry-pick <commits-from-codex-branch-with-paywall-logic>

# 3. Resolve conflicts, favoring Firebase infra
```

---

## 3. MONETIZATION RECOMMENDATION: HYBRID CREDITS + SUBSCRIPTION

Based on your **$0.0077/generation cost**, here's the optimal pricing structure:

### Tier Architecture

| Tier | Price | Includes | Your Cost | Margin |
|------|-------|----------|-----------|--------|
| **Trial** | Free | 1 watermarked preview | $0.0077 | -100% (acquisition) |
| **Starter** | $0.99/export | Single MP4, no watermark | $0.0077 | **99.2%** |
| **Golem Pack** | $2.99-$11.99 | DKG bundle + 3-10 MP4s | $0.023-$0.077 | **97-99%** |
| **Pro** | $9.99/mo | 50 gens/mo, all features | $0.385 | **96.1%** |
| **Creator** | $29.99/mo | 200 gens/mo + API access | $1.54 | **94.9%** |

### Why This Works

1. **Low barrier entry:** $0.99 impulse purchase converts trial users
2. **Value ladder:** Users upgrade as they see results
3. **Subscription retention:** Pro users generate recurring revenue
4. **API tier:** Enables B2B/plugin ecosystem for your orbital app

### Credit System Design

```typescript
// credits.ts - Simple credit ledger
interface CreditTransaction {
  userId: string;
  type: 'purchase' | 'subscription' | 'generation' | 'export' | 'refund';
  amount: number; // positive = credit, negative = debit
  timestamp: Date;
  metadata: {
    generationId?: string;
    paymentId?: string;
    tier?: 'turbo' | 'quality' | 'super';
  };
}

// Cost mapping
const CREDIT_COSTS = {
  generation_turbo: 1,    // 1 credit = $0.20 value at base
  generation_quality: 2,
  generation_super: 3,
  export_mp4: 1,
  export_dkg: 2,
};
```

---

## 4. REFACTOR PRIORITIES (From Code Audit)

### HIGH PRIORITY

| Task | File | Issue | Solution |
|------|------|-------|----------|
| Split giant component | `Step4Preview.tsx` (1500+ lines) | Too large, memory leaks | Extract `useAnimationLoop`, `useFXPipeline`, `useGolemState` hooks |
| Split templates | `playerExport.ts` (3500+ lines) | Embedded CSS/JS/HTML | Move to `/templates/player/` with build-time bundling |
| Consolidate types | `types.ts` + engine files | Duplicate definitions | Single source in `types/index.ts` |
| Add error boundaries | `App.tsx` | No crash protection | Wrap Step components |

### MEDIUM PRIORITY

| Task | File | Issue | Solution |
|------|------|-------|----------|
| Implement paywall | New `PaywallGate.tsx` | Missing from Firebase branch | Cherry-pick from paywall branch |
| Credit system | New `services/credits.ts` | Not implemented | Firestore-backed ledger |
| Stripe integration | New `services/stripe.ts` | Mock only | Use `@stripe/stripe-js` |
| Input validation | `gemini.ts` | No sanitization | Add file type/size checks |

### LOW PRIORITY

| Task | File | Issue | Solution |
|------|------|-------|----------|
| Dead code cleanup | `ControlDock.tsx`, `FXRail.tsx` | Unused | Remove after verification |
| Unit tests | `engine/*.ts` | Only KineticEngine tested | Add GolemMixer, BPMDetector tests |
| Keyboard nav | `FXBezel.tsx`, `ModeBezel.tsx` | Missing a11y | Add Tab/Enter/Escape handlers |

---

## 5. PAYWALL IMPLEMENTATION SPEC

### Trigger Points

```typescript
// PaywallGate.tsx - Wrapper component
const PAYWALL_TRIGGERS = {
  export_mp4: { requiredTier: 'starter', credits: 1, price: '$0.99' },
  export_dkg: { requiredTier: 'golem_pack', credits: 2, price: '$2.99' },
  quality_mode: { requiredTier: 'pro', credits: 0 },
  super_mode: { requiredTier: 'pro', credits: 1 },
  fx_engine: { requiredTier: 'pro', credits: 0 },
  api_access: { requiredTier: 'creator', credits: 0 },
};

// Usage in Step4Preview
<PaywallGate 
  action="export_mp4" 
  onUnlocked={() => handleExport()}
>
  <Button>Export MP4</Button>
</PaywallGate>
```

### Stripe Products (Firebase Extension)

```json
// firestore: products/{productId}
{
  "name": "Starter Export",
  "stripe_price_id": "price_xxx",
  "type": "one_time",
  "credits": 1,
  "price_cents": 99
}

{
  "name": "Pro Monthly",
  "stripe_price_id": "price_yyy",
  "type": "recurring",
  "interval": "month",
  "credits_per_period": 50,
  "price_cents": 999
}
```

---

## 6. API MONETIZATION (For Orbital App Parity)

### Endpoint Design

```
POST /api/v1/generate
Authorization: Bearer <api_key>
X-Credits-Remaining: 47

{
  "image": "base64...",
  "style": "cinematic",
  "mode": "turbo",
  "frames": 32
}

Response:
{
  "generation_id": "gen_abc123",
  "frames": [...],
  "credits_used": 1,
  "credits_remaining": 46
}
```

### Pricing Tiers

| Tier | Price | Requests/mo | Rate Limit | Cost/Request |
|------|-------|-------------|------------|--------------|
| Free | $0 | 50 | 5/min | $0.0077 (loss leader) |
| Starter | $29/mo | 500 | 20/min | $0.058 |
| Growth | $99/mo | 2000 | 50/min | $0.0495 |
| Enterprise | Custom | Unlimited | Custom | Negotiated |

### Markup Math

- Your cost: $0.0077/generation
- Starter tier: $29/500 = $0.058/gen → **7.5x markup** (87% margin)
- Growth tier: $99/2000 = $0.0495/gen → **6.4x markup** (84% margin)

---

## 7. IMPLEMENTATION ROADMAP

### Phase 1: Merge & Stabilize (Days 1-3)
- [ ] Create `release/v1.0-unified` from Firebase branch
- [ ] Cherry-pick paywall components from codex branch
- [ ] Resolve merge conflicts
- [ ] Run full test suite
- [ ] Deploy to staging Firebase project

### Phase 2: Core Refactor (Days 4-7)
- [ ] Extract hooks from Step4Preview.tsx
- [ ] Split playerExport.ts templates
- [ ] Implement PaywallGate component
- [ ] Add error boundaries
- [ ] Clean up dead code

### Phase 3: Monetization (Days 8-12)
- [ ] Set up Stripe products in Firebase console
- [ ] Install `@invertase/firestore-stripe-payments`
- [ ] Implement credit ledger service
- [ ] Wire PaywallGate to Stripe checkout
- [ ] Add subscription management UI

### Phase 4: API Layer (Days 13-18)
- [ ] Create Firebase Functions for API endpoints
- [ ] Implement API key generation/management
- [ ] Add rate limiting with Firebase RTDB
- [ ] Set up Stripe metering for usage billing
- [ ] Build developer documentation

### Phase 5: Launch Prep (Days 19-21)
- [ ] Enable GitHub Pages for both branches
- [ ] Set up Firebase production project
- [ ] Configure custom domain
- [ ] Add analytics (Mixpanel/Amplitude)
- [ ] Prepare App Store wrapper (Capacitor)

---

## 8. GITHUB ACTIONS UPDATES

```yaml
# .github/workflows/deploy.yml additions
name: Deploy to Firebase + GitHub Pages

on:
  push:
    branches:
      - release/v1.0-unified
      - claude/fix-ui-deploy-firebase-qq3V7

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install & Build
        run: |
          npm ci
          npm run build
        env:
          API_KEY: ${{ secrets.GEMINI_API_KEY }}
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: jusdnce-app
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 9. TELEMETRY & AGENTIC OBSERVABILITY

Per your preferences for agentic-first telemetry:

```typescript
// services/telemetry.ts
interface AgentEvent {
  event_type: 'generation' | 'export' | 'error' | 'paywall_hit' | 'conversion';
  timestamp: string;
  session_id: string;
  user_id?: string;
  metadata: {
    mode?: 'turbo' | 'quality' | 'super';
    latency_ms?: number;
    cost_usd?: number;
    frames_generated?: number;
    error_code?: string;
  };
}

// Cloud Function endpoint for agent consumption
export const getAgentMetrics = functions.https.onCall(async (data, context) => {
  // Returns structured metrics for orchestrator agents
  return {
    daily_generations: 1247,
    conversion_rate: 0.034,
    avg_latency_ms: 2340,
    error_rate: 0.012,
    revenue_today_usd: 127.45,
    top_styles: ['cinematic', 'anime', 'glitch'],
  };
});
```

---

## 10. NEXT IMMEDIATE ACTION

I recommend we start by:

1. **Examine the paywall branch** - Share that zip so I can identify exactly which commits/files to cherry-pick
2. **Or** start implementing the PaywallGate component fresh using the spec above
3. Deploy the current Firebase branch to GitHub Pages immediately for a working baseline

Which direction do you want to go?
