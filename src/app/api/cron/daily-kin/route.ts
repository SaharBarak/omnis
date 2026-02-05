import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { dateToKin, kinToSeal, kinToTone, calculateOracle } from '@/lib/calculations'
import { getSeal } from '@/lib/data/seals'
import { getTone } from '@/lib/data/tones'
import { generateMantra } from '@/lib/data/mantras'

export const dynamic = 'force-dynamic'

// This endpoint is called by Vercel Cron
// Configure in vercel.json: {"crons": [{"path": "/api/cron/daily-kin", "schedule": "0 6 * * *"}]}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return createClient(
      url || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )
  }

  return createClient(url, serviceKey)
}

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // In development, allow without auth
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
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

    // Get active subscribers
    const supabase = getSupabaseAdmin()
    const { data: subscribers, error: fetchError } = await supabase
      .from('newsletter_subscribers')
      .select('id, email')
      .eq('confirmed', true)
      .is('unsubscribed_at', null)

    if (fetchError) {
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
    const resend = new Resend(process.env.RESEND_API_KEY)
    let sent = 0
    let failed = 0

    for (const subscriber of subscribers) {
      try {
        const { error: sendError } = await resend.emails.send({
          from: 'Omnis <noreply@omnis.app>',
          to: subscriber.email,
          subject: `Today's Kin: ${kinData.seal.name} - Kin ${kinData.kin}`,
          html: getDailyKinEmailHtml(kinData, subscriber.email)
        })

        if (sendError) {
          console.error(`Failed to send to ${subscriber.email}:`, sendError)
          failed++
        } else {
          sent++
          // Log successful send
          await supabase.from('email_send_log').insert({
            subscriber_id: subscriber.id,
            email_type: 'daily_kin',
            subject: `Today's Kin: ${kinData.seal.name} - Kin ${kinData.kin}`,
            status: 'sent'
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

function getDailyKinEmailHtml(kinData: KinData, subscriberEmail: string): string {
  const sealColors: Record<string, string> = {
    red: '#ef4444',
    white: '#f5f5f5',
    blue: '#3b82f6',
    yellow: '#eab308'
  }

  const sealColor = sealColors[kinData.seal.color] || '#c9a55c'
  const dateFormatted = new Date(kinData.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="color: #c9a55c; font-size: 24px;">*</span>
      <p style="color: #666; font-size: 14px; margin: 10px 0 0;">${dateFormatted}</p>
    </div>

    <div style="background: linear-gradient(180deg, rgba(201, 165, 92, 0.15) 0%, rgba(201, 165, 92, 0.05) 100%); border: 1px solid rgba(201, 165, 92, 0.3); border-radius: 16px; padding: 30px; margin-bottom: 30px; text-align: center;">
      <div style="background: ${sealColor}; color: ${kinData.seal.color === 'white' ? '#000' : '#fff'}; display: inline-block; padding: 8px 20px; border-radius: 20px; font-weight: 600; margin-bottom: 20px;">
        Kin ${kinData.kin}
      </div>

      <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 5px;">
        ${kinData.tone.name} ${kinData.seal.name}
      </h1>
      <p style="color: #888; font-size: 14px; margin: 0 0 20px;">
        ${kinData.tone.nameHebrew} ${kinData.seal.nameHebrew}
      </p>

      <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 20px; margin-top: 20px;">
        <p style="color: #c9a55c; font-style: italic; line-height: 1.6; margin: 0; white-space: pre-line;">
${kinData.mantra}
        </p>
      </div>
    </div>

    <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 25px; margin-bottom: 30px;">
      <h3 style="color: #c9a55c; font-size: 16px; margin: 0 0 15px; text-align: center;">Today's Oracle</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="text-align: center; padding: 10px; width: 50%;">
            <span style="color: ${sealColors[kinData.oracle.guide.color] || '#888'}; font-size: 12px; text-transform: uppercase;">Guide</span>
            <p style="color: #fff; margin: 5px 0 0; font-size: 14px;">${kinData.oracle.guide.name}</p>
          </td>
          <td style="text-align: center; padding: 10px; width: 50%;">
            <span style="color: ${sealColors[kinData.oracle.analog.color] || '#888'}; font-size: 12px; text-transform: uppercase;">Analog</span>
            <p style="color: #fff; margin: 5px 0 0; font-size: 14px;">${kinData.oracle.analog.name}</p>
          </td>
        </tr>
        <tr>
          <td style="text-align: center; padding: 10px; width: 50%;">
            <span style="color: ${sealColors[kinData.oracle.antipode.color] || '#888'}; font-size: 12px; text-transform: uppercase;">Antipode</span>
            <p style="color: #fff; margin: 5px 0 0; font-size: 14px;">${kinData.oracle.antipode.name}</p>
          </td>
          <td style="text-align: center; padding: 10px; width: 50%;">
            <span style="color: ${sealColors[kinData.oracle.occult.color] || '#888'}; font-size: 12px; text-transform: uppercase;">Occult</span>
            <p style="color: #fff; margin: 5px 0 0; font-size: 14px;">${kinData.oracle.occult.name}</p>
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-bottom: 30px;">
      <a href="https://omnis.app/today" style="display: inline-block; background: linear-gradient(90deg, #c9a55c 0%, #e8d5a3 50%, #c9a55c 100%); color: #0a0a0f; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-weight: 600; font-size: 14px;">
        Explore Full Reading
      </a>
    </div>

    <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
      <p style="color: #666; font-size: 12px; margin: 0 0 10px;">Daily Kin from Omnis</p>
      <p style="color: #666; font-size: 12px; margin: 0;">
        <a href="https://omnis.app/api/newsletter/unsubscribe?email=${encodeURIComponent(subscriberEmail)}" style="color: #888;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
`
}
