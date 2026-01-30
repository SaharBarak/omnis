import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './[personId]/route'

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  })),
}))

// Import after mocking
import { createClient } from '@supabase/supabase-js'

// Helper to create mock NextRequest
function createRequest(personId: string): NextRequest {
  return new NextRequest(
    new URL(`/api/predictions/timeline/${personId}`, 'http://localhost:3000')
  )
}

// Helper to parse response JSON
async function parseResponse(response: Response) {
  return response.json()
}

// Mock person data
const MOCK_PERSON = {
  id: '12345678-1234-1234-1234-123456789012',
  first_name: 'Test',
  last_name: 'User',
  birth_date: '1990-05-15',
}

const MOCK_PERSON_NO_BIRTH_DATE = {
  id: '12345678-1234-1234-1234-123456789013',
  first_name: 'No',
  last_name: 'Birthday',
  birth_date: null,
}

describe('GET /api/predictions/timeline/[personId]', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Set env vars
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('UUID Validation', () => {
    it('should return 400 for invalid UUID format', async () => {
      const request = createRequest('not-a-uuid')
      const params = Promise.resolve({ personId: 'not-a-uuid' })
      const response = await GET(request, { params })
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid person ID format')
    })

    it('should return 400 for UUID that is too short', async () => {
      const request = createRequest('12345678-1234-1234-1234')
      const params = Promise.resolve({ personId: '12345678-1234-1234-1234' })
      const response = await GET(request, { params })
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return 400 for UUID with wrong characters', async () => {
      const request = createRequest('GGGGGGGG-1234-1234-1234-123456789012')
      const params = Promise.resolve({ personId: 'GGGGGGGG-1234-1234-1234-123456789012' })
      const response = await GET(request, { params })
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should accept valid lowercase UUID', async () => {
      // Setup mock to return person
      const mockSingle = vi.fn().mockResolvedValue({ data: MOCK_PERSON, error: null })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
      vi.mocked(createClient).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createClient>)

      const request = createRequest(MOCK_PERSON.id)
      const params = Promise.resolve({ personId: MOCK_PERSON.id })
      const response = await GET(request, { params })

      expect(response.status).toBe(200)
    })

    it('should accept valid uppercase UUID', async () => {
      const uppercaseId = MOCK_PERSON.id.toUpperCase()

      // Setup mock to return person
      const mockSingle = vi.fn().mockResolvedValue({ data: MOCK_PERSON, error: null })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
      vi.mocked(createClient).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createClient>)

      const request = createRequest(uppercaseId)
      const params = Promise.resolve({ personId: uppercaseId })
      const response = await GET(request, { params })

      // UUID validation is case-insensitive
      expect(response.status).toBe(200)
    })
  })

  describe('Database Queries', () => {
    it('should return 404 when person not found', async () => {
      // Setup mock to return null
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
      vi.mocked(createClient).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createClient>)

      const request = createRequest(MOCK_PERSON.id)
      const params = Promise.resolve({ personId: MOCK_PERSON.id })
      const response = await GET(request, { params })
      const data = await parseResponse(response)

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Person not found')
    })

    it('should return 400 when person has no birth date', async () => {
      // Setup mock to return person without birth_date
      const mockSingle = vi.fn().mockResolvedValue({ data: MOCK_PERSON_NO_BIRTH_DATE, error: null })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
      vi.mocked(createClient).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createClient>)

      const request = createRequest(MOCK_PERSON_NO_BIRTH_DATE.id)
      const params = Promise.resolve({ personId: MOCK_PERSON_NO_BIRTH_DATE.id })
      const response = await GET(request, { params })
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('no birth date')
    })

    it('should query the people table with correct person ID', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: MOCK_PERSON, error: null })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
      vi.mocked(createClient).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createClient>)

      const request = createRequest(MOCK_PERSON.id)
      const params = Promise.resolve({ personId: MOCK_PERSON.id })
      await GET(request, { params })

      expect(mockFrom).toHaveBeenCalledWith('people')
      expect(mockSelect).toHaveBeenCalledWith('id, first_name, last_name, birth_date')
      expect(mockEq).toHaveBeenCalledWith('id', MOCK_PERSON.id)
    })
  })

  describe('Success Response', () => {
    it('should return timeline data for valid person', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: MOCK_PERSON, error: null })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
      vi.mocked(createClient).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createClient>)

      const request = createRequest(MOCK_PERSON.id)
      const params = Promise.resolve({ personId: MOCK_PERSON.id })
      const response = await GET(request, { params })
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.computedAt).toBeDefined()
    })

    it('should return timeline with correct person info', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: MOCK_PERSON, error: null })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
      vi.mocked(createClient).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createClient>)

      const request = createRequest(MOCK_PERSON.id)
      const params = Promise.resolve({ personId: MOCK_PERSON.id })
      const response = await GET(request, { params })
      const data = await parseResponse(response)

      expect(data.data.personId).toBe(MOCK_PERSON.id)
      expect(data.data.personName).toBe('Test User')
      expect(data.data.birthDate).toBe('1990-05-15')
    })

    it('should return timeline with required milestone fields', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: MOCK_PERSON, error: null })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
      vi.mocked(createClient).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createClient>)

      const request = createRequest(MOCK_PERSON.id)
      const params = Promise.resolve({ personId: MOCK_PERSON.id })
      const response = await GET(request, { params })
      const data = await parseResponse(response)

      expect(data.data).toHaveProperty('birthKin')
      expect(data.data).toHaveProperty('currentPersonalYear')
      expect(data.data).toHaveProperty('milestones')
      expect(data.data).toHaveProperty('galacticReturns')
      expect(data.data).toHaveProperty('tunBirthdays')
      expect(data.data).toHaveProperty('katunBirthdays')
    })

    it('should handle person with only first name', async () => {
      const personFirstNameOnly = {
        ...MOCK_PERSON,
        last_name: null,
      }
      const mockSingle = vi.fn().mockResolvedValue({ data: personFirstNameOnly, error: null })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
      vi.mocked(createClient).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createClient>)

      const request = createRequest(MOCK_PERSON.id)
      const params = Promise.resolve({ personId: MOCK_PERSON.id })
      const response = await GET(request, { params })
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.data.personName).toBe('Test')
    })

    it('should handle person with only last name', async () => {
      const personLastNameOnly = {
        ...MOCK_PERSON,
        first_name: null,
      }
      const mockSingle = vi.fn().mockResolvedValue({ data: personLastNameOnly, error: null })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
      vi.mocked(createClient).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof createClient>)

      const request = createRequest(MOCK_PERSON.id)
      const params = Promise.resolve({ personId: MOCK_PERSON.id })
      const response = await GET(request, { params })
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.data.personName).toBe('User')
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when Supabase config is missing', async () => {
      vi.unstubAllEnvs()

      const request = createRequest(MOCK_PERSON.id)
      const params = Promise.resolve({ personId: MOCK_PERSON.id })
      const response = await GET(request, { params })
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to generate timeline')
    })
  })
})
