import { getGroupWithMembers } from '@/lib/db/repositories/groups-repo'
import { getPersonWithTags, listPeopleWithTags } from '@/lib/db/repositories/people-repo'
import { isEntityId, toEntityId } from '@/lib/db/serialize'
import type { PersonWithTags } from '@/lib/hooks/use-people'
import type { GroupWithMembers } from '@/lib/types/relationship'

/**
 * Server reads for the signed-in people pages, typed with the API's row
 * contract. Ownership is enforced by the repositories; a record owned by
 * someone else reads as missing.
 */

/** A route segment as an entity id, or null when it cannot be one. */
export const routeId = (raw: string): string | null => (isEntityId(raw) ? toEntityId(raw) : null)

export async function ownedPeople(userId: string): Promise<readonly PersonWithTags[]> {
  const { people } = await listPeopleWithTags(userId)
  return people
}

export const ownedPerson = (userId: string, id: string): Promise<PersonWithTags | null> => getPersonWithTags(userId, id)

export const ownedCircle = (userId: string, id: string): Promise<GroupWithMembers | null> => getGroupWithMembers(userId, id)
