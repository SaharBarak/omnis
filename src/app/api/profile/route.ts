import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '@/lib/db/client'
import { profiles, users } from '@/lib/db/schema'
import { serialize } from '@/lib/db/serialize'
import { getSession, UnauthorizedError, type SessionUser } from '@/lib/auth-server'

const birthPlaceSchema = z
  .object({
    lat: z.number().optional(),
    lng: z.number().optional(),
    name: z.string().optional(),
  })
  .nullable()

const updateSchema = z.object({
  display_name: z.string().min(1).max(200).optional(),
  birth_date: z.string().optional().nullable(),
  birth_time: z.string().optional().nullable(),
  birth_place: birthPlaceSchema.optional(),
  hebrew_name: z.string().optional().nullable(),
  avatar_url: z.string().optional().nullable(),
  locale: z.enum(['he', 'en']).optional(),
  timezone: z.string().optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
  onboarding_completed: z.boolean().optional(),
})

/**
 * Identity bootstrap — upserts the Auth0 user into the local `users` mirror
 * and ensures an app profile exists. Replaces the Better Auth
 * databaseHooks.user.create.after hook; called by both GET and PATCH so a
 * profile is guaranteed before the first write, with no ordering dependency.
 */
async function ensureUserAndProfile(user: SessionUser) {
  const db = getDb()
  const now = new Date().toISOString()

  await db
    .insert(users)
    .values({ id: user.id, email: user.email, name: user.name, image: user.image })
    .onConflictDoUpdate({
      target: users.id,
      set: { email: user.email, name: user.name, image: user.image, updated_at: now },
    })

  const display_name = user.name || (user.email ? user.email.split('@')[0] : '') || 'User'
  await db
    .insert(profiles)
    .values({ user_id: user.id, display_name, avatar_url: user.image })
    .onConflictDoNothing()

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.user_id, user.id))
    .limit(1)
  return profile
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) throw new UnauthorizedError()
    const profile = await ensureUserAndProfile(session.user)
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

    // Guarantee the identity mirror + profile row exist before updating, so a
    // PATCH that lands before any GET (e.g. onboarding on a fresh session)
    // never 404s.
    await ensureUserAndProfile(session.user)

    const db = getDb()
    const [profile] = await db
      .update(profiles)
      .set({ ...updates, updated_at: new Date().toISOString() })
      .where(eq(profiles.user_id, session.user.id))
      .returning()

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
