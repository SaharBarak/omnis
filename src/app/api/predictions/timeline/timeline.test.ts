import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock auth + predictions repo (the route is owner-scoped now: requireUserId()
// establishes the tenant and getPersonForTimeline enforces ownership).
// Fully mock @/lib/auth-server so the real module (which pulls in mongo-client
// at import time and needs MONGODB_URI) is never loaded.
vi.mock('@/lib/auth-server', () => {
  class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized') {
      super(message)
      this.name = 'UnauthorizedError'
    }
  }
  return {
    UnauthorizedError,
    requireUserId: vi.fn(),
    getCurrentUserId: vi.fn(),
    getSession: vi.fn(),
  }
})

vi.mock('@/lib/db/repositories/predictions-repo', () => ({
  getPersonForTimeline: vi.fn(),
}))

import { GET } from './[personId]/route'
import { requireUserId, UnauthorizedError } from '@/lib/auth-server'
import { getPersonForTimeline } from '@/lib/db/repositories/predictions-repo'

const mockRequireUserId = vi.mocked(requireUserId)
const mockGetPersonForTimeline = vi.mocked(getPersonForTimeline)

// Valid Mongo ObjectId (24 hex chars)
const VALID_ID = '507f1f77bcf86cd799439011'
const USER_ID = 'user-1'

const MOCK_PERSON = {
  id: VALID_ID,
  name: 'Test User',
  birth_date: '1990-05-15',
}

const MOCK_PERSON_NO_BIRTH_DATE = {
  id: VALID_ID,
  name: 'No Birthday',
  birth_date: null,
}

function createRequest(personId: string): NextRequest {
  return new NextRequest(
    new URL(`/api/predictions/timeline/${personId}`, 'http://localhost:3000')
  )
}

async function parseResponse(response: Response) {
  return response.json()
}

describe('GET /api/predictions/timeline/[personId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireUserId.mockResolvedValue(USER_ID)
  })

  describe('Authentication', () => {
    it('should return 401 when unauthenticated', async () => {
      mockRequireUserId.mockRejectedValueOnce(new UnauthorizedError())
      const request = createRequest(VALID_ID)
      const params = Promise.resolve({ personId: VALID_ID })
      const response = await GET(request, { params })
      const data = await parseResponse(response)

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('ID Validation', () => {
    it('should return 400 for invalid id format', async () => {
      const request = createRequest('not-an-id')
      const params = Promise.resolve({ personId: 'not-an-id' })
      const response = await GET(request, { params })
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid person ID format')
    })

    it('should accept a valid ObjectId', async () => {
      mockGetPersonForTimeline.mockResolvedValue(MOCK_PERSON)
      const request = createRequest(VALID_ID)
      const params = Promise.resolve({ personId: VALID_ID })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
    })
  })

  describe('Ownership / Existence', () => {
    it('should return 404 when person not found or not owned', async () => {
      mockGetPersonForTimeline.mockResolvedValue(null)
      const request = createRequest(VALID_ID)
      const params = Promise.resolve({ personId: VALID_ID })
      const response = await GET(request, { params })
      const data = await parseResponse(response)

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Person not found')
    })

    it('should scope the lookup to the authenticated user', async () => {
      mockGetPersonForTimeline.mockResolvedValue(MOCK_PERSON)
      const request = createRequest(VALID_ID)
      const params = Promise.resolve({ personId: VALID_ID })
      await GET(request, { params })

      expect(mockGetPersonForTimeline).toHaveBeenCalledWith(USER_ID, VALID_ID)
    })

    it('should return 400 when person has no birth date', async () => {
      mockGetPersonForTimeline.mockResolvedValue(MOCK_PERSON_NO_BIRTH_DATE)
      const request = createRequest(VALID_ID)
      const params = Promise.resolve({ personId: VALID_ID })
      const response = await GET(request, { params })
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('no birth date')
    })
  })

  describe('Success Response', () => {
    beforeEach(() => {
      mockGetPersonForTimeline.mockResolvedValue(MOCK_PERSON)
    })

    it('should return timeline data for valid person', async () => {
      const request = createRequest(VALID_ID)
      const params = Promise.resolve({ personId: VALID_ID })
      const response = await GET(request, { params })
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.computedAt).toBeDefined()
    })

    it('should return timeline with correct person info', async () => {
      const request = createRequest(VALID_ID)
      const params = Promise.resolve({ personId: VALID_ID })
      const response = await GET(request, { params })
      const data = await parseResponse(response)

      expect(data.data.personId).toBe(VALID_ID)
      expect(data.data.personName).toBe('Test User')
      expect(data.data.birthDate).toBe('1990-05-15')
    })

    it('should return timeline with required milestone fields', async () => {
      const request = createRequest(VALID_ID)
      const params = Promise.resolve({ personId: VALID_ID })
      const response = await GET(request, { params })
      const data = await parseResponse(response)

      expect(data.data).toHaveProperty('birthKin')
      expect(data.data).toHaveProperty('currentPersonalYear')
      expect(data.data).toHaveProperty('milestones')
      expect(data.data).toHaveProperty('galacticReturns')
      expect(data.data).toHaveProperty('tunBirthdays')
      expect(data.data).toHaveProperty('katunBirthdays')
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when the repository throws', async () => {
      mockGetPersonForTimeline.mockRejectedValueOnce(new Error('db down'))
      const request = createRequest(VALID_ID)
      const params = Promise.resolve({ personId: VALID_ID })
      const response = await GET(request, { params })
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to generate timeline')
    })
  })
})
