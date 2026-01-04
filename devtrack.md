# Dev Track Log

## 2026-01-03T21:29:16Z
- Initialized session; reviewed root AGENTS instructions for deployment tooling expectations.
- Created `docs/systematic_plan.md` outlining phased execution across monetization, cost modeling, player evolution, packaging, compliance, and launch QA.
- Next: build cost input sheet + calculator scaffold and reconstitute credit/paywall middleware with Stripe + Firebase hooks under feature flags.

## 2026-01-03T21:48:27Z
- Reviewed pricing requirements (offer everything for sale), QR code ask, bug-reporting in Help, and terminology change to Golems/DKGs.
- Added `docs/pricing_model.md` capturing simplified tiers (Trial → Starter Export → Golem Packs/DKGs → Pro), QR system, bug intake, and naming checklist.
- Updated `docs/systematic_plan.md` and `BUSINESS_STRATEGY.md` to align phases and pricing strategy with the new model and calculator PR references.
- Next: propagate Golem/DKG terminology into UI copy and paywall flows, wire QR + bug-report endpoints, and sync pricing calculator inputs with Stripe/Firebase mirrors.

## 2026-01-04T05:32:00Z
- Re-ran `npm run build` after merged changes; TypeScript and Vite builds now succeed (prior TS1005 at `services/playerExport.ts:1371` not reproducible).
- Verified dependency install state (`npm install` already present); no code changes required for build.
- Next: monitor for recurring build errors on CI, propagate Golem/DKG terminology into UI/paywall, and wire QR + bug-report flows per plan.

## 2026-01-03T22:25:14Z
- Investigated prior TS1005 report at `services/playerExport.ts:1371`; reran TypeScript build and Vite bundle—no syntax errors reproduced.
- Noted Vite CLI rejects `--pretty` flag (removed from command); standard `npm run build` completes successfully.
- Next: continue Golem/DKG terminology propagation, implement QR + bug-report flows, and monitor CI for any recurrence of build parsing issues around `playerExport.ts`.

## 2026-01-03T22:41:09Z
- Propagated Golem/DKG terminology into UI copy (import buttons, help overlays, Step 4 labels) and standalone player export controls/alerts.
- Updated project save flow to emit `.dkg` files and refreshed acceptance filters plus E2E tests to expect Golem naming and DKG downloads.
- Next: continue terminology sweep across remaining docs/copy, integrate QR code + bug intake flows, and align pricing/paywall UX with Golem tiers.

## 2026-01-03T23:48:46Z
- Added legacy rig compatibility to the standalone player, allowing .rig/.jusdnce inputs and optional conversion to .dkg on load.
- Normalized incoming rig payloads to tolerate older field names before hydrating the player state.
- Next: wire QR code sharing + bug-report intake and continue pricing/paywall implementation with updated Golem/DKG flows.
