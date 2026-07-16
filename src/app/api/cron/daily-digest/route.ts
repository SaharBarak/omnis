import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { sendPlatformDigestEmail, type PlatformDigestMetric } from '@/lib/services/email'

export const dynamic = 'force-dynamic'

// Called by Vercel Cron — see vercel.json.
// Emails a platform-health digest to the owner (ADMIN_NOTIFICATION_EMAIL).

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return createClient(url || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
  }

  return createClient(url, serviceKey)
}

interface CountOptions {
  /** ISO timestamp; only rows with `column` >= since are counted. */
  since?: string
  /** Timestamp column used with `since`. */
  column?: string
  /** Extra filters applied to the query. */
  filter?: (q: ReturnType<ReturnType<SupabaseClient['from']>['select']>) => typeof q
}

/**
 * Count rows in a table, tolerating failures. Returns null if the query errors,
 * so a single bad table/column can't break the whole digest.
 */
async function countRows(
  supabase: SupabaseClient,
  table: string,
  opts: CountOptions = {}
): Promise<number | null> {
  try {
    let query = supabase.from(table).select('*', { count: 'exact', head: true })
    if (opts.filter) query = opts.filter(query)
    if (opts.since && opts.column) query = query.gte(opts.column, opts.since)

    const { count, error } = await query
    if (error) {
      console.error(`[daily-digest] count failed for ${table}:`, error.message)
      return null
    }
    return count ?? 0
  } catch (err) {
    console.error(`[daily-digest] count threw for ${table}:`, err)
    return null
  }
}

export async function GET(request: NextRequest) {
  // Verify cron secret (allow unauthenticated only outside production).
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const now = new Date()
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

    const [
      totalUsers,
      newUsers,
      onboardedUsers,
      totalCharts,
      newCharts,
      activeSubscribers,
      newSubscribers,
      totalPredictions,
      newPredictions,
      totalBoards,
      newBoards,
    ] = await Promise.all([
      countRows(supabase, 'profiles'),
      countRows(supabase, 'profiles', { since: since24h, column: 'created_at' }),
      countRows(supabase, 'profiles', { filter: (q) => q.eq('onboarding_completed', true) }),
      countRows(supabase, 'people', { filter: (q) => q.is('deleted_at', null) }),
      countRows(supabase, 'people', {
        since: since24h,
        column: 'created_at',
        filter: (q) => q.is('deleted_at', null),
      }),
      countRows(supabase, 'newsletter_subscribers', {
        filter: (q) => q.eq('confirmed', true).is('unsubscribed_at', null),
      }),
      countRows(supabase, 'newsletter_subscribers', {
        since: since24h,
        column: 'subscribed_at',
        filter: (q) => q.is('unsubscribed_at', null),
      }),
      countRows(supabase, 'predictions'),
      countRows(supabase, 'predictions', { since: since24h, column: 'computed_at' }),
      countRows(supabase, 'boards'),
      countRows(supabase, 'boards', { since: since24h, column: 'created_at' }),
    ])

    const metrics: PlatformDigestMetric[] = [
      { label: 'Users', today: newUsers, total: totalUsers },
      { label: 'Onboarding completed', today: null, total: onboardedUsers },
      { label: 'Charts (people)', today: newCharts, total: totalCharts },
      { label: 'Newsletter subscribers', today: newSubscribers, total: activeSubscribers },
      { label: 'Predictions', today: newPredictions, total: totalPredictions },
      { label: 'Boards', today: newBoards, total: totalBoards },
    ]

    const dateLabel = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    const result = await sendPlatformDigestEmail({ date: dateLabel, metrics })

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to send digest' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: result.id, metrics })
  } catch (error) {
    console.error('[daily-digest] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
