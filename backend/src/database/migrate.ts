import { readFileSync } from 'fs'
import { join } from 'path'
import { query } from './connection'

async function migrate() {
  try {
    console.log('🔄 Running database migrations...')
    
    const schemaPath = join(__dirname, 'schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')
    
    // Execute schema SQL
    await query(schema)
    
    console.log('✅ Database migrations completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migrate()

