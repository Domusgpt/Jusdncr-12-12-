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

## 2026-01-04T00:33:16Z
- Added in-app bug reporting to the Help overlay with local persistence for offline capture plus impact tagging.
- Introduced QR-based sharing/upgrade controls inside the Step 4 export menu using branded QR codes and share links.
- Next: sync bug reports to backend support intake, wire QR events into analytics, and expose QR download from paywall modal.

## 2026-01-04T02:42:22Z
- Added streaming link ingestion across Step 1 and Step 4 so users can paste URLs or upload audio later; Step 4 now surfaces a stream-link modal and badge plus clipboard paste support.
- Updated the standalone HTML player to accept pasted stream URLs with clipboard helper, inline status, and CORS guidance while retaining local file upload.
- Next: wire share-to-earn logic into QR codes, sync bug reports to backend, and add safety checks for unsupported/blocked audio links.

## 2026-01-04T03:56:11Z
- Simplified Step 1 audio UX to a single "Streaming URL" option that opens a focused modal for pasting any supported stream, removing inline clutter.
- Kept "add later" as a clean fallback while retaining upload/change flows; confirmed hook-up to existing `onSetAudioLink` behavior.
- Next: verify stream modal parity in Step 4/HTML player and keep Impact/pattern/kinetic controls smoke-tested alongside new audio sourcing.

## 2026-01-04T04:45:00Z
- Simplified audio selection everywhere: Step 1 keeps a single "Streaming URL" path with a cleaner add-later link; Step 4 status bar now exposes a compact audio menu with Upload vs Streaming URL instead of multiple inline buttons.
- Streamlined the exported HTML player with a dedicated STREAM toggle that reveals the paste field and focuses it, keeping compatibility with legacy rig/audio flows.
- Next: Validate Impact/pattern/kinetic interactions after the streamlined controls, and ensure stream-row visibility persists through exports and previews.

## 2026-01-05T20:30:00Z
- Added a standalone pricing calculator script (`tools/pricingCalculator.mjs`) to model per-generation costs, offer margins, and monthly scenarios.
- Documented assumptions and usage in `docs/pricing_calculator.md` for Trial/Starter/Golem Pack/Pro tiers.
- Next: align calculator inputs with Stripe metadata and expose results to admin dashboards.

## 2026-01-06T21:08:51Z
- Reviewed request to integrate fixes from another recent PR, but no remote branches or patch artifacts are available in the repository to pull or cherry-pick.
- Next: obtain the referenced PR diff or branch so changes can be merged; once available, reconcile with current work branch and rerun build/tests.
