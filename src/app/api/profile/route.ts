import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { updateSchema } from './schemas'
import { getDb } from '@/lib/db/client'
import { profiles, users } from '@/lib/db/schema'
import { serialize } from '@/lib/db/serialize'
import { notifyNewSignup } from '@/lib/alerts'
import { getSession, UnauthorizedError, type SessionUser } from '@/lib/auth-server'
import { upsertSelfPerson } from '@/lib/db/repositories/people-repo'

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
  // `.returning()` on a conflict-do-nothing insert yields a row only when this
  // call actually created the profile — which is the moment a user first exists
  // to us. This route runs on every GET /api/profile, so it is the only honest
  // new-user signal available, and letting the database arbitrate means
  // concurrent first requests still ping exactly once.
  const inserted = await db
    .insert(profiles)
    .values({ user_id: user.id, display_name, avatar_url: user.image })
    .onConflictDoNothing()
    .returning({ id: profiles.id })

  if (inserted.length > 0 && user.email) {
    void notifyNewSignup({ kind: 'app_user', email: user.email, name: user.name })
  }

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

    // Mirror the profile into the owner's "self" person so the user is on
    // their own map. Runs once onboarding is complete and whenever identity
    // fields change afterwards; the self entry is exempt from the plan cap.
    if (profile?.onboarding_completed && profile.birth_date) {
      const identityKeys = [
        'display_name',
        'hebrew_name',
        'birth_date',
        'birth_time',
        'birth_place',
        'onboarding_completed',
      ] as const
      if (identityKeys.some((k) => k in updates)) {
        await upsertSelfPerson(session.user.id, {
          name: profile.display_name,
          hebrew_name: profile.hebrew_name,
          birth_date: profile.birth_date,
          birth_time: profile.birth_time,
          birth_place: profile.birth_place,
          avatar_url: profile.avatar_url,
        })
      }
    }

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
