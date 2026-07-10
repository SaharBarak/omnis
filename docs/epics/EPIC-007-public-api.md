# EPIC-007: Public API

**Status:** Proposed
**Created:** 2026-02-05
**Author:** Arc (Product Engineer)
**Phase:** 8 (Platform Scale)
**Priority:** Low

---

## Problem Statement

Pleiad calculations are locked inside the web application. There's no way for:

1. **Developers** to integrate Pleiad calculations into their own apps
2. **Practitioners** to build custom tools on top of Pleiad data
3. **Third parties** to create integrations (Notion, Slack, etc.)
4. **Power users** to automate workflows

The Practitioner tier ($29/mo) promises API access per BILLING.md, but no API exists beyond internal endpoints.

## Proposed Solution

Build a public REST API with:

### Core Endpoints

#### Calculations
```
POST /api/v1/calculate/dreamspell
POST /api/v1/calculate/tzolkin
POST /api/v1/calculate/longcount
POST /api/v1/calculate/humandesign
POST /api/v1/calculate/astrology
POST /api/v1/calculate/gematria
POST /api/v1/calculate/all          # All systems for a date
```

#### People (Authenticated)
```
GET    /api/v1/people
POST   /api/v1/people
GET    /api/v1/people/:id
PUT    /api/v1/people/:id
DELETE /api/v1/people/:id
GET    /api/v1/people/:id/results   # Computed results
```

#### Relationships (Authenticated)
```
GET    /api/v1/relationships
POST   /api/v1/relationships
GET    /api/v1/relationships/:id/compatibility
```

#### Predictions (Authenticated)
```
GET    /api/v1/predictions/daily
GET    /api/v1/predictions/timeline
```

### Authentication
- API keys (generated in settings)
- Rate limiting per tier
- Usage tracking for billing

### Rate Limits
| Tier | Requests/Day | Requests/Minute |
|------|--------------|-----------------|
| Free | 0 | 0 |
| Complete | 0 | 0 |
| Practitioner | 10,000 | 100 |

### Response Format
```json
{
  "success": true,
  "data": { /* calculation results */ },
  "meta": {
    "requestId": "req_xxx",
    "timestamp": "2026-02-05T12:00:00Z",
    "usage": {
      "today": 150,
      "limit": 10000
    }
  }
}
```

## Affected Components

| Component | Changes |
|-----------|---------|
| `src/app/api/v1/` | New - All public API routes |
| `src/lib/services/api-keys.ts` | New - API key management |
| `src/lib/middleware/api-auth.ts` | New - API authentication |
| `src/lib/middleware/rate-limit.ts` | New - Rate limiting |
| `src/app/app/settings/api/` | New - API key management UI |
| Database | New tables: api_keys, api_usage_logs |
| Documentation | New - API docs site/page |

## Success Criteria

- [ ] All 6 calculation systems exposed via API
- [ ] API key generation in user settings
- [ ] Authentication middleware validates keys
- [ ] Rate limiting enforced per tier
- [ ] Usage tracking per API key
- [ ] Error responses follow consistent format
- [ ] API documentation (OpenAPI/Swagger)
- [ ] SDK or code examples (TypeScript, Python)
- [ ] People/Relationships CRUD for authenticated users
- [ ] Predictions endpoints working
- [ ] Usage displayed in settings
- [ ] Billing integration (API counts toward usage)

## Tasks (Post-Approval)

1. Design API schema and versioning strategy
2. Create database migrations for api_keys table
3. Build API key service (generate, revoke, list)
4. Create API authentication middleware
5. Implement rate limiting middleware
6. Build calculation endpoints (v1)
7. Build authenticated CRUD endpoints
8. Create usage tracking and logging
9. Build API settings UI (key management)
10. Write OpenAPI specification
11. Generate API documentation
12. Create SDK/examples
13. Integration tests for all endpoints
14. Load testing for rate limits

## API Design Principles

1. **Versioned**: `/api/v1/` prefix for future compatibility
2. **RESTful**: Standard HTTP methods and status codes
3. **Consistent**: Same response envelope for all endpoints
4. **Documented**: OpenAPI spec, interactive docs
5. **Secure**: API keys, HTTPS only, rate limited
6. **Efficient**: Pagination, filtering, field selection

## Example Request

```bash
curl -X POST https://omnis.app/api/v1/calculate/dreamspell \
  -H "Authorization: Bearer om_sk_xxx" \
  -H "Content-Type: application/json" \
  -d '{"birthDate": "1990-05-15"}'
```

```json
{
  "success": true,
  "data": {
    "kin": 123,
    "seal": {
      "number": 3,
      "name": "Blue Night",
      "hebrew": "לילה כחול"
    },
    "tone": {
      "number": 6,
      "name": "Rhythmic"
    },
    "oracle": {
      "guide": "Blue Hand",
      "analog": "Yellow Warrior",
      "antipode": "Red Skywalker",
      "occult": "White Mirror"
    },
    "wavespell": { /* ... */ },
    "castle": { /* ... */ }
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-02-05T12:00:00Z"
  }
}
```

## Estimated Effort

- **Design:** 1 week
- **Core Implementation:** 3 weeks
- **Documentation:** 1 week
- **Testing:** 1 week
- **Total:** 6 weeks

## References

- `/specs/architecture/API.md` - Internal API design
- `/specs/FEATURE_ROADMAP.md` - Phase 8
- OpenAPI Specification
