import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPersonalTimeline } from '@/lib/services/predictions'
import type { TimelineResponse } from '@/lib/types/prediction'

export const dynamic = 'force-dynamic'

// Create Supabase client for server-side operations
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(url, key)
}

/**
 * GET /api/predictions/timeline/[personId]
 *
 * Get personal timeline with milestones for a specific person
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ personId: string }> }
) {
  try {
    const { personId } = await params

    // Validate personId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(personId)) {
      return NextResponse.json<TimelineResponse>(
        { success: false, error: 'Invalid person ID format.' },
        { status: 400 }
      )
    }

    // Fetch person data from database
    const supabase = getSupabaseClient()
    const { data: person, error: fetchError } = await supabase
      .from('people')
      .select('id, first_name, last_name, birth_date')
      .eq('id', personId)
      .single()

    if (fetchError || !person) {
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
    const personName = [person.first_name, person.last_name].filter(Boolean).join(' ')
    const timeline = getPersonalTimeline(
      person.id,
      personName,
      person.birth_date
    )

    return NextResponse.json<TimelineResponse>({
      success: true,
      data: timeline,
      computedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Timeline error:', error)
    return NextResponse.json<TimelineResponse>(
      { success: false, error: 'Failed to generate timeline' },
      { status: 500 }
    )
  }
}
