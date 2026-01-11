# Pricing Calculator & Margins

This calculator mirrors the simplified pricing tiers (Trial → Starter Export → Golem Packs → Pro Monthly) and uses the cost assumptions surfaced during pricing research. Run it locally to pressure-test margins for different daily usage scenarios.

## Assumptions
- **Compute**: Turbo (4-frame) ~ $0.017, High-Res (8-frame) ~ $0.030.
- **Storage**: ~$0.026/GB-month, ~5 MB retained per generation for 30 days.
- **Egress**: ~$0.12/GB. Turbo MP4/preview ~12 MB; High-Res ~18 MB.
- **Firestore**: ~8 reads + 3 writes per generation (auth/session/usage events) at standard pricing.

These inputs produce per-generation costs of roughly **$0.0186 (Turbo)** and **$0.0324 (High-Res)** after bandwidth + storage + Firestore overheads.

## How to run
```bash
node tools/pricingCalculator.mjs
```
The script prints:
- Cost per generation by quality
- Margins for each offer (Trial, Starter Export, Golem Packs, Pro Monthly)
- Monthly scenarios (e.g., 5 runs/day/user pay-per-export; Pro Monthly with daily allowance)

## Offer matrix (example)
| Offer | Price | Included runs | Quality | Approx. cost per run | Margin example |
| --- | --- | --- | --- | --- | --- |
| Trial (preview) | $0 | 1 | Turbo | $0.0186 | n/a |
| Starter Export (MP4) | $1 | 1 | Turbo | $0.0186 | ~98.1% |
| Bronze Golem Pack | $3 | 3 | Turbo | $0.0186 | ~98.1% |
| Silver Golem Pack | $7 | 8 | Turbo | $0.0186 | ~97.9% |
| Gold Golem Pack | $12 | 15 | High-Res | $0.0324 | ~95.9% |
| Pro Monthly | $9.99 | ~30 runs/mo | High-Res | $0.0324 | ~90.3% (at 1 run/day) |

## Scenario walkthrough
- **Pay-per-export**: At 5 runs/day/user for a month, Turbo exports at $1 generate ~98% margin; High-Res at $1.50 stay above 96%.
- **Pro monthly**: With 1 run/day of High-Res, margin sits around 90%. Add a 20% buffer by capping Pro at ~45 runs/month or upselling extra exports a la carte.
- **Golem Packs**: Tiered pricing keeps margins ~96–98% while encouraging upsell to Pro for unlimited exports + HTML/DKG access.

## Next hooks
- Sync calculator inputs with live Stripe price metadata (e.g., `metadata.cost_per_run` and `included_runs`).
- Surface results in an admin view or Notion export to adjust tiers without code changes.
- Add sensitivity toggles for CDN egress variance and bonus daily allowances.
