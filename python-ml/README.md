# Offline analytics pipeline

`pipeline.py` downloads and cleans the UCI Online Retail workbook, builds daily
market and product aggregates, backtests the revenue forecast, detects robust
anomalies, creates evidence-backed insights, and writes
`database/portfolio_seed.json`.

```bash
npm run python:setup
npm run data:build
```

The pipeline is deterministic (`random_state=42`, single-worker model fitting).
Run its focused tests with `npm run test:python`.
