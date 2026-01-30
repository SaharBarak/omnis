import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Import route handlers
import { GET as getDailyPrediction } from './daily/route'
import { GET as getWeeklyPrediction } from './weekly/route'
import { GET as getMonthlyPrediction } from './monthly/route'
import { GET as getRangePrediction } from './range/route'

// Helper to create mock NextRequest with URL
function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'))
}

// Helper to parse response JSON
async function parseResponse(response: Response) {
  return response.json()
}

describe('Prediction API Routes', () => {
  describe('GET /api/predictions/daily', () => {
    it('should return prediction for today when no date provided', async () => {
      const request = createRequest('/api/predictions/daily')
      const response = await getDailyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.computedAt).toBeDefined()
    })

    it('should return prediction for specific date', async () => {
      const request = createRequest('/api/predictions/daily?date=2024-06-15')
      const response = await getDailyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.date).toBe('2024-06-15')
    })

    it('should return 400 for invalid date format', async () => {
      const request = createRequest('/api/predictions/daily?date=invalid')
      const response = await getDailyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid date format')
    })

    it('should return 400 for partial date format', async () => {
      const request = createRequest('/api/predictions/daily?date=2024-06')
      const response = await getDailyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return personalized prediction with birthDate', async () => {
      const request = createRequest(
        '/api/predictions/daily?date=2024-06-15&birthDate=1990-05-20'
      )
      const response = await getDailyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
    })

    it('should return 400 for invalid birthDate format', async () => {
      const request = createRequest(
        '/api/predictions/daily?date=2024-06-15&birthDate=invalid'
      )
      const response = await getDailyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid birthDate format')
    })

    it('should accept optional personId parameter', async () => {
      const request = createRequest(
        '/api/predictions/daily?date=2024-06-15&birthDate=1990-05-20&personId=user-123'
      )
      const response = await getDailyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return correct structure for daily prediction', async () => {
      const request = createRequest('/api/predictions/daily?date=2024-06-15')
      const response = await getDailyPrediction(request)
      const data = await parseResponse(response)

      expect(data.data).toHaveProperty('date')
      expect(data.data).toHaveProperty('kin')
      expect(data.data).toHaveProperty('seal')
      expect(data.data).toHaveProperty('tone')
      expect(data.data).toHaveProperty('color')
    })
  })

  describe('GET /api/predictions/weekly', () => {
    it('should return prediction for current week when no date provided', async () => {
      const request = createRequest('/api/predictions/weekly')
      const response = await getWeeklyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.computedAt).toBeDefined()
    })

    it('should return prediction for specific week', async () => {
      const request = createRequest('/api/predictions/weekly?startDate=2024-06-10')
      const response = await getWeeklyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
    })

    it('should return 400 for invalid date format', async () => {
      const request = createRequest('/api/predictions/weekly?startDate=bad-date')
      const response = await getWeeklyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid date format')
    })

    it('should return weekly structure with days array', async () => {
      const request = createRequest('/api/predictions/weekly?startDate=2024-06-10')
      const response = await getWeeklyPrediction(request)
      const data = await parseResponse(response)

      expect(data.data).toHaveProperty('startDate')
      expect(data.data).toHaveProperty('endDate')
      expect(data.data).toHaveProperty('days')
      expect(Array.isArray(data.data.days)).toBe(true)
      expect(data.data.days.length).toBe(7)
    })

    it('should return week range dates', async () => {
      const request = createRequest('/api/predictions/weekly?startDate=2024-06-10')
      const response = await getWeeklyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.data.startDate).toBeDefined()
      expect(data.data.endDate).toBeDefined()
    })
  })

  describe('GET /api/predictions/monthly', () => {
    it('should return prediction for current month when no params provided', async () => {
      const request = createRequest('/api/predictions/monthly')
      const response = await getMonthlyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.computedAt).toBeDefined()
    })

    it('should return prediction for specific year and month', async () => {
      const request = createRequest('/api/predictions/monthly?year=2024&month=6')
      const response = await getMonthlyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
    })

    it('should accept just year parameter', async () => {
      const request = createRequest('/api/predictions/monthly?year=2024')
      const response = await getMonthlyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should accept just month parameter', async () => {
      const request = createRequest('/api/predictions/monthly?month=3')
      const response = await getMonthlyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 400 for year below 1900', async () => {
      const request = createRequest('/api/predictions/monthly?year=1899')
      const response = await getMonthlyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid year')
    })

    it('should return 400 for year above 2100', async () => {
      const request = createRequest('/api/predictions/monthly?year=2101')
      const response = await getMonthlyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid year')
    })

    it('should accept year 1900 (lower boundary)', async () => {
      const request = createRequest('/api/predictions/monthly?year=1900&month=1')
      const response = await getMonthlyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should accept year 2100 (upper boundary)', async () => {
      const request = createRequest('/api/predictions/monthly?year=2100&month=1')
      const response = await getMonthlyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 400 for month 0', async () => {
      const request = createRequest('/api/predictions/monthly?month=0')
      const response = await getMonthlyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid month')
    })

    it('should return 400 for month 13', async () => {
      const request = createRequest('/api/predictions/monthly?month=13')
      const response = await getMonthlyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid month')
    })

    it('should accept month 1 (January)', async () => {
      const request = createRequest('/api/predictions/monthly?year=2024&month=1')
      const response = await getMonthlyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should accept month 12 (December)', async () => {
      const request = createRequest('/api/predictions/monthly?year=2024&month=12')
      const response = await getMonthlyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 400 for non-numeric year', async () => {
      const request = createRequest('/api/predictions/monthly?year=abc')
      const response = await getMonthlyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return 400 for non-numeric month', async () => {
      const request = createRequest('/api/predictions/monthly?month=june')
      const response = await getMonthlyPrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return monthly structure with days array', async () => {
      const request = createRequest('/api/predictions/monthly?year=2024&month=6')
      const response = await getMonthlyPrediction(request)
      const data = await parseResponse(response)

      expect(data.data).toHaveProperty('year')
      expect(data.data).toHaveProperty('month')
      expect(data.data).toHaveProperty('days')
      expect(Array.isArray(data.data.days)).toBe(true)
      expect(data.data).toHaveProperty('highlights')
      expect(data.data).toHaveProperty('events')
    })
  })

  describe('GET /api/predictions/range', () => {
    it('should return predictions for valid date range', async () => {
      const request = createRequest(
        '/api/predictions/range?start=2024-06-01&end=2024-06-07'
      )
      const response = await getRangePrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should return 400 when start date is missing', async () => {
      const request = createRequest('/api/predictions/range?end=2024-06-07')
      const response = await getRangePrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('required')
    })

    it('should return 400 when end date is missing', async () => {
      const request = createRequest('/api/predictions/range?start=2024-06-01')
      const response = await getRangePrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('required')
    })

    it('should return 400 when both dates are missing', async () => {
      const request = createRequest('/api/predictions/range')
      const response = await getRangePrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return 400 for invalid start date format', async () => {
      const request = createRequest(
        '/api/predictions/range?start=invalid&end=2024-06-07'
      )
      const response = await getRangePrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid start date format')
    })

    it('should return 400 for invalid end date format', async () => {
      const request = createRequest(
        '/api/predictions/range?start=2024-06-01&end=invalid'
      )
      const response = await getRangePrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid end date format')
    })

    it('should return 400 when start is after end', async () => {
      const request = createRequest(
        '/api/predictions/range?start=2024-06-07&end=2024-06-01'
      )
      const response = await getRangePrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('before or equal')
    })

    it('should accept same day for start and end', async () => {
      const request = createRequest(
        '/api/predictions/range?start=2024-06-15&end=2024-06-15'
      )
      const response = await getRangePrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.length).toBe(1)
    })

    it('should return correct number of predictions for 7-day range', async () => {
      const request = createRequest(
        '/api/predictions/range?start=2024-06-01&end=2024-06-07'
      )
      const response = await getRangePrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.data.length).toBe(7)
    })

    it('should accept 366-day range (max allowed)', async () => {
      const request = createRequest(
        '/api/predictions/range?start=2024-01-01&end=2024-12-31'
      )
      const response = await getRangePrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 400 for range exceeding 366 days', async () => {
      const request = createRequest(
        '/api/predictions/range?start=2024-01-01&end=2025-01-02'
      )
      const response = await getRangePrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('366 days')
    })

    it('should handle range spanning multiple years', async () => {
      const request = createRequest(
        '/api/predictions/range?start=2024-12-28&end=2025-01-03'
      )
      const response = await getRangePrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.length).toBe(7)
    })

    it('should handle leap year February', async () => {
      // 2024 is a leap year
      const request = createRequest(
        '/api/predictions/range?start=2024-02-28&end=2024-03-01'
      )
      const response = await getRangePrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.length).toBe(3) // Feb 28, Feb 29, Mar 1
    })

    it('should return predictions in chronological order', async () => {
      const request = createRequest(
        '/api/predictions/range?start=2024-06-01&end=2024-06-05'
      )
      const response = await getRangePrediction(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.data[0].date).toBe('2024-06-01')
      expect(data.data[1].date).toBe('2024-06-02')
      expect(data.data[2].date).toBe('2024-06-03')
      expect(data.data[3].date).toBe('2024-06-04')
      expect(data.data[4].date).toBe('2024-06-05')
    })
  })
})
