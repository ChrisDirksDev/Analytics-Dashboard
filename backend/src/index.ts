import http from 'http'
import axios from 'axios'
import cors from 'cors'
import dotenv from 'dotenv'
import express, { NextFunction, Request, Response } from 'express'
import { initializeDatabase, pool, query } from './database/connection'

dotenv.config()

const app = express()
const port = Number(process.env.PORT || 5000)
const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000'

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }))
app.use(express.json({ limit: '1mb' }))

type DatabaseRow = Record<string, unknown>

const numberValue = (value: unknown): number => Number(value)

function serializeMetric(row: DatabaseRow) {
  return {
    id: row.id,
    name: row.name,
    value: numberValue(row.value),
    unit: row.unit,
    change: numberValue(row.change),
    trend: row.trend,
    timestamp: row.timestamp,
  }
}

function serializeInsight(row: DatabaseRow) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    confidence: numberValue(row.confidence),
    timestamp: row.timestamp,
    data: row.data ?? undefined,
  }
}

const asyncRoute = (
  handler: (req: Request, res: Response) => Promise<unknown>
) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(handler(req, res)).catch(next)
}

const healthHandler = (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'api', timestamp: new Date().toISOString() })
}

app.get('/health', healthHandler)
app.get('/api/health', healthHandler)

app.get('/api/metrics', asyncRoute(async (_req, res) => {
  const result = await query('SELECT * FROM metrics ORDER BY timestamp DESC LIMIT 100')
  res.json(result.rows.map((row) => serializeMetric(row as DatabaseRow)))
}))

app.get('/api/metrics/:id', asyncRoute(async (req, res) => {
  const result = await query('SELECT * FROM metrics WHERE id = $1', [req.params.id])
  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Metric not found' })
  }
  res.json(serializeMetric(result.rows[0] as DatabaseRow))
}))

app.put('/api/metrics/:id', asyncRoute(async (req, res) => {
  const { value, change, trend } = req.body ?? {}
  if (value === undefined && change === undefined && trend === undefined) {
    return res.status(400).json({ error: 'At least one of value, change, or trend is required' })
  }
  if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value))) {
    return res.status(400).json({ error: 'value must be a finite number' })
  }
  if (change !== undefined && (typeof change !== 'number' || !Number.isFinite(change))) {
    return res.status(400).json({ error: 'change must be a finite number' })
  }
  if (trend !== undefined && !['up', 'down', 'stable'].includes(trend)) {
    return res.status(400).json({ error: 'trend must be one of: up, down, stable' })
  }

  const result = await query(
    `UPDATE metrics
     SET value = COALESCE($1, value), change = COALESCE($2, change),
         trend = COALESCE($3, trend), updated_at = NOW(), timestamp = NOW()
     WHERE id = $4 RETURNING *`,
    [value ?? null, change ?? null, trend ?? null, req.params.id]
  )
  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Metric not found' })
  }
  res.json(serializeMetric(result.rows[0] as DatabaseRow))
}))

app.get('/api/ml/insights', asyncRoute(async (_req, res) => {
  const result = await query('SELECT * FROM ml_insights ORDER BY timestamp DESC LIMIT 20')
  res.json(result.rows.map((row) => serializeInsight(row as DatabaseRow)))
}))

app.post('/api/ml/predict', asyncRoute(async (req, res) => {
  const { metricIds } = req.body ?? {}
  if (!Array.isArray(metricIds) || metricIds.length === 0 ||
      !metricIds.every((id: unknown) => typeof id === 'string' && id.trim())) {
    return res.status(400).json({ error: 'metricIds must be a non-empty array of strings' })
  }

  const result = await query('SELECT id, value FROM metrics WHERE id = ANY($1::text[])', [metricIds])
  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'No metrics found' })
  }
  const response = await axios.post(`${mlServiceUrl}/predict`, {
    metrics: result.rows.map((row) => ({ id: row.id, value: numberValue(row.value) })),
  }, { timeout: 10000 })
  res.json(response.data)
}))

app.post('/api/ml/anomaly-detection', asyncRoute(async (req, res) => {
  const { data } = req.body ?? {}
  if (!Array.isArray(data) || data.length === 0 ||
      !data.every((value: unknown) => typeof value === 'number' && Number.isFinite(value))) {
    return res.status(400).json({ error: 'data must be a non-empty array of finite numbers' })
  }
  const response = await axios.post(`${mlServiceUrl}/detect-anomalies`, { data }, { timeout: 10000 })
  const timestamp = new Date().toISOString()
  const anomalies = (response.data as DatabaseRow[]).map((anomaly) => ({
    id: anomaly.id,
    metricId: `metric-${anomaly.index}`,
    value: numberValue(anomaly.value),
    expectedValue: numberValue(anomaly.expectedValue),
    severity: anomaly.severity,
    timestamp,
  }))
  res.json(anomalies)
}))

const methodNotAllowed = (_req: Request, res: Response) => {
  res.status(405).json({ error: 'Method not allowed' })
}

app.all('/api/health', methodNotAllowed)
app.all('/api/metrics', methodNotAllowed)
app.all('/api/metrics/:id', methodNotAllowed)
app.all('/api/ml/insights', methodNotAllowed)
app.all('/api/ml/predict', methodNotAllowed)
app.all('/api/ml/anomaly-detection', methodNotAllowed)
app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint not found' }))

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error)
  if (axios.isAxiosError(error)) {
    return res.status(502).json({ error: 'ML service unavailable' })
  }
  res.status(500).json({ error: 'Internal server error' })
})

let server: http.Server

initializeDatabase()
  .then(() => {
    server = app.listen(port, () => console.log(`API listening on http://localhost:${port}`))
  })
  .catch(() => process.exit(1))

async function shutdown() {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
  await pool.end()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
