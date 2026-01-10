# Pricing Model (Trial → Exports → Golems/"DKGs" → Pro)

## Goals
- Keep a single free experience (1 trial generation) that proves value without export rights.
- Let every artifact be purchasable: MP4 export, golem/DKG bundles, and a Pro unlock for unlimited exports.
- Preserve high margins (>70%) using existing cost calculator inputs (Turbo ~\$0.017, High-Res ~\$0.030 baseline).
- Align terminology: **rigs → Golems**, exportable bundles → **DKGs (Deterministic Kinetic Golems)**, decks remain "Golem Decks".

## Tiering & Entitlements
| Tier | Price (suggested) | Includes | Notes |
| ---- | ----------------- | -------- | ----- |
| Trial | Free (1 run) | 1 low-res generation, preview only, watermark, limited director controls (first/last category only). | Blocks MP4/HTML/DKG exports, FX/Kinetic engine locked. Paywall badges visible. |
| Starter Export | ~$1 per MP4 | One-time MP4 export from Step4, watermark removed on the paid file only. | Uses calculator to keep margin >90%. HTML/DKG blocked unless bought separately. |
| Golem Packs (DKGs) | ~$3 / ~$7 / ~$12 for Standard/Pro/Elite | Downloadable DKGs (formerly rigs) with regen rights and swapping; watermark removed for those assets. | Price scales with frame quality/pose diversity. MP4 exports still per-file unless bundled. |
| Pro Monthly | ~$9.99 | Unlocks MP4 + HTML/DKG exports without caps, FX/Kinetic controls, music/rig swapping, daily stipend of 1+ gens. | Enforce soft daily caps via credits; watermark removed everywhere. |
| Share-to-Earn (future) | Free credits for verified referrals/shares | Watermarked outputs gain UTM-tagged share buttons that can mint limited credits on successful referrals. | Keep off by default until tracking is in place. |

## Monetization Flow
1. Free trial leads to a watermarked preview; all exports show a lock state with price callouts.
2. Users can buy the specific thing they want (MP4, DKG/golem, or full Pro) without forced bundles.
3. Calculator PR provides the knobs to keep per-unit price safely above cost; revisit quarterly or when provider pricing shifts.
4. Watermark stays until a paid entitlement is attached; Pro globally disables the watermark.

## Pricing Math References
- Turbo (4 frames) baseline: ~\$0.017 including hosting.
- High-Res (8 frames) baseline: ~\$0.030 including hosting.
- Starter MP4 at ~\$1 yields >90% gross margin even at High-Res.
- Golem Pack pricing assumes 1–3 gens per pack; margins remain >75% with current costs.

## QR Code System (sales + sharing)
- Add QR generation for: (a) user share links to previews, (b) paywall screens to let users pay/upgrade on mobile, and (c) Pro landing pages for in-person events.
- Generate QR codes server-side with short links (Firestore doc + hosted redirect) to avoid leaking raw IDs.
- Store QR metadata (target, campaign tag, creator UID) for attribution; log scans to analytics.
- Surface QR download in Step4 paywall modal and in-share panel; include watermark if preview-only.

## Bug Reporting in Help
- Add "Report a Bug" entry under Help: opens modal with severity, repro steps, device info, and optional screenshot/console text.
- Persist to Firestore `bug_reports` with status and timestamps; send optional email/Slack webhook for high severity.
- Include checkbox to attach latest generation context (golem ID/DKG name, preset, browser info) when permitted.

## Terminology Update Checklist
- Rename all user-facing "rig" references to "Golem" or "DKG" (Deterministic Kinetic Golem) across UI copy, docs, and exports.
- Ensure export file extensions and sprite sheet naming use `.dkg` where applicable.
- Update paywall and pricing copy to use the new tier names (Starter Export, Golem Packs, Pro Monthly).
- Keep technical identifiers stable; apply name changes in presentation layers and docs first.
