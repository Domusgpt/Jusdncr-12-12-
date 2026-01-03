# Cost Dashboard (auto-generated)

_Last updated: 2026-01-03T21:44:56.218Z_

## Provider Pricing (per image generation)

| Cloud | Model | Image Gen | Source |
| --- | --- | --- | --- |
| Google | Gemini 2.5 Flash Image | $0.0030 / image | https://ai.google.dev/pricing |
| OpenAI | GPT-4o | $0.0400 / image | https://openai.com/api/pricing/ |
| Anthropic | Claude 3.5 Sonnet | $0.0400 / image | https://www.anthropic.com/api |

## Sprite-sheet generation profile (derived from services/gemini.ts)

| Mode | Sheets per generation | Model cost / gen | Total cost / gen (incl. infra) | Notes |
| --- | --- | --- | --- | --- |
| Turbo (default) | 2 (base, flourish) | $0.0060 | $0.0077 | Matches App.tsx defaults: base + flourish sheets for 32 frames with mirroring |
| Quality (Turbo off) | 3 (base, flourish, alt) | $0.0090 | $0.0107 | Adds alternate movement sheet when useTurbo is disabled |
| Super (paid) | 4 (base, flourish, alt, smooth) | $0.0120 | $0.0137 | Adds smoothing/interpolation sheet when superMode is enabled |

## Core Assumptions

- Default model: **Gemini 2.5 Flash Image**
- Default profile: **turbo**
- Asset footprint: **12 MB** stored & **12 MB** egress per generation
- Firestore ops per generation: **8 reads / 3 writes**
- Usage pattern: **5 generations per user per day (30-day month)**
- Fixed platform cost: **$150.00 / month**

## Unit Economics (default profile)

- **Per-generation cost:** $0.0077
- **Per-user monthly cost @ 5 gens/day:** $1.16

### Margin by Price Point

| Price / gen | Margin / gen | Gross Margin | Break-even volume |
| --- | --- | --- | --- |
| $0.20 | $0.1923 | 96.1% | 781 gens/mo |
| $0.50 | $0.4923 | 98.5% | 305 gens/mo |
| $0.75 | $0.7423 | 99.0% | 203 gens/mo |

### Sensitivity (Low / Med / High usage)

| Cohort size | Monthly Cost | Monthly Revenue (at $0.50/gen) | Gross Margin |
| --- | --- | --- | --- |
| 100 users | $115.82 | $7500.00 | 98.5% |
| 500 users | $579.09 | $37500.00 | 98.5% |
| 2,000 users | $2316.34 | $150000.00 | 98.5% |

### Warnings

- Trigger alert if cost/gen exceeds **$0.38**
- Trigger alert if per-user monthly cost exceeds **$37.50**

## Sources
- Models: Google (https://ai.google.dev/pricing), OpenAI (https://openai.com/api/pricing/), Anthropic (https://www.anthropic.com/api)
- Storage: https://cloud.google.com/storage/pricing#storage-pricing
- Bandwidth: https://cloud.google.com/storage/pricing#network-egress
- Firestore: https://firebase.google.com/pricing
