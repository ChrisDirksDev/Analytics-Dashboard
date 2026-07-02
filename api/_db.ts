import { Db, MongoClient } from 'mongodb'

let clientPromise: Promise<MongoClient> | undefined

function mongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI environment variable is required')

  // Cache the connection promise across warm serverless invocations.
  if (!clientPromise) {
    clientPromise = new MongoClient(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5_000,
    }).connect().catch((error) => {
      // Let a later invocation retry after a transient connection failure.
      clientPromise = undefined
      throw error
    })
  }
  return clientPromise
}

export async function getDatabase(): Promise<Db> {
  const client = await mongoClient()
  return client.db(process.env.MONGODB_DB || 'analytics_dashboard')
}
