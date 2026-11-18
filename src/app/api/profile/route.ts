import { NextResponse } from 'next/server'
import { z } from 'zod'
import { updateSchema } from './schemas'
import { serialize } from '@/lib/db/serialize'
import { getSession, UnauthorizedError } from '@/lib/auth-server'
import { ensureUserAndProfile, updateOwnProfile } from '@/lib/services/profile'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) throw new UnauthorizedError()
    const profile = await ensureUserAndProfile(session.user, request)
    return NextResponse.json({ profile: serialize(profile) ?? null })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('GET /api/profile failed:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session) throw new UnauthorizedError()
    const body = await request.json()
    const updates = updateSchema.parse(body)

    const profile = await updateOwnProfile(session.user, updates, request)

    return NextResponse.json({ profile: serialize(profile) })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }
    console.error('PATCH /api/profile failed:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
