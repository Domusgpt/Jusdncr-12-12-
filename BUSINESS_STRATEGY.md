
# jusDNCE - Business Strategy & Architecture

## 1. Cost Analysis (Unit Economics)

We are running a highly optimized pipeline using **Gemini 2.5 Flash**.

*   **Image Input Size:** 384px (approx. 200 tokens)
*   **Video Encoding:** Client-side (Zero server cost)

| Item | Cost per Unit | Note |
| :--- | :--- | :--- |
| **Asset Analysis** | $0.0001 | 1 Image + 1 Audio interpretation |
| **Motion Planning** | $0.0001 | JSON Generation |
| **Turbo Gen (4 Frames)** | $0.0120 | 4 x Flash Image Gen |
| **High-Res Gen (8 Frames)**| $0.0240 | 8 x Flash Image Gen |
| **Bandwidth/Hosting** | $0.0050 | Firebase Hosting / Storage |
| **TOTAL (Turbo)** | **~$0.017** | **< 2 Cents per Video** |
| **TOTAL (High-Res)** | **~$0.030** | **3 Cents per Video** |

---

## 2. Pricing & Monetization

We now expose every artifact for sale, anchored to the calculator PR assumptions (~$0.017 Turbo / ~$0.030 High-Res per 4–8 frame generation with hosting).

### A. Trial (Free, 1 run)
*   Preview-only, watermark, limited director controls (first/last category only).
*   Blocks MP4/HTML/DKG exports and FX/Kinetic engine; upsell copy shows prices for paid unlocks.

### B. Starter Export (per MP4)
*   **Price:** ~$1 per MP4 export from Step4.
*   **Includes:** Watermark removal on the purchased file only; HTML/DKG remain locked unless purchased separately.
*   **Margin:** >90% even on High-Res; revisit quarterly with calculator inputs.

### C. Golem Packs (DKGs — formerly "rigs")
*   **Price Tiers:** ~$3 (Standard) / ~$7 (Pro) / ~$12 (Elite) mapped to frame quality/diversity.
*   **Includes:** Downloadable DKG bundles with regen rights and swapping; watermark removed for those assets.
*   **Note:** MP4 exports can be bundled or remain per-export; keep pricing aligned to calculator assumptions.

### D. Pro Monthly Subscription
*   **Price:** ~$9.99 / month.
*   **Includes:** Unlocks MP4 + HTML/DKG exports without caps, FX/Kinetic controls, music/rig (golem) swapping, daily stipend of 1+ gens.
*   **Controls:** Soft daily caps via credits to protect margins; watermark removed globally.

### E. Share-to-Earn (future experiment)
*   Watermarked outputs can be shared with UTM + QR codes; verified referrals grant limited credits.
*   Keep gated until attribution and abuse controls are ready.

---

## 3. Onboarding & Paywall Strategy

**Goal:** Product-Led Growth (PLG). Get the user to the "Aha!" moment as fast as possible.

### The Funnel:
1.  **Landing (Step 1):** No login required. Upload Image + Audio immediately.
    *   *Why?* High friction kills conversion. Let them play with the UI.
2.  **Director (Step 2):** Allow full configuration.
3.  **Preview (Step 3):**
    *   **First Run:** FREE. No login.
    *   *Hook:* They see the low-res / watermarked preview.
4.  **The Paywall (The "Gate"):**
    *   Trigger: User clicks **EXPORT VIDEO** or **HIGH QUALITY**.
    *   Action: "Sign in to save this masterpiece." (Soft Gate)
    *   Action 2: "Get 3 Free Credits for signing up." (Incentive)

### Paywall Best Practices:
*   **Never block creation.** Only block *possession* (Export).
*   **Watermark the free tier.** Let them share it, but make it an ad for us ("Made with jusDNCE").
*   **Micro-Transactions.** Don't force a $20 sub. Allow a $2 one-time purchase for a single high-quality render.

---

## 4. Red Team Analysis (Critique)

**Self-Criticism & Risk Assessment:**

### A. API Dependency Risk
*   **Critique:** We rely entirely on `gemini-2.5-flash-image`. If Google changes pricing, deprecates the preview, or adds strict safety filters that flag innocent dance moves, the app breaks.
*   **Mitigation:** Abstract the generation service. Be ready to swap to Stable Diffusion Turbo or Midjourney API if needed.

### B. Retention (The "Novelty" Problem)
*   **Critique:** Users might make 3 videos of their cat dancing and never come back. Churn will be high.
*   **Mitigation:**
    *   **Social loop:** "Remix this dance" feature.
    *   **Daily Challenges:** "Best Moonwalk wins 50 credits."
    *   **Templates:** "Birthday Greeting", "Anniversary", "Meme Format".

### C. Client-Side Export Quality
*   **Critique:** `MediaRecorder` API in browser varies by device. Mobile Safari is notorious for issues. Export might glitch on low-end phones.
*   **Mitigation:**
    *   Implement a server-side render queue (FFmpeg) for Pro users.
    *   Fallback to GIF export for compatibility.

### D. Audio Copyright
*   **Critique:** Users uploading copyrighted MP3s. If we host these, we risk DMCA.
*   **Mitigation:**
    *   We do not *host* the source audio publicly. It stays in the user's browser session or private storage bucket.
    *   Terms of Service must explicitly state user liability.

---

## 5. Technical Roadmap (Next Steps)

1.  **Firebase Integration:** Connect the mock Auth/DB to real Firebase (see `FIREBASE_INTEGRATION.md`).
2.  **Stripe Connect:** Enable real payments.
3.  **Share Pages:** `jusdnce.ai/v/12345` -> Public page for a generated video.
4.  **Mobile App:** Wrap this React app in Capacitor/Ionic for App Store release.
