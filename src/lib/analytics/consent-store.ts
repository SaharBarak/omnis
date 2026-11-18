'use client'

import { useEffect, useSyncExternalStore } from 'react'
import {
  CONSENT_KEY,
  gateFor,
  hasPrivacySignal,
  isSettled,
  readChoice,
  syncConsentCookie,
  writeChoice,
  type ConsentChoice,
  type ConsentGate,
} from './consent'
import { applyConsent } from './posthog'

/**
 * One answer, shared by the banner that asks, the trackers that wait for it
 * and the preference control on the privacy page. A module-level store read
 * through `useSyncExternalStore` keeps them in step without a provider, and
 * the `storage` event carries an answer given in another tab.
 *
 * `writeChoice` stores each answer together with the cookie that carries it
 * to the server, so server events follow the same answer
 * (docs/analytics/north-star.md, "Server events and consent").
 *
 * Snapshots are plain strings, so React's `Object.is` comparison is stable.
 */

let choice: ConsentChoice | null = null
let mustAsk: boolean | null = null
let resolving = false

const listeners = new Set<() => void>()

function snapshot(): ConsentGate {
  return gateFor({ choice, mustAsk, hasPrivacySignal: hasPrivacySignal() })
}

/** The server has no browser to have stored anything; hydration starts here too. */
function serverSnapshot(): ConsentGate {
  return 'deciding'
}

/** Tell the components, and tell PostHog once the answer is settled. */
function announce(): void {
  const gate = snapshot()
  if (isSettled(gate)) applyConsent(gate === 'allowed' ? 'granted' : 'denied')
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  const fromOtherTab = (event: StorageEvent) => {
    if (event.key !== null && event.key !== CONSENT_KEY) return
    choice = readChoice()
    // The answering tab wrote the shared cookie; this repairs one that went missing.
    syncConsentCookie(choice)
    announce()
  }
  window.addEventListener('storage', fromOtherTab)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', fromOtherTab)
  }
}

/** First call does the work; an answer on file or a privacy signal skips the network. */
function startResolving(): void {
  if (resolving) return
  resolving = true

  choice = readChoice()
  if (choice !== null || hasPrivacySignal()) return announce()

  void fetch('/api/consent', { cache: 'no-store' })
    .then((response) => (response.ok ? response.json() : null))
    .then((body: { ask?: unknown } | null) => {
      mustAsk = body?.ask !== false
    })
    .catch(() => {
      // Could not learn where they are, so ask them.
      mustAsk = true
    })
    .finally(announce)
}

export function useConsentGate(): ConsentGate {
  useEffect(startResolving, [])
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot)
}

export function answerConsent(next: ConsentChoice): void {
  choice = next
  writeChoice(next)
  announce()
}
