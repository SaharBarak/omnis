import { NextRequest, NextResponse } from 'next/server'
import { Types } from 'mongoose'
import { requireUserId, UnauthorizedError } from '@/lib/auth-server'
import { getPersonForTimeline } from '@/lib/db/repositories/predictions-repo'
import { getPersonalTimeline } from '@/lib/services/predictions'
import type { TimelineResponse } from '@/lib/types/prediction'

export const dynamic = 'force-dynamic'

/**
 * GET /api/predictions/timeline/[personId]
 *
 * Get personal timeline with milestones for a specific person.
 *
 * USER CONTEXT: the caller must be authenticated and must own the person.
 * Ownership is enforced in the repository (getPersonForTimeline filters by
 * owner_id), so a person owned by someone else returns the same 404 as a
 * missing person — no ownership leak.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ personId: string }> }
) {
  try {
    const userId = await requireUserId()
    const { personId } = await params

    // Validate id format (Mongo ObjectId)
    if (!Types.ObjectId.isValid(personId)) {
      return NextResponse.json<TimelineResponse>(
        { success: false, error: 'Invalid person ID format.' },
        { status: 400 }
      )
    }

    // Owner-scoped fetch — null when missing OR not owned by the caller.
    const person = await getPersonForTimeline(userId, personId)

    if (!person) {
      return NextResponse.json<TimelineResponse>(
        { success: false, error: 'Person not found.' },
        { status: 404 }
      )
    }

    if (!person.birth_date) {
      return NextResponse.json<TimelineResponse>(
        { success: false, error: 'Person has no birth date set.' },
        { status: 400 }
      )
    }

    // Generate personal timeline
    const timeline = getPersonalTimeline(
      person.id,
      person.name,
      person.birth_date
    )

    return NextResponse.json<TimelineResponse>({
      success: true,
      data: timeline,
      computedAt: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json<TimelineResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Timeline error:', error)
    return NextResponse.json<TimelineResponse>(
      { success: false, error: 'Failed to generate timeline' },
      { status: 500 }
    )
  }
}
