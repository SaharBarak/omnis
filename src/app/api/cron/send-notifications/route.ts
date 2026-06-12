import { NextRequest, NextResponse } from 'next/server'
import { processDailyDigestNotifications } from '@/lib/services/notifications'
import {
  listAllEnabledSettingsForHour,
  logEmailSend,
} from '@/lib/db/repositories/notifications-repo'

export const dynamic = 'force-dynamic'

// This endpoint is called by Vercel Cron every hour
// Configure in vercel.json: {"crons": [{"path": "/api/cron/send-notifications", "schedule": "0 * * * *"}]}
//
// SYSTEM-context: authorized by CRON_SECRET and intentionally reads across ALL
// users' notification_settings. There is NO requireUserId() here — the cross-
// tenant read is legitimate and lives behind clearly-named system repo
// functions (listAllEnabledSettingsForHour / processDailyDigestNotifications).

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const now = new Date()
    const currentHour = now.getUTCHours()

    // Only process daily digests during morning hours (6-9 UTC)
    // This gives flexibility for different timezones
    if (currentHour >= 6 && currentHour <= 9) {
      // Get users who want digest at this hour
      const hourPrefix = String(currentHour).padStart(2, '0')
      const settings = await listAllEnabledSettingsForHour(hourPrefix)

      if (settings.length === 0) {
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
      await logEmailSend({
        email_type: 'daily_digest_batch',
        subject: `Daily digest batch at ${now.toISOString()} (hour ${currentHour}, sent ${result.sent}, failed ${result.failed})`,
        status: result.sent > 0 ? 'sent' : 'skipped',
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
