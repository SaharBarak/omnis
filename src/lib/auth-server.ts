import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

/**
 * Server-side session helpers. These are the single source of truth for "who
 * is the authenticated user" and the backbone of tenant scoping now that
 * Postgres RLS is gone — every owner-scoped query must derive its filter from
 * requireUserId(), never from client input.
 */

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
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
