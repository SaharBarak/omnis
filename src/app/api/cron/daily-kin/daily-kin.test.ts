import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

import { GET } from './route'

// Mock the newsletter repository (datastore is now MongoDB via the repo).
const mockListSubscribers = vi.fn()
const mockLogEmailSend = vi.fn()
const mockWasEmailSentToday = vi.fn()

vi.mock('@/lib/db/repositories/newsletter-repo', () => ({
  listSubscribersForCron: () => mockListSubscribers(),
  logEmailSend: (input: unknown) => mockLogEmailSend(input),
  wasEmailSentToday: (id: string, type: string) => mockWasEmailSentToday(id, type),
}))

// Mock Resend
const mockResendSend = vi.fn()
vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = {
      send: mockResendSend
    }
  }
}))

// Mock calculations
vi.mock('@/lib/calculations', () => ({
  dateToKin: vi.fn(() => 42),
  kinToSeal: vi.fn(() => 2),
  kinToTone: vi.fn(() => 3),
  calculateOracle: vi.fn(() => ({
    guide: 10,
    analog: 19,
    antipode: 12,
    occult: 19
  }))
}))

// Mock data lookups
vi.mock('@/lib/data/seals', () => ({
  getSeal: vi.fn((num: number) => ({
    number: num,
    english: 'Wind',
    hebrew: 'רוח',
    color: 'white',
    mayan: 'Ik'
  }))
}))

vi.mock('@/lib/data/tones', () => ({
  getTone: vi.fn((num: number) => ({
    number: num,
    name: 'Electric',
    nameHebrew: 'חשמלי'
  }))
}))

vi.mock('@/lib/data/mantras', () => ({
  generateMantra: vi.fn(() => 'I activate in order to communicate\nBonding breath')
}))

// Helper to create mock NextRequest with headers
function createRequest(url: string, headers: Record<string, string> = {}): NextRequest {
  const req = new NextRequest(new URL(url, 'http://localhost:3000'))
  Object.entries(headers).forEach(([key, value]) => {
    req.headers.set(key, value)
  })
  return req
}

// Helper to parse response JSON
async function parseResponse(response: Response) {
  return response.json()
}

describe('GET /api/cron/daily-kin', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: 'test-resend-key',
      CRON_SECRET: 'test-cron-secret',
      UNSUBSCRIBE_SECRET: 'test-unsubscribe-secret',
      NODE_ENV: 'test'
    }

    // Default: one subscriber, none sent today, log/send succeed.
    mockListSubscribers.mockResolvedValue([
      { id: 'sub-1', email: 'test@example.com' }
    ])
    mockWasEmailSentToday.mockResolvedValue(false)
    mockLogEmailSend.mockResolvedValue(undefined)

    mockResendSend.mockResolvedValue({ data: { id: 'msg-1' }, error: null })
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Authentication', () => {
    it('should return 401 in production without valid cron secret', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const request = createRequest('/api/cron/daily-kin')
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 in production with invalid cron secret', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const request = createRequest('/api/cron/daily-kin', {
        authorization: 'Bearer wrong-secret'
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should succeed in production with valid cron secret', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const request = createRequest('/api/cron/daily-kin', {
        authorization: 'Bearer test-cron-secret'
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should fail closed in development without cron secret', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      const request = createRequest('/api/cron/daily-kin')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('Configuration Validation', () => {
    it('should return 500 when RESEND_API_KEY is not configured', async () => {
      process.env.RESEND_API_KEY = ''

      const request = createRequest('/api/cron/daily-kin', {
        authorization: 'Bearer test-cron-secret'
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('RESEND_API_KEY not configured')
    })
  })

  describe('Successful Execution', () => {
    it('should return success response with correct structure', async () => {
      const request = createRequest('/api/cron/daily-kin', {
        authorization: 'Bearer test-cron-secret'
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.date).toBeDefined()
      expect(data.kin).toBe(42)
      expect(data.seal).toBe('Wind')
      expect(data.sent).toBeDefined()
      expect(data.failed).toBeDefined()
      expect(data.total).toBeDefined()
    })

    it('should send emails to all confirmed subscribers', async () => {
      mockListSubscribers.mockResolvedValue([
        { id: 'sub-1', email: 'test1@example.com' },
        { id: 'sub-2', email: 'test2@example.com' },
        { id: 'sub-3', email: 'test3@example.com' }
      ])

      const request = createRequest('/api/cron/daily-kin', {
        authorization: 'Bearer test-cron-secret'
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.sent).toBe(3)
      expect(data.total).toBe(3)
      expect(mockResendSend).toHaveBeenCalledTimes(3)
    })

    it('should handle no subscribers', async () => {
      mockListSubscribers.mockResolvedValue([])

      const request = createRequest('/api/cron/daily-kin', {
        authorization: 'Bearer test-cron-secret'
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.message).toBe('No subscribers')
      expect(data.sent).toBe(0)
    })

    it('should log successful sends to email_send_log', async () => {
      const request = createRequest('/api/cron/daily-kin', {
        authorization: 'Bearer test-cron-secret'
      })
      await GET(request)

      expect(mockLogEmailSend).toHaveBeenCalled()
    })

    it('should include oracle data in email', async () => {
      const request = createRequest('/api/cron/daily-kin', {
        authorization: 'Bearer test-cron-secret'
      })
      await GET(request)

      // Verify email was sent with oracle data
      expect(mockResendSend).toHaveBeenCalled()
      const emailCall = mockResendSend.mock.calls[0][0]
      expect(emailCall.subject).toContain('Wind')
      expect(emailCall.subject).toContain('Kin 42')
    })

    it('should include correct unsubscribe link with subscriber email', async () => {
      const testEmail = 'test@example.com'
      const request = createRequest('/api/cron/daily-kin', {
        authorization: 'Bearer test-cron-secret'
      })
      await GET(request)

      // Verify email contains personalized unsubscribe link
      expect(mockResendSend).toHaveBeenCalled()
      const emailCall = mockResendSend.mock.calls[0][0]
      expect(emailCall.html).toContain(`email=${encodeURIComponent(testEmail)}`)
      expect(emailCall.html).not.toContain('email=RECIPIENT')
      // Link must carry the HMAC signature (forgery protection).
      expect(emailCall.html).toMatch(/&sig=[0-9a-f]{64}/)
    })

    it('should fall back to the manual unsubscribe page when UNSUBSCRIBE_SECRET is unset', async () => {
      delete process.env.UNSUBSCRIBE_SECRET
      const request = createRequest('/api/cron/daily-kin', {
        authorization: 'Bearer test-cron-secret'
      })
      await GET(request)

      const emailCall = mockResendSend.mock.calls[0][0]
      // Never emit a forgeable bare-email link.
      expect(emailCall.html).not.toContain('/api/newsletter/unsubscribe?email=')
      expect(emailCall.html).toContain('https://omnis.app/unsubscribe')
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when fetching subscribers fails', async () => {
      mockListSubscribers.mockRejectedValue(new Error('Database error'))

      const request = createRequest('/api/cron/daily-kin', {
        authorization: 'Bearer test-cron-secret'
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch subscribers')
    })

    it('should continue sending after individual email failures', async () => {
      mockListSubscribers.mockResolvedValue([
        { id: 'sub-1', email: 'test1@example.com' },
        { id: 'sub-2', email: 'test2@example.com' }
      ])

      // First email fails, second succeeds
      mockResendSend
        .mockResolvedValueOnce({ data: null, error: { message: 'Send failed' } })
        .mockResolvedValueOnce({ data: { id: 'msg-1' }, error: null })

      const request = createRequest('/api/cron/daily-kin', {
        authorization: 'Bearer test-cron-secret'
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.sent).toBe(1)
      expect(data.failed).toBe(1)
      expect(data.total).toBe(2)
    })

    it('should handle send exceptions gracefully', async () => {
      mockResendSend.mockRejectedValue(new Error('Network error'))

      const request = createRequest('/api/cron/daily-kin', {
        authorization: 'Bearer test-cron-secret'
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.failed).toBe(1)
    })

    it('should return 500 for unexpected errors', async () => {
      // An error thrown during kin calculation (before the subscriber fetch)
      // falls through to the outer catch -> generic "Internal server error".
      const { dateToKin } = await import('@/lib/calculations')
      vi.mocked(dateToKin).mockImplementationOnce(() => {
        throw new Error('Unexpected error')
      })

      const request = createRequest('/api/cron/daily-kin', {
        authorization: 'Bearer test-cron-secret'
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('Rate Limiting', () => {
    it('should respect rate limiting between emails', async () => {
      mockListSubscribers.mockResolvedValue([
        { id: 'sub-1', email: 'test1@example.com' },
        { id: 'sub-2', email: 'test2@example.com' }
      ])

      const startTime = Date.now()
      const request = createRequest('/api/cron/daily-kin', {
        authorization: 'Bearer test-cron-secret'
      })
      await GET(request)
      const duration = Date.now() - startTime

      // Should have at least 100ms delay between 2 emails
      expect(duration).toBeGreaterThanOrEqual(100)
    })
  })
})
