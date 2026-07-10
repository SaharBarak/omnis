# API Architecture Specification

## Overview

RESTful API design for the Pleiad platform with consistent patterns, authentication, and error handling.

---

## Base URL

```
Production: https://api.omnis.co.il
Staging:    https://api.staging.omnis.co.il
Local:      http://localhost:3000/api
```

---

## Authentication

### JWT Bearer Token
```http
Authorization: Bearer <access_token>
```

### Token Structure
```typescript
interface AccessToken {
  sub: UserId;                   // User ID
  email: string;
  iat: number;                   // Issued at
  exp: number;                   // Expires (1 hour)
}

interface RefreshToken {
  sub: UserId;
  jti: string;                   // Token ID (for revocation)
  iat: number;
  exp: number;                   // Expires (7 days)
}
```

### Auth Endpoints
```
POST /auth/login                 # Initiate OAuth
GET  /auth/callback              # OAuth callback
POST /auth/refresh               # Refresh access token
POST /auth/logout                # Revoke tokens
GET  /auth/session               # Get current session
```

---

## Request/Response Format

### Request Headers
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <token>
Accept-Language: he             # or 'en'
X-Request-ID: <uuid>            # Optional, for tracing
```

### Response Headers
```http
Content-Type: application/json; charset=utf-8
X-Request-ID: <uuid>
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706000000
```

### Success Response
```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: ResponseMeta;
}

interface ResponseMeta {
  pagination?: PaginationMeta;
  timing?: { ms: number };
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

### Error Response
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
    requestId: string;
  };
}

type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';
```

---

## API Endpoints

### Profile

```
GET /profile
Returns current user's profile

Response: {
  success: true,
  data: UserProfile
}
```

```
PUT /profile
Update user profile

Body: {
  displayName?: string,
  birthDate?: string,
  birthTime?: string,
  birthPlace?: BirthPlace,
  hebrewName?: string,
  locale?: 'he' | 'en',
  timezone?: string
}

Response: {
  success: true,
  data: UserProfile
}
```

```
DELETE /profile
Delete user account and all data

Response: {
  success: true,
  data: { deleted: true }
}
```

---

### People

```
GET /people
List all people

Query:
  - page: number (default: 1)
  - pageSize: number (default: 50, max: 200)
  - sort: 'name' | 'birthDate' | 'createdAt' (default: 'name')
  - order: 'asc' | 'desc' (default: 'asc')
  - tags: string[] (filter by tags, OR logic)
  - search: string (search in name, hebrewName)

Response: {
  success: true,
  data: Person[],
  meta: { pagination: PaginationMeta }
}
```

```
POST /people
Create a new person

Body: {
  name: string,
  hebrewName?: string,
  birthDate: string,         // YYYY-MM-DD
  birthTime?: string,        // HH:MM
  birthPlace?: BirthPlace,
  tags?: string[],
  notes?: string
}

Response: {
  success: true,
  data: Person
}
```

```
GET /people/:id
Get person by ID

Response: {
  success: true,
  data: Person
}
```

```
PATCH /people/:id
Update person

Body: Partial<PersonInput>

Response: {
  success: true,
  data: Person
}
```

```
DELETE /people/:id
Soft delete person

Response: {
  success: true,
  data: { deleted: true, expiresAt: string }
}
```

```
POST /people/:id/restore
Restore deleted person

Response: {
  success: true,
  data: Person
}
```

```
DELETE /people/:id/permanent
Permanently delete person (only if already soft-deleted)

Response: {
  success: true,
  data: { deleted: true }
}
```

---

### Tags

```
GET /tags
List all tags (system + custom)

Response: {
  success: true,
  data: Tag[]
}
```

```
POST /tags
Create custom tag

Body: {
  name: string,
  hebrewName: string,
  color: string             // #RRGGBB
}

Response: {
  success: true,
  data: Tag
}
```

```
DELETE /tags/:id
Delete custom tag

Response: {
  success: true,
  data: { deleted: true }
}
```

---

### Relationships

```
GET /relationships
List all relationships

Query:
  - type: RelationshipType[]
  - personId: string (filter by person)

Response: {
  success: true,
  data: Relationship[]
}
```

```
POST /relationships
Create relationship

Body: {
  person1Id: string,
  person2Id: string,
  type: RelationshipType,
  subtype?: string,
  bidirectional?: boolean,
  strength?: number,
  startDate?: string,
  notes?: string
}

Response: {
  success: true,
  data: Relationship
}
```

```
GET /relationships/:id
Get relationship by ID

Response: {
  success: true,
  data: Relationship
}
```

```
PATCH /relationships/:id
Update relationship

Body: Partial<RelationshipInput>

Response: {
  success: true,
  data: Relationship
}
```

```
DELETE /relationships/:id
Delete relationship

Response: {
  success: true,
  data: { deleted: true }
}
```

```
GET /relationships/graph
Get relationship graph data

Query:
  - centerId?: string (center on specific person)
  - depth?: number (1-3, default: 2)
  - types?: RelationshipType[]

Response: {
  success: true,
  data: {
    nodes: GraphNode[],
    edges: GraphEdge[]
  }
}
```

---

### Computed Results

```
GET /results/:personId
Get all computed results for a person

Query:
  - systems: SystemType[] (filter by systems)

Response: {
  success: true,
  data: ComputedResult[]
}
```

```
GET /results/:personId/:system
Get specific system result

Response: {
  success: true,
  data: ComputedResult
}
```

```
POST /results/:personId/compute
Trigger computation for a person

Body: {
  systems?: SystemType[],    // Default: all applicable
  force?: boolean            // Recompute even if cached
}

Response: {
  success: true,
  data: ComputedResult[]
}
```

---

### Groups

```
GET /groups
List all groups

Response: {
  success: true,
  data: Group[]
}
```

```
POST /groups
Create group

Body: {
  name: string,
  description?: string,
  personIds: string[]
}

Response: {
  success: true,
  data: Group
}
```

```
GET /groups/:id
Get group by ID

Response: {
  success: true,
  data: Group
}
```

```
PATCH /groups/:id
Update group

Body: Partial<GroupInput>

Response: {
  success: true,
  data: Group
}
```

```
DELETE /groups/:id
Delete group

Response: {
  success: true,
  data: { deleted: true }
}
```

```
GET /groups/:id/analysis
Get group analysis

Query:
  - systems: SystemType[]

Response: {
  success: true,
  data: GroupAnalysis
}
```

---

### Predictions

```
GET /predictions/daily/:date
Get daily predictions

Query:
  - personId?: string (specific person, default: self)
  - systems: SystemType[]

Response: {
  success: true,
  data: DailyPredictions
}
```

```
GET /predictions/weekly/:date
Get weekly predictions (week containing date)

Response: {
  success: true,
  data: WeeklyPredictions
}
```

```
GET /predictions/monthly/:year/:month
Get monthly predictions

Response: {
  success: true,
  data: MonthlyPredictions
}
```

```
GET /predictions/timeline/:personId
Get personal timeline overview

Response: {
  success: true,
  data: PersonalTimeline
}
```

---

### Boards

```
GET /boards
List all boards

Query:
  - page, pageSize, sort, order

Response: {
  success: true,
  data: BoardSummary[],
  meta: { pagination }
}
```

```
POST /boards
Create board

Body: {
  name: string,
  description?: string,
  template?: BoardTemplate
}

Response: {
  success: true,
  data: Board
}
```

```
GET /boards/:id
Get board by ID

Response: {
  success: true,
  data: Board
}
```

```
PATCH /boards/:id
Update board (auto-save)

Body: Partial<BoardInput> | CanvasOperation[]

Response: {
  success: true,
  data: Board
}
```

```
DELETE /boards/:id
Delete board

Response: {
  success: true,
  data: { deleted: true }
}
```

```
POST /boards/:id/duplicate
Duplicate board

Response: {
  success: true,
  data: Board
}
```

```
POST /boards/:id/export
Export board

Body: {
  format: 'png' | 'jpeg' | 'svg' | 'pdf',
  options?: ExportOptions
}

Response: Binary file or {
  success: true,
  data: { url: string }
}
```

---

### Sharing

```
POST /share
Create share link

Body: {
  type: ShareType,
  entityId: string,
  options: ShareOptions,
  expiresIn?: number,        // Days until expiration
  maxViews?: number,
  password?: string
}

Response: {
  success: true,
  data: SharedView
}
```

```
GET /share/:id
Get shared content (public endpoint, no auth required)

Headers:
  - X-Share-Password: string (if password protected)

Response: {
  success: true,
  data: SharedContent
}
```

```
DELETE /share/:id
Revoke share link

Response: {
  success: true,
  data: { revoked: true }
}
```

---

### AI

```
POST /ai/interpret
Generate interpretation

Body: {
  personId: string,
  system: SystemType,
  component: string
}

Response: {
  success: true,
  data: Interpretation
}
```

```
POST /ai/chat
Send chat message

Body: {
  sessionId?: string,
  message: string
}

Response: {
  success: true,
  data: ChatResponse
}
```

```
GET /ai/chat/:sessionId
Get chat history

Response: {
  success: true,
  data: ChatMessage[]
}
```

```
GET /ai/usage
Get AI usage statistics

Response: {
  success: true,
  data: {
    tokensUsed: number,
    tokensLimit: number,
    resetDate: string
  }
}
```

---

### Subscription

```
GET /subscription
Get current subscription

Response: {
  success: true,
  data: Subscription
}
```

```
POST /subscription/checkout
Create checkout session

Body: {
  plan: 'pro',
  successUrl: string,
  cancelUrl: string
}

Response: {
  success: true,
  data: { checkoutUrl: string }
}
```

```
POST /subscription/cancel
Cancel subscription

Response: {
  success: true,
  data: Subscription
}
```

```
POST /subscription/webhook
Stripe webhook (internal)
```

---

## Rate Limiting

### Limits by Endpoint
```typescript
const rateLimits = {
  // General API
  default: { requests: 100, window: '1m' },

  // Expensive operations
  compute: { requests: 10, window: '1m' },
  aiInterpret: { requests: 20, window: '1h' },
  aiChat: { requests: 50, window: '1h' },
  export: { requests: 10, window: '1h' },

  // Auth
  login: { requests: 5, window: '15m' },
  refresh: { requests: 10, window: '1m' },
};
```

### Rate Limit Response
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706000060
Retry-After: 60

{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "details": {
      "limit": 100,
      "window": "1m",
      "retryAfter": 60
    }
  }
}
```

---

## Versioning

### URL Versioning
```
/api/v1/people
/api/v2/people
```

### Version Header (Alternative)
```http
Accept: application/vnd.omnis.v1+json
```

### Deprecation
```http
Deprecation: true
Sunset: Sat, 01 Jan 2026 00:00:00 GMT
Link: </api/v2/people>; rel="successor-version"
```

---

## Error Codes

### HTTP Status Codes
```
200 OK                  - Success
201 Created             - Resource created
204 No Content          - Success, no body
400 Bad Request         - Validation error
401 Unauthorized        - Missing/invalid auth
403 Forbidden           - Insufficient permissions
404 Not Found           - Resource not found
409 Conflict            - Resource conflict
422 Unprocessable       - Semantic error
429 Too Many Requests   - Rate limited
500 Internal Error      - Server error
503 Service Unavailable - Maintenance/overload
```

### Validation Errors
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fields": {
        "birthDate": ["Invalid date format. Expected YYYY-MM-DD"],
        "name": ["Name is required", "Name must be at least 2 characters"]
      }
    }
  }
}
```

---

## Pagination

### Cursor-Based (for large datasets)
```
GET /people?cursor=eyJpZCI6MTIzfQ&limit=50

Response: {
  data: [...],
  meta: {
    cursor: {
      next: "eyJpZCI6MTczfQ",
      previous: "eyJpZCI6MTIzfQ"
    },
    hasMore: true
  }
}
```

### Offset-Based (default)
```
GET /people?page=2&pageSize=50

Response: {
  data: [...],
  meta: {
    pagination: {
      page: 2,
      pageSize: 50,
      totalItems: 150,
      totalPages: 3,
      hasNext: true,
      hasPrevious: true
    }
  }
}
```

---

## Webhooks

### Webhook Events
```typescript
type WebhookEvent =
  | 'person.created'
  | 'person.updated'
  | 'person.deleted'
  | 'relationship.created'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.canceled';

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: unknown;
  signature: string;
}
```

### Webhook Signature
```typescript
// HMAC-SHA256 signature for verification
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');

// Header: X-Pleiad-Signature: sha256=<signature>
```

---

## OpenAPI Specification

API documentation available at:
```
GET /api/docs              # Swagger UI
GET /api/openapi.json      # OpenAPI spec
```
