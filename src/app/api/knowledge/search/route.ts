import { NextRequest, NextResponse } from 'next/server'
import { searchKnowledge } from '@/lib/services/knowledge-search'
import { rateLimiters, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * POST /api/knowledge/search
 *
 * Public semantic search over the knowledge base (Workers AI embeddings +
 * Atlas Vector Search). Powers the landing knowledge band and the /learn
 * search surface (docs/redesign/USER_FLOWS.md gap #2).
 *
 * Body:
 * - query: string (required, 2–200 chars)
 * - limit: number (optional, 1–10, default 3)
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimit = await rateLimiters.publicApi.check(request, 'knowledge-search')
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit)
    }

    const body = (await request.json()) as { query?: unknown; limit?: unknown }
    const query = typeof body.query === 'string' ? body.query.trim() : ''
    if (query.length < 2 || query.length > 200) {
      return NextResponse.json(
        { error: 'query must be between 2 and 200 characters' },
        { status: 400 },
      )
    }
    const limit = Math.min(Math.max(Number(body.limit) || 3, 1), 10)

    const results = await searchKnowledge(query, limit)

    const response = NextResponse.json({
      results: results.map((r) => ({
        title: r.title,
        snippet: r.chunkText.slice(0, 240),
        sourceUrl: r.sourceUrl,
        similarity: r.similarity,
      })),
    })
    return addRateLimitHeaders(response, rateLimit)
  } catch (error) {
    console.error('knowledge search failed:', error)
    return NextResponse.json({ error: 'Search is unavailable right now' }, { status: 503 })
  }
}
