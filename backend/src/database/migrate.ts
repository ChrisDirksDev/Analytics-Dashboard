import { closeDatabase, collection, initializeDatabase } from './connection'

async function migrate() {
  await initializeDatabase()
  const artifacts = collection('analytics_artifacts')
  await artifacts.createIndex({ artifactId: 1 }, { name: 'artifactId_unique', unique: true })
  await artifacts.createIndex({ generatedAt: -1 }, { name: 'generatedAt_desc' })
  console.log('✅ MongoDB indexes created')
  await closeDatabase()
}

migrate().catch(async (error) => {
  console.error('❌ Migration failed:', error)
  await closeDatabase()
  process.exit(1)
})
