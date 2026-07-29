import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

import { GET } from './route'

// Mock the notifications repository (only the batch log is used by the route).
const mockLogEmailSend = vi.fn()

vi.mock('@/lib/db/repositories/notifications-repo', () => ({
  logEmailSend: (input: unknown) => mockLogEmailSend(input),
}))

// Mock notifications service — the route delegates all recipient selection
// (per-user digest hour × timezone) to the processor.
const mockProcessDailyDigest = vi.fn()
vi.mock('@/lib/services/notifications', () => ({
  processDailyDigestNotifications: (now: Date) => mockProcessDailyDigest(now),
}))

function createRequest(url: string, headers: Record<string, string> = {}): NextRequest {
  const req = new NextRequest(new URL(url, 'http://localhost:3000'))
  Object.entries(headers).forEach(([key, value]) => {
    req.headers.set(key, value)
  })
  return req
}

async function parseResponse(response: Response) {
  return response.json()
}

describe('GET /api/cron/send-notifications', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      CRON_SECRET: 'test-cron-secret',
      NODE_ENV: 'test',
    }
    mockLogEmailSend.mockResolvedValue({ logged: true })
    mockProcessDailyDigest.mockResolvedValue({ sent: 5, failed: 0 })
  })

  afterEach(() => {
    process.env = originalEnv
    vi.useRealTimers()
  })

  describe('Authentication', () => {
    it('should return 401 in production without valid cron secret', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const response = await GET(createRequest('/api/cron/send-notifications'))
      const data = await parseResponse(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 in production with invalid cron secret', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const response = await GET(
        createRequest('/api/cron/send-notifications', {
          authorization: 'Bearer wrong-secret',
        })
      )
      const data = await parseResponse(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should succeed in production with valid cron secret', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const response = await GET(
        createRequest('/api/cron/send-notifications', {
          authorization: 'Bearer test-cron-secret',
        })
      )
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should fail closed in development without cron secret', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      const response = await GET(createRequest('/api/cron/send-notifications'))

      expect(response.status).toBe(401)
    })
  })

  describe('Hourly semantics (#65)', () => {
    // The route runs every hour; per-recipient hour matching (digest time ×
    // timezone) is the processor's job. The old 6-9 UTC window is gone.
    it.each([0, 5, 7, 10, 12, 23])(
      'invokes the processor at %i UTC',
      async (hour) => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date(`2024-06-15T${String(hour).padStart(2, '0')}:00:00Z`))

        const response = await GET(
          createRequest('/api/cron/send-notifications', {
            authorization: 'Bearer test-cron-secret',
          })
        )
        const data = await parseResponse(response)

        expect(response.status).toBe(200)
        expect(data.hour).toBe(hour)
        expect(mockProcessDailyDigest).toHaveBeenCalledTimes(1)
        expect(mockProcessDailyDigest.mock.calls[0][0]).toBeInstanceOf(Date)
      }
    )
  })

  describe('Successful Execution', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-15T07:00:00Z'))
    })

    it('should return success response with correct structure', async () => {
      const response = await GET(
        createRequest('/api/cron/send-notifications', {
          authorization: 'Bearer test-cron-secret',
        })
      )
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.hour).toBe(7)
      expect(data.sent).toBe(5)
      expect(data.failed).toBe(0)
    })

    it('should log the batch when anything was sent', async () => {
      await GET(
        createRequest('/api/cron/send-notifications', {
          authorization: 'Bearer test-cron-secret',
        })
      )

      expect(mockLogEmailSend).toHaveBeenCalledTimes(1)
    })

    it('should skip the batch log on a quiet hour', async () => {
      mockProcessDailyDigest.mockResolvedValue({ sent: 0, failed: 0 })

      const response = await GET(
        createRequest('/api/cron/send-notifications', {
          authorization: 'Bearer test-cron-secret',
        })
      )
      const data = await parseResponse(response)

      expect(data.sent).toBe(0)
      expect(mockLogEmailSend).not.toHaveBeenCalled()
    })

    it('should return sent and failed counts from processor', async () => {
      mockProcessDailyDigest.mockResolvedValue({ sent: 10, failed: 2 })

      const response = await GET(
        createRequest('/api/cron/send-notifications', {
          authorization: 'Bearer test-cron-secret',
        })
      )
      const data = await parseResponse(response)

      expect(data.sent).toBe(10)
      expect(data.failed).toBe(2)
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when the processor rejects', async () => {
      mockProcessDailyDigest.mockRejectedValue(new Error('Processing error'))

      const response = await GET(
        createRequest('/api/cron/send-notifications', {
          authorization: 'Bearer test-cron-secret',
        })
      )
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should return 500 when the batch log write fails', async () => {
      mockLogEmailSend.mockRejectedValue(new Error('Database error'))

      const response = await GET(
        createRequest('/api/cron/send-notifications', {
          authorization: 'Bearer test-cron-secret',
        })
      )
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})
