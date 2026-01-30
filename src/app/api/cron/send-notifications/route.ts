import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processDailyDigestNotifications } from '@/lib/services/notifications'

// This endpoint is called by Vercel Cron every hour
// Configure in vercel.json: {"crons": [{"path": "/api/cron/send-notifications", "schedule": "0 * * * *"}]}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(url, serviceKey)
}

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const supabase = getSupabaseAdmin()
    const now = new Date()
    const currentHour = now.getUTCHours()

    // Only process daily digests during morning hours (6-9 UTC)
    // This gives flexibility for different timezones
    if (currentHour >= 6 && currentHour <= 9) {
      // Get users who want digest at this hour
      const targetTime = `${String(currentHour).padStart(2, '0')}:00`

      const { data: settings, error: settingsError } = await supabase
        .from('notification_settings')
        .select('user_id')
        .eq('enabled', true)
        .eq('daily_digest', true)
        .contains('channels', ['email'])
        .gte('daily_digest_time', `${String(currentHour).padStart(2, '0')}:00`)
        .lt('daily_digest_time', `${String(currentHour + 1).padStart(2, '0')}:00`)

      if (settingsError) {
        console.error('Error fetching notification settings:', settingsError)
        return NextResponse.json(
          { error: 'Failed to fetch notification settings' },
          { status: 500 }
        )
      }

      if (!settings || settings.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No notifications to send this hour',
          hour: currentHour,
          sent: 0,
          failed: 0,
        })
      }

      // Process daily digest notifications
      const result = await processDailyDigestNotifications()

      // Log the notification batch
      await supabase.from('email_send_log').insert({
        email_type: 'daily_digest_batch',
        subject: `Daily digest batch at ${now.toISOString()}`,
        status: result.sent > 0 ? 'sent' : 'skipped',
        metadata: {
          hour: currentHour,
          sent: result.sent,
          failed: result.failed,
        },
      })

      return NextResponse.json({
        success: true,
        hour: currentHour,
        sent: result.sent,
        failed: result.failed,
      })
    }

    // For other hours, just return success
    return NextResponse.json({
      success: true,
      message: 'Outside daily digest window',
      hour: currentHour,
      sent: 0,
      failed: 0,
    })
  } catch (error) {
    console.error('Send notifications cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
