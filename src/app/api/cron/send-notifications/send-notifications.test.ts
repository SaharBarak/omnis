import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

import { GET } from './route'

// Mock the notifications repository (datastore is now MongoDB via the repo).
const mockListSettingsForHour = vi.fn()
const mockLogEmailSend = vi.fn()

vi.mock('@/lib/db/repositories/notifications-repo', () => ({
  listAllEnabledSettingsForHour: (hour: string) => mockListSettingsForHour(hour),
  logEmailSend: (input: unknown) => mockLogEmailSend(input),
}))

// Mock notifications service
const mockProcessDailyDigest = vi.fn()
vi.mock('@/lib/services/notifications', () => ({
  processDailyDigestNotifications: () => mockProcessDailyDigest(),
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

describe('GET /api/cron/send-notifications', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      CRON_SECRET: 'test-cron-secret',
      NODE_ENV: 'test',
    }

    // Default: one user wants the digest this hour.
    mockListSettingsForHour.mockResolvedValue([{ id: 's1', user_id: 'user-1' }])
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
      const request = createRequest('/api/cron/send-notifications')
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 in production with invalid cron secret', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const request = createRequest('/api/cron/send-notifications', {
        authorization: 'Bearer wrong-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should succeed in production with valid cron secret', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-15T07:00:00Z'))

      const request = createRequest('/api/cron/send-notifications', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should fail closed in development without cron secret', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      const request = createRequest('/api/cron/send-notifications')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('Time Window Logic', () => {
    it('should process notifications during morning hours (6 UTC)', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-15T06:30:00Z'))

      const request = createRequest('/api/cron/send-notifications', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.hour).toBe(6)
      expect(mockProcessDailyDigest).toHaveBeenCalled()
    })

    it('should process notifications during morning hours (7 UTC)', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-15T07:00:00Z'))

      const request = createRequest('/api/cron/send-notifications', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.hour).toBe(7)
    })

    it('should process notifications during morning hours (8 UTC)', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-15T08:00:00Z'))

      const request = createRequest('/api/cron/send-notifications', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.hour).toBe(8)
    })

    it('should process notifications during morning hours (9 UTC)', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-15T09:00:00Z'))

      const request = createRequest('/api/cron/send-notifications', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.hour).toBe(9)
    })

    it('should skip processing outside morning hours (5 UTC)', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-15T05:00:00Z'))

      const request = createRequest('/api/cron/send-notifications', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.message).toBe('Outside daily digest window')
      expect(data.hour).toBe(5)
      expect(mockProcessDailyDigest).not.toHaveBeenCalled()
    })

    it('should skip processing outside morning hours (10 UTC)', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-15T10:00:00Z'))

      const request = createRequest('/api/cron/send-notifications', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.message).toBe('Outside daily digest window')
      expect(data.hour).toBe(10)
      expect(mockProcessDailyDigest).not.toHaveBeenCalled()
    })

    it('should skip processing at midnight (0 UTC)', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-15T00:00:00Z'))

      const request = createRequest('/api/cron/send-notifications', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.message).toBe('Outside daily digest window')
      expect(data.hour).toBe(0)
    })
  })

  describe('Successful Execution', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-15T07:00:00Z'))
    })

    it('should return success response with correct structure', async () => {
      const request = createRequest('/api/cron/send-notifications', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.hour).toBeDefined()
      expect(data.sent).toBeDefined()
      expect(data.failed).toBeDefined()
    })

    it('should process daily digest notifications', async () => {
      const request = createRequest('/api/cron/send-notifications', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.sent).toBe(5)
      expect(data.failed).toBe(0)
      expect(mockProcessDailyDigest).toHaveBeenCalled()
    })

    it('should handle no users needing notifications', async () => {
      mockListSettingsForHour.mockResolvedValue([])

      const request = createRequest('/api/cron/send-notifications', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.message).toBe('No notifications to send this hour')
      expect(data.sent).toBe(0)
      expect(mockProcessDailyDigest).not.toHaveBeenCalled()
    })

    it('should log notification batch to email_send_log', async () => {
      const request = createRequest('/api/cron/send-notifications', {
        authorization: 'Bearer test-cron-secret',
      })
      await GET(request)

      expect(mockLogEmailSend).toHaveBeenCalled()
    })

    it('should return sent and failed counts from processor', async () => {
      mockProcessDailyDigest.mockResolvedValue({ sent: 10, failed: 2 })

      const request = createRequest('/api/cron/send-notifications', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(data.sent).toBe(10)
      expect(data.failed).toBe(2)
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-15T07:00:00Z'))
    })

    it('should return 500 when fetching settings fails', async () => {
      mockListSettingsForHour.mockRejectedValue(new Error('Database error'))

      const request = createRequest('/api/cron/send-notifications', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should return 500 for unexpected errors', async () => {
      mockListSettingsForHour.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const request = createRequest('/api/cron/send-notifications', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle notification processing errors gracefully', async () => {
      mockProcessDailyDigest.mockRejectedValue(new Error('Processing error'))

      const request = createRequest('/api/cron/send-notifications', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('Response Structure', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-06-15T07:00:00Z'))
    })

    it('should include hour in response during digest window', async () => {
      const request = createRequest('/api/cron/send-notifications', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(data.hour).toBe(7)
    })

    it('should include success flag', async () => {
      const request = createRequest('/api/cron/send-notifications', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(data.success).toBe(true)
    })

    it('should return zero counts when outside window', async () => {
      vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))

      const request = createRequest('/api/cron/send-notifications', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(data.sent).toBe(0)
      expect(data.failed).toBe(0)
    })
  })
})
