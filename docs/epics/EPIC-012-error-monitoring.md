# EPIC-012: Error Monitoring & Observability

**Status:** Proposed
**Created:** 2026-02-05
**Author:** Arc (Product Engineer)
**Phase:** Pre-Launch (Medium Priority)
**Priority:** MEDIUM

---

## Problem Statement

Pleiad has **50+ console.error statements** in production code with no error aggregation:

1. **Errors are invisible** - No alerting when things break
2. **No error context** - Stack traces lost in server logs
3. **No user impact tracking** - Don't know how many users affected
4. **Debugging is archaeological** - Must search through logs manually
5. **No performance monitoring** - Slow endpoints go unnoticed

Current state:
```typescript
// Scattered throughout codebase
console.error('Failed to fetch person:', error)
// ^ This goes nowhere useful in production
```

When production breaks, you find out from angry users, not monitoring.

## Proposed Solution

### 1. Sentry Integration

Implement Sentry for error tracking:
- Automatic error capture
- Source maps for readable stack traces
- User context (who experienced the error)
- Release tracking
- Performance monitoring

### 2. Error Boundary Components

React error boundaries for graceful degradation:
- Catch rendering errors
- Show user-friendly fallback UI
- Report to Sentry automatically

### 3. Structured Logging

Replace `console.error` with structured logger:
```typescript
import { logger } from '@/lib/logger'

// Instead of console.error
logger.error('Failed to fetch person', { 
  personId, 
  userId, 
  error: serializeError(error) 
})
```

### 4. Alerting

Configure alerts for:
- Error rate spikes (>10 errors/minute)
- New error types (first seen)
- Critical path failures (auth, payments)

## Affected Components

| Component | Changes |
|-----------|---------|
| `sentry.client.config.ts` | New - Client-side Sentry |
| `sentry.server.config.ts` | New - Server-side Sentry |
| `sentry.edge.config.ts` | New - Edge runtime Sentry |
| `src/lib/logger.ts` | New - Structured logging utility |
| `src/components/ErrorBoundary.tsx` | New - React error boundary |
| `src/app/global-error.tsx` | New - Next.js global error handler |
| `next.config.js` | Update - Sentry webpack plugin |
| `package.json` | Update - Add @sentry/nextjs |
| All files with console.error | Update - Replace with logger |

## Success Criteria

- [ ] Sentry SDK integrated (client + server)
- [ ] Source maps uploaded for readable traces
- [ ] All unhandled errors captured automatically
- [ ] Error boundaries prevent white screens
- [ ] User context attached to errors
- [ ] Release version tracked
- [ ] Structured logger replaces console.error
- [ ] Alert configured for error spikes
- [ ] Performance monitoring enabled
- [ ] Dashboard shows error trends

## Tasks (Post-Approval)

1. Create Sentry project (free tier: 5k errors/month)
2. Install `@sentry/nextjs`
3. Run Sentry wizard: `npx @sentry/wizard@latest -i nextjs`
4. Configure source map uploads
5. Create structured logger utility
6. Create React error boundary component
7. Add global-error.tsx for app-level errors
8. Search and replace console.error calls (50+)
9. Add user context to Sentry (on auth)
10. Configure release tracking
11. Set up Slack/email alerts
12. Test error capture end-to-end
13. Create error monitoring runbook

## Implementation Details

### Logger Utility
```typescript
// src/lib/logger.ts
import * as Sentry from '@sentry/nextjs'

export const logger = {
  error(message: string, context?: Record<string, any>) {
    console.error(message, context)
    Sentry.captureException(new Error(message), {
      extra: context,
    })
  },
  
  warn(message: string, context?: Record<string, any>) {
    console.warn(message, context)
    Sentry.addBreadcrumb({
      message,
      level: 'warning',
      data: context,
    })
  },
  
  info(message: string, context?: Record<string, any>) {
    console.info(message, context)
  },
}
```

### Error Boundary
```typescript
// src/components/ErrorBoundary.tsx
'use client'
import * as Sentry from '@sentry/nextjs'

export class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, { extra: errorInfo })
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }
    return this.props.children
  }
}
```

### User Context
```typescript
// On successful auth
Sentry.setUser({
  id: user.id,
  email: user.email,
})
```

## Error Response Standardization

```typescript
// Consistent error responses
interface ApiError {
  error: string
  message: string
  code?: string
  requestId?: string // For correlation with Sentry
}
```

## Monitoring Dashboard

Track these metrics in Sentry:
- Error count by endpoint
- Error rate over time
- Most affected users
- Browser/device breakdown
- Release comparison

## Estimated Effort

- **Sentry Setup:** 1-2 hours
- **Logger Creation:** 1 hour
- **Error Boundaries:** 1 hour
- **console.error Migration:** 3-4 hours
- **Testing:** 1 hour
- **Total:** 1 day

## Cost

- **Sentry Free Tier:** 5,000 errors/month
- **Sentry Team:** $26/month (50k errors)
- Start with free, upgrade if needed

## References

- Sentry Next.js: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- React Error Boundaries: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- Structured Logging: https://www.loggly.com/ultimate-guide/node-logging-basics/
