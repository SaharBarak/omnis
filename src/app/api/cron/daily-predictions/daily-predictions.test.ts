import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

import { GET } from './route'
import {
  systemListPeopleWithBirthDate,
  systemListPredictionKeysForPeople,
  systemInsertPredictions,
  systemDeleteExpiredPredictions,
  type UpsertPredictionInput,
} from '@/lib/db/repositories/predictions-repo'

// Mock predictions repo (the cron is SYSTEM context: authorized by CRON_SECRET
// and operates across owners via the system* repo functions). Post-refactor the
// route reads the existing (person|type|start) key set ONCE, then bulk-inserts
// the fresh candidates in chunks of 100.
vi.mock('@/lib/db/repositories/predictions-repo', () => ({
  systemListPeopleWithBirthDate: vi.fn(),
  systemListPredictionKeysForPeople: vi.fn(),
  systemInsertPredictions: vi.fn(),
  systemDeleteExpiredPredictions: vi.fn(),
}))

// Mock predictions service
vi.mock('@pleiad/engine/services/predictions', () => ({
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

const mockListPeople = vi.mocked(systemListPeopleWithBirthDate)
const mockListKeys = vi.mocked(systemListPredictionKeysForPeople)
const mockInsertMany = vi.mocked(systemInsertPredictions)
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

    // Sensible defaults: one person, no existing prediction keys.
    mockListPeople.mockResolvedValue([
      { id: 'person-1', owner_id: 'user-1', birth_date: '1990-05-20', name: 'Test' },
    ])
    mockListKeys.mockResolvedValue(new Set())
    mockInsertMany.mockResolvedValue(undefined)
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

    it('should fail closed in development without cron secret', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      const request = createRequest('/api/cron/daily-predictions')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should fail closed in test mode without cron secret', async () => {
      const request = createRequest('/api/cron/daily-predictions')
      const response = await GET(request)

      expect(response.status).toBe(401)
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
      expect(mockInsertMany).not.toHaveBeenCalled()
    })

    it('should skip existing predictions', async () => {
      mockListPeople.mockResolvedValue([
        { id: 'person-1', owner_id: 'user-1', birth_date: '1990-05-20', name: 'Test1' },
        { id: 'person-2', owner_id: 'user-2', birth_date: '1985-03-15', name: 'Test2' },
      ])
      // person-1 already has today's (person|type|start) key cached — the mocked
      // engine emits one 'wavespell' event starting 2024-06-15 per person.
      mockListKeys.mockResolvedValue(new Set(['person-1|wavespell|2024-06-15']))

      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(mockInsertMany).toHaveBeenCalledTimes(1)
      const inserted = mockInsertMany.mock.calls[0][0] as UpsertPredictionInput[]
      expect(inserted).toHaveLength(1)
      expect(inserted[0]).toEqual(
        expect.objectContaining({ person_id: 'person-2', type: 'wavespell', start_date: '2024-06-15' })
      )
      expect(inserted.map((row) => row.person_id)).not.toContain('person-1')
      expect(data.predictionsGenerated).toBe(1)
    })

    it('should not insert at all when every candidate already exists', async () => {
      mockListKeys.mockResolvedValue(new Set(['person-1|wavespell|2024-06-15']))

      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(mockInsertMany).not.toHaveBeenCalled()
      expect(data.predictionsGenerated).toBe(0)
    })

    it('should query existing keys once for the candidate people', async () => {
      mockListPeople.mockResolvedValue([
        { id: 'person-1', owner_id: 'user-1', birth_date: '1990-05-20', name: 'Test1' },
        { id: 'person-2', owner_id: 'user-2', birth_date: '1985-03-15', name: 'Test2' },
      ])

      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret',
      })
      await GET(request)

      expect(mockListKeys).toHaveBeenCalledTimes(1)
      expect(mockListKeys).toHaveBeenCalledWith(['person-1', 'person-2'])
    })

    it('should persist the owner_id from the person row', async () => {
      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret',
      })
      await GET(request)

      expect(mockInsertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ person_id: 'person-1', owner_id: 'user-1' }),
        ])
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
      // 150 people × 1 event = 150 candidates → two chunks (100 + 50). The
      // first chunk fails; the route must keep going and land the second.
      mockListPeople.mockResolvedValue(
        Array.from({ length: 150 }, (_, i) => ({
          id: `person-${i}`,
          owner_id: `user-${i}`,
          birth_date: '1990-05-20',
          name: `Test${i}`,
        }))
      )
      mockInsertMany.mockRejectedValueOnce(new Error('Insert error'))

      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret',
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(mockInsertMany).toHaveBeenCalledTimes(2)
      // Failed chunk of 100 counted as errors; surviving chunk of 50 generated.
      expect(data.errors).toBe(100)
      expect(data.predictionsGenerated).toBe(50)
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
