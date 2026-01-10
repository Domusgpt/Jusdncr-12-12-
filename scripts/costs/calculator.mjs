import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const assumptionsPath = path.join(ROOT, 'data', 'cost-assumptions.json');
const dashboardPath = path.join(ROOT, 'data', 'costs-dashboard.json');

const fmt = (value) => Number(value.toFixed(4));

const assumptions = JSON.parse(await readFile(assumptionsPath, 'utf8'));

const firestoreCost = () => {
  const reads = (assumptions.firestore.readsPerGeneration * assumptions.firestore.costPerRead) / 100000;
  const writes = (assumptions.firestore.writesPerGeneration * assumptions.firestore.costPerWrite) / 100000;
  return reads + writes;
};

const costPerGeneration = (quality) => {
  const compute = quality === 'highRes'
    ? assumptions.compute.highResPerGeneration
    : assumptions.compute.turboPerGeneration;
  const egressGb = assumptions.egress.gbPerGeneration[quality === 'highRes' ? 'highRes' : 'turbo'];
  const bandwidth = egressGb * assumptions.egress.perGb;
  const storage = assumptions.storage.gbPerGeneration * assumptions.storage.perGbMonth;
  return fmt(compute + bandwidth + storage + firestoreCost());
};

const costTurbo = costPerGeneration('turbo');
const costHighRes = costPerGeneration('highRes');

const offers = [
  { name: 'Trial (preview)', price: 0, runs: 1, quality: 'turbo' },
  { name: 'Starter Export', price: 1, runs: 1, quality: 'turbo' },
  { name: 'Bronze Golem Pack', price: 3, runs: 3, quality: 'turbo' },
  { name: 'Silver Golem Pack', price: 7, runs: 8, quality: 'turbo' },
  { name: 'Gold Golem Pack', price: 12, runs: 15, quality: 'highRes' },
  { name: 'Pro Monthly', price: 9.99, runs: 30, quality: 'highRes' }
].map((offer) => {
  const costPerRun = offer.quality === 'highRes' ? costHighRes : costTurbo;
  const cost = costPerRun * offer.runs;
  const margin = offer.price === 0 ? 0 : ((offer.price - cost) / offer.price) * 100;
  return {
    ...offer,
    costPerRun: fmt(costPerRun),
    margin: Number(margin.toFixed(2))
  };
});

const scenarios = [
  {
    name: 'Pay-per-export (Turbo)',
    users: 1000,
    runsPerDay: 5,
    pricePerRun: 1,
    quality: 'turbo'
  },
  {
    name: 'Pay-per-export (High-Res)',
    users: 100,
    runsPerDay: 5,
    pricePerRun: 1.5,
    quality: 'highRes'
  },
  {
    name: 'Pro monthly (High-Res)',
    users: 500,
    runsPerDay: 1,
    pricePerRun: 9.99 / 30,
    quality: 'highRes'
  }
].map((scenario) => {
  const costPerRun = scenario.quality === 'highRes' ? costHighRes : costTurbo;
  const runs = scenario.users * scenario.runsPerDay * 30;
  const revenue = scenario.pricePerRun * runs;
  const cost = costPerRun * runs;
  const margin = revenue === 0 ? 0 : ((revenue - cost) / revenue) * 100;
  return {
    ...scenario,
    monthlyRevenue: Number(revenue.toFixed(2)),
    monthlyCost: Number(cost.toFixed(2)),
    margin: Number(margin.toFixed(2))
  };
});

const dashboard = {
  updatedAt: new Date().toISOString().split('T')[0],
  perGeneration: {
    turbo: costTurbo,
    highRes: costHighRes
  },
  offers,
  scenarios
};

await writeFile(dashboardPath, `${JSON.stringify(dashboard, null, 2)}\n`);

console.log(`Updated ${dashboardPath}`);
