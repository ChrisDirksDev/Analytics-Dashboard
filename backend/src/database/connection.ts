import { Pool, PoolClient, QueryResult } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

// Validate DATABASE_URL is provided
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is required. ' +
    'Format: postgresql://user:password@host:port/database'
  )
}

// Create connection pool using connection string
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Test connection
export async function initializeDatabase(): Promise<void> {
  try {
    const client = await pool.connect()
    console.log('✅ Database connection established')
    client.release()
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

// Helper function to execute queries
export async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Query error', { text, error })
    throw error
  }
}

