/**
 * Rate Limiting Utility
 *
 * Backing store selection (per check, so it works under Workers isolate churn):
 *
 * 1. Cloudflare KV (`RATE_LIMIT_KV` binding, wrangler.jsonc) — fixed-window
 *    counter shared across all Workers isolates. KV is eventually consistent
 *    and the read-increment-write is not atomic, so this is BEST-EFFORT
 *    smoothing: a burst racing across isolates can slightly exceed `max`.
 *    That is acceptable for these limits (abuse damping, not billing
 *    enforcement). The strict alternative is a Durable Object counter
 *    (single-writer, exact), deliberately not used here: it adds a class +
 *    migration + per-request DO round-trip and cost for no product benefit.
 * 2. In-memory Map — fallback when the KV binding is absent (local dev
 *    without bindings, vitest, plain Node). Per-process only.
 *
 * @example
 * const limiter = createRateLimiter({ max: 10, windowMs: 60_000 })
 * const result = await limiter.check(request, 'api-endpoint')
 * if (!result.success) return rateLimitResponse(result)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  max: number
  /** Time window in milliseconds */
  windowMs: number
  /** Optional: Use IP + User ID for authenticated requests */
  useUserId?: boolean
  /** Optional: Custom key prefix for this limiter */
  keyPrefix?: string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // Unix timestamp when the limit resets
}

/** Minimal KV surface the limiter needs (subset of Workers KVNamespace). */
export interface RateLimitKv {
  get(key: string): Promise<string | null>
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ): Promise<void>
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory fallback store. Resets on restart, per-isolate/per-process only.
const store = new Map<string, RateLimitEntry>()

/** Reset the in-memory rate limit store (for tests) */
export function resetRateLimitStore() {
  store.clear()
}

// Cleanup old entries periodically (every 5 minutes)
let cleanupInterval: NodeJS.Timeout | null = null

function startCleanup() {
  if (cleanupInterval) return
  cleanupInterval = setInterval(
    () => {
      const now = Date.now()
      for (const [key, entry] of store.entries()) {
        if (entry.resetAt < now) {
          store.delete(key)
        }
      }
    },
    5 * 60 * 1000
  )
  // Don't prevent process from exiting
  if (cleanupInterval.unref) {
    cleanupInterval.unref()
  }
}

/**
 * Resolve the KV binding from the request-scoped Cloudflare context.
 * Returns null when not running on Workers (dev without bindings, tests,
 * plain Node) so callers can degrade to the in-memory store.
 */
function getRateLimitKv(): RateLimitKv | null {
  try {
    const { env } = getCloudflareContext()
    return (env as { RATE_LIMIT_KV?: RateLimitKv }).RATE_LIMIT_KV ?? null
  } catch {
    return null
  }
}

/**
 * Get a unique identifier for the request
 */
function getIdentifier(request: NextRequest, userId?: string): string {
  // Try to get the real IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  const ip =
    cfConnectingIp ||
    realIp ||
    (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
    'unknown'

  // If we have a user ID, combine with IP for more accurate limiting
  if (userId) {
    return `${ip}:${userId}`
  }

  return ip
}

/** Fixed-window check against the shared KV namespace. */
async function checkKv(
  kv: RateLimitKv,
  key: string,
  max: number,
  windowMs: number,
  now: number
): Promise<RateLimitResult> {
  const windowStart = Math.floor(now / windowMs) * windowMs
  const resetAt = windowStart + windowMs
  const kvKey = `${key}:${windowStart}`

  const current = Number.parseInt((await kv.get(kvKey)) ?? '0', 10) || 0
  const count = current + 1

  // KV requires expirationTtl >= 60s; pad past the window end so the key
  // outlives its window and then self-deletes.
  const ttl = Math.max(60, Math.ceil(windowMs / 1000) + 60)
  await kv.put(kvKey, String(count), { expirationTtl: ttl })

  return {
    success: count <= max,
    limit: max,
    remaining: Math.max(0, max - count),
    reset: Math.floor(resetAt / 1000),
  }
}

/** Sliding-window-ish check against the per-process in-memory store. */
function checkMemory(
  key: string,
  max: number,
  windowMs: number,
  now: number
): RateLimitResult {
  let entry = store.get(key)

  // If no entry or window expired, create new entry
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
    }
    store.set(key, entry)

    return {
      success: true,
      limit: max,
      remaining: max - 1,
      reset: Math.floor(entry.resetAt / 1000),
    }
  }

  // Increment counter
  entry.count++
  store.set(key, entry)

  return {
    success: entry.count <= max,
    limit: max,
    remaining: Math.max(0, max - entry.count),
    reset: Math.floor(entry.resetAt / 1000),
  }
}

/**
 * Create a rate limiter with the specified configuration
 */
export function createRateLimiter(config: RateLimitConfig) {
  startCleanup()

  const { max, windowMs, keyPrefix = 'rl' } = config

  return {
    /**
     * Check if the request is within rate limits
     */
    async check(
      request: NextRequest,
      endpoint: string,
      userId?: string
    ): Promise<RateLimitResult> {
      const identifier = getIdentifier(request, config.useUserId ? userId : undefined)
      const key = `${keyPrefix}:${endpoint}:${identifier}`
      const now = Date.now()

      const kv = getRateLimitKv()
      if (kv) {
        try {
          return await checkKv(kv, key, max, windowMs, now)
        } catch {
          // KV outage must never take the API down — degrade to per-isolate.
        }
      }

      return checkMemory(key, max, windowMs, now)
    },
  }
}

/**
 * Create a rate limit response with appropriate headers
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many requests',
      message: 'Please try again later',
      retryAfter: result.reset - Math.floor(Date.now() / 1000),
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': (result.reset - Math.floor(Date.now() / 1000)).toString(),
      },
    }
  )
}

/**
 * Add rate limit headers to a successful response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.reset.toString())
  return response
}

// Pre-configured limiters for common use cases
export const rateLimiters = {
  /**
   * AI endpoints - expensive operations
   * 10 requests per minute per user
   */
  ai: createRateLimiter({
    max: 10,
    windowMs: 60 * 1000,
    keyPrefix: 'rl:ai',
    useUserId: true,
  }),

  /**
   * Newsletter subscription - prevent spam
   * 5 requests per hour per IP
   */
  newsletter: createRateLimiter({
    max: 5,
    windowMs: 60 * 60 * 1000,
    keyPrefix: 'rl:newsletter',
  }),

  /**
   * Public API endpoints
   * 60 requests per minute per IP
   */
  publicApi: createRateLimiter({
    max: 60,
    windowMs: 60 * 1000,
    keyPrefix: 'rl:public',
  }),

  /**
   * Authenticated API endpoints
   * 120 requests per minute per user
   */
  authenticatedApi: createRateLimiter({
    max: 120,
    windowMs: 60 * 1000,
    keyPrefix: 'rl:auth',
    useUserId: true,
  }),
}
