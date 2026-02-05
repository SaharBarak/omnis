# EPIC-011: API Hardening (Rate Limiting & Validation)

**Status:** Proposed
**Created:** 2026-02-05
**Author:** Arc (Product Engineer)
**Phase:** Pre-Launch (High Priority)
**Priority:** HIGH

---

## Problem Statement

### Rate Limiting
Omnis API endpoints have **no rate limiting**:
- `/api/ai/interpret` - Expensive Claude API calls, unprotected
- All public endpoints can be abused
- A single bad actor could run up massive AI bills
- DoS attacks are trivially easy

### Input Validation
API routes use **manual validation** instead of schemas:
- Inconsistent validation patterns across endpoints
- No type safety between client and server
- Edge cases likely missed
- Error messages inconsistent

Current state example:
```typescript
// Manual validation - error-prone
if (!req.body.birthDate || typeof req.body.birthDate !== 'string') {
  return res.status(400).json({ error: 'Invalid birth date' })
}
```

## Proposed Solution

### 1. Rate Limiting with Upstash

Use `@upstash/ratelimit` with Redis for distributed rate limiting:

```typescript
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
})
```

#### Rate Limit Tiers
| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/ai/*` | 10 | 1 minute |
| `/api/calculate/*` | 60 | 1 minute |
| `/api/people/*` | 30 | 1 minute |
| `/api/auth/*` | 5 | 1 minute |

### 2. Input Validation with Zod

Replace manual validation with Zod schemas:

```typescript
import { z } from 'zod'

const CalculateSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  system: z.enum(['dreamspell', 'tzolkin', 'longcount', 'humandesign', 'astrology', 'gematria']),
  options: z.object({
    includeOracle: z.boolean().optional(),
  }).optional(),
})

// In route handler
const result = CalculateSchema.safeParse(req.body)
if (!result.success) {
  return NextResponse.json({ error: result.error.issues }, { status: 400 })
}
```

### 3. Middleware Architecture

Create reusable middleware:
- `withRateLimit(handler, options)` - Apply rate limiting
- `withValidation(handler, schema)` - Apply Zod validation
- `withAuth(handler)` - Require authentication

## Affected Components

| Component | Changes |
|-----------|---------|
| `src/lib/middleware/rate-limit.ts` | New - Rate limiting utility |
| `src/lib/middleware/validate.ts` | New - Zod validation wrapper |
| `src/lib/schemas/*.ts` | New - API request schemas |
| `src/app/api/ai/interpret/route.ts` | Update - Add rate limit + validation |
| `src/app/api/calculate/*/route.ts` | Update - Add validation |
| `src/app/api/people/*/route.ts` | Update - Add validation |
| `package.json` | Update - Add @upstash/ratelimit, zod |

## Success Criteria

- [ ] Rate limiting active on `/api/ai/*` endpoints
- [ ] Rate limiting returns proper 429 responses
- [ ] All API routes use Zod schemas
- [ ] Validation errors return structured responses
- [ ] Consistent error format across all endpoints
- [ ] Rate limit headers in responses (X-RateLimit-*)
- [ ] No AI endpoint abuse possible
- [ ] TypeScript types derived from Zod schemas
- [ ] Unit tests for validation schemas

## Tasks (Post-Approval)

1. Install dependencies (`zod`, `@upstash/ratelimit`, `@upstash/redis`)
2. Set up Upstash Redis (free tier sufficient)
3. Create rate limiting middleware
4. Create Zod validation middleware
5. Define schemas for all API routes:
   - `/api/ai/interpret`
   - `/api/calculate/*`
   - `/api/people/*`
   - `/api/relationships/*`
6. Apply rate limiting to AI endpoints (highest priority)
7. Apply validation to all endpoints
8. Add rate limit headers to responses
9. Create error response standardization
10. Write tests for schemas
11. Document rate limits in API docs

## Schema Examples

```typescript
// src/lib/schemas/ai.ts
export const InterpretRequestSchema = z.object({
  personId: z.string().uuid(),
  system: z.enum(['dreamspell', 'humandesign', 'astrology']),
  focusArea: z.string().max(500).optional(),
})

// src/lib/schemas/people.ts
export const CreatePersonSchema = z.object({
  name: z.string().min(1).max(100),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  birthPlace: z.string().max(200).optional(),
})
```

## Rate Limit Response

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 45 seconds.",
  "retryAfter": 45
}
```

Headers:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1707177600
Retry-After: 45
```

## Estimated Effort

- **Setup:** 2 hours
- **Schemas:** 3-4 hours
- **Integration:** 2-3 hours
- **Testing:** 2 hours
- **Total:** 1.5-2 days

## References

- Upstash Rate Limit: https://upstash.com/docs/oss/sdks/ts/ratelimit
- Zod: https://zod.dev
- Next.js Middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware
