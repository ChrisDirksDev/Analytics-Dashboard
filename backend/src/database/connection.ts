import { Collection, Db, MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const uri = process.env.MONGODB_URI || (process.env.NODE_ENV !== 'production' ? 'mongodb://localhost:27017' : '')
if (!uri) throw new Error('MONGODB_URI environment variable is required in production')

export const client = new MongoClient(uri, { maxPoolSize: 20 })
let database: Db | undefined

export async function initializeDatabase(): Promise<void> {
  await client.connect()
  database = client.db(process.env.MONGODB_DB || 'analytics_dashboard')
  await database.command({ ping: 1 })
  console.log('✅ MongoDB connection established')
}

export function collection<T extends object>(name: string): Collection<T> {
  if (!database) throw new Error('Database has not been initialized')
  return database.collection<T>(name)
}

export async function closeDatabase(): Promise<void> {
  await client.close()
}
