import { NextRequest, NextResponse } from 'next/server'
import { dateToKin, kinToSeal, kinToTone, calculateOracle } from '@pleiad/engine/calculations'
import { getSeal } from '@pleiad/engine/data/seals'
import { getTone } from '@pleiad/engine/data/tones'
import { generateMantra } from '@pleiad/engine/data/mantras'
import {
  getDailyAstroPhenomena,
  type AstroPhenomena,
} from '@pleiad/engine/services/astro-phenomena'
import { isAuthorizedCron } from '@/lib/api/cron-auth'
import { sendMarketingEmail } from '@/lib/email'
import { buildUnsubscribeLink } from '@/lib/email/links'
import {
  listSubscriberIdsSentToday,
  listSubscribersForCron,
  logEmailSend,
} from '@/lib/db/repositories/newsletter-repo'

export const dynamic = 'force-dynamic'

// This endpoint is called by Vercel Cron
// Configure in vercel.json: {"crons": [{"path": "/api/cron/daily-kin", "schedule": "0 6 * * *"}]}

export async function GET(request: NextRequest) {
  // Verify cron secret — fail closed regardless of environment.
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY not configured' },
      { status: 500 }
    )
  }

  try {
    // Calculate today's kin
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0]
    const kin = dateToKin(dateStr)
    const sealNumber = kinToSeal(kin)
    const toneNumber = kinToTone(kin)
    const oracle = calculateOracle(kin)

    const seal = getSeal(sealNumber)
    const tone = getTone(toneNumber)
    const mantra = generateMantra(seal, tone)

    const kinData = {
      date: today.toISOString().split('T')[0],
      kin,
      seal: {
        number: sealNumber,
        name: seal.english,
        nameHebrew: seal.hebrew,
        color: seal.color
      },
      tone: {
        number: toneNumber,
        name: tone.name,
        nameHebrew: tone.nameHebrew
      },
      mantra,
      oracle: {
        guide: { name: getSeal(oracle.guide).english, color: getSeal(oracle.guide).color },
        analog: { name: getSeal(oracle.analog).english, color: getSeal(oracle.analog).color },
        antipode: { name: getSeal(oracle.antipode).english, color: getSeal(oracle.antipode).color },
        occult: { name: getSeal(oracle.occult).english, color: getSeal(oracle.occult).color }
      }
    }

    // Today's astronomical phenomena — moon phase, retrogrades, transitions.
    const astro = getDailyAstroPhenomena(kinData.date)

    // Get active subscribers (confirmed + not unsubscribed)
    let subscribers
    try {
      subscribers = await listSubscribersForCron()
    } catch (fetchError) {
      console.error('Error fetching subscribers:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch subscribers' },
        { status: 500 }
      )
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ message: 'No subscribers', sent: 0 })
    }

    // Send emails
    const subject = `Today's Kin: ${kinData.seal.name} (Kin ${kinData.kin})`
    let sent = 0
    let failed = 0
    let skipped = 0

    // Dedup set fetched once — the per-subscriber form cost a DB round trip
    // per recipient, which scales linearly with the list. Per-send log writes
    // below stay individual on purpose: they are the crash-safe audit trail
    // this dedup reads from on rerun.
    const alreadySent = await listSubscriberIdsSentToday('daily_kin')

    for (const subscriber of subscribers) {
      try {
        // Dedup: skip anyone already sent today's daily_kin (idempotent reruns).
        if (alreadySent.has(subscriber.id)) {
          skipped++
          continue
        }

        const result = await sendMarketingEmail({
          to: subscriber.email,
          subject,
          preheader: `${kinData.tone.name} ${kinData.seal.name} · ${astro.summary}`,
          bodyHtml: dailyKinBody(kinData, astro),
          footerText: 'Daily Kin from the Pleiad newsletter.',
          unsubscribe: await buildUnsubscribeLink(subscriber.email),
        })

        if (!result.ok) {
          console.error(`Failed to send to ${subscriber.email}`)
          failed++
        } else {
          sent++
          // Log successful send (dedup audit trail).
          await logEmailSend({
            subscriber_id: subscriber.id,
            email_type: 'daily_kin',
            subject,
            resend_id: result.id ?? null,
            status: 'sent',
          })
        }

        // Rate limiting: 100ms between emails
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (err) {
        console.error(`Exception sending to ${subscriber.email}:`, err)
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      date: kinData.date,
      kin: kinData.kin,
      seal: kinData.seal.name,
      sent,
      failed,
      skipped,
      total: subscribers.length
    })
  } catch (error) {
    console.error('Daily kin cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

interface KinData {
  date: string
  kin: number
  seal: { number: number; name: string; nameHebrew: string; color: string }
  tone: { number: number; name: string; nameHebrew: string }
  mantra: string
  oracle: {
    guide: { name: string; color: string }
    analog: { name: string; color: string }
    antipode: { name: string; color: string }
    occult: { name: string; color: string }
  }
}

/** The "Sky today" block — moon phase, retrogrades, and day-over-day transitions. */
function astroSection(astro: AstroPhenomena): string {
  const retro = astro.retrogrades.length
    ? `<p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 4px;text-align:center;">${astro.retrogrades
        .map((r) => `${r.symbol} ${r.planet}`)
        .join(' · ')} retrograde</p>`
    : ''
  const transitions = astro.transitions.length
    ? `<div style="margin-top:10px;">${astro.transitions
        .map(
          (t) =>
            `<p style="color:#A78FDF;font-size:13px;margin:2px 0;text-align:center;">${t.detail}</p>`
        )
        .join('')}</div>`
    : ''
  return `
    <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;margin-bottom:24px;">
      <h3 style="color:#A78FDF;font-size:15px;margin:0 0 10px;text-align:center;">Sky today</h3>
      <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0 0 4px;text-align:center;">
        ${astro.moon.phase} · ${Math.round(astro.moon.illumination * 100)}% illuminated · Sun in ${astro.sun.sign}
      </p>
      ${retro}
      ${transitions}
    </div>
  `
}

/** Inner content of the daily-kin email; the branded shell is renderEmail(). */
function dailyKinBody(kinData: KinData, astro: AstroPhenomena): string {
  const sealColors: Record<string, string> = {
    red: '#ef4444',
    white: '#f5f5f5',
    blue: '#3b82f6',
    yellow: '#eab308'
  }

  const sealColor = sealColors[kinData.seal.color] || '#7D5BC9'
  const dateFormatted = new Date(kinData.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return `
    <div style="text-align:center;margin-bottom:20px;">
      <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0;">${dateFormatted}</p>
    </div>
    <div style="text-align:center;margin-bottom:24px;">
      <div style="background:${sealColor};color:${kinData.seal.color === 'white' ? '#000' : '#fff'};display:inline-block;padding:8px 20px;border-radius:20px;font-weight:600;margin-bottom:16px;">
        Kin ${kinData.kin}
      </div>
      <h1 style="color:#ffffff;font-size:26px;margin:0 0 4px;">
        ${kinData.tone.name} ${kinData.seal.name}
      </h1>
      <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0 0 18px;">
        ${kinData.tone.nameHebrew} ${kinData.seal.nameHebrew}
      </p>
      <div style="background:rgba(0,0,0,0.25);border-radius:8px;padding:18px;">
        <p style="color:#A78FDF;font-style:italic;line-height:1.6;margin:0;white-space:pre-line;">
${kinData.mantra}
        </p>
      </div>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;margin-bottom:24px;">
      <h3 style="color:#A78FDF;font-size:15px;margin:0 0 14px;text-align:center;">Today's Oracle</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="text-align:center;padding:8px;width:50%;">
            <span style="color:${sealColors[kinData.oracle.guide.color] || 'rgba(255,255,255,0.5)'};font-size:12px;text-transform:uppercase;">Guide</span>
            <p style="color:#fff;margin:4px 0 0;font-size:14px;">${kinData.oracle.guide.name}</p>
          </td>
          <td style="text-align:center;padding:8px;width:50%;">
            <span style="color:${sealColors[kinData.oracle.analog.color] || 'rgba(255,255,255,0.5)'};font-size:12px;text-transform:uppercase;">Analog</span>
            <p style="color:#fff;margin:4px 0 0;font-size:14px;">${kinData.oracle.analog.name}</p>
          </td>
        </tr>
        <tr>
          <td style="text-align:center;padding:8px;width:50%;">
            <span style="color:${sealColors[kinData.oracle.antipode.color] || 'rgba(255,255,255,0.5)'};font-size:12px;text-transform:uppercase;">Antipode</span>
            <p style="color:#fff;margin:4px 0 0;font-size:14px;">${kinData.oracle.antipode.name}</p>
          </td>
          <td style="text-align:center;padding:8px;width:50%;">
            <span style="color:${sealColors[kinData.oracle.occult.color] || 'rgba(255,255,255,0.5)'};font-size:12px;text-transform:uppercase;">Occult</span>
            <p style="color:#fff;margin:4px 0 0;font-size:14px;">${kinData.oracle.occult.name}</p>
          </td>
        </tr>
      </table>
    </div>
    ${astroSection(astro)}
    <div style="text-align:center;">
      <a href="https://pleiad.io/today" style="display:inline-block;background:#7D5BC9;color:#ffffff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:600;font-size:14px;">
        Explore Full Reading
      </a>
    </div>
  `
}
