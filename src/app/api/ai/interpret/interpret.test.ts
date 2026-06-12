import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock AI interpretations service
vi.mock('@/lib/services/ai-interpretations', () => ({
  generateInterpretation: vi.fn(),
  generateQuickInterpretation: vi.fn(),
}))

// Import after mocking
import { createClient } from '@/lib/supabase/server'
import { generateInterpretation, generateQuickInterpretation } from '@/lib/services/ai-interpretations'
import { resetRateLimitStore } from '@/lib/rate-limit'
import { POST } from './route'

// Helper to create mock NextRequest with POST body
function createPostRequest(body: object): NextRequest {
  return new NextRequest(
    new URL('/api/ai/interpret', 'http://localhost:3000'),
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}

// Helper to parse response JSON
async function parseResponse(response: Response) {
  return response.json()
}

// Mock prediction event for testing
const MOCK_PREDICTION = {
  system: 'dreamspell' as const,
  type: 'wavespell' as const,
  startDate: '2024-06-15',
  endDate: '2024-06-27',
  title: 'Wavespell of the Red Dragon',
  description: 'A 13-day cycle focused on nurturing and new beginnings',
  intensity: 'medium' as const,
  themes: ['nurturing', 'birth', 'new beginnings'],
  data: { kin: 1, seal: 1, tone: 1 },
}

// Mock interpretation response
const MOCK_INTERPRETATION = {
  interpretation: 'This is a time of new beginnings and nurturing energy.',
  themes: ['nurturing', 'birth', 'new beginnings'],
  affirmation: 'I embrace new beginnings with an open heart.',
  guidance: 'Focus on self-care and nurturing your dreams.',
  cachedAt: '2024-06-15T10:00:00.000Z',
}

describe('POST /api/ai/interpret', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    resetRateLimitStore()
    // Set required env vars
    vi.stubEnv('GEMINI_API_KEY', 'test-api-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  // Helper to setup authenticated mock
  function setupAuthenticatedMock() {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>)
    return mockUser
  }

  // Helper to setup unauthenticated mock
  function setupUnauthenticatedMock() {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>)
  }

  describe('Configuration Checks', () => {
    it('should return 503 when GEMINI_API_KEY is not configured', async () => {
      vi.unstubAllEnvs()
      setupAuthenticatedMock()

      const request = createPostRequest({ prediction: MOCK_PREDICTION })
      const response = await POST(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(503)
      expect(data.success).toBe(false)
      expect(data.error).toContain('not configured')
    })
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      setupUnauthenticatedMock()

      const request = createPostRequest({ prediction: MOCK_PREDICTION })
      const response = await POST(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unauthorized')
    })

    it('should allow authenticated users', async () => {
      setupAuthenticatedMock()
      vi.mocked(generateInterpretation).mockResolvedValue(MOCK_INTERPRETATION)

      const request = createPostRequest({ prediction: MOCK_PREDICTION })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Request Validation', () => {
    it('should return 400 when prediction is missing', async () => {
      setupAuthenticatedMock()

      const request = createPostRequest({})
      const response = await POST(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('prediction is required')
    })

    it('should return 400 when prediction is null', async () => {
      setupAuthenticatedMock()

      const request = createPostRequest({ prediction: null })
      const response = await POST(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })

  describe('Quick Interpretation Mode', () => {
    it('should use quick interpretation when quick flag is true', async () => {
      setupAuthenticatedMock()
      vi.mocked(generateQuickInterpretation).mockResolvedValue('Quick interpretation text')

      const request = createPostRequest({
        prediction: MOCK_PREDICTION,
        quick: true,
      })
      const response = await POST(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(generateQuickInterpretation).toHaveBeenCalledWith(
        MOCK_PREDICTION.type,
        MOCK_PREDICTION.title,
        MOCK_PREDICTION.description,
        MOCK_PREDICTION.themes,
        'en'
      )
    })

    it('should pass locale to quick interpretation', async () => {
      setupAuthenticatedMock()
      vi.mocked(generateQuickInterpretation).mockResolvedValue('תפרוש מהיר')

      const request = createPostRequest({
        prediction: MOCK_PREDICTION,
        quick: true,
        locale: 'he',
      })
      await POST(request)

      expect(generateQuickInterpretation).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        'he'
      )
    })

    it('should return quick interpretation response', async () => {
      setupAuthenticatedMock()
      vi.mocked(generateQuickInterpretation).mockResolvedValue('Quick interpretation text')

      const request = createPostRequest({
        prediction: MOCK_PREDICTION,
        quick: true,
      })
      const response = await POST(request)
      const data = await parseResponse(response)

      expect(data.data).toHaveProperty('interpretation')
      expect(data.data).toHaveProperty('themes')
      expect(data.data).toHaveProperty('cachedAt')
      expect(data.data.interpretation).toBe('Quick interpretation text')
    })
  })

  describe('Full Interpretation Mode', () => {
    it('should use full interpretation when quick flag is false', async () => {
      setupAuthenticatedMock()
      vi.mocked(generateInterpretation).mockResolvedValue(MOCK_INTERPRETATION)

      const request = createPostRequest({
        prediction: MOCK_PREDICTION,
        quick: false,
      })
      await POST(request)

      expect(generateInterpretation).toHaveBeenCalled()
      expect(generateQuickInterpretation).not.toHaveBeenCalled()
    })

    it('should use full interpretation when quick flag is omitted', async () => {
      setupAuthenticatedMock()
      vi.mocked(generateInterpretation).mockResolvedValue(MOCK_INTERPRETATION)

      const request = createPostRequest({
        prediction: MOCK_PREDICTION,
      })
      await POST(request)

      expect(generateInterpretation).toHaveBeenCalled()
      expect(generateQuickInterpretation).not.toHaveBeenCalled()
    })

    it('should pass person context to full interpretation', async () => {
      setupAuthenticatedMock()
      vi.mocked(generateInterpretation).mockResolvedValue(MOCK_INTERPRETATION)

      const personContext = {
        birthDate: '1990-05-15',
        birthKin: 100,
        currentAge: 34,
        personalYearKin: 125,
      }

      const request = createPostRequest({
        prediction: MOCK_PREDICTION,
        personContext,
      })
      await POST(request)

      expect(generateInterpretation).toHaveBeenCalledWith(
        expect.objectContaining({
          personContext,
        })
      )
    })

    it('should pass locale to full interpretation', async () => {
      setupAuthenticatedMock()
      vi.mocked(generateInterpretation).mockResolvedValue(MOCK_INTERPRETATION)

      const request = createPostRequest({
        prediction: MOCK_PREDICTION,
        locale: 'he',
      })
      await POST(request)

      expect(generateInterpretation).toHaveBeenCalledWith(
        expect.objectContaining({
          locale: 'he',
        })
      )
    })

    it('should default locale to en', async () => {
      setupAuthenticatedMock()
      vi.mocked(generateInterpretation).mockResolvedValue(MOCK_INTERPRETATION)

      const request = createPostRequest({
        prediction: MOCK_PREDICTION,
      })
      await POST(request)

      expect(generateInterpretation).toHaveBeenCalledWith(
        expect.objectContaining({
          locale: 'en',
        })
      )
    })

    it('should return full interpretation response', async () => {
      setupAuthenticatedMock()
      vi.mocked(generateInterpretation).mockResolvedValue(MOCK_INTERPRETATION)

      const request = createPostRequest({
        prediction: MOCK_PREDICTION,
      })
      const response = await POST(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(MOCK_INTERPRETATION)
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when AI service throws an error', async () => {
      setupAuthenticatedMock()
      vi.mocked(generateInterpretation).mockRejectedValue(new Error('AI service error'))

      const request = createPostRequest({
        prediction: MOCK_PREDICTION,
      })
      const response = await POST(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to generate interpretation')
    })

    it('should return 500 when quick interpretation throws an error', async () => {
      setupAuthenticatedMock()
      vi.mocked(generateQuickInterpretation).mockRejectedValue(new Error('Quick AI error'))

      const request = createPostRequest({
        prediction: MOCK_PREDICTION,
        quick: true,
      })
      const response = await POST(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})
