import { describe, it, expect, afterEach, vi } from 'vitest'
import { verifyTurnstileToken, isTurnstileEnabled } from './turnstile'

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

function stubFetch(impl: () => Promise<Response>) {
  const mock = vi.fn((_input: string | URL | Request, _init?: RequestInit) => impl())
  vi.stubGlobal('fetch', mock)
  return mock
}

function siteverifyResponse(payload: unknown, status = 200): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('isTurnstileEnabled', () => {
  it('is false when TURNSTILE_SECRET_KEY is unset', () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    expect(isTurnstileEnabled()).toBe(false)
  })

  it('is true when TURNSTILE_SECRET_KEY is set', () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret-123')
    expect(isTurnstileEnabled()).toBe(true)
  })
})

describe('verifyTurnstileToken', () => {
  describe('skipped mode (no secret configured)', () => {
    it('allows without calling siteverify, even with no token', async () => {
      vi.stubEnv('TURNSTILE_SECRET_KEY', '')
      const fetchMock = stubFetch(() => siteverifyResponse({ success: true }))

      await expect(verifyTurnstileToken(undefined)).resolves.toEqual({
        ok: true,
        skipped: true,
      })
      await expect(verifyTurnstileToken('some-token')).resolves.toEqual({
        ok: true,
        skipped: true,
      })
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  describe('enabled mode (secret configured)', () => {
    it('fails closed when the token is missing, without calling siteverify', async () => {
      vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret-123')
      const fetchMock = stubFetch(() => siteverifyResponse({ success: true }))

      await expect(verifyTurnstileToken(undefined)).resolves.toEqual({
        ok: false,
        skipped: false,
      })
      await expect(verifyTurnstileToken(null)).resolves.toEqual({
        ok: false,
        skipped: false,
      })
      await expect(verifyTurnstileToken('')).resolves.toEqual({
        ok: false,
        skipped: false,
      })
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('allows when Cloudflare confirms the token', async () => {
      vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret-123')
      const fetchMock = stubFetch(() => siteverifyResponse({ success: true }))

      await expect(verifyTurnstileToken('tok-abc', '203.0.113.7')).resolves.toEqual({
        ok: true,
        skipped: false,
      })

      expect(fetchMock).toHaveBeenCalledOnce()
      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe(VERIFY_URL)
      expect(init?.method).toBe('POST')
      const body = init?.body as URLSearchParams
      expect(body.get('secret')).toBe('secret-123')
      expect(body.get('response')).toBe('tok-abc')
      expect(body.get('remoteip')).toBe('203.0.113.7')
    })

    it('omits remoteip when not provided', async () => {
      vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret-123')
      const fetchMock = stubFetch(() => siteverifyResponse({ success: true }))

      await verifyTurnstileToken('tok-abc')

      const [, init] = fetchMock.mock.calls[0]
      expect((init?.body as URLSearchParams).has('remoteip')).toBe(false)
    })

    it('rejects when Cloudflare reports the token invalid', async () => {
      vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret-123')
      stubFetch(() =>
        siteverifyResponse({ success: false, 'error-codes': ['invalid-input-response'] }),
      )

      await expect(verifyTurnstileToken('tok-bad')).resolves.toEqual({
        ok: false,
        skipped: false,
      })
    })

    it('fails closed on a non-2xx siteverify response', async () => {
      vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret-123')
      stubFetch(() => siteverifyResponse({}, 503))

      await expect(verifyTurnstileToken('tok-abc')).resolves.toEqual({
        ok: false,
        skipped: false,
      })
    })

    it('fails closed when siteverify is unreachable', async () => {
      vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret-123')
      stubFetch(() => Promise.reject(new Error('network down')))

      await expect(verifyTurnstileToken('tok-abc')).resolves.toEqual({
        ok: false,
        skipped: false,
      })
    })
  })
})
