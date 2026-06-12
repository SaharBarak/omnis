import { NextResponse } from 'next/server'
import { z } from 'zod'
import { UnauthorizedError } from '@/lib/auth-server'
import { BadIdError } from '@/lib/db/serialize'

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
  console.error(`${context} failed:`, error)
  return NextResponse.json({ error: 'Internal error' }, { status: 500 })
}
