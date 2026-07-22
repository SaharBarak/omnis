import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limit'
import { emailFrom } from '@/lib/email/from'

export const dynamic = 'force-dynamic'

const CONTACT_TO = process.env.CONTACT_EMAIL || 'hello@pleiad.io'

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format')
    .transform((val) => val.toLowerCase().trim()),
  message: z.string().min(1, 'Message is required').max(5000),
})

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimiters.contact.check(request, 'send')
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult)
    }

    const body = await request.json()
    const parseResult = contactSchema.safeParse(body)
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => e.message).join(', ')
      return NextResponse.json({ error: errors }, { status: 400 })
    }

    const { name, email, message } = parseResult.data

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error('contact: RESEND_API_KEY not configured — message dropped')
      return NextResponse.json(
        { error: 'Contact form is not available right now. Email us directly instead.' },
        { status: 503 },
      )
    }

    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: emailFrom(),
      to: CONTACT_TO,
      replyTo: email,
      subject: `Contact form — ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    })

    if (error) {
      console.error('contact: send failed', error)
      return NextResponse.json(
        { error: 'Sending failed. Email us directly instead.' },
        { status: 502 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
