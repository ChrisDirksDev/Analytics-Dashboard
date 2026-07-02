# Retail Analytics — an explainable ML case study

A portfolio-grade analytics product built from 530,104 cleaned transactions in the
[UCI Online Retail dataset](https://archive.ics.uci.edu/dataset/352/online-retail).
The dashboard presents historical 2010–2011 activity honestly: no random chart
values, seeded prose, hidden model fallbacks, or invented confidence scores.

## Product story

The original demo exposed isolated metric snapshots and generated both its charts
and forecast history with random numbers. That made its “AI-powered” claim
impossible to audit. This rebuild treats trust as part of the interface:

- every KPI reconciles to cleaned sales transactions;
- forecasts are evaluated using rolling time-series splits and compared with a
  same-weekday seasonal baseline;
- anomalies include observed and expected values plus their detection method;
- insight text is deterministic and cites its evidence, period, and model version;
- filtered segments withhold forecasts and generalized insights until separately
  validated.

## Architecture

```text
UCI workbook → Python pipeline → versioned aggregate/model artifact → MongoDB
                                                                    ↓
React editorial dashboard ← typed dashboard contract ← Express / Vercel API
```

Python is an offline, reproducible analytics pipeline—not a fragile runtime
microservice. The committed `database/portfolio_seed.json` lets reviewers run the
case study without downloading the source workbook. `python-ml/pipeline.py`
recreates that artifact from the official source.

## Analytics methodology

Cleaning excludes cancelled invoices, non-positive quantities, non-positive unit
prices, and invalid timestamps. Sales revenue is `quantity × unit price` for the
remaining lines. Orders are distinct invoices. Customer measures include only
records with a supplied customer ID and de-duplicate those IDs over the selected
period.

The 30-day revenue forecast uses random-forest regression with lag 1/7/14/28,
rolling 7/28-day values, trend, weekday, and month features. Four rolling
time-series splits produce MAE, WAPE, and a held-out residual interval. The
generated artifact scores **31.88% WAPE**, compared with **38.09%** for the
7-day seasonal baseline. This is a small historical dataset, not a production
demand model; promotions, stock, holidays, and acquisition activity are absent.

Anomalies compare each day with an eight-week same-weekday median and use robust
median absolute deviation thresholds. These are statistical signals, not causal
claims.

## Run locally

Requirements: Node.js 18+, Python 3.9+, and Docker Compose.

```bash
npm run setup
npm run dev
```

The app runs at `http://localhost:3000`; the API runs at
`http://localhost:5000`. The setup command installs dependencies, starts
MongoDB, creates its indexes, and loads the committed artifact.

Useful commands:

```bash
npm test                 # Python, API-contract, and frontend behavior tests
npm run build            # production frontend and backend builds
npm run data:build       # download UCI data and regenerate the artifact
npm run db:seed          # reload the generated artifact into MongoDB
```

## API

- `GET /api/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD&country=...`
- `GET /api/model-card`
- `GET /api/health` (local Express runtime)

Invalid filters return `400`, empty slices return `404`, and a missing analytics
artifact returns `503`. The API never substitutes fabricated results.

## Deployment

The frontend and serverless API are configured for Vercel. Set `MONGODB_URI` to
your MongoDB connection string and, optionally, `MONGODB_DB` (defaults to
`analytics_dashboard`). Run `npm run db:migrate` to create indexes and
`npm run db:seed` to load the artifact. Local development uses the same artifact
and contract through Express.

For a Vercel deployment:

1. Import the repository with the project root left at the repository root.
2. Add `MONGODB_URI` and `MONGODB_DB` to the Production and Preview environments.
3. Allow connections from Vercel in the MongoDB provider's network-access rules.
4. Seed the database once from a trusted machine; serverless functions only read
   the resulting `analytics_artifacts` collection.

Vercel installs both root and frontend dependencies, builds the Vite app, and
deploys each file in `api/` as a Node.js function. The SPA fallback is applied
only after filesystem routes, so `/api/*` continues to resolve to those functions.

## Data license and attribution

Chen, D. (2015). *Online Retail* [Dataset]. UCI Machine Learning Repository.
[DOI 10.24432/C5BW33](https://doi.org/10.24432/C5BW33). Licensed CC BY 4.0.
The raw workbook is intentionally not committed.
