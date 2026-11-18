/**
 * Whether non-essential trackers may run, and who has to be asked first.
 *
 * The rules are pure, so they can be tested without a browser, and run on
 * both sides: the browser decides what it loads, and the server decides
 * what a server event may name (`gateForRequest`), from the same inputs. The
 * store that holds the answer is `consent-store.ts`; the code that acts on
 * it is `posthog.ts` (PostHog), `server.ts` (server events) and
 * `components/analytics/trackers.tsx` (the rest).
 *
 * - Region decides whether silence counts as permission, not whether a refusal
 *   is honoured: a "no" and a browser privacy signal are final everywhere.
 * - An unknown country is asked. A header we could not read is not evidence
 *   the visitor is outside Europe.
 * - Until the answer is known, nothing non-essential loads.
 *
 * Spec: docs/analytics/north-star.md, "Consent" and "Server events and consent".
 */

export type ConsentChoice = 'granted' | 'denied'

/**
 * What the browser settles without the network, carried to the server in
 * `CONSENT_COOKIE`: the answer, a privacy signal's refusal, or nothing yet
 * (the region decides). Transport state, not an answer.
 */
export type ConsentRecord = ConsentChoice | 'unanswered'

/** The request headers the server reads; `Headers` and Next's read-only headers both fit. */
export type HeaderSource = Pick<Headers, 'get'>

/**
 * `deciding` and `asking` both mean "load nothing"; only `asking` shows the
 * banner. `allowed` enables storage. `refused` leaves PostHog counting
 * cookielessly, with no identifier kept in the browser, and nothing else.
 */
export type ConsentGate = 'deciding' | 'asking' | 'allowed' | 'refused'

export const CONSENT_KEY = 'pleiad.consent.analytics'

export const CONSENT_COOKIE = 'pleiad-consent'

/**
 * The cookie mirrors an answer that has no expiry, so it asks for the
 * longest lifetime a browser may honour: RFC 6265bis caps it at 400 days.
 */
export const CONSENT_COOKIE_MAX_AGE_S = 400 * 24 * 60 * 60

/** Cloudflare stamps the visitor's country on every request. */
export const COUNTRY_HEADER = 'cf-ipcountry'

/** The request headers a privacy signal arrives in, and the value that turns it on. */
const PRIVACY_SIGNAL_HEADERS = ['sec-gpc', 'dnt'] as const
const SIGNAL_ON = '1'

const RECORDS: ReadonlySet<string> = new Set<ConsentRecord>(['granted', 'denied', 'unanswered'])

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

/** Whether the region a request comes from asks first. `/api/consent` and the server's gate both read it here. */
export function mustAskFrom(headers: HeaderSource): boolean {
  return needsAsking(headers.get(COUNTRY_HEADER))
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
  return gpc === true || navigator.doNotTrack === SIGNAL_ON
}

/** The same signal as the browser's settings send it on every request. */
export function sendsPrivacySignal(headers: HeaderSource): boolean {
  return PRIVACY_SIGNAL_HEADERS.some((name) => headers.get(name)?.trim() === SIGNAL_ON)
}

function isRecord(value: string | undefined): value is ConsentRecord {
  return value !== undefined && RECORDS.has(value)
}

/** What the browser settles without the network: the answer, else a signal's refusal, else nothing yet. */
export function recordFor(choice: ConsentChoice | null, signalled: boolean): ConsentRecord {
  return choice ?? (signalled ? 'denied' : 'unanswered')
}

/** The answer a record holds, as `gateFor` takes it. */
export function choiceOf(record: ConsentRecord): ConsentChoice | null {
  return record === 'unanswered' ? null : record
}

/** The `document.cookie` assignment that stores a record for the server. */
export function consentCookie(record: ConsentRecord, secure: boolean): string {
  return [
    `${CONSENT_COOKIE}=${record}`,
    'Path=/',
    `Max-Age=${CONSENT_COOKIE_MAX_AGE_S}`,
    'SameSite=Lax',
    ...(secure ? ['Secure'] : []),
  ].join('; ')
}

/**
 * The record a `Cookie` header carries. Exactly one well-formed value counts:
 * an absent, repeated or unknown value is no record, so a request that cannot
 * show one plainly is sent unattributed rather than guessed at.
 */
export function recordFromCookieHeader(header: string | null | undefined): ConsentRecord | null {
  const prefix = `${CONSENT_COOKIE}=`
  const [only, ...others] = (header ?? '')
    .split(';')
    .map((pair) => pair.trim())
    .filter((pair) => pair.startsWith(prefix))
    .map((pair) => pair.slice(prefix.length).trim())
  return others.length === 0 && isRecord(only) ? only : null
}

/**
 * The gate for the request a server event came from: the answer its cookie
 * carries, with the request's own region and privacy signal, through the
 * same `gateFor` the browser runs. `null` when the request carries no record:
 * no browser of ours has spoken for it, so it is not given the region default.
 */
export function gateForRequest(headers: HeaderSource): ConsentGate | null {
  const record = recordFromCookieHeader(headers.get('cookie'))
  if (record === null) return null
  return gateFor({
    choice: choiceOf(record),
    mustAsk: mustAskFrom(headers),
    hasPrivacySignal: sendsPrivacySignal(headers),
  })
}

function readCookieRecord(): ConsentRecord | null {
  try {
    return recordFromCookieHeader(document.cookie)
  } catch {
    return null
  }
}

/**
 * The stored answer. Where storage throws (private mode, blocked site data)
 * the consent cookie is the record, so an answer given there, a refusal
 * above all, is not lost on the next page.
 */
export function readChoice(): ConsentChoice | null {
  try {
    const stored = window.localStorage.getItem(CONSENT_KEY)
    return stored === 'granted' || stored === 'denied' ? stored : null
  } catch {
    const record = readCookieRecord()
    return record === null ? null : choiceOf(record)
  }
}

/** Mirrors the answer into the cookie the server reads; runs before hydration and with every answer. */
export function syncConsentCookie(choice: ConsentChoice | null): void {
  try {
    document.cookie = consentCookie(recordFor(choice, hasPrivacySignal()), window.location.protocol === 'https:')
  } catch {
    // Cookies blocked: the server sees no record and sends unattributed.
  }
}

/** Stores the answer and its cookie in one step, so the server sees a change on the next request. */
export function writeChoice(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, choice)
  } catch {
    // Storage blocked: the cookie written next is the record.
  }
  syncConsentCookie(choice)
}
