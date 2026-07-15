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

type Claims = {
  sub: string
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}

/**
 * Supabase puts OAuth profile fields in user_metadata under provider-specific
 * keys — Google sends `name`/`avatar_url`, others `full_name`/`picture`. Read
 * every spelling rather than trusting one, or a display name silently becomes
 * null for some providers.
 */
function toSessionUser(claims: Claims): SessionUser {
  const meta = claims.user_metadata ?? {}
  const pick = (...keys: string[]): string | null => {
    for (const key of keys) {
      const value = meta[key]
      if (typeof value === 'string' && value.length > 0) return value
    }
    return null
  }
  return {
    id: claims.sub,
    email: claims.email ?? pick('email') ?? '',
    name: pick('name', 'full_name', 'preferred_username'),
    image: pick('avatar_url', 'picture'),
  }
}

export async function getSession(): Promise<AppSession | null> {
  const supabase = await getSupabaseServerClient()
  // getClaims() verifies the token's signature LOCALLY against the project's
  // cached JWKS (asymmetric ES256) — no network round trip per request, unlike
  // getUser(). It checks signature + expiry but not server-side revocation; for
  // this app that trade (a revoked token stays valid until it expires, ≤1h) is
  // worth eliminating a ~400ms hop on every authorized call.
  const { data, error } = await supabase.auth.getClaims()
  if (!error && data?.claims?.sub) {
    return { user: toSessionUser(data.claims as Claims) }
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
  const { data, error } = await supabase.auth.getClaims(token)
  if (error || !data?.claims?.sub) return null
  return { user: toSessionUser(data.claims as Claims) }
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
