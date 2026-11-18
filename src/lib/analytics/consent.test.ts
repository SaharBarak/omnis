import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CONSENT_COOKIE,
  CONSENT_COOKIE_MAX_AGE_S,
  CONSENT_KEY,
  consentCookie,
  gateFor,
  gateForRequest,
  isSettled,
  mustAskFrom,
  needsAsking,
  readChoice,
  recordFor,
  recordFromCookieHeader,
  sendsPrivacySignal,
  syncConsentCookie,
  writeChoice,
  type ConsentRecord,
} from './consent'
import { blockedStorage, memoryStorage } from '@/test/storage'

const RECORDS: readonly ConsentRecord[] = ['granted', 'denied', 'unanswered']

describe('needsAsking', () => {
  it('asks in the EEA, the UK and Switzerland', () => {
    for (const country of ['DE', 'fr', ' IE ', 'NO', 'GB', 'CH']) {
      expect(needsAsking(country)).toBe(true)
    }
  })

  it('does not ask elsewhere', () => {
    for (const country of ['US', 'IL', 'JP', 'BR']) {
      expect(needsAsking(country)).toBe(false)
    }
  })

  it('asks when the country is unknown', () => {
    for (const country of [null, undefined, '', 'XX', 'T1', 'Germany']) {
      expect(needsAsking(country)).toBe(true)
    }
  })
})

describe('gateFor', () => {
  const undecided = { choice: null, mustAsk: null, hasPrivacySignal: false } as const

  it('loads nothing while the region is unknown', () => {
    expect(gateFor(undecided)).toBe('deciding')
  })

  it('asks where asking is required', () => {
    expect(gateFor({ ...undecided, mustAsk: true })).toBe('asking')
  })

  it('allows where silence counts as permission', () => {
    expect(gateFor({ ...undecided, mustAsk: false })).toBe('allowed')
  })

  it('treats a browser privacy signal as a refusal everywhere', () => {
    expect(gateFor({ ...undecided, mustAsk: false, hasPrivacySignal: true })).toBe('refused')
    expect(gateFor({ ...undecided, hasPrivacySignal: true })).toBe('refused')
  })

  it('lets an explicit answer outrank region and signal', () => {
    expect(gateFor({ choice: 'granted', mustAsk: true, hasPrivacySignal: true })).toBe('allowed')
    expect(gateFor({ choice: 'denied', mustAsk: false, hasPrivacySignal: false })).toBe('refused')
  })
})

describe('isSettled', () => {
  it('is true only once there is an answer', () => {
    expect(isSettled('allowed')).toBe(true)
    expect(isSettled('refused')).toBe(true)
    expect(isSettled('asking')).toBe(false)
    expect(isSettled('deciding')).toBe(false)
  })
})

describe('mustAskFrom', () => {
  it('reads the edge country header', () => {
    expect(mustAskFrom(new Headers({ 'cf-ipcountry': 'DE' }))).toBe(true)
    expect(mustAskFrom(new Headers({ 'cf-ipcountry': 'US' }))).toBe(false)
    expect(mustAskFrom(new Headers())).toBe(true)
  })
})

describe('sendsPrivacySignal', () => {
  it('is on for Sec-GPC or DNT set to 1', () => {
    expect(sendsPrivacySignal(new Headers({ 'sec-gpc': '1' }))).toBe(true)
    expect(sendsPrivacySignal(new Headers({ dnt: ' 1 ' }))).toBe(true)
  })

  it('is off otherwise', () => {
    expect(sendsPrivacySignal(new Headers())).toBe(false)
    expect(sendsPrivacySignal(new Headers({ 'sec-gpc': '0', dnt: 'unspecified' }))).toBe(false)
  })
})

describe('recordFor', () => {
  it('keeps an answer whatever the signal', () => {
    expect(recordFor('granted', true)).toBe('granted')
    expect(recordFor('denied', false)).toBe('denied')
  })

  it('records a signal without an answer as a refusal, and silence as unanswered', () => {
    expect(recordFor(null, true)).toBe('denied')
    expect(recordFor(null, false)).toBe('unanswered')
  })
})

describe('consentCookie', () => {
  it('is first-party, sent on top-level returns, and as long-lived as a browser allows', () => {
    expect(consentCookie('granted', true)).toBe(
      `${CONSENT_COOKIE}=granted; Path=/; Max-Age=${CONSENT_COOKIE_MAX_AGE_S}; SameSite=Lax; Secure`
    )
  })

  it('drops Secure on a plain-http page so local builds keep it', () => {
    expect(consentCookie('denied', false)).not.toContain('Secure')
  })

  it('reads back as the record it stores', () => {
    for (const record of RECORDS) {
      const [pair] = consentCookie(record, true).split(';')
      expect(recordFromCookieHeader(pair)).toBe(record)
    }
  })
})

describe('recordFromCookieHeader', () => {
  it('finds the record among other cookies', () => {
    expect(recordFromCookieHeader(`sb-auth=abc; ${CONSENT_COOKIE}=denied; theme=dark`)).toBe('denied')
  })

  it('is no record when absent, empty or unknown', () => {
    for (const header of [null, undefined, '', 'sb-auth=abc', `${CONSENT_COOKIE}=`, `${CONSENT_COOKIE}=yes`, `${CONSENT_COOKIE}="granted"`]) {
      expect(recordFromCookieHeader(header)).toBeNull()
    }
  })

  it('does not match a cookie whose name only contains ours', () => {
    expect(recordFromCookieHeader(`x${CONSENT_COOKIE}=granted; ${CONSENT_COOKIE}-old=granted`)).toBeNull()
  })

  it('is no record when the header carries it more than once', () => {
    expect(recordFromCookieHeader(`${CONSENT_COOKIE}=granted; ${CONSENT_COOKIE}=denied`)).toBeNull()
    expect(recordFromCookieHeader(`${CONSENT_COOKIE}=granted; ${CONSENT_COOKIE}=granted`)).toBeNull()
  })
})

describe('gateForRequest', () => {
  const request = (record: ConsentRecord | null, extra: Record<string, string> = {}) =>
    new Headers({ ...(record ? { cookie: `${CONSENT_COOKIE}=${record}` } : {}), ...extra })

  it('follows an explicit answer over region and signal, as the browser does', () => {
    expect(gateForRequest(request('granted', { 'cf-ipcountry': 'DE', 'sec-gpc': '1' }))).toBe('allowed')
    expect(gateForRequest(request('denied', { 'cf-ipcountry': 'US' }))).toBe('refused')
  })

  it('lets the region decide an unanswered visitor', () => {
    expect(gateForRequest(request('unanswered', { 'cf-ipcountry': 'US' }))).toBe('allowed')
    expect(gateForRequest(request('unanswered', { 'cf-ipcountry': 'FR' }))).toBe('asking')
    expect(gateForRequest(request('unanswered'))).toBe('asking')
  })

  it("lets the request's own privacy signal refuse an unanswered visitor", () => {
    expect(gateForRequest(request('unanswered', { 'cf-ipcountry': 'US', 'sec-gpc': '1' }))).toBe('refused')
    expect(gateForRequest(request('unanswered', { 'cf-ipcountry': 'US', dnt: '1' }))).toBe('refused')
  })

  it('gives no gate, and so no region default, to a request without the cookie', () => {
    expect(gateForRequest(request(null, { 'cf-ipcountry': 'US' }))).toBeNull()
  })
})

describe('the consent cookie in the browser', () => {
  const cookieRecord = () => recordFromCookieHeader(document.cookie)

  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    document.cookie = `${CONSENT_COOKIE}=; Path=/; Max-Age=0`
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(navigator, 'globalPrivacyControl')
  })

  it('mirrors silence as unanswered, so the server can apply the region', () => {
    syncConsentCookie(readChoice())
    expect(cookieRecord()).toBe('unanswered')
  })

  it('mirrors a privacy signal the browser shows as a refusal', () => {
    Object.defineProperty(navigator, 'globalPrivacyControl', { value: true, configurable: true })
    syncConsentCookie(readChoice())
    expect(cookieRecord()).toBe('denied')
  })

  it('stores an answer and its cookie in one step, and follows a withdrawal', () => {
    writeChoice('granted')
    expect(window.localStorage.getItem(CONSENT_KEY)).toBe('granted')
    expect(cookieRecord()).toBe('granted')

    writeChoice('denied')
    expect(cookieRecord()).toBe('denied')
  })

  it('takes the stored answer over a stale cookie', () => {
    document.cookie = `${CONSENT_COOKIE}=granted; Path=/`
    syncConsentCookie(readChoice())
    expect(cookieRecord()).toBe('unanswered')
  })

  it('keeps a refusal in the cookie where storage is blocked', () => {
    vi.stubGlobal('localStorage', blockedStorage())

    writeChoice('denied')
    expect(readChoice()).toBe('denied')

    syncConsentCookie(readChoice())
    expect(cookieRecord()).toBe('denied')
  })
})
