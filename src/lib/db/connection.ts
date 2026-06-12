import mongoose from 'mongoose';

/**
 * Mongo connection singleton.
 *
 * Caches the connection (and its in-flight promise) on a module-level variable
 * and on `globalThis` so that hot-module-replacement in development and the
 * serverless request lifecycle do not open a new pool on every invocation.
 *
 * Safe to call on every request: returns the cached connection if present,
 * awaits the in-flight promise if a connect is already underway, otherwise
 * starts a single connect and caches its promise.
 */

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongoose = globalThis as unknown as {
  __mongooseCache?: MongooseCache;
};

const cache: MongooseCache =
  globalForMongoose.__mongooseCache ?? { conn: null, promise: null };

if (!globalForMongoose.__mongooseCache) {
  globalForMongoose.__mongooseCache = cache;
}

export async function connectMongo(): Promise<typeof mongoose> {
  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // Workers-tuned pool: isolates are short-lived and reused, so keep the
    // pool tiny and fail fast on server selection. (See OpenNext/CF + MongoDB
    // driver >=6.15 guidance for the Workers runtime.)
    cache.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        maxPoolSize: 1,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 5000,
      })
      .then((m) => m);
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    // Reset the promise so a subsequent call can retry the connection.
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}

export default connectMongo;
