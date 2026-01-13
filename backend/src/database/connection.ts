import { Pool, PoolClient } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

// Create connection pool
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'analytics_dashboard',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
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
export async function query(text: string, params?: any[]): Promise<any> {
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

