import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

import { POST as subscribePOST } from './subscribe/route'
import { GET as confirmGET } from './confirm/route'
import { POST as unsubscribePOST } from './unsubscribe/route'
import { signConfirmToken, signUnsubscribeToken } from '@/lib/api/email-token'

/**
 * Regression suite for the newsletter's two consent guarantees:
 *
 * 1. A signup grants no consent. The endpoint is public, so anyone can POST
 *    anyone's address; only a signed confirmation click may put an address into
 *    the blast. Without this, one request subscribes a third party to
 *    recurring mail from a verified domain.
 * 2. One-click unsubscribe actually works. Providers POST form-encoded to the
 *    signed URL; if that path errors, the user's only working button is
 *    "Report spam", which bulk-folders the whole sending domain.
 */

const mockFindByEmail = vi.fn()
const mockUpsertPending = vi.fn()
const mockConfirmSubscriber = vi.fn()
const mockUnsubscribe = vi.fn()

vi.mock('@/lib/db/repositories/newsletter-repo', () => ({
  findByEmail: (email: string) => mockFindByEmail(email),
  upsertPendingSubscriber: (email: string) => mockUpsertPending(email),
  confirmSubscriber: (email: string) => mockConfirmSubscriber(email),
  unsubscribe: (email: string) => mockUnsubscribe(email),
}))

const mockResendSend = vi.fn()
const mockContactsCreate = vi.fn()
const mockContactsUpdate = vi.fn()
vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: mockResendSend }
    contacts = { create: mockContactsCreate, update: mockContactsUpdate }
  },
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimiters: {
    newsletter: { check: vi.fn(async () => ({ success: true, limit: 5, remaining: 4, reset: 0 })) },
  },
  rateLimitResponse: vi.fn(),
  addRateLimitHeaders: (res: unknown) => res,
}))

// Turnstile disabled (no secret) → verifier no-ops, as in local/dev.
vi.mock('@/lib/security/turnstile', () => ({
  verifyTurnstileToken: vi.fn(async () => ({ ok: true, skipped: true })),
}))

const BASE = 'https://pleiad.io'
const EMAIL = 'user@example.com'
const OPS_EMAIL = 'ops@example.com'

function jsonRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(new URL(url, BASE).toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function parse(response: Response) {
  return JSON.parse(await response.text())
}

describe('newsletter consent flow', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: 'test-resend-key',
      UNSUBSCRIBE_SECRET: 'test-unsubscribe-secret',
      RESEND_AUDIENCE_ID: 'test-audience',
      EMAIL_POSTAL_ADDRESS: 'Pleiad, 1 Test St, Testville',
      APP_BASE_URL: BASE,
      BRIEFING_EMAIL: OPS_EMAIL,
      NODE_ENV: 'test',
    }
    mockFindByEmail.mockResolvedValue(null)
    mockUpsertPending.mockResolvedValue({ id: 'sub-1', email: EMAIL, confirmed: false })
    mockConfirmSubscriber.mockResolvedValue({
      subscriber: { id: 'sub-1', email: EMAIL, confirmed: true },
      activated: true,
    })
    mockUnsubscribe.mockResolvedValue(true)
    mockResendSend.mockResolvedValue({ data: { id: 'email-1' }, error: null })
    mockContactsCreate.mockResolvedValue({ data: null, error: null })
    mockContactsUpdate.mockResolvedValue({ data: null, error: null })
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('subscribe — grants no consent', () => {
    it('records a pending subscriber and never confirms one', async () => {
      const res = await subscribePOST(jsonRequest('/api/newsletter/subscribe', { email: EMAIL }))

      expect(res.status).toBe(200)
      expect(mockUpsertPending).toHaveBeenCalledWith(EMAIL)
      // The whole point: subscribing must not confirm.
      expect(mockConfirmSubscriber).not.toHaveBeenCalled()
    })

    it('does not add to the Resend audience before consent', async () => {
      await subscribePOST(jsonRequest('/api/newsletter/subscribe', { email: EMAIL }))
      expect(mockContactsCreate).not.toHaveBeenCalled()
    })

    it('sends a confirmation mail carrying a signed, expiring link', async () => {
      await subscribePOST(jsonRequest('/api/newsletter/subscribe', { email: EMAIL }))

      expect(mockResendSend).toHaveBeenCalledTimes(1)
      const mail = mockResendSend.mock.calls[0][0]
      expect(mail.to).toBe(EMAIL)
      expect(mail.html).toMatch(/\/api\/newsletter\/confirm\?/)
      expect(mail.html).toMatch(/sig=[0-9a-f]{64}/)
      expect(mail.html).toMatch(/exp=\d+/)
      // Confirmation mail is transactional: it must not advertise
      // List-Unsubscribe for a list the recipient hasn't joined.
      expect(mail.headers).toBeUndefined()
    })

    it('returns one constant message regardless of membership (no oracle)', async () => {
      const fresh = await parse(
        await subscribePOST(jsonRequest('/api/newsletter/subscribe', { email: EMAIL })),
      )

      mockFindByEmail.mockResolvedValue({
        id: 'sub-1',
        email: EMAIL,
        confirmed: true,
        unsubscribed_at: null,
      })
      const active = await parse(
        await subscribePOST(jsonRequest('/api/newsletter/subscribe', { email: EMAIL })),
      )

      mockFindByEmail.mockResolvedValue({
        id: 'sub-1',
        email: EMAIL,
        confirmed: true,
        unsubscribed_at: '2026-01-01T00:00:00.000Z',
      })
      const returning = await parse(
        await subscribePOST(jsonRequest('/api/newsletter/subscribe', { email: EMAIL })),
      )

      expect(active.message).toBe(fresh.message)
      expect(returning.message).toBe(fresh.message)
    })

    it('sends no second confirmation mail to an already-active subscriber', async () => {
      mockFindByEmail.mockResolvedValue({
        id: 'sub-1',
        email: EMAIL,
        confirmed: true,
        unsubscribed_at: null,
      })
      await subscribePOST(jsonRequest('/api/newsletter/subscribe', { email: EMAIL }))
      expect(mockResendSend).not.toHaveBeenCalled()
      expect(mockUpsertPending).not.toHaveBeenCalled()
    })

    it('refuses the signup when no secret exists to sign the link with', async () => {
      delete process.env.UNSUBSCRIBE_SECRET
      const res = await subscribePOST(jsonRequest('/api/newsletter/subscribe', { email: EMAIL }))

      expect(res.status).toBe(500)
      expect(mockUpsertPending).not.toHaveBeenCalled()
      expect(mockResendSend).not.toHaveBeenCalled()
    })
  })

  describe('confirm — the only path that grants consent', () => {
    async function confirmUrl(email = EMAIL, now = Date.now()) {
      const token = await signConfirmToken(email, now)
      const params = new URLSearchParams({
        email,
        exp: String(token!.expiresAt),
        sig: token!.sig,
      })
      return `/api/newsletter/confirm?${params.toString()}`
    }

    it('confirms, mirrors to the audience, and sends the welcome mail', async () => {
      const res = await confirmGET(new NextRequest(new URL(await confirmUrl(), BASE).toString()))

      expect(mockConfirmSubscriber).toHaveBeenCalledWith(EMAIL)
      expect(mockContactsCreate).toHaveBeenCalled()
      expect(res.headers.get('location')).toContain('/newsletter/confirmed?success=true')
      // Welcome mail to the subscriber + signup ping to the ops inbox.
      const recipients = mockResendSend.mock.calls.map((c) => c[0].to)
      expect(recipients).toContain(EMAIL)
      expect(recipients).toContain(OPS_EMAIL)
    })

    it('the welcome mail advertises a working one-click unsubscribe', async () => {
      await confirmGET(new NextRequest(new URL(await confirmUrl(), BASE).toString()))

      const mail = mockResendSend.mock.calls.find((c) => c[0].to === EMAIL)![0]
      expect(mail.headers['List-Unsubscribe']).toMatch(/\/api\/newsletter\/unsubscribe\?email=/)
      expect(mail.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
    })

    it('pings ops with the new subscriber', async () => {
      await confirmGET(new NextRequest(new URL(await confirmUrl(), BASE).toString()))

      const ping = mockResendSend.mock.calls.find((c) => c[0].to === OPS_EMAIL)![0]
      expect(ping.subject).toContain(EMAIL)
      // A ping is not bulk mail — it must not carry List-Unsubscribe.
      expect(ping.headers).toBeUndefined()
    })

    it('a re-clicked link neither re-welcomes nor re-pings', async () => {
      mockConfirmSubscriber.mockResolvedValue({
        subscriber: { id: 'sub-1', email: EMAIL, confirmed: true },
        activated: false,
      })
      const res = await confirmGET(new NextRequest(new URL(await confirmUrl(), BASE).toString()))

      expect(mockResendSend).not.toHaveBeenCalled()
      expect(mockContactsCreate).not.toHaveBeenCalled()
      // Still idempotently successful for the human who clicked.
      expect(res.headers.get('location')).toContain('success=true')
    })

    it('rejects a forged signature', async () => {
      const params = new URLSearchParams({
        email: EMAIL,
        exp: String(Date.now() + 1000),
        sig: 'f'.repeat(64),
      })
      const res = await confirmGET(
        new NextRequest(new URL(`/api/newsletter/confirm?${params}`, BASE).toString()),
      )

      expect(mockConfirmSubscriber).not.toHaveBeenCalled()
      expect(res.headers.get('location')).toContain('error=invalid_link')
    })

    it('rejects an expired link — an old mail cannot resurrect an opted-out address', async () => {
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000
      const res = await confirmGET(
        new NextRequest(new URL(await confirmUrl(EMAIL, eightDaysAgo), BASE).toString()),
      )

      expect(mockConfirmSubscriber).not.toHaveBeenCalled()
      expect(res.headers.get('location')).toContain('error=invalid_link')
    })

    it('rejects an unsubscribe signature replayed as a confirmation', async () => {
      const sig = await signUnsubscribeToken(EMAIL)
      const params = new URLSearchParams({
        email: EMAIL,
        exp: String(Date.now() + 1000),
        sig: sig!,
      })
      const res = await confirmGET(
        new NextRequest(new URL(`/api/newsletter/confirm?${params}`, BASE).toString()),
      )

      expect(mockConfirmSubscriber).not.toHaveBeenCalled()
      expect(res.headers.get('location')).toContain('error=invalid_link')
    })
  })

  describe('unsubscribe — RFC 8058 one-click', () => {
    async function oneClickRequest(email = EMAIL, sig?: string) {
      const signature = sig ?? (await signUnsubscribeToken(email))!
      const url = new URL('/api/newsletter/unsubscribe', BASE)
      url.searchParams.set('email', email)
      url.searchParams.set('sig', signature)
      // Exactly what Gmail/Yahoo send: form-encoded, not JSON.
      return new NextRequest(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'List-Unsubscribe=One-Click',
      })
    }

    it('honours a provider one-click POST with a form-encoded body', async () => {
      const res = await unsubscribePOST(await oneClickRequest())

      expect(res.status).toBe(200)
      expect(mockUnsubscribe).toHaveBeenCalledWith(EMAIL)
      expect(mockContactsUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ email: EMAIL, unsubscribed: true }),
      )
    })

    it('rejects a forged one-click signature', async () => {
      const res = await unsubscribePOST(await oneClickRequest(EMAIL, 'f'.repeat(64)))

      expect(res.status).toBe(403)
      expect(mockUnsubscribe).not.toHaveBeenCalled()
    })

    it('rejects one user unsubscribing another with their own signature', async () => {
      const sig = await signUnsubscribeToken('attacker@example.com')
      const res = await unsubscribePOST(await oneClickRequest('victim@example.com', sig!))

      expect(res.status).toBe(403)
      expect(mockUnsubscribe).not.toHaveBeenCalled()
    })

    it('still serves the manual JSON form', async () => {
      const res = await unsubscribePOST(
        jsonRequest('/api/newsletter/unsubscribe', { email: EMAIL }),
      )

      expect(res.status).toBe(200)
      expect(mockUnsubscribe).toHaveBeenCalledWith(EMAIL)
    })
  })
})
