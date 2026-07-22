import { NextRequest, NextResponse } from 'next/server'

import { isAuthorizedCron } from '@/lib/api/cron-auth'
import { collectBriefing } from '@/lib/services/briefing/collect'
import { renderBriefingEmail } from '@/lib/email/daily-briefing'
import { opsRecipient } from '@/lib/email/ops'
import { sendTransactionalEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * Daily ops briefing → email. Triggered by the cron worker at 07:00 UTC
 * (workers/cron), authorized solely by CRON_SECRET. Aggregates traffic (humans
 * vs bots), new users, buyers/subscriptions, and SEO (on-page grade + Search
 * Console), then emails BRIEFING_EMAIL. Every data source is fault-isolated in
 * collectBriefing — a missing key or a failing API degrades to a "not
 * connected" line, never a failed send.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_BASE_URL || 'https://pleiad.io'
  const to = opsRecipient()

  try {
    const briefing = await collectBriefing(siteUrl)
    const mail = renderBriefingEmail(briefing)

    const result = await sendTransactionalEmail({
      to,
      subject: mail.subject,
      preheader: mail.preheader,
      title: 'Daily briefing',
      bodyHtml: mail.bodyHtml,
      footerText: mail.footerText,
    })

    if (!result.ok) {
      // Data gathered fine; only the send failed — surface it so the cron logs a failure.
      return NextResponse.json({ ok: false, sent: false, briefing: summarize(briefing) }, { status: 502 })
    }

    return NextResponse.json({ ok: true, sent: true, id: result.id, briefing: summarize(briefing) })
  } catch (err) {
    console.error('daily-briefing failed', err)
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
  }
}

/** Compact, PII-free run summary for the cron log / response. */
function summarize(b: Awaited<ReturnType<typeof collectBriefing>>) {
  return {
    generatedAt: b.generatedAt,
    connected: {
      traffic: b.traffic.connected,
      users: b.users.connected,
      revenue: b.revenue.connected,
      seoOnPage: b.seoOnPage.connected,
      gsc: b.gsc.connected,
      backlinks: b.backlinks.connected,
    },
  }
}
