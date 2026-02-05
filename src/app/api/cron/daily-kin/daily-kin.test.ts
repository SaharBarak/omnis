import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase
const mockSupabaseSelect = vi.fn()
const mockSupabaseInsert = vi.fn()
const mockSupabaseFrom = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockSupabaseFrom
  }))
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

import { GET } from './route'

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
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      RESEND_API_KEY: 'test-resend-key',
      CRON_SECRET: 'test-cron-secret',
      NODE_ENV: 'test'
    }

    // Setup default mock chain
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'newsletter_subscribers') {
        return {
          select: mockSupabaseSelect.mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockResolvedValue({
                data: [
                  { id: 'sub-1', email: 'test@example.com' }
                ],
                error: null
              })
            })
          })
        }
      }
      if (table === 'email_send_log') {
        return {
          insert: mockSupabaseInsert.mockResolvedValue({ error: null })
        }
      }
      return { select: vi.fn() }
    })

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

    it('should succeed in development without cron secret', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      const request = createRequest('/api/cron/daily-kin')
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
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
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'newsletter_subscribers') {
          return {
            select: mockSupabaseSelect.mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({
                  data: [
                    { id: 'sub-1', email: 'test1@example.com' },
                    { id: 'sub-2', email: 'test2@example.com' },
                    { id: 'sub-3', email: 'test3@example.com' }
                  ],
                  error: null
                })
              })
            })
          }
        }
        if (table === 'email_send_log') {
          return {
            insert: mockSupabaseInsert.mockResolvedValue({ error: null })
          }
        }
        return { select: vi.fn() }
      })

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
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'newsletter_subscribers') {
          return {
            select: mockSupabaseSelect.mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          }
        }
        return { select: vi.fn() }
      })

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

      expect(mockSupabaseInsert).toHaveBeenCalled()
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
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when fetching subscribers fails', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'newsletter_subscribers') {
          return {
            select: mockSupabaseSelect.mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' }
                })
              })
            })
          }
        }
        return { select: vi.fn() }
      })

      const request = createRequest('/api/cron/daily-kin', {
        authorization: 'Bearer test-cron-secret'
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch subscribers')
    })

    it('should continue sending after individual email failures', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'newsletter_subscribers') {
          return {
            select: mockSupabaseSelect.mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({
                  data: [
                    { id: 'sub-1', email: 'test1@example.com' },
                    { id: 'sub-2', email: 'test2@example.com' }
                  ],
                  error: null
                })
              })
            })
          }
        }
        if (table === 'email_send_log') {
          return {
            insert: mockSupabaseInsert.mockResolvedValue({ error: null })
          }
        }
        return { select: vi.fn() }
      })

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
      mockSupabaseFrom.mockImplementation(() => {
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
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'newsletter_subscribers') {
          return {
            select: mockSupabaseSelect.mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({
                  data: [
                    { id: 'sub-1', email: 'test1@example.com' },
                    { id: 'sub-2', email: 'test2@example.com' }
                  ],
                  error: null
                })
              })
            })
          }
        }
        if (table === 'email_send_log') {
          return {
            insert: mockSupabaseInsert.mockResolvedValue({ error: null })
          }
        }
        return { select: vi.fn() }
      })

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
