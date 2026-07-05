import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import {
  createRateLimiter,
  resetRateLimitStore,
  type RateLimitKv,
} from './rate-limit'

// Mutable holder so each test controls whether a Cloudflare context (and its
// RATE_LIMIT_KV binding) exists. `null` simulates non-Workers environments,
// where getCloudflareContext throws.
const ctx: { kv: RateLimitKv | null } = { kv: null }

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: () => {
    if (!ctx.kv) throw new Error('no cloudflare context')
    return { env: { RATE_LIMIT_KV: ctx.kv } }
  },
}))

/** In-test KV double backed by a shared Map (i.e. "cross-isolate" storage). */
function createFakeKv(backing = new Map<string, string>()): RateLimitKv & {
  backing: Map<string, string>
} {
  return {
    backing,
    async get(key) {
      return backing.get(key) ?? null
    },
    async put(key, value) {
      backing.set(key, value)
    },
  }
}

function makeRequest(ip = '203.0.113.7'): NextRequest {
  const req = new NextRequest(new URL('/api/test', 'http://localhost:3000'))
  req.headers.set('cf-connecting-ip', ip)
  return req
}

describe('rate limiter', () => {
  beforeEach(() => {
    ctx.kv = null
    resetRateLimitStore()
  })

  describe('in-memory fallback (no KV binding)', () => {
    it('allows requests under the limit and blocks over it', async () => {
      const limiter = createRateLimiter({ max: 3, windowMs: 60_000 })

      for (let i = 0; i < 3; i++) {
        const result = await limiter.check(makeRequest(), 'ep')
        expect(result.success).toBe(true)
      }
      const blocked = await limiter.check(makeRequest(), 'ep')
      expect(blocked.success).toBe(false)
      expect(blocked.remaining).toBe(0)
    })

    it('tracks identifiers independently', async () => {
      const limiter = createRateLimiter({ max: 1, windowMs: 60_000 })

      expect((await limiter.check(makeRequest('10.0.0.1'), 'ep')).success).toBe(true)
      expect((await limiter.check(makeRequest('10.0.0.1'), 'ep')).success).toBe(false)
      expect((await limiter.check(makeRequest('10.0.0.2'), 'ep')).success).toBe(true)
    })
  })

  describe('KV-backed store', () => {
    it('counts across limiter instances sharing the namespace (cross-isolate)', async () => {
      const backing = new Map<string, string>()
      ctx.kv = createFakeKv(backing)

      // Two limiter instances model two Workers isolates: the in-memory
      // limiter would give each its own budget; KV must share one.
      const isolateA = createRateLimiter({ max: 2, windowMs: 60_000 })
      const isolateB = createRateLimiter({ max: 2, windowMs: 60_000 })

      expect((await isolateA.check(makeRequest(), 'ep')).success).toBe(true)
      expect((await isolateB.check(makeRequest(), 'ep')).success).toBe(true)
      const blocked = await isolateA.check(makeRequest(), 'ep')
      expect(blocked.success).toBe(false)
      expect(backing.size).toBeGreaterThan(0)
    })

    it('reports limit, remaining, and reset', async () => {
      ctx.kv = createFakeKv()
      const limiter = createRateLimiter({ max: 5, windowMs: 60_000 })

      const result = await limiter.check(makeRequest(), 'ep')
      expect(result).toMatchObject({ success: true, limit: 5, remaining: 4 })
      expect(result.reset).toBeGreaterThan(Math.floor(Date.now() / 1000))
    })

    it('degrades to the in-memory store when KV errors', async () => {
      ctx.kv = {
        async get() {
          throw new Error('kv outage')
        },
        async put() {
          throw new Error('kv outage')
        },
      }
      const limiter = createRateLimiter({ max: 1, windowMs: 60_000 })

      expect((await limiter.check(makeRequest(), 'ep')).success).toBe(true)
      expect((await limiter.check(makeRequest(), 'ep')).success).toBe(false)
    })
  })
})
