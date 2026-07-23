import { and, eq, sql } from 'drizzle-orm'

import { getDb } from '@/lib/db/client'
import { profiles } from '@/lib/db/schema'

export type InstallationChannel = 'native' | 'pwa'
export type InstallationPlatform = 'android' | 'ios' | 'web'

export interface InstallationInput {
  channel: InstallationChannel
  platform: InstallationPlatform
}

export async function registerFirstInstallation(
  userId: string,
  installation: InstallationInput
): Promise<boolean> {
  const db = getDb()
  const key = `${installation.channel}:${installation.platform}`
  const now = new Date().toISOString()
  const currentInstallations = sql`coalesce(${profiles.preferences}->'installations', '{}'::jsonb)`

  const updated = await db
    .update(profiles)
    .set({
      preferences: sql`${profiles.preferences} || jsonb_build_object(
        'installations',
        ${currentInstallations} || jsonb_build_object(${key}, ${now})
      )`,
      updated_at: now,
    })
    .where(
      and(
        eq(profiles.user_id, userId),
        sql`not (${currentInstallations} ? ${key})`
      )
    )
    .returning({ id: profiles.id })

  return updated.length > 0
}
