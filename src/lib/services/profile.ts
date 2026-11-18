import { eq } from 'drizzle-orm'
import { notifyNewSignup } from '@/lib/alerts'
import type { SessionUser } from '@/lib/auth-server'
import { getDb } from '@/lib/db/client'
import { upsertSelfPerson } from '@/lib/db/repositories/people-repo'
import { profiles, users } from '@/lib/db/schema'
import { trackServer } from '@/lib/analytics/server'

/** The profile columns an account writes for itself. */
export type ProfileChanges = Partial<
  Pick<
    typeof profiles.$inferInsert,
    | 'display_name'
    | 'birth_date'
    | 'birth_time'
    | 'birth_place'
    | 'hebrew_name'
    | 'avatar_url'
    | 'locale'
    | 'timezone'
    | 'preferences'
    | 'onboarding_completed'
  >
>

/** `method` when the session token names no auth provider. */
const UNKNOWN_AUTH_METHOD = 'unknown'

/** The fields the account's own person mirrors: a change to any of them rewrites that person. */
const IDENTITY_KEYS = ['display_name', 'hebrew_name', 'birth_date', 'birth_time', 'birth_place', 'onboarding_completed'] as const

/**
 * Identity bootstrap: upserts the auth user into the local `users` mirror and
 * ensures an app profile exists, so a profile is there before the first write
 * with no ordering dependency. The insert that creates the profile is the one
 * honest new-user signal, so it alone pings and reports `user_signed_up`;
 * the database arbitrates concurrent first requests. `request`, where there is
 * one, is the visitor's own: it carries their consent, and with it the event
 * names the account and joins the browser session that caused it. Without
 * it the event is unattributed (docs/analytics/north-star.md).
 */
export async function ensureUserAndProfile(user: SessionUser, request?: Request) {
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
  const inserted = await db
    .insert(profiles)
    .values({ user_id: user.id, display_name, avatar_url: user.image })
    .onConflictDoNothing()
    .returning({ id: profiles.id })

  if (inserted.length > 0) {
    trackServer('user_signed_up', {
      actor: { userId: user.id },
      properties: { method: user.provider ?? UNKNOWN_AUTH_METHOD },
      request,
    })
    if (user.email) {
      void notifyNewSignup({ kind: 'app_user', email: user.email, name: user.name })
    }
  }

  const [profile] = await db.select().from(profiles).where(eq(profiles.user_id, user.id)).limit(1)
  return profile
}

/**
 * The one write path for an account's own profile (PATCH /api/profile, the
 * v2 keep and change actions). Guarantees the identity rows first, writes the
 * changes, then mirrors the profile into the account's own person once
 * onboarding is complete and an identity field changed, so the user is on
 * their own map and the two never drift. The own person is free on every plan.
 * `request`, where the caller has the visitor's own, goes to
 * `ensureUserAndProfile` for its consent; a server action has none.
 */
export async function updateOwnProfile(user: SessionUser, changes: ProfileChanges, request?: Request) {
  await ensureUserAndProfile(user, request)

  const db = getDb()
  const [profile] = await db
    .update(profiles)
    .set({ ...changes, updated_at: new Date().toISOString() })
    .where(eq(profiles.user_id, user.id))
    .returning()

  if (profile?.onboarding_completed && profile.birth_date && IDENTITY_KEYS.some((key) => key in changes)) {
    await upsertSelfPerson(user.id, {
      name: profile.display_name,
      hebrew_name: profile.hebrew_name,
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      birth_place: profile.birth_place,
      avatar_url: profile.avatar_url,
    })
  }

  return profile
}
