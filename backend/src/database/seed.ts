import { readFileSync } from 'fs'
import { resolve } from 'path'
import { closeDatabase, collection, initializeDatabase } from './connection'

async function seed() {
  const path = resolve(__dirname, '../../../database/portfolio_seed.json')
  const payload = JSON.parse(readFileSync(path, 'utf8'))
  await initializeDatabase()
  await collection('analytics_artifacts').replaceOne(
    { artifactId: 'uci-online-retail-v1' },
    {
      artifactId: 'uci-online-retail-v1',
      payload,
      generatedAt: new Date(payload.metadata.generatedAt),
      createdAt: new Date(),
    },
    { upsert: true },
  )
  console.log(`Loaded ${payload.daily.length} daily aggregates and ${payload.products.length} product aggregates`)
  await closeDatabase()
}

seed().catch(async (error) => {
  console.error('Seed failed:', error)
  await closeDatabase()
  process.exit(1)
})
