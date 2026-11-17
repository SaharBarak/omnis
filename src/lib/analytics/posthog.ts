'use client'

/**
 * The browser analytics layer. Application code imports this module and never
 * `posthog-js` (enforced by `no-restricted-imports` in eslint.config.mjs).
 *
 *   track(event, properties)     event must be a key of ClientEventMap
 *   identify(userId, traits?)    applies the `<site>:user:<id>` namespace
 *   reset()
 *   captureException(error, context?)
 *
 * Spec, event table and consent behaviour: docs/analytics/north-star.md.
 *
 * Without NEXT_PUBLIC_POSTHOG_KEY every export is a no-op: no network, no
 * storage. A development build also raises one error naming the variable.
 */

import posthog, { type CaptureResult } from 'posthog-js'
import {
  KEY_VAR,
  analyticsEnv,
  analyticsHost,
  analyticsKey,
  distinctIdFor,
  isReportingEnv,
  missingConfigMessage,
  reservedProperties,
  withReserved,
  type WithoutReserved,
} from './config'
import type { ConsentChoice } from './consent'
import type { ClientEvent, ClientEventMap } from './events'
import { redactValue } from './redact'

/** Person properties. The id is never one of these. */
export type PersonTraits = { email?: string; name?: string; plan?: string }

type TrackArgs<E extends ClientEvent> = keyof ClientEventMap[E] extends never
  ? [properties?: WithoutReserved]
  : [properties: ClientEventMap[E] & WithoutReserved]

/**
 * The SDK drops captures while consent is pending. Business events raised in
 * that window are held and sent once the visitor is known to have accepted
 * (with storage) or refused (cookieless). Bounded: a visitor who never answers
 * must not grow a queue for the length of a session.
 */
const MOST_HELD = 20

let started = false
let consent: ConsentChoice | null = null
let identity: { userId: string; traits?: PersonTraits } | null = null
const held: Array<() => void> = []

/** Surfaces in the dev overlay without interrupting the code that called us. */
function raise(message: string): void {
  const error = new Error(message)
  if (typeof globalThis.reportError === 'function') globalThis.reportError(error)
  else console.error(error)
}

/**
 * Runs on every event, including pageviews, autocapture and exceptions. The
 * reserved keys are stamped here as well as registered at init, because
 * `reset()` and a consent change both clear registered super properties.
 */
function beforeSend(event: CaptureResult | null): CaptureResult | null {
  if (!event) return null
  return {
    ...event,
    properties: withReserved(redactValue(event.properties)),
    $set: redactValue(event.$set),
    $set_once: redactValue(event.$set_once),
  }
}

/** Called once, from `src/instrumentation-client.ts`. */
export function initAnalytics(): void {
  if (started || typeof window === 'undefined') return

  const key = analyticsKey()
  if (!key) {
    if (process.env.NODE_ENV !== 'production') raise(missingConfigMessage(KEY_VAR))
    return
  }
  if (!isReportingEnv(analyticsEnv())) return

  posthog.init(key, {
    api_host: analyticsHost(),
    defaults: '2026-08-30',
    // Accounts product: no storage until the visitor accepts, cookieless
    // counting if they refuse, person profiles only for signed-in users.
    cookieless_mode: 'on_reject',
    person_profiles: 'identified_only',
    capture_exceptions: true,
    session_recording: { maskAllInputs: true },
    // Same-origin API calls carry the session id, so server events join it.
    tracing_headers: [window.location.hostname],
    before_send: beforeSend,
  })
  posthog.register(reservedProperties())
  started = true
}

function whenDecided(action: () => void): void {
  if (consent !== null) return action()
  if (held.length < MOST_HELD) held.push(action)
}

function applyIdentity(): void {
  if (!started || consent !== 'granted' || !identity) return
  const id = distinctIdFor(identity.userId)
  if (posthog.get_distinct_id() !== id) posthog.identify(id, identity.traits)
}

/**
 * The consent gate's answer (`consent-store.ts`). PostHog keeps its own copy
 * of the decision; it is only told when the two differ, so re-applying a
 * stored answer on every page load sends nothing.
 */
export function applyConsent(choice: ConsentChoice): void {
  consent = choice
  const queued = held.splice(0, held.length)
  if (!started) return

  if (posthog.get_explicit_consent_status() !== choice) {
    if (choice === 'granted') posthog.opt_in_capturing()
    else posthog.opt_out_capturing()
  }
  applyIdentity()
  for (const action of queued) action()
}

export function track<E extends ClientEvent>(event: E, ...[properties]: TrackArgs<E>): void {
  if (!started) return
  const timestamp = new Date()
  whenDecided(() => posthog.capture(event, withReserved(properties), { timestamp }))
}

/**
 * Ties this browser to the signed-in user. Takes effect only with consent: a
 * refusal is cookieless and has no identity to attach, and an answer given
 * later applies the identity then. Safe to call on every render.
 */
export function identify(userId: string, traits?: PersonTraits): void {
  identity = { userId, traits }
  applyIdentity()
}

/** On sign-out, so the next person on this browser starts anonymous. */
export function reset(): void {
  identity = null
  if (started) posthog.reset()
}

/** For framework error boundaries. Uncaught errors are captured by the SDK itself. */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!started) return
  posthog.captureException(error, withReserved(redactValue(context)))
}

/** Test seam. Nothing in the application resets this; a page load does. */
export function forgetAnalyticsState(): void {
  started = false
  consent = null
  identity = null
  held.length = 0
}
