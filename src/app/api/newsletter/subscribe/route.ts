import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

// Create server-side Supabase client
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    // Fall back to anon key for local dev
    return createClient(
      url || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )
  }

  return createClient(url, serviceKey)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const normalizedEmail = email.toLowerCase().trim()

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, unsubscribed_at')
      .eq('email', normalizedEmail)
      .single()

    if (existing) {
      if (existing.unsubscribed_at) {
        // Re-subscribe
        const { error } = await supabase
          .from('newsletter_subscribers')
          .update({
            unsubscribed_at: null,
            subscribed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (error) {
          console.error('Error re-subscribing:', error)
          return NextResponse.json(
            { error: 'Failed to re-subscribe' },
            { status: 500 }
          )
        }

        return NextResponse.json({ success: true, message: 'Welcome back!' })
      }

      // Already subscribed
      return NextResponse.json({ success: true, message: 'Already subscribed' })
    }

    // New subscriber
    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: normalizedEmail,
        confirmed: true,
        confirmed_at: new Date().toISOString(),
        preferences: { daily_kin: true }
      })

    if (insertError) {
      // Handle unique constraint violation
      if (insertError.code === '23505') {
        return NextResponse.json({ success: true, message: 'Already subscribed' })
      }
      console.error('Error inserting subscriber:', insertError)
      return NextResponse.json(
        { error: 'Failed to subscribe' },
        { status: 500 }
      )
    }

    // Send welcome email if Resend is configured
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'Omnis <noreply@omnis.app>',
          to: normalizedEmail,
          subject: 'Welcome to Omnis - Your Cosmic Journey Begins',
          html: getWelcomeEmailHtml()
        })
      } catch (emailError) {
        // Log but don't fail the subscription
        console.error('Error sending welcome email:', emailError)
      }
    }

    return NextResponse.json({ success: true, message: 'Subscribed successfully' })
  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getWelcomeEmailHtml(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 40px;">
      <span style="color: #c9a55c; font-size: 32px;">*</span>
      <h1 style="color: #ffffff; font-size: 28px; margin: 10px 0;">Welcome to Omnis</h1>
    </div>
    <div style="background: linear-gradient(180deg, rgba(201, 165, 92, 0.1) 0%, rgba(201, 165, 92, 0.05) 100%); border: 1px solid rgba(201, 165, 92, 0.3); border-radius: 12px; padding: 30px; margin-bottom: 30px;">
      <h2 style="color: #c9a55c; font-size: 20px; margin: 0 0 15px;">Your Cosmic Journey Begins</h2>
      <p style="color: #a0a0a0; line-height: 1.6; margin: 0 0 20px;">
        Thank you for joining Omnis! You'll now receive daily cosmic guidance featuring Today's Kin from the Dreamspell calendar.
      </p>
      <ul style="color: #a0a0a0; line-height: 1.8; margin: 0 0 20px; padding-left: 20px;">
        <li>The day's galactic signature (Kin)</li>
        <li>Solar Seal and Galactic Tone meanings</li>
        <li>Your daily affirmation (mantra)</li>
        <li>Oracle relationships for deeper insight</li>
      </ul>
    </div>
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="https://omnis.app/today" style="display: inline-block; background: linear-gradient(90deg, #c9a55c 0%, #e8d5a3 50%, #c9a55c 100%); color: #0a0a0f; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600;">
        View Today's Kin
      </a>
    </div>
    <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
      <p style="color: #666; font-size: 12px;">
        <a href="https://omnis.app/unsubscribe" style="color: #888;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
`
}
