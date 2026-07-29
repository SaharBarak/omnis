import { NextRequest, NextResponse } from 'next/server'
import { isAuthorizedCron } from '@/lib/api/cron-auth'
import { processDailyDigestNotifications } from '@/lib/services/notifications'
import { logEmailSend } from '@/lib/db/repositories/notifications-repo'

export const dynamic = 'force-dynamic'

// Fired hourly by the cron worker (workers/cron, '0 * * * *').
//
// SYSTEM-context: authorized by CRON_SECRET and intentionally reads across ALL
// users' notification_settings. There is NO requireUserId() here — the cross-
// tenant read is legitimate and lives behind the clearly-named system service
// (processDailyDigestNotifications), which matches each recipient's chosen
// digest hour in their own timezone.

export async function GET(request: NextRequest) {
  // Verify cron secret — fail closed regardless of environment.
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const currentHour = now.getUTCHours()

    // Runs hourly (#65). Per-recipient hour matching happens inside the
    // processor, against each user's OWN timezone and chosen digest time —
    // the old 6-9 UTC window silently skipped every other choice, and its
    // hour "gate" then sent to all users at once regardless of theirs.
    const result = await processDailyDigestNotifications(now)

    if (result.sent > 0 || result.failed > 0) {
      await logEmailSend({
        email_type: 'daily_digest_batch',
        subject: `Daily digest batch at ${now.toISOString()} (UTC hour ${currentHour}, sent ${result.sent}, failed ${result.failed})`,
        status: result.sent > 0 ? 'sent' : 'skipped',
      })
    }

    return NextResponse.json({
      success: true,
      hour: currentHour,
      sent: result.sent,
      failed: result.failed,
    })
  } catch (error) {
    console.error('Send notifications cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
