import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

/**
 * Drizzle + postgres.js over the Supabase Supavisor pooler.
 *
 * Workers/OpenNext tuning mirrors the old Mongo client: one connection per
 * isolate, no prepared statements (Supavisor transaction mode does not
 * support them), lazy connect, cached on globalThis so HMR and isolate
 * reuse don't leak connections.
 *
 * DATABASE_URL must be the pooler URI (port 6543) in production; a direct
 * connection (5432) is fine for local dev and drizzle-kit.
 */

type Client = ReturnType<typeof createClient>

function createClient() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('Missing DATABASE_URL environment variable')
  }
  const sql = postgres(url, {
    max: 1,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  })
  return drizzle(sql, { schema })
}

const globalCache = globalThis as unknown as { __drizzleDb?: Client }

export function getDb(): Client {
  if (!globalCache.__drizzleDb) {
    globalCache.__drizzleDb = createClient()
  }
  return globalCache.__drizzleDb
}

export type Db = Client
