import { auth0 } from '@/lib/auth0'

/**
 * Server-side session helpers. These are the single source of truth for "who
 * is the authenticated user" and the backbone of tenant scoping — every
 * owner-scoped query must derive its filter from requireUserId(), never from
 * client input. Same public API as the Better Auth era; the Auth0 session
 * user is mapped to the old shape (id = Auth0 sub).
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
  if (!session?.user?.sub) return null
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
