import { connectMongo } from '@/lib/db/connection'
import { Group, GroupMember, Person } from '@/lib/db/models'
import { serialize, serializeMany, toObjectId } from '@/lib/db/serialize'

/**
 * Groups domain repository. Every function is scoped to the authenticated
 * `userId` (Better Auth id). This is the only place tenant isolation for
 * groups/group_members is enforced now that Postgres RLS is gone — callers MUST
 * pass the id from requireUserId(), never from client input.
 *
 * Member operations verify the parent group is owned by the user before any
 * mutation of group_members, so a caller can never attach members to (or read
 * members of) a group they do not own.
 */

export interface GroupInput {
  name: string
  description?: string | null
}

export type GroupUpdateInput = Partial<GroupInput>

/** Confirm the group exists and belongs to the user. Returns its ObjectId or null. */
async function assertOwnedGroup(userId: string, groupId: string) {
  const groupObjId = toObjectId(groupId)
  const group = await Group.findOne({ _id: groupObjId, owner_id: userId })
    .select('_id')
    .lean()
  return group ? groupObjId : null
}

export async function listGroups(userId: string) {
  await connectMongo()
  const groups = await Group.find({ owner_id: userId }).sort({ name: 1 }).lean()
  return serializeMany(groups)
}

/**
 * Reimplements the Postgres RPC `get_group_with_members(p_group_id)`.
 * Returns the group joined to its members (each member projected from the
 * people doc plus the membership `added_at`), or null if the group does not
 * exist or is not owned by the user. The `members` array preserves the exact
 * JSON shape the old RPC returned:
 *   { id, name, hebrew_name, birth_date, added_at }
 */
export async function getGroupWithMembers(userId: string, groupId: string) {
  await connectMongo()
  const groupObjId = toObjectId(groupId)

  const group = await Group.findOne({ _id: groupObjId, owner_id: userId }).lean()
  if (!group) return null

  const memberships = await GroupMember.find({ group_id: groupObjId })
    .sort({ added_at: 1 })
    .lean()

  const personIds = memberships.map((m) => m.person_id)
  const people = personIds.length
    ? await Person.find({ _id: { $in: personIds } })
        .select('name hebrew_name birth_date birth_time birth_place')
        .lean()
    : []

  const personById = new Map(people.map((p) => [String(p._id), p]))

  const members = memberships
    .map((m) => {
      const person = personById.get(String(m.person_id))
      if (!person) return null
      return {
        id: String(person._id),
        name: person.name,
        hebrew_name: person.hebrew_name ?? null,
        birth_date: person.birth_date,
        birth_time: person.birth_time ?? null,
        birth_place: person.birth_place
          ? { lat: person.birth_place.lat ?? null, lng: person.birth_place.lng ?? null }
          : null,
        added_at:
          m.added_at instanceof Date
            ? m.added_at.toISOString()
            : (m.added_at as unknown as string),
      }
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)

  return { ...serialize(group), members }
}

export async function createGroup(
  userId: string,
  input: GroupInput,
  personIds: string[] = []
) {
  await connectMongo()
  const group = await Group.create({
    owner_id: userId,
    name: input.name,
    description: input.description ?? null,
  })

  if (personIds.length) {
    await GroupMember.insertMany(
      personIds.map((personId) => ({
        group_id: group._id,
        person_id: toObjectId(personId),
      })),
      { ordered: false }
    )
  }

  return serialize(group.toObject())
}

/** Returns the updated group, or null if it is not owned by the user. */
export async function updateGroup(
  userId: string,
  id: string,
  updates: GroupUpdateInput
) {
  await connectMongo()
  const group = await Group.findOneAndUpdate(
    { _id: toObjectId(id), owner_id: userId },
    { $set: updates },
    { new: true }
  ).lean()

  if (!group) return null
  return serialize(group)
}

/** Deletes a group owned by the user and its memberships. Returns true if removed. */
export async function deleteGroup(userId: string, id: string) {
  await connectMongo()
  const groupObjId = toObjectId(id)
  const res = await Group.deleteOne({ _id: groupObjId, owner_id: userId })
  if (res.deletedCount > 0) {
    await GroupMember.deleteMany({ group_id: groupObjId })
  }
  return res.deletedCount > 0
}

/**
 * Adds a member to a group the user owns.
 * Returns 'ok', 'not_found' (group missing/not owned), or 'duplicate'.
 */
export async function addMemberToGroup(
  userId: string,
  groupId: string,
  personId: string
): Promise<'ok' | 'not_found' | 'duplicate'> {
  await connectMongo()
  const groupObjId = await assertOwnedGroup(userId, groupId)
  if (!groupObjId) return 'not_found'

  const personObjId = toObjectId(personId)
  try {
    await GroupMember.create({ group_id: groupObjId, person_id: personObjId })
    return 'ok'
  } catch (error) {
    // Duplicate key on the unique (group_id, person_id) index.
    if ((error as { code?: number }).code === 11000) return 'duplicate'
    throw error
  }
}

/**
 * Removes a member from a group the user owns.
 * Returns false if the group is missing/not owned (membership left untouched).
 */
export async function removeMemberFromGroup(
  userId: string,
  groupId: string,
  personId: string
): Promise<boolean> {
  await connectMongo()
  const groupObjId = await assertOwnedGroup(userId, groupId)
  if (!groupObjId) return false

  await GroupMember.deleteOne({
    group_id: groupObjId,
    person_id: toObjectId(personId),
  })
  return true
}

/**
 * Replaces all members of a group the user owns with the given person ids.
 * Returns false if the group is missing/not owned.
 */
export async function setGroupMembers(
  userId: string,
  groupId: string,
  personIds: string[]
): Promise<boolean> {
  await connectMongo()
  const groupObjId = await assertOwnedGroup(userId, groupId)
  if (!groupObjId) return false

  await GroupMember.deleteMany({ group_id: groupObjId })
  if (personIds.length) {
    await GroupMember.insertMany(
      personIds.map((personId) => ({
        group_id: groupObjId,
        person_id: toObjectId(personId),
      })),
      { ordered: false }
    )
  }
  return true
}
