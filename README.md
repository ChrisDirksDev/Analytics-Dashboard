# AI-Powered Analytics Dashboard

A local analytics demo with a React dashboard, PostgreSQL-backed Express API,
and Python prediction and anomaly-detection service.

## What runs locally

| Service | Address | Purpose |
| --- | --- | --- |
| React/Vite | http://localhost:3000 | Dashboard UI and `/api` development proxy |
| Node/Express | http://localhost:5000 | Metrics, insights, and ML API |
| Python/Flask | http://localhost:8000 | Prediction and anomaly models |
| PostgreSQL | localhost:5433 | Development data store |

PostgreSQL intentionally uses host port 5433 so it does not collide with a
system PostgreSQL installation on the default port.

## Prerequisites

- Node.js 18 or newer
- Python 3.9 or newer with the `venv` module (`python3-venv` on Debian/Ubuntu)
- Docker with Docker Compose

## First-time setup

```bash
npm run setup
```

This installs all Node dependencies, creates `python-ml/.venv`, starts the
database container, applies the schema, and loads the explicit demo seed data.
Seeding resets the dashboard tables, so run it only when that is intended.

If you prefer to perform each stage separately:

```bash
npm run install:all
npm run python:setup
npm run db:setup
```

The checked-in `.env.example` files document every setting. Development
defaults already match Docker Compose; copy an example to `.env` only when you
need to recreate or customize a local file.

## Run the application

Ensure the database is running, then launch all application services:

```bash
npm run db:up
npm run dev
```

Press Ctrl+C once to stop the frontend, API, and ML processes together. The
database remains available between sessions. Stop it separately with:

```bash
npm run db:down
```

## Common commands

```bash
npm run dev              # frontend + API + ML service
npm run build            # production TypeScript/Vite builds
npm run db:migrate       # apply idempotent schema changes
npm run db:seed          # reset and reload demo records
npm run dev:frontend     # run only Vite
npm run dev:backend      # run only Express
npm run dev:ml           # run only Flask using the project venv
```

## API

### Health

- `GET /api/health`
- Python service: `GET http://localhost:8000/health`

### Metrics and insights

- `GET /api/metrics`
- `GET /api/metrics/:id`
- `PUT /api/metrics/:id` with one or more of `value`, `change`, and `trend`
- `GET /api/ml/insights`

### Machine learning

```http
POST /api/ml/predict
Content-Type: application/json

{"metricIds":["metric-id"]}
```

```http
POST /api/ml/anomaly-detection
Content-Type: application/json

{"data":[100,105,98,150,102]}
```

The Node API validates requests, loads metric values from PostgreSQL, and calls
the Python service. If Python is unavailable, ML endpoints return `502` rather
than fabricated data.

## Troubleshooting

- `docker: command not found`: install Docker and its Compose plugin, then rerun
  `npm run db:setup`.
- API exits on startup: verify the database is healthy with `docker compose ps`
  and confirm `backend/.env` uses port 5433.
- ML service will not start: rerun `npm run python:setup`.
- Dashboard stays on loading: check `http://localhost:5000/api/health`, then the
  API terminal for database errors.
