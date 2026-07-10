import { headers } from 'next/headers'

import { auth0 } from '@/lib/auth0'
import { verifyBearer } from '@/lib/api/bearer-auth'

/**
 * Server-side session helpers. These are the single source of truth for "who
 * is the authenticated user" and the backbone of tenant scoping — every
 * owner-scoped query must derive its filter from requireUserId(), never from
 * client input. Same public API as the Better Auth era; the Auth0 session
 * user is mapped to the old shape (id = Auth0 sub).
 *
 * Two authentication paths, checked in order:
 * 1. Auth0 encrypted session cookie (web).
 * 2. `Authorization: Bearer <Auth0 access token>` (native clients, AUTH-M1) —
 *    verified against the tenant JWKS with a required audience. Disabled
 *    unless AUTH0_API_AUDIENCE is configured.
 * Both yield the Auth0 `sub` as the user id, so tenant scoping is identical.
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

export async function getSession(): Promise<AppSession | null> {
  const session = await auth0.getSession()
  if (session?.user?.sub) {
    const { user } = session
    return {
      user: {
        id: user.sub,
        email: user.email ?? '',
        name: user.name ?? null,
        image: user.picture ?? null,
      },
    }
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
  const identity = await verifyBearer(authorization)
  if (!identity) return null
  return {
    user: {
      id: identity.id,
      email: identity.email,
      name: identity.name,
      image: null,
    },
  }
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
