import { NextRequest, NextResponse } from 'next/server'
import { getWeeklyPrediction } from '@/lib/services/predictions'
import type { WeeklyPredictionResponse } from '@/lib/types/prediction'

export const dynamic = 'force-dynamic'

/**
 * GET /api/predictions/weekly
 *
 * Query parameters:
 * - startDate: YYYY-MM-DD (optional, defaults to start of current week)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Get start date parameter or use today
    const startDateParam = searchParams.get('startDate')
    const today = new Date().toISOString().split('T')[0]
    const startDate = startDateParam || today

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return NextResponse.json<WeeklyPredictionResponse>(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 }
      )
    }

    const prediction = getWeeklyPrediction(startDate)

    return NextResponse.json<WeeklyPredictionResponse>({
      success: true,
      data: prediction,
      computedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Weekly prediction error:', error)
    return NextResponse.json<WeeklyPredictionResponse>(
      { success: false, error: 'Failed to generate prediction' },
      { status: 500 }
    )
  }
}
