import { MongoClient, type Db } from 'mongodb'

/**
 * Raw MongoDB client for Better Auth's mongodb adapter.
 *
 * Better Auth needs a `Db` synchronously at config time. The driver connects
 * lazily on the first operation, so we don't await here. Cached on globalThis
 * to survive HMR and isolate reuse on the Workers runtime. Pool kept tiny per
 * the Cloudflare Workers + MongoDB driver guidance.
 */

const globalForMongo = globalThis as unknown as {
  __mongoClient?: MongoClient
}

function getClient(): MongoClient {
  if (!globalForMongo.__mongoClient) {
    const uri = process.env.MONGODB_URI
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set')
    }
    globalForMongo.__mongoClient = new MongoClient(uri, {
      maxPoolSize: 1,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 5000,
    })
  }
  return globalForMongo.__mongoClient
}

export const mongoClient: MongoClient = getClient()

/** Database resolved from the connection string. */
export const mongoDb: Db = mongoClient.db()
