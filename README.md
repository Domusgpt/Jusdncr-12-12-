<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1kMTJbNoSCN5Shp1oWMEJhLot2xwp5Fl1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Cost dashboard + automated docs

- Edit pricing inputs in [`data/cost-assumptions.json`](data/cost-assumptions.json) (token rates, Firebase storage/egress, Firestore operations).
- Regenerate the JSON + Markdown dashboard with `npm run costs:generate`.
- The latest computed economics live in [`data/costs-dashboard.json`](data/costs-dashboard.json) and the human-readable report in [`docs/costs.md`](docs/costs.md).
