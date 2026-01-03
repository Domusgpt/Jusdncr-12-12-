# Cost Dashboard (auto-generated)

_Last updated: 2026-01-03T21:32:32.946Z_

## Provider Pricing (per 1K tokens)

| Cloud | Model | Input | Output | Source |
| --- | --- | --- | --- | --- |
| Google | Gemini 1.5 Flash (8K context) | $0.0003 | $0.0007 | https://ai.google.dev/pricing |
| OpenAI | GPT-4o | $0.0050 | $0.0150 | https://openai.com/api/pricing/ |
| Anthropic | Claude 3.5 Sonnet | $0.0030 | $0.0150 | https://www.anthropic.com/api |

## Core Assumptions

- Default model: **Gemini 1.5 Flash (8K context)**
- Tokens per generation: **1800 in / 900 out**
- Asset footprint: **12 MB** stored & **12 MB** egress per generation
- Firestore ops per generation: **8 reads / 3 writes**
- Usage pattern: **5 generations per user per day (30-day month)**
- Fixed platform cost: **$150.00 / month**

## Unit Economics

- **Per-generation cost:** $0.0030
- **Per-user monthly cost @ 5 gens/day:** $0.45

### Margin by Price Point

| Price / gen | Margin / gen | Gross Margin | Break-even volume |
| --- | --- | --- | --- |
| $0.20 | $0.1970 | 98.5% | 762 gens/mo |
| $0.50 | $0.4970 | 99.4% | 302 gens/mo |
| $0.75 | $0.7470 | 99.6% | 201 gens/mo |

### Sensitivity (Low / Med / High usage)

| Cohort size | Monthly Cost | Monthly Revenue (at $0.50/gen) | Gross Margin |
| --- | --- | --- | --- |
| 100 users | $44.72 | $7500.00 | 99.4% |
| 500 users | $223.59 | $37500.00 | 99.4% |
| 2,000 users | $894.34 | $150000.00 | 99.4% |

### Warnings

- Trigger alert if cost/gen exceeds **$0.38**
- Trigger alert if per-user monthly cost exceeds **$37.50**

## Sources
- Models: Google (https://ai.google.dev/pricing), OpenAI (https://openai.com/api/pricing/), Anthropic (https://www.anthropic.com/api)
- Storage: https://cloud.google.com/storage/pricing#storage-pricing
- Bandwidth: https://cloud.google.com/storage/pricing#network-egress
- Firestore: https://firebase.google.com/pricing
