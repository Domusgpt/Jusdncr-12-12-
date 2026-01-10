import fs from "fs/promises";
import path from "path";

const root = process.cwd();
const assumptionsPath = path.join(root, "data", "cost-assumptions.json");
const dashboardPath = path.join(root, "data", "costs-dashboard.json");

const round = (value, digits = 4) => Number(value.toFixed(digits));

const buildDashboard = (assumptions) => {
  const computeTurbo = assumptions.compute.sheetCostUsd * assumptions.compute.turboSheets;
  const computeHighRes = assumptions.compute.sheetCostUsd * assumptions.compute.highResSheets;

  const storage = assumptions.storage.perGbUsd * assumptions.storage.gbPerGeneration;
  const egressTurbo = assumptions.egress.perGbUsd * assumptions.egress.gbPerGeneration.turbo;
  const egressHighRes = assumptions.egress.perGbUsd * assumptions.egress.gbPerGeneration.highRes;

  const firestore =
    assumptions.firestore.readsPerGen * assumptions.firestore.costPerReadUsd +
    assumptions.firestore.writesPerGen * assumptions.firestore.costPerWriteUsd;

  const turboTotal = computeTurbo + storage + egressTurbo + firestore;
  const highResTotal = computeHighRes + storage + egressHighRes + firestore;

  return {
    updatedAt: new Date().toISOString(),
    currency: "USD",
    perGeneration: {
      turbo: {
        compute: round(computeTurbo, 6),
        storage: round(storage, 6),
        egress: round(egressTurbo, 6),
        firestore: round(firestore, 7),
        total: round(turboTotal, 4)
      },
      highRes: {
        compute: round(computeHighRes, 6),
        storage: round(storage, 6),
        egress: round(egressHighRes, 6),
        firestore: round(firestore, 7),
        total: round(highResTotal, 4)
      }
    }
  };
};

const main = async () => {
  const raw = await fs.readFile(assumptionsPath, "utf-8");
  const assumptions = JSON.parse(raw);
  const dashboard = buildDashboard(assumptions);
  await fs.writeFile(dashboardPath, `${JSON.stringify(dashboard, null, 2)}\n`);
  console.log(`Updated ${path.relative(root, dashboardPath)}`);
};

main().catch((error) => {
  console.error("Cost dashboard generation failed:", error);
  process.exit(1);
});
