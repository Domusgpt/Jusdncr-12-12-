# Systematic Execution Plan for Monetization, Cost Modeling, and Adaptive Player

## Objectives
- Reinstate and harden monetization (credits/paywall) tied to Firebase + Stripe.
- Produce transparent cost models and calculators for per-generation economics.
- Upgrade the HTML/offline player with mic input, reactive playback, and broader platform compatibility.
- Package the player into trusted, portable formats (PWA, widget, extension, desktop wrapper).
- Add watermarking, QR-enabled sharing, and social hooks to drive conversions.
- Maintain compliance, observability, and launch-readiness.

## Guiding Principles
- Ship in iterative milestones with instrumentation per feature gate.
- Prefer server-side enforcement (credits, watermarking) with client-side guardrails.
- Keep artifacts self-contained and CSP-friendly for embeddability.
- Document math, assumptions, and per-feature rollout switches.

## Phase Breakdown

### Phase 0 — Readiness & Tooling
- Verify Node >=18, install deps (`npm install`), ensure Firebase CLI and Stripe keys available in env.
- Baseline test run (lint/test) to confirm working tree health.
- Create cost inputs sheet (API prices, Firebase egress/storage, hosting bandwidth assumptions).

### Phase 1 — Monetization & Credits
- Restore credit ledger access layer (Firestore `users/{uid}` credits) with server-side decrement middleware on expensive endpoints.
- Re-enable Stripe checkout + webhook/extension for credit top-ups; map products/prices to Firestore mirrors.
- Client tasks: credit meter, purchase flow, insufficient-credit UX, promo code/tier selection.
- Safety: daily/monthly caps aligned to cost model, webhook verification, signed client requests.
- Align all pricing and copy to the simplified tiers in `docs/pricing_model.md` (Trial → Starter Export → Golem Packs/DKGs → Pro Monthly).

### Phase 2 — Cost Modeling & Pricing Artifacts
- Build a calculator script/doc: per-generation cost = LLM tokens + media inference time + storage + bandwidth + Firebase reads/writes.
- Model scenarios (5 gens/day/user, 30 days) with margin buffer; expose knobs for provider price changes.
- Publish assumptions, formulas, and target margins; tie to feature flags/limits; keep in sync with the calculator PR already published.

### Phase 3 — Watermarking & Sharing
- Server-side watermark overlay in export pipeline (videos/thumbnails) gated by tier; ensure deterministic positioning and opacity.
- Add share/deep-link buttons with UTM tags, copy-link, QR codes for previews/paywall upgrades, and preview thumbnail generation.
- QA watermark visibility across outputs and share previews; ensure QR payloads never leak private IDs.

### Phase 4 — HTML/Offline Player Evolution
- Mic Input: integrate `MediaDevices.getUserMedia` + Web Audio graph with analyzer; permission UX and fallback.
- Reactive Playback: beat/onset detection drives visuals; parameterize for overlay/embedded modes.
- External audio sources: tab/system capture (extension), YouTube Player API sync, optional line-in/virtual cable flow; avoid TOS-violating downloads.
- Maintain current mp4 ingest path; add visual preset toggles for adaptability.

### Phase 5 — Packaging & Distribution
- PWA bundle with manifest + service worker for offline assets; cache-busting and integrity.
- Embeddable iframe/widget bundle exposing postMessage API for host control; size presets for cut-out overlay.
- Browser extension prototype enabling tab-audio capture + mic, with documented permissions.
- Desktop wrapper (Electron/Tauri) for trusted offline playback with mic; signed artifacts.

### Phase 6 — Compliance, Limits, and Observability
- Rate limits and per-user credit caps; fraud controls (captcha/velocity checks) on signup/checkout.
- Usage logging with cost attribution; alerts on margin compression or cost spikes.
- Security review: webhook verification, CSP for embeds, storage rules aligning to credit enforcement.
- Add bug-report intake (modal + Firestore + webhook) with redaction of PII by default; expose in Help menu.

### Phase 7 — Launch QA & Documentation
- End-to-end smoke tests: checkout, credit decrement/exhaustion, mic permission flows, overlay modes.
- Cross-browser testing (Chrome/Firefox/Safari + mobile PWA) for mic/accessibility.
- Document pricing math, limits, refund/failed-payment handling, terminology updates (Golem/DKG), and distribution options.
- Prepare release notes and deployment runbook for Firebase Hosting + Firestore updates.

## Deliverables per Phase
- Updated source modules (API guards, client UI), Stripe/Firebase config, and Firestore rules as needed.
- Cost calculator (script + markdown write-up) with scenario tables.
- Watermarked export assets and share UX changes.
- Player packages: HTML/PWA bundle, widget API docs, extension manifest, desktop wrapper plan.
- QA checklist and instrumentation dashboards for launch.

## Milestone Sequencing & Dependencies
- Phases 1 and 2 unblock pricing and usage limits; execute before broad user rollout.
- Phase 4/5 can iterate in parallel once monetization gates exist; extensions depend on widget API surface.
- Phase 6 depends on Phase 1 telemetry; Phase 7 wraps all deliverables with docs and tests.

## Next Actions (immediate)
- Stand up cost inputs and calculator scaffold.
- Reconstitute credit/paywall middleware and Stripe hooks with feature flags for safe rollout.
- Draft mic/reactivity implementation plan aligned with existing player architecture and asset pipeline.
- Extend devtrack logging for each session and tie tasks to milestones above.
