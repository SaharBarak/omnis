/**
 * Rate Limiting Utility
 *
 * Uses in-memory store for development/edge functions.
 * Can be extended to use Upstash Redis or Vercel KV for distributed rate limiting.
 *
 * @example
 * const limiter = createRateLimiter({ max: 10, windowMs: 60_000 })
 * const result = await limiter.check(request, 'api-endpoint')
 * if (!result.success) return rateLimitResponse(result)
 */

import { NextRequest, NextResponse } from 'next/server'

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

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store for rate limiting
// Note: This resets on server restart and doesn't work across multiple instances
// For production with multiple instances, use Upstash Redis or Vercel KV
const store = new Map<string, RateLimitEntry>()

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

      const remaining = Math.max(0, max - entry.count)
      const success = entry.count <= max

      return {
        success,
        limit: max,
        remaining,
        reset: Math.floor(entry.resetAt / 1000),
      }
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
