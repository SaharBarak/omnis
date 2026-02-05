import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { rateLimiters, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// Zod schema for request validation
const unsubscribeSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .transform((val) => val.toLowerCase().trim()),
})

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return createClient(url || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
  }

  return createClient(url, serviceKey)
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitResult = await rateLimiters.newsletter.check(request, 'unsubscribe')
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult)
    }

    const body = await request.json()

    // Validate with Zod
    const parseResult = unsubscribeSchema.safeParse(body)
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((e) => e.message).join(', ')
      return NextResponse.json({ error: errors }, { status: 400 })
    }

    const { email: normalizedEmail } = parseResult.data
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('email', normalizedEmail)

    if (error) {
      console.error('Error unsubscribing:', error)
      return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
    }

    const response = NextResponse.json({ success: true, message: 'Unsubscribed successfully' })
    return addRateLimitHeaders(response, rateLimitResult)
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Also support GET for unsubscribe links in emails
export async function GET(request: NextRequest) {
  // Rate limiting check for GET as well
  const rateLimitResult = await rateLimiters.newsletter.check(request, 'unsubscribe-link')
  if (!rateLimitResult.success) {
    // For GET requests, redirect to error page instead of JSON response
    return NextResponse.redirect(new URL('/unsubscribe?error=rate_limit', request.url))
  }

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
      updated_at: new Date().toISOString(),
    })
    .eq('email', normalizedEmail)

  // Redirect to unsubscribe confirmation page
  return NextResponse.redirect(new URL('/unsubscribe?success=true', request.url))
}
