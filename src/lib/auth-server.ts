import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

import { getSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Server-side session helpers. These are the single source of truth for "who
 * is the authenticated user" and the backbone of tenant scoping — every
 * owner-scoped query must derive its filter from requireUserId(), never from
 * client input.
 *
 * Two authentication paths, checked in order:
 * 1. Supabase auth cookies (web), refreshed by the middleware.
 * 2. `Authorization: Bearer <Supabase access token>` (native clients).
 * Both yield the Supabase user id (a UUID), so tenant scoping is identical.
 */

export interface SessionUser {
  id: string
  email: string
  name: string | null
  image: string | null
}

export interface AppSession {
  user: SessionUser
}

type SupabaseUserLike = {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}

/**
 * Supabase puts OAuth profile fields in user_metadata under provider-specific
 * keys — Google sends `name`/`avatar_url`, others `full_name`/`picture`. Read
 * every spelling rather than trusting one, or a display name silently becomes
 * null for some providers.
 */
function toSessionUser(user: SupabaseUserLike): SessionUser {
  const meta = user.user_metadata ?? {}
  const pick = (...keys: string[]): string | null => {
    for (const key of keys) {
      const value = meta[key]
      if (typeof value === 'string' && value.length > 0) return value
    }
    return null
  }
  return {
    id: user.id,
    email: user.email ?? pick('email') ?? '',
    name: pick('name', 'full_name', 'preferred_username'),
    image: pick('avatar_url', 'picture'),
  }
}

export async function getSession(): Promise<AppSession | null> {
  const supabase = await getSupabaseServerClient()
  // getUser() revalidates the token against Supabase — unlike getSession(),
  // which trusts the cookie. Never trust the cookie for authorization.
  const { data, error } = await supabase.auth.getUser()
  if (!error && data.user) {
    return { user: toSessionUser(data.user) }
  }
  return getBearerSession()
}

async function getBearerSession(): Promise<AppSession | null> {
  let authorization: string | null
  try {
    authorization = (await headers()).get('authorization')
  } catch {
    // Outside a request scope (e.g. build-time) there is no bearer session.
    return null
  }
  if (!authorization?.startsWith('Bearer ')) return null
  const token = authorization.slice('Bearer '.length).trim()
  if (!token) return null

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null

  const supabase = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return { user: toSessionUser(data.user) }
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession()
  return session?.user?.id ?? null
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

/** Returns the authenticated user id or throws UnauthorizedError. */
export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId()
  if (!userId) throw new UnauthorizedError()
  return userId
}
