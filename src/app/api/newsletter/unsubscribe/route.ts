import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimiters, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limit'
import { unsubscribe } from '@/lib/db/repositories/newsletter-repo'

export const dynamic = 'force-dynamic'

// Zod schema for request validation
const unsubscribeSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .transform((val) => val.toLowerCase().trim()),
})

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
      const errors = parseResult.error.issues.map((e) => e.message).join(', ')
      return NextResponse.json({ error: errors }, { status: 400 })
    }

    const { email: normalizedEmail } = parseResult.data

    await unsubscribe(normalizedEmail)

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

  const normalizedEmail = email.toLowerCase().trim()

  await unsubscribe(normalizedEmail)

  // Redirect to unsubscribe confirmation page
  return NextResponse.redirect(new URL('/unsubscribe?success=true', request.url))
}
