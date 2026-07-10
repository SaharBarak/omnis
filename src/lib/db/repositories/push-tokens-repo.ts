import { and, eq, inArray } from 'drizzle-orm'

import { getDb } from '@/lib/db/client'
import { device_push_tokens } from '@/lib/db/schema'
import { serializeMany } from '@/lib/db/serialize'

/**
 * Device push-token registry (PUSH-M1). Owner-scoped writes take `userId`
 * from requireUserId(). Tokens are globally unique — re-registering a token
 * re-homes it to the registering user (device changed accounts).
 */

export interface SerializedPushToken {
  id: string
  user_id: string
  expo_push_token: string
  platform: string
  created_at: string
  updated_at: string
}

export async function registerPushToken(
  userId: string,
  expoPushToken: string,
  platform: 'ios' | 'android'
): Promise<void> {
  const db = getDb()
  await db
    .insert(device_push_tokens)
    .values({ user_id: userId, expo_push_token: expoPushToken, platform })
    .onConflictDoUpdate({
      target: device_push_tokens.expo_push_token,
      set: { user_id: userId, platform, updated_at: new Date().toISOString() },
    })
}

export async function unregisterPushToken(
  userId: string,
  expoPushToken: string
): Promise<boolean> {
  const db = getDb()
  const rows = await db
    .delete(device_push_tokens)
    .where(
      and(
        eq(device_push_tokens.user_id, userId),
        eq(device_push_tokens.expo_push_token, expoPushToken)
      )
    )
    .returning({ id: device_push_tokens.id })
  return rows.length > 0
}

/** Cron-only: tokens for a set of users (fan-out). */
export async function listPushTokensForUsers(
  userIds: string[]
): Promise<SerializedPushToken[]> {
  if (userIds.length === 0) return []
  const db = getDb()
  const rows = await db
    .select()
    .from(device_push_tokens)
    .where(inArray(device_push_tokens.user_id, userIds))
  return serializeMany(rows) as SerializedPushToken[]
}

/** Cron-only: drop tokens Expo reported as dead (DeviceNotRegistered). */
export async function deletePushTokens(tokens: string[]): Promise<void> {
  if (tokens.length === 0) return
  const db = getDb()
  await db
    .delete(device_push_tokens)
    .where(inArray(device_push_tokens.expo_push_token, tokens))
}
