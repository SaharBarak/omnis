import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth-server'
import {
  generateInterpretation,
  generateQuickInterpretation,
} from '@/lib/services/ai-interpretations'
import { rateLimiters, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limit'
import type { AIInterpretationRequest, PredictionEvent } from '@/lib/types/prediction'

export const dynamic = 'force-dynamic'

/**
 * POST /api/ai/interpret
 *
 * Generate AI interpretation for a prediction event
 *
 * Body:
 * - prediction: PredictionEvent (required)
 * - personContext: { birthDate, birthKin, currentAge?, personalYearKin? } (optional)
 * - locale: 'en' | 'he' (optional, defaults to 'en')
 * - quick: boolean (optional, for quick interpretations without caching)
 */
export async function POST(request: NextRequest) {
  try {
    // Check if AI is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'AI service not configured' },
        { status: 503 }
      )
    }

    // Check authentication
    const userId = await getCurrentUserId()

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting check (using user ID for more accurate limiting)
    const rateLimitResult = await rateLimiters.ai.check(request, 'interpret', userId)
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult)
    }

    const body = await request.json()

    // Validate required fields
    if (!body.prediction) {
      return NextResponse.json(
        { success: false, error: 'prediction is required' },
        { status: 400 }
      )
    }

    const prediction: PredictionEvent = body.prediction
    const locale = body.locale || 'en'

    // Quick interpretation mode (for one-off requests)
    if (body.quick) {
      const interpretation = await generateQuickInterpretation(
        prediction.type,
        prediction.title,
        prediction.description,
        prediction.themes,
        locale
      )

      const response = NextResponse.json({
        success: true,
        data: {
          interpretation,
          themes: prediction.themes,
          cachedAt: new Date().toISOString(),
        },
      })
      return addRateLimitHeaders(response, rateLimitResult)
    }

    // Full interpretation mode
    const interpretationRequest: AIInterpretationRequest = {
      prediction,
      personContext: body.personContext,
      locale,
    }

    const interpretation = await generateInterpretation(interpretationRequest)

    const response = NextResponse.json({
      success: true,
      data: interpretation,
    })
    return addRateLimitHeaders(response, rateLimitResult)
  } catch (error) {
    console.error('AI interpretation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate interpretation' },
      { status: 500 }
    )
  }
}
