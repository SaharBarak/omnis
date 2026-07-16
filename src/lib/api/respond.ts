import { NextResponse } from 'next/server'
import { z } from 'zod'
import { UnauthorizedError } from '@/lib/auth-server'
import { BadIdError } from '@/lib/db/serialize'
import { sendCriticalAlert } from '@/lib/alerts'

/** Map known error types to HTTP responses; everything else is a 500. */
export function handleApiError(error: unknown, context: string): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (error instanceof BadIdError) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Invalid input', details: error.issues },
      { status: 400 }
    )
  }
  // Genuinely unexpected — the known 4xx cases are handled above. Log for the
  // record, and page a human (throttled, fire-and-forget so the response isn't
  // delayed if Resend is slow).
  console.error(`${context} failed:`, error)
  void sendCriticalAlert(context, error)
  return NextResponse.json({ error: 'Internal error' }, { status: 500 })
}
