/**
 * The server analytics layer, for route handlers. Server code imports this
 * module and never `posthog-node` (enforced by `no-restricted-imports`).
 *
 * - One client per isolate, reused.
 * - Delivery is `ctx.waitUntil(client.captureImmediate(...))`: the response is
 *   not held up, and the Worker stays alive until the event is sent.
 * - Analytics never fails the business action: a send error is logged here
 *   and goes no further.
 * - An event names its account only with the visitor's consent, read from
 *   their own request (`attributionFor`); otherwise it is sent unattributed.
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
import { gateForRequest } from './consent'
import type { ServerEvent, ServerEventMap } from './events'
import { redactText, redactValue } from './redact'

/**
 * Who the event is about. The account is named only when the visitor allowed
 * analytics; a signed-out visitor is never named.
 */
export type Actor = { userId: string } | { anonymous: true }

/** What a server event may name, decided once for every server event by `attributionFor`. */
export type Attribution = {
  readonly distinctId: string
  /** `$current_url` and `$session_id`, only from a visit that allowed analytics. */
  readonly visit: Readonly<Record<string, string>>
  /** Without a named account, no person profile is created or updated. */
  readonly person: Readonly<{ $process_person_profile?: false }>
}

const NAMED_PERSON: Attribution['person'] = Object.freeze({})
const UNATTRIBUTED_PERSON: Attribution['person'] = Object.freeze({ $process_person_profile: false })

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
  // No GeoIP: the request PostHog sees comes from the Worker, not the visitor.
  client = new PostHog(key, { host: analyticsHost(), flushAt: 1, flushInterval: 0, disableGeoip: true })
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
function visitProperties(request: Request): Record<string, string> {
  const sessionId = sanitizeId(request.headers.get(SESSION_HEADER))
  return {
    $current_url: pageUrl(request),
    ...(sessionId ? { $session_id: sessionId } : {}),
  }
}

/** The request, if it is a visit whose own gate allows analytics; a webhook's never is. */
function allowedVisit(request?: Request): Request | null {
  return request && gateForRequest(request.headers) === 'allowed' ? request : null
}

/**
 * The one consent decision for server events (docs/analytics/north-star.md,
 * "Server events and consent"). With the visitor's request allowing
 * analytics, the event names the actor's account and joins the visit.
 * Otherwise, or without a request, it is unattributed: a distinct id drawn
 * for this event alone, no person profile, nothing from the visit.
 */
export function attributionFor(actor: Actor | undefined, request?: Request): Attribution {
  const allowed = allowedVisit(request)
  const userId = allowed && actor && 'userId' in actor ? actor.userId : null
  return {
    distinctId: userId === null ? crypto.randomUUID() : distinctIdFor(userId),
    visit: allowed ? visitProperties(allowed) : {},
    person: userId === null ? UNATTRIBUTED_PERSON : NAMED_PERSON,
  }
}

export function trackServer<E extends ServerEvent>(
  event: E,
  input: {
    actor: Actor
    properties: ServerEventMap[E] & WithoutReserved
    /** The visitor's own request, which carries their consent. A webhook's is not one. */
    request?: Request
    /** The provider's event id, for webhook-sourced events: retries then count once. */
    dedupeKey?: string
  }
): void {
  const posthog = getClient()
  if (!posthog) return

  const { actor, properties, request, dedupeKey } = input
  const { distinctId, visit, person } = attributionFor(actor, request)
  const send = async () => {
    await posthog.captureImmediate({
      distinctId,
      event,
      uuid: dedupeKey ? await deterministicUuid([SITE, event, dedupeKey]) : undefined,
      properties: withReserved({ ...visit, ...properties, ...person }),
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
  const { distinctId, visit, person } = attributionFor(actor, request)
  deliver(
    posthog.captureExceptionImmediate(
      error,
      distinctId,
      withReserved({ ...visit, ...redactValue(context), ...person })
    )
  )
}

/** Test seam: drop the memoised client and the one-time warning. */
export function forgetServerAnalyticsState(): void {
  client = null
  hasWarned = false
}
