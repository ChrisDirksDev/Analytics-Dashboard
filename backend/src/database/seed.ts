import { readFileSync } from 'fs'
import { resolve } from 'path'
import { query, pool } from './connection'

async function seed() {
  const path = resolve(__dirname, '../../../database/portfolio_seed.json')
  const payload = JSON.parse(readFileSync(path, 'utf8'))
  await query('TRUNCATE TABLE analytics_artifacts')
  await query(
    `INSERT INTO analytics_artifacts (id, payload, generated_at)
     VALUES ($1, $2::jsonb, $3)`,
    ['uci-online-retail-v1', JSON.stringify(payload), payload.metadata.generatedAt]
  )
  console.log(`Loaded ${payload.daily.length} daily aggregates and ${payload.products.length} product aggregates`)
  await pool.end()
}

seed().catch(async (error) => {
  console.error('Seed failed:', error)
  await pool.end()
  process.exit(1)
})
