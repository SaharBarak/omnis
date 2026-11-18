import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CONSENT_COOKIE, CONSENT_KEY, recordFromCookieHeader } from './consent'
import { memoryStorage } from '@/test/storage'

const mocks = vi.hoisted(() => ({ applyConsent: vi.fn() }))

vi.mock('./posthog', () => ({ applyConsent: mocks.applyConsent }))

const cookieRecord = () => recordFromCookieHeader(document.cookie)

/** The store keeps module state, as a page does; each test starts a fresh page. */
async function freshStore() {
  vi.resetModules()
  return import('./consent-store')
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('localStorage', memoryStorage())
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ask: true })))
  document.cookie = `${CONSENT_COOKIE}=; Path=/; Max-Age=0`
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('consent store and the server cookie', () => {
  it('carries an answer to the cookie as it tells PostHog', async () => {
    const { answerConsent } = await freshStore()

    answerConsent('denied')

    expect(cookieRecord()).toBe('denied')
    expect(mocks.applyConsent).toHaveBeenCalledWith('denied')
  })

  it("restores the cookie from another tab's answer", async () => {
    const { useConsentGate } = await freshStore()
    const { result } = renderHook(() => useConsentGate())
    await waitFor(() => expect(result.current).toBe('asking'))

    window.localStorage.setItem(CONSENT_KEY, 'granted')
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: CONSENT_KEY }))
    })

    expect(result.current).toBe('allowed')
    expect(cookieRecord()).toBe('granted')
  })
})
