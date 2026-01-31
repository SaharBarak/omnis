import { NextRequest, NextResponse } from 'next/server'
import { getMonthlyPrediction } from '@/lib/services/predictions'
import type { MonthlyPredictionResponse } from '@/lib/types/prediction'

export const dynamic = 'force-dynamic'

/**
 * GET /api/predictions/monthly
 *
 * Query parameters:
 * - year: YYYY (optional, defaults to current year)
 * - month: 1-12 (optional, defaults to current month)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const now = new Date()

    // Get year parameter or use current year
    const yearParam = searchParams.get('year')
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear()

    // Get month parameter or use current month (1-12 in API, 0-11 internally)
    const monthParam = searchParams.get('month')
    const month = monthParam ? parseInt(monthParam, 10) - 1 : now.getMonth()

    // Validate year
    if (isNaN(year) || year < 1900 || year > 2100) {
      return NextResponse.json<MonthlyPredictionResponse>(
        { success: false, error: 'Invalid year. Must be between 1900 and 2100.' },
        { status: 400 }
      )
    }

    // Validate month (after conversion: 0-11)
    if (isNaN(month) || month < 0 || month > 11) {
      return NextResponse.json<MonthlyPredictionResponse>(
        { success: false, error: 'Invalid month. Must be between 1 and 12.' },
        { status: 400 }
      )
    }

    const prediction = getMonthlyPrediction(year, month)

    return NextResponse.json<MonthlyPredictionResponse>({
      success: true,
      data: prediction,
      computedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Monthly prediction error:', error)
    return NextResponse.json<MonthlyPredictionResponse>(
      { success: false, error: 'Failed to generate prediction' },
      { status: 500 }
    )
  }
}
