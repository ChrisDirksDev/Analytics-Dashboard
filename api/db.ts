import { Pool, QueryResult } from 'pg'

// Serverless-optimized connection pool
// Vercel serverless functions require connection pooling optimization
let pool: Pool | null = null

function createPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL environment variable is required. ' +
      'Format: postgresql://user:password@host:port/database'
    )
  }

  return new Pool({
    connectionString: process.env.DATABASE_URL,
    // Optimize for serverless: smaller pool, shorter timeouts
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 2000,
    // Allow connections to close quickly
    allowExitOnIdle: true,
  })
}

export function getPool(): Pool {
  if (!pool) {
    pool = createPool()
  }
  return pool
}

// Helper function to execute queries
// Uses pg's QueryResult type for better type safety
export async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  const pool = getPool()
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
