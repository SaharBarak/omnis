import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock predictions repo (the cron is SYSTEM context: authorized by CRON_SECRET
// and operates across owners via the system* repo functions).
vi.mock('@/lib/db/repositories/predictions-repo', () => ({
  systemListPeopleWithBirthDate: vi.fn(),
  systemPredictionExists: vi.fn(),
  systemInsertPrediction: vi.fn(),
  systemDeleteExpiredPredictions: vi.fn(),
}))

// Mock predictions service
vi.mock('@/lib/services/predictions', () => ({
  getDailyPrediction: vi.fn(() => ({
    date: '2024-06-15',
    kin: 42,
    seal: { number: 2, name: 'Wind', color: 'white' },
    tone: { number: 3, name: 'Electric' },
  })),
  getPersonalDailyPrediction: vi.fn(() => ({
    date: '2024-06-15',
    kin: 42,
    events: [
      {
        type: 'wavespell',
        system: 'dreamspell',
        startDate: '2024-06-15',
        endDate: '2024-06-15',
        intensity: 'medium',
        themes: ['creativity'],
        data: {},
      },
    ],
  })),
}))

import { GET } from './route'
import {
  systemListPeopleWithBirthDate,
  systemPredictionExists,
  systemInsertPrediction,
  systemDeleteExpiredPredictions,
} from '@/lib/db/repositories/predictions-repo'

const mockListPeople = vi.mocked(systemListPeopleWithBirthDate)
const mockExists = vi.mocked(systemPredictionExists)
const mockInsert = vi.mocked(systemInsertPrediction)
const mockDeleteExpired = vi.mocked(systemDeleteExpiredPredictions)

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

describe('GET /api/cron/daily-predictions', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      CRON_SECRET: 'test-cron-secret',
      NODE_ENV: 'test',
    }

    // Sensible defaults: one person, no existing predictions.
    mockListPeople.mockResolvedValue([
      { id: 'person-1', owner_id: 'user-1', birth_date: '1990-05-20', name: 'Test' },
    ])
    mockExists.mockResolvedValue(false)
    mockInsert.mockResolvedValue(undefined)
    mockDeleteExpired.mockResolvedValue(0)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Authentication', () => {
    it('should return 401 in production without valid cron secret', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const request = createRequest('/api/cron/daily-predictions')
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 in production with invalid cron secret', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer wrong-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should succeed in production with valid cron secret', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should succeed in development without cron secret', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      const request = createRequest('/api/cron/daily-predictions')
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should succeed in test mode without cron secret', async () => {
      const request = createRequest('/api/cron/daily-predictions')
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Successful Execution', () => {
    it('should return success response with correct structure', async () => {
      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.date).toBeDefined()
      expect(data.kin).toBeDefined()
      expect(data.predictionsGenerated).toBeDefined()
      expect(data.errors).toBeDefined()
      expect(data.peopleProcessed).toBeDefined()
    })

    it('should process all people with birth dates', async () => {
      mockListPeople.mockResolvedValue([
        { id: 'person-1', owner_id: 'user-1', birth_date: '1990-05-20', name: 'Test1' },
        { id: 'person-2', owner_id: 'user-2', birth_date: '1985-03-15', name: 'Test2' },
      ])

      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.peopleProcessed).toBe(2)
    })

    it('should handle empty people list', async () => {
      mockListPeople.mockResolvedValue([])

      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.peopleProcessed).toBe(0)
      expect(mockInsert).not.toHaveBeenCalled()
    })

    it('should skip existing predictions', async () => {
      mockExists.mockResolvedValue(true)

      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockInsert).not.toHaveBeenCalled()
    })

    it('should persist the owner_id from the person row', async () => {
      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret',
      })
      await GET(request)

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ person_id: 'person-1', owner_id: 'user-1' })
      )
    })

    it('should clean up expired predictions', async () => {
      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret',
      })
      await GET(request)

      expect(mockDeleteExpired).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when fetching people fails', async () => {
      mockListPeople.mockRejectedValue(new Error('Database error'))

      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch people')
    })

    it('should continue processing after individual insert errors', async () => {
      mockInsert.mockRejectedValue(new Error('Insert error'))

      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.errors).toBeGreaterThan(0)
    })

    it('should handle cleanup errors gracefully', async () => {
      mockListPeople.mockResolvedValue([])
      mockDeleteExpired.mockRejectedValue(new Error('Delete error'))

      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      // Should still succeed even with cleanup errors
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})
