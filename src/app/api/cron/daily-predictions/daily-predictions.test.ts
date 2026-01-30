import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase
const mockSupabaseSelect = vi.fn()
const mockSupabaseInsert = vi.fn()
const mockSupabaseDelete = vi.fn()
const mockSupabaseFrom = vi.fn()
const mockSupabaseSingle = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockSupabaseFrom
  }))
}))

// Mock predictions service
vi.mock('@/lib/services/predictions', () => ({
  getDailyPrediction: vi.fn(() => ({
    date: '2024-06-15',
    kin: 42,
    seal: { number: 2, name: 'Wind', color: 'white' },
    tone: { number: 3, name: 'Electric' }
  })),
  getPersonalDailyPrediction: vi.fn(() => ({
    date: '2024-06-15',
    kin: 42,
    events: [
      {
        type: 'wavespell_day',
        system: 'dreamspell',
        startDate: '2024-06-15',
        endDate: '2024-06-15',
        intensity: 'medium',
        themes: ['creativity'],
        data: {}
      }
    ]
  }))
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

describe('GET /api/cron/daily-predictions', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
      CRON_SECRET: 'test-cron-secret',
      NODE_ENV: 'test'
    }

    // Setup default mock chain
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'people') {
        return {
          select: mockSupabaseSelect.mockReturnValue({
            not: vi.fn().mockResolvedValue({
              data: [
                { id: 'person-1', owner_id: 'user-1', birth_date: '1990-05-20', first_name: 'Test' }
              ],
              error: null
            })
          })
        }
      }
      if (table === 'predictions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: mockSupabaseSingle.mockResolvedValue({ data: null, error: null })
                })
              })
            })
          }),
          insert: mockSupabaseInsert.mockResolvedValue({ error: null }),
          delete: vi.fn().mockReturnValue({
            lt: mockSupabaseDelete.mockResolvedValue({ error: null })
          })
        }
      }
      return { select: vi.fn() }
    })
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Authentication', () => {
    it('should return 401 in production without valid cron secret', async () => {
      process.env.NODE_ENV = 'production'
      const request = createRequest('/api/cron/daily-predictions')
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 in production with invalid cron secret', async () => {
      process.env.NODE_ENV = 'production'
      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer wrong-secret'
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should succeed in production with valid cron secret', async () => {
      process.env.NODE_ENV = 'production'
      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret'
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should succeed in development without cron secret', async () => {
      process.env.NODE_ENV = 'development'
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
        authorization: 'Bearer test-cron-secret'
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
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'people') {
          return {
            select: mockSupabaseSelect.mockReturnValue({
              not: vi.fn().mockResolvedValue({
                data: [
                  { id: 'person-1', owner_id: 'user-1', birth_date: '1990-05-20', first_name: 'Test1' },
                  { id: 'person-2', owner_id: 'user-2', birth_date: '1985-03-15', first_name: 'Test2' }
                ],
                error: null
              })
            })
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: mockSupabaseSingle.mockResolvedValue({ data: null, error: null })
                  })
                })
              })
            }),
            insert: mockSupabaseInsert.mockResolvedValue({ error: null }),
            delete: vi.fn().mockReturnValue({
              lt: mockSupabaseDelete.mockResolvedValue({ error: null })
            })
          }
        }
        return { select: vi.fn() }
      })

      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret'
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.peopleProcessed).toBe(2)
    })

    it('should skip people without birth dates', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'people') {
          return {
            select: mockSupabaseSelect.mockReturnValue({
              not: vi.fn().mockResolvedValue({
                data: [
                  { id: 'person-1', owner_id: 'user-1', birth_date: null, first_name: 'Test1' }
                ],
                error: null
              })
            })
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: mockSupabaseSingle.mockResolvedValue({ data: null, error: null })
                  })
                })
              })
            }),
            insert: mockSupabaseInsert.mockResolvedValue({ error: null }),
            delete: vi.fn().mockReturnValue({
              lt: mockSupabaseDelete.mockResolvedValue({ error: null })
            })
          }
        }
        return { select: vi.fn() }
      })

      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret'
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.predictionsGenerated).toBe(0)
    })

    it('should handle empty people list', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'people') {
          return {
            select: mockSupabaseSelect.mockReturnValue({
              not: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          }
        }
        if (table === 'predictions') {
          return {
            delete: vi.fn().mockReturnValue({
              lt: mockSupabaseDelete.mockResolvedValue({ error: null })
            })
          }
        }
        return { select: vi.fn() }
      })

      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret'
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.peopleProcessed).toBe(0)
    })

    it('should skip existing predictions', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'people') {
          return {
            select: mockSupabaseSelect.mockReturnValue({
              not: vi.fn().mockResolvedValue({
                data: [
                  { id: 'person-1', owner_id: 'user-1', birth_date: '1990-05-20', first_name: 'Test' }
                ],
                error: null
              })
            })
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: mockSupabaseSingle.mockResolvedValue({
                      data: { id: 'existing-prediction' },
                      error: null
                    })
                  })
                })
              })
            }),
            insert: mockSupabaseInsert,
            delete: vi.fn().mockReturnValue({
              lt: mockSupabaseDelete.mockResolvedValue({ error: null })
            })
          }
        }
        return { select: vi.fn() }
      })

      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret'
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(mockSupabaseInsert).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when Supabase config is missing', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = ''
      process.env.SUPABASE_SERVICE_ROLE_KEY = ''

      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret'
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should return 500 when fetching people fails', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'people') {
          return {
            select: mockSupabaseSelect.mockReturnValue({
              not: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' }
              })
            })
          }
        }
        return { select: vi.fn() }
      })

      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret'
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch people')
    })

    it('should continue processing after individual insert errors', async () => {
      let insertCallCount = 0
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'people') {
          return {
            select: mockSupabaseSelect.mockReturnValue({
              not: vi.fn().mockResolvedValue({
                data: [
                  { id: 'person-1', owner_id: 'user-1', birth_date: '1990-05-20', first_name: 'Test' }
                ],
                error: null
              })
            })
          }
        }
        if (table === 'predictions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: mockSupabaseSingle.mockResolvedValue({ data: null, error: null })
                  })
                })
              })
            }),
            insert: vi.fn().mockImplementation(() => {
              insertCallCount++
              return Promise.resolve({ error: { message: 'Insert error' } })
            }),
            delete: vi.fn().mockReturnValue({
              lt: mockSupabaseDelete.mockResolvedValue({ error: null })
            })
          }
        }
        return { select: vi.fn() }
      })

      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret'
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.errors).toBeGreaterThan(0)
    })

    it('should handle cleanup errors gracefully', async () => {
      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'people') {
          return {
            select: mockSupabaseSelect.mockReturnValue({
              not: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          }
        }
        if (table === 'predictions') {
          return {
            delete: vi.fn().mockReturnValue({
              lt: mockSupabaseDelete.mockResolvedValue({ error: { message: 'Delete error' } })
            })
          }
        }
        return { select: vi.fn() }
      })

      const request = createRequest('/api/cron/daily-predictions', {
        authorization: 'Bearer test-cron-secret'
      })
      const response = await GET(request)
      const data = await parseResponse(response)

      // Should still succeed even with cleanup errors
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})
