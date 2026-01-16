import { Pool } from '@neondatabase/serverless'

// Serverless-optimized connection pool for Neon
// Vercel serverless functions require connection pooling optimization
let pool: Pool | null = null

function createPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL environment variable is required. ' +
      'For Neon serverless, use the pooled connection string (contains -pooler. in the hostname or ends with ?sslmode=require)'
    )
  }

  // Neon serverless Pool - optimized for Vercel and other serverless platforms
  // Automatically handles connection pooling through Neon's pooler
  // Supports PostgreSQL-style $1, $2 parameter placeholders
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
// Compatible with pg's query(text, params) signature
// Supports PostgreSQL-style $1, $2 parameter placeholders
export async function query(
  text: string,
  params?: unknown[]
): Promise<{ rows: unknown[]; rowCount: number }> {
  const pool = getPool()
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: res.rowCount })
    return {
      rows: res.rows,
      rowCount: res.rowCount || 0,
    }
  } catch (error) {
    console.error('Query error', { text, error })
    throw error
  }
}
