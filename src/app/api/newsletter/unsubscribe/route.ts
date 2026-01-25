import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    const supabase = getSupabaseAdmin()
    const normalizedEmail = email.toLowerCase().trim()

    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', normalizedEmail)

    if (error) {
      console.error('Error unsubscribing:', error)
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Unsubscribed successfully' })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also support GET for unsubscribe links in emails
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const supabase = getSupabaseAdmin()
  const normalizedEmail = email.toLowerCase().trim()

  await supabase
    .from('newsletter_subscribers')
    .update({
      unsubscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('email', normalizedEmail)

  // Redirect to unsubscribe confirmation page
  return NextResponse.redirect(new URL('/unsubscribe?success=true', request.url))
}
