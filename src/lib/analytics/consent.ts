/**
 * Whether non-essential trackers may run, and who has to be asked first.
 *
 * Pure rules only, so they can be tested without a browser. The store that
 * holds the answer is `consent-store.ts`; the code that acts on it is
 * `posthog.ts` (PostHog) and `components/analytics/trackers.tsx` (the rest).
 *
 * - Region decides whether silence counts as permission, not whether a refusal
 *   is honoured: a "no" and a browser privacy signal are final everywhere.
 * - An unknown country is asked. A header we could not read is not evidence
 *   the visitor is outside Europe.
 * - Until the answer is known, nothing non-essential loads.
 */

export type ConsentChoice = 'granted' | 'denied'

/**
 * `deciding` and `asking` both mean "load nothing"; only `asking` shows the
 * banner. `allowed` enables storage. `refused` leaves PostHog counting
 * cookielessly, with no identifier kept in the browser, and nothing else.
 */
export type ConsentGate = 'deciding' | 'asking' | 'allowed' | 'refused'

export const CONSENT_KEY = 'pleiad.consent.analytics'

/** ISO 3166-1 alpha-2: the EEA, plus the UK (PECR) and Switzerland (FADP). */
const ASKS_FIRST: ReadonlySet<string> = new Set([
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR',
  'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI',
  'SK',
  'IS', 'LI', 'NO',
  'GB', 'CH',
])

/** Cloudflare's placeholders for Tor exits and unknown networks. */
const NOT_A_COUNTRY: ReadonlySet<string> = new Set(['XX', 'T1'])

function isKnownCountry(code: string): boolean {
  return /^[A-Z]{2}$/.test(code) && !NOT_A_COUNTRY.has(code)
}

export function needsAsking(country: string | null | undefined): boolean {
  const code = country?.trim().toUpperCase() ?? ''
  return !isKnownCountry(code) || ASKS_FIRST.has(code)
}

export function gateFor(input: {
  choice: ConsentChoice | null
  /** `null` while the region answer is still in flight. */
  mustAsk: boolean | null
  /** The browser sends Global Privacy Control or Do Not Track. */
  hasPrivacySignal: boolean
}): ConsentGate {
  // An explicit answer outranks the browser-wide signal in both directions:
  // the person answered this specific question.
  if (input.choice === 'granted') return 'allowed'
  if (input.choice === 'denied') return 'refused'
  if (input.hasPrivacySignal) return 'refused'
  if (input.mustAsk === null) return 'deciding'
  return input.mustAsk ? 'asking' : 'allowed'
}

export function isSettled(gate: ConsentGate): gate is 'allowed' | 'refused' {
  return gate === 'allowed' || gate === 'refused'
}

export function hasPrivacySignal(): boolean {
  if (typeof navigator === 'undefined') return false
  const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl
  return gpc === true || navigator.doNotTrack === '1'
}

/** Storage can throw (private mode, blocked site data); that reads as "not answered". */
export function readChoice(): ConsentChoice | null {
  try {
    const stored = window.localStorage.getItem(CONSENT_KEY)
    return stored === 'granted' || stored === 'denied' ? stored : null
  } catch {
    return null
  }
}

export function writeChoice(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, choice)
  } catch {
    // The answer holds for this page view and is asked again next time.
  }
}
