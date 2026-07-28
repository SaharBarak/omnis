import { getCloudflareContext } from '@opennextjs/cloudflare'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

/**
 * Drizzle + postgres.js over the Supabase Supavisor pooler.
 *
 * Cloudflare Workers constraint: an I/O object (TCP socket) opened during one
 * request cannot be used by another request in the same isolate. A client
 * cached on globalThis and reused across requests therefore throws "Cannot
 * perform I/O on behalf of a different request" under isolate reuse. So on
 * Workers we cache the client PER REQUEST (keyed on the request-scoped
 * Cloudflare context); in dev/node — where no such restriction exists and
 * getCloudflareContext() is unavailable synchronously — we fall back to a
 * process-global cache.
 *
 * Tuning mirrors the old Mongo client: one connection per isolate,
 * prepare:false (Supavisor transaction mode forbids prepared statements),
 * lazy connect, short idle timeout so pooled connections release quickly.
 */

type Client = ReturnType<typeof createClient>

function createClient(connectionString?: string): ReturnType<typeof drizzle<typeof schema>> {
  const url = connectionString ?? process.env.DATABASE_URL
  if (!url) {
    throw new Error('Missing DATABASE_URL environment variable')
  }
  const sql = postgres(url, {
    // With Hyperdrive terminating the handshake nearby, extra connections are
    // cheap — a small pool lets Promise.all'd queries inside one request run
    // concurrently instead of serializing 300ms Sydney round trips.
    max: 4,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  })
  return drizzle(sql, { schema })
}

// Hyperdrive terminates the expensive TCP+TLS+auth handshake to Supabase in
// Cloudflare's network and hands the Worker a warm pooled connection, so the
// per-request client below becomes cheap to open. Outside a Worker (dev,
// migrations, scripts) the binding is absent and DATABASE_URL is used as-is.
function getHyperdriveUrl(ctx: object): string | undefined {
  const env = (ctx as { env?: { HYPERDRIVE?: { connectionString?: string } } }).env
  return env?.HYPERDRIVE?.connectionString
}

const globalCache = globalThis as unknown as { __drizzleDb?: Client }

// Per-request cache for Workers: the Cloudflare request context object is a
// stable, request-scoped key, so a WeakMap entry lives exactly as long as the
// request and never bleeds into the next one.
const perRequestCache = new WeakMap<object, Client>()

function getRequestContext(): object | null {
  try {
    // Synchronous form — populated during a Worker request. Throws in the Node
    // dev runtime (context not initialized), where we intentionally fall
    // through to the global cache.
    const ctx = getCloudflareContext() as unknown
    return ctx && typeof ctx === 'object' ? (ctx as object) : null
  } catch {
    return null
  }
}

export function getDb(): Client {
  const ctx = getRequestContext()
  if (ctx) {
    let db = perRequestCache.get(ctx)
    if (!db) {
      db = createClient(getHyperdriveUrl(ctx))
      perRequestCache.set(ctx, db)
    }
    return db
  }
  if (!globalCache.__drizzleDb) {
    globalCache.__drizzleDb = createClient()
  }
  return globalCache.__drizzleDb
}

export type Db = Client
