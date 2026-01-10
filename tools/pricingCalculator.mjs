// Pricing and margin calculator for jusDNCE artifacts
// Run with: node tools/pricingCalculator.mjs

const costInputs = {
  compute: {
    turbo: 0.006, // USD per Turbo generation (2 sheets @ $0.003/sheet)
    quality: 0.009, // USD per Quality generation (3 sheets @ $0.003/sheet)
    super: 0.012 // USD per Super generation (4 sheets @ $0.003/sheet)
  },
  storage: {
    perGb: 0.026, // USD per GB-month (Firebase/Cloud Storage assumption)
    gbPerGen: 0.005 // ~5 MB per generation kept for 30 days
  },
  egress: {
    perGb: 0.12, // USD per GB outbound bandwidth
    gbPerGen: {
      turbo: 0.012, // ~12 MB per MP4/preview payload
      highRes: 0.018 // ~18 MB per MP4/preview payload
    }
  },
  firestore: {
    readsPerGen: 8,
    writesPerGen: 3,
    costPerRead: 0.06 / 100000, // USD per read
    costPerWrite: 0.18 / 100000 // USD per write
  }
};

const offerings = {
  trial: { price: 0, runsIncluded: 1, quality: 'turbo' },
  starterExport: { price: 1, runsIncluded: 1, quality: 'turbo' },
  golemPacks: [
    { name: 'Bronze Golem', price: 3, runsIncluded: 3, quality: 'turbo' },
    { name: 'Silver Golem', price: 7, runsIncluded: 8, quality: 'quality' },
    { name: 'Gold Golem', price: 12, runsIncluded: 15, quality: 'super' }
  ],
  proMonthly: { price: 9.99, runsPerDay: 1, billingDays: 30, quality: 'super' }
};

function calcFirestoreCost() {
  const readCost = costInputs.firestore.readsPerGen * costInputs.firestore.costPerRead;
  const writeCost = costInputs.firestore.writesPerGen * costInputs.firestore.costPerWrite;
  return readCost + writeCost;
}

function calcCostPerGen(quality) {
  const computeCosts = {
    turbo: costInputs.compute.turbo,
    quality: costInputs.compute.quality,
    super: costInputs.compute.super
  };
  const compute = computeCosts[quality] || costInputs.compute.turbo;
  const egressGb = quality === 'super' ? costInputs.egress.gbPerGen.highRes : costInputs.egress.gbPerGen.turbo;
  const storageGb = costInputs.storage.gbPerGen;
  const bandwidth = egressGb * costInputs.egress.perGb;
  const storage = storageGb * costInputs.storage.perGb;
  const firestore = calcFirestoreCost();
  return Number((compute + bandwidth + storage + firestore).toFixed(4));
}

function calcMargin(price, costPerGen, runs) {
  const revenue = price;
  const cost = costPerGen * runs;
  const profit = revenue - cost;
  const margin = revenue === 0 ? 0 : (profit / revenue) * 100;
  return { revenue, cost: Number(cost.toFixed(4)), profit: Number(profit.toFixed(4)), margin: Number(margin.toFixed(2)) };
}

function scenarioMonthlyUsers({ users, runsPerDay, quality, pricePerRun, days = 30 }) {
  const costPerGen = calcCostPerGen(quality);
  const runs = runsPerDay * days;
  const revenue = users * runs * pricePerRun;
  const cost = users * runs * costPerGen;
  const margin = revenue === 0 ? 0 : ((revenue - cost) / revenue) * 100;
  return { users, runsPerDay, quality, pricePerRun, costPerGen, revenue: Number(revenue.toFixed(2)), cost: Number(cost.toFixed(2)), margin: Number(margin.toFixed(2)) };
}

function printHeader(title) {
  console.log(`\n=== ${title} ===`);
}

function printOffer(offer) {
  const costPerGen = calcCostPerGen(offer.quality);
  const runs = offer.runsIncluded ?? offer.runsPerDay * (offer.billingDays ?? 30);
  const summary = calcMargin(offer.price, costPerGen, runs);
  console.log(`${offer.name || 'Offer'} | Price: $${offer.price} | Runs: ${runs} | Quality: ${offer.quality}`);
  console.table([{ ...summary, costPerGen }]);
}

function main() {
  printHeader('Per-generation Costs');
  console.table([
    { quality: 'turbo', sheets: 2, costPerGen: calcCostPerGen('turbo') },
    { quality: 'quality', sheets: 3, costPerGen: calcCostPerGen('quality') },
    { quality: 'super', sheets: 4, costPerGen: calcCostPerGen('super') }
  ]);

  printHeader('A la carte offers');
  printOffer({ ...offerings.trial, name: 'Trial (preview only)' });
  printOffer({ ...offerings.starterExport, name: 'Starter Export (MP4)' });
  offerings.golemPacks.forEach(pack => printOffer(pack));
  printOffer({ ...offerings.proMonthly, name: 'Pro Monthly (unlocks exports)' });

  printHeader('Scenario: 5 runs/day/user pay-per-export');
  console.table([
    scenarioMonthlyUsers({ users: 1000, runsPerDay: 5, quality: 'turbo', pricePerRun: 0.5, days: 30 }),
    scenarioMonthlyUsers({ users: 500, runsPerDay: 5, quality: 'quality', pricePerRun: 0.75, days: 30 }),
    scenarioMonthlyUsers({ users: 100, runsPerDay: 5, quality: 'super', pricePerRun: 1, days: 30 })
  ]);

  printHeader('Scenario: Pro monthly with daily allowance');
  const proCost = calcCostPerGen(offerings.proMonthly.quality);
  const proRuns = offerings.proMonthly.runsPerDay * offerings.proMonthly.billingDays;
  const proSummary = calcMargin(offerings.proMonthly.price, proCost, proRuns);
  console.table([{ plan: 'Pro Monthly', runs: proRuns, costPerGen: proCost, ...proSummary }]);
}

main();
