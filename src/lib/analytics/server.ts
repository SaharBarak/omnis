/**
 * The server analytics layer, for route handlers. Server code imports this
 * module and never `posthog-node` (enforced by `no-restricted-imports`).
 *
 * - One client per isolate, reused.
 * - Delivery is `ctx.waitUntil(client.captureImmediate(...))`: the response is
 *   not held up, and the Worker stays alive until the event is sent.
 * - Analytics never fails the business action: a send error is logged here
 *   and goes no further.
 *
 * Spec and event table: docs/analytics/north-star.md.
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { PostHog } from 'posthog-node'
import {
  KEY_VAR,
  SITE,
  analyticsEnv,
  analyticsHost,
  analyticsKey,
  distinctIdFor,
  isReportingEnv,
  missingConfigMessage,
  withReserved,
  type WithoutReserved,
} from './config'
import type { ServerEvent, ServerEventMap } from './events'
import { redactText, redactValue } from './redact'

/** Who the event is about. A signed-out visitor gets a one-off id and no person profile. */
export type Actor = { userId: string } | { anonymous: true }

const SESSION_HEADER = 'x-posthog-session-id'
const MAX_ID_LENGTH = 200

let client: PostHog | null = null
let hasWarned = false

function getClient(): PostHog | null {
  if (client) return client

  const key = analyticsKey()
  if (!key) {
    if (process.env.NODE_ENV !== 'production' && !hasWarned) {
      hasWarned = true
      console.warn(missingConfigMessage(KEY_VAR))
    }
    return null
  }
  if (!isReportingEnv(analyticsEnv())) return null

  // No batching: an isolate can be evicted before a background flush runs.
  client = new PostHog(key, { host: analyticsHost(), flushAt: 1, flushInterval: 0 })
  return client
}

/** Keeps the Worker alive for the send; elsewhere the process outlives the request. */
function deliver(send: Promise<void>): void {
  const settled = send.catch((error) => {
    console.error('[analytics] send failed:', error)
  })
  try {
    getCloudflareContext().ctx.waitUntil(settled)
  } catch {
    // Not on Workers (tests, plain Node): the promise completes without help.
  }
}

/**
 * A stable event id from stable parts, shaped as a UUID. A provider that
 * redelivers a webhook produces the same id, so the event is counted once.
 */
export async function deterministicUuid(parts: readonly string[]): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(parts.join('\n')))
  const bytes = new Uint8Array(digest).slice(0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x50 // version 5: name-based
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // RFC 4122 variant
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-')
}

function sanitizeId(value: string | null): string | undefined {
  // Browser-supplied and untrusted: analytics data only, never authorisation.
  return value?.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim().slice(0, MAX_ID_LENGTH) || undefined
}

/** The page the visitor was on: the referring page for an API call, else the request itself. */
function pageUrl(request: Request): string {
  const referer = request.headers.get('referer')
  const isSameOrigin = referer !== null && URL.canParse(referer) && new URL(referer).origin === new URL(request.url).origin
  return redactText(isSameOrigin ? referer : request.url)
}

/** Joins the server event to the browser session, where the request carries one. */
export function requestProperties(request?: Request): Record<string, string> {
  if (!request) return {}
  const sessionId = sanitizeId(request.headers.get(SESSION_HEADER))
  return {
    $current_url: pageUrl(request),
    ...(sessionId ? { $session_id: sessionId } : {}),
  }
}

function distinctIdOf(actor: Actor): string {
  return 'userId' in actor ? distinctIdFor(actor.userId) : crypto.randomUUID()
}

export function trackServer<E extends ServerEvent>(
  event: E,
  input: {
    actor: Actor
    properties: ServerEventMap[E] & WithoutReserved
    request?: Request
    /** The provider's event id, for webhook-sourced events: retries then count once. */
    dedupeKey?: string
  }
): void {
  const posthog = getClient()
  if (!posthog) return

  const { actor, properties, request, dedupeKey } = input
  const send = async () => {
    await posthog.captureImmediate({
      distinctId: distinctIdOf(actor),
      event,
      uuid: dedupeKey ? await deterministicUuid([SITE, event, dedupeKey]) : undefined,
      properties: withReserved({
        ...requestProperties(request),
        ...properties,
        ...('anonymous' in actor ? { $process_person_profile: false } : {}),
      }),
    })
  }
  deliver(send())
}

export function captureServerException(
  error: unknown,
  input: { actor?: Actor; request?: Request; context?: Record<string, unknown> } = {}
): void {
  const posthog = getClient()
  if (!posthog) return

  const { actor, request, context } = input
  deliver(
    posthog.captureExceptionImmediate(
      error,
      actor ? distinctIdOf(actor) : undefined,
      withReserved({ ...requestProperties(request), ...redactValue(context) })
    )
  )
}

/** Test seam: drop the memoised client and the one-time warning. */
export function forgetServerAnalyticsState(): void {
  client = null
  hasWarned = false
}
