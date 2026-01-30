import { NextRequest, NextResponse } from 'next/server'
import { getDailyPrediction, getPersonalDailyPrediction } from '@/lib/services/predictions'
import type { DailyPredictionResponse } from '@/lib/types/prediction'

/**
 * GET /api/predictions/daily
 *
 * Query parameters:
 * - date: YYYY-MM-DD (optional, defaults to today)
 * - birthDate: YYYY-MM-DD (optional, for personalized predictions)
 * - personId: UUID (optional, for tracking)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Get date parameter or use today
    const dateParam = searchParams.get('date')
    const today = new Date().toISOString().split('T')[0]
    const date = dateParam || today

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json<DailyPredictionResponse>(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 }
      )
    }

    // Check for personalization parameters
    const birthDate = searchParams.get('birthDate')
    const personId = searchParams.get('personId') || undefined

    let prediction

    if (birthDate) {
      // Validate birth date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
        return NextResponse.json<DailyPredictionResponse>(
          { success: false, error: 'Invalid birthDate format. Use YYYY-MM-DD.' },
          { status: 400 }
        )
      }
      prediction = getPersonalDailyPrediction(date, birthDate, personId)
    } else {
      prediction = getDailyPrediction(date)
    }

    return NextResponse.json<DailyPredictionResponse>({
      success: true,
      data: prediction,
      computedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Daily prediction error:', error)
    return NextResponse.json<DailyPredictionResponse>(
      { success: false, error: 'Failed to generate prediction' },
      { status: 500 }
    )
  }
}
