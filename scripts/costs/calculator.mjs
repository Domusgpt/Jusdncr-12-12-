/* eslint-env node */
import fs from 'fs';
import path from 'path';

const root = path.resolve(process.cwd());
const assumptionsPath = path.join(root, 'data', 'cost-assumptions.json');
const outputJsonPath = path.join(root, 'data', 'costs-dashboard.json');
const outputMarkdownPath = path.join(root, 'docs', 'costs.md');

const loadAssumptions = () => {
  const raw = fs.readFileSync(assumptionsPath, 'utf-8');
  return JSON.parse(raw);
};

const formatCurrency = (value) => `$${value.toFixed(4)}`;
const formatDollars = (value) => `$${value.toFixed(2)}`;

const buildDashboard = (config) => {
  const { providers, storage, bandwidth, firestore, assumptions, defaultModel } = config;
  const defaultProvider = providers.find((p) => p.id === defaultModel) ?? providers[0];

  const tokenCost =
    (assumptions.inputTokensPerGen / 1000) * defaultProvider.inputCostPer1k +
    (assumptions.outputTokensPerGen / 1000) * defaultProvider.outputCostPer1k;

  const storageCost = (assumptions.assetSizeMB / 1024) * storage.firebaseStoragePerGBMonth;
  const bandwidthCost = (assumptions.bandwidthPerGenMB / 1024) * bandwidth.firebaseEgressPerGB;
  const firestoreReadCost =
    (assumptions.firestoreReadsPerGen / 100_000) * firestore.readPer100k;
  const firestoreWriteCost =
    (assumptions.firestoreWritesPerGen / 100_000) * firestore.writePer100k;

  const perGenerationCost =
    tokenCost + storageCost + bandwidthCost + firestoreReadCost + firestoreWriteCost;

  const monthlyGenerationsPerUser = assumptions.generationsPerUserPerDay * 30;
  const perUserMonthlyCost = perGenerationCost * monthlyGenerationsPerUser;

  const scenarios = assumptions.lowMedHighUsers.map((users) => {
    const monthlyCost = perUserMonthlyCost * users;
    const revenuePerUser = assumptions.pricePoints[1] * monthlyGenerationsPerUser;
    const monthlyRevenue = revenuePerUser * users;
    const grossMarginPct = monthlyRevenue === 0 ? 0 : ((monthlyRevenue - monthlyCost) / monthlyRevenue) * 100;
    return {
      label: `${users.toLocaleString()} users`,
      users,
      monthlyCost,
      monthlyRevenue,
      grossMarginPct,
    };
  });

  const marginByPrice = assumptions.pricePoints.map((price) => {
    const marginPerGen = price - perGenerationCost;
    const grossMarginPct = price === 0 ? 0 : (marginPerGen / price) * 100;
    const breakEvenGenerations =
      marginPerGen <= 0 ? Infinity : assumptions.monthlyFixedPlatformCost / marginPerGen;

    return {
      price,
      marginPerGen,
      grossMarginPct,
      breakEvenGenerations,
    };
  });

  const warningThresholds = {
    perGenCostWarning: assumptions.pricePoints[1] * 0.75,
    perUserMonthlyWarning: assumptions.pricePoints[1] * monthlyGenerationsPerUser * 0.5,
  };

  const dashboard = {
    generatedAt: new Date().toISOString(),
    defaultProvider,
    providers,
    storage,
    bandwidth,
    firestore,
    assumptions,
    perGenerationCost,
    perUserMonthlyCost,
    monthlyGenerationsPerUser,
    scenarios,
    marginByPrice,
    warningThresholds,
  };

  return dashboard;
};

const toMarkdown = (dashboard) => {
  const providerTable = dashboard.providers
    .map(
      (p) =>
        `| ${p.provider} | ${p.model} | $${p.inputCostPer1k.toFixed(4)} | $${p.outputCostPer1k.toFixed(4)} | ${p.source} |`
    )
    .join('\n');

  const marginTable = dashboard.marginByPrice
    .map((m) => {
      const breakEvenText = m.breakEvenGenerations === Infinity
        ? 'N/A'
        : `${Math.ceil(m.breakEvenGenerations).toLocaleString()} gens/mo`;
      return `| ${formatDollars(m.price)} | ${formatCurrency(m.marginPerGen)} | ${m.grossMarginPct.toFixed(1)}% | ${breakEvenText} |`;
    })
    .join('\n');

  const scenarioTable = dashboard.scenarios
    .map((s) =>
      `| ${s.label} | ${formatDollars(s.monthlyCost)} | ${formatDollars(s.monthlyRevenue)} | ${s.grossMarginPct.toFixed(1)}% |`
    )
    .join('\n');

  return `# Cost Dashboard (auto-generated)

_Last updated: ${dashboard.generatedAt}_

## Provider Pricing (per 1K tokens)

| Cloud | Model | Input | Output | Source |
| --- | --- | --- | --- | --- |
${providerTable}

## Core Assumptions

- Default model: **${dashboard.defaultProvider.model}**
- Tokens per generation: **${dashboard.assumptions.inputTokensPerGen} in / ${dashboard.assumptions.outputTokensPerGen} out**
- Asset footprint: **${dashboard.assumptions.assetSizeMB} MB** stored & **${dashboard.assumptions.bandwidthPerGenMB} MB** egress per generation
- Firestore ops per generation: **${dashboard.assumptions.firestoreReadsPerGen} reads / ${dashboard.assumptions.firestoreWritesPerGen} writes**
- Usage pattern: **${dashboard.assumptions.generationsPerUserPerDay} generations per user per day (30-day month)**
- Fixed platform cost: **${formatDollars(dashboard.assumptions.monthlyFixedPlatformCost)} / month**

## Unit Economics

- **Per-generation cost:** ${formatCurrency(dashboard.perGenerationCost)}
- **Per-user monthly cost @ 5 gens/day:** ${formatDollars(dashboard.perUserMonthlyCost)}

### Margin by Price Point

| Price / gen | Margin / gen | Gross Margin | Break-even volume |
| --- | --- | --- | --- |
${marginTable}

### Sensitivity (Low / Med / High usage)

| Cohort size | Monthly Cost | Monthly Revenue (at ${formatDollars(dashboard.assumptions.pricePoints[1])}/gen) | Gross Margin |
| --- | --- | --- | --- |
${scenarioTable}

### Warnings

- Trigger alert if cost/gen exceeds **${formatDollars(dashboard.warningThresholds.perGenCostWarning)}**
- Trigger alert if per-user monthly cost exceeds **${formatDollars(dashboard.warningThresholds.perUserMonthlyWarning)}**

## Sources
- Models: ${dashboard.providers.map((p) => `${p.provider} (${p.source})`).join(', ')}
- Storage: ${dashboard.storage.source}
- Bandwidth: ${dashboard.bandwidth.source}
- Firestore: ${dashboard.firestore.source}
`;
};

const main = () => {
  const assumptions = loadAssumptions();
  const dashboard = buildDashboard(assumptions);

  fs.writeFileSync(outputJsonPath, JSON.stringify(dashboard, null, 2));
  fs.writeFileSync(outputMarkdownPath, toMarkdown(dashboard));

  console.log(`Cost dashboard written to ${path.relative(root, outputJsonPath)} and ${path.relative(root, outputMarkdownPath)}`);
};

main();
