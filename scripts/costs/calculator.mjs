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
  const { providers, storage, bandwidth, firestore, assumptions, defaultModel, defaultProfile } = config;
  const defaultProvider = providers.find((p) => p.id === defaultModel) ?? providers[0];

  const baseInfraCost =
    (assumptions.assetSizeMB / 1024) * storage.firebaseStoragePerGBMonth +
    (assumptions.bandwidthPerGenMB / 1024) * bandwidth.firebaseEgressPerGB +
    (assumptions.firestoreReadsPerGen / 100_000) * firestore.readPer100k +
    (assumptions.firestoreWritesPerGen / 100_000) * firestore.writePer100k;

  const generationProfiles = Object.entries(assumptions.generationProfiles || {}).map(([key, profile]) => {
    const sheetCount = profile.sheetCount ?? (profile.sheets ? profile.sheets.length : 1);
    const modelCostPerGen = sheetCount * (defaultProvider.imageGenCost ?? 0);
    const totalPerGen = modelCostPerGen + baseInfraCost;

    return {
      id: key,
      label: profile.label || key,
      notes: profile.notes,
      sheetCount,
      sheets: profile.sheets || [],
      modelCostPerGen,
      totalPerGen,
    };
  });

  const defaultProfileEntry = generationProfiles.find((p) => p.id === defaultProfile) ?? generationProfiles[0];
  const perGenerationCost = defaultProfileEntry?.totalPerGen ?? 0;

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
    assumptions: {
      ...assumptions,
      defaultProfile: defaultProfileEntry?.id,
    },
    baseInfraCost,
    generationProfiles,
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
      (p) => `| ${p.provider} | ${p.model} | $${(p.imageGenCost ?? 0).toFixed(4)} / image | ${p.source} |`
    )
    .join('\n');

  const profileTable = dashboard.generationProfiles
    .map(
      (p) =>
        `| ${p.label} | ${p.sheetCount} (${p.sheets.join(', ')}) | ${formatCurrency(p.modelCostPerGen)} | ${formatCurrency(
          p.totalPerGen
        )} | ${p.notes || ''} |`
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

## Provider Pricing (per image generation)

| Cloud | Model | Image Gen | Source |
| --- | --- | --- | --- |
${providerTable}

## Sprite-sheet generation profile (derived from services/gemini.ts)

| Mode | Sheets per generation | Model cost / gen | Total cost / gen (incl. infra) | Notes |
| --- | --- | --- | --- | --- |
${profileTable}

## Core Assumptions

- Default model: **${dashboard.defaultProvider.model}**
- Default profile: **${dashboard.assumptions.defaultProfile}**
- Asset footprint: **${dashboard.assumptions.assetSizeMB} MB** stored & **${dashboard.assumptions.bandwidthPerGenMB} MB** egress per generation
- Firestore ops per generation: **${dashboard.assumptions.firestoreReadsPerGen} reads / ${dashboard.assumptions.firestoreWritesPerGen} writes**
- Usage pattern: **${dashboard.assumptions.generationsPerUserPerDay} generations per user per day (30-day month)**
- Fixed platform cost: **${formatDollars(dashboard.assumptions.monthlyFixedPlatformCost)} / month**

## Unit Economics (default profile)

- **Per-generation cost:** ${formatCurrency(dashboard.perGenerationCost)}
- **Per-user monthly cost @ ${dashboard.assumptions.generationsPerUserPerDay} gens/day:** ${formatDollars(dashboard.perUserMonthlyCost)}

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
