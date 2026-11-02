import { ownedPerson, routeId } from '@/lib/atlas/app/owned'
import { requireUserId } from '@/lib/auth-server'

/** The `?person=` a system page was opened with (the person page links each system that way). */
export type PersonParam = string | readonly string[] | undefined

/**
 * The requested person's id when the signed-in account owns that person,
 * else null, so the page falls back to the account's own person.
 */
export async function requestedPersonId(param: PersonParam): Promise<string | null> {
  const raw = typeof param === 'string' ? param : param?.[0]
  const id = raw ? routeId(raw) : null
  if (!id) return null
  const person = await ownedPerson(await requireUserId(), id)
  return person ? person.id : null
}
