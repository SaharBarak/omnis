import { eq } from 'drizzle-orm'

import { notifyNewSignup } from '@/lib/alerts'
import type { SessionUser } from '@/lib/auth-server'
import { getDb } from '@/lib/db/client'
import { profiles, users } from '@/lib/db/schema'

export async function ensureUserAndProfile(user: SessionUser) {
  const db = getDb()
  const now = new Date().toISOString()

  await db
    .insert(users)
    .values({ id: user.id, email: user.email, name: user.name, image: user.image })
    .onConflictDoUpdate({
      target: users.id,
      set: { email: user.email, name: user.name, image: user.image, updated_at: now },
    })

  const displayName = user.name || (user.email ? user.email.split('@')[0] : '') || 'User'
  const inserted = await db
    .insert(profiles)
    .values({ user_id: user.id, display_name: displayName, avatar_url: user.image })
    .onConflictDoNothing()
    .returning({ id: profiles.id })

  if (inserted.length > 0 && user.email) {
    await notifyNewSignup({ kind: 'app_user', email: user.email, name: user.name })
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.user_id, user.id))
    .limit(1)

  return profile
}
