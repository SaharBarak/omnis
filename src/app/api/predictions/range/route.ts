import { NextRequest, NextResponse } from 'next/server'
import { getRangePredictions } from '@/lib/services/predictions'
import type { PredictionAPIResponse, DailyPrediction } from '@/lib/types/prediction'

/**
 * GET /api/predictions/range
 *
 * Query parameters:
 * - start: YYYY-MM-DD (required)
 * - end: YYYY-MM-DD (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json<PredictionAPIResponse<DailyPrediction[]>>(
        { success: false, error: 'Both start and end dates are required.' },
        { status: 400 }
      )
    }

    // Validate date formats
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return NextResponse.json<PredictionAPIResponse<DailyPrediction[]>>(
        { success: false, error: 'Invalid start date format. Use YYYY-MM-DD.' },
        { status: 400 }
      )
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return NextResponse.json<PredictionAPIResponse<DailyPrediction[]>>(
        { success: false, error: 'Invalid end date format. Use YYYY-MM-DD.' },
        { status: 400 }
      )
    }

    // Validate date order
    if (startDate > endDate) {
      return NextResponse.json<PredictionAPIResponse<DailyPrediction[]>>(
        { success: false, error: 'Start date must be before or equal to end date.' },
        { status: 400 }
      )
    }

    // Limit range to 366 days (1 year)
    const start = new Date(startDate)
    const end = new Date(endDate)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff > 366) {
      return NextResponse.json<PredictionAPIResponse<DailyPrediction[]>>(
        { success: false, error: 'Date range cannot exceed 366 days.' },
        { status: 400 }
      )
    }

    const predictions = getRangePredictions(startDate, endDate)

    return NextResponse.json<PredictionAPIResponse<DailyPrediction[]>>({
      success: true,
      data: predictions,
      computedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Range prediction error:', error)
    return NextResponse.json<PredictionAPIResponse<DailyPrediction[]>>(
      { success: false, error: 'Failed to generate predictions' },
      { status: 500 }
    )
  }
}
