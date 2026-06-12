import { connectMongo } from '@/lib/db/connection'
import { Person, Tag, PersonTag } from '@/lib/db/models'
import { serialize, serializeMany, toObjectId } from '@/lib/db/serialize'

/**
 * People domain repository. Every function is scoped to the authenticated
 * `userId` (Better Auth id). This is the only place tenant isolation for
 * people/tags is enforced now that Postgres RLS is gone — callers MUST pass the
 * id from requireUserId(), never from client input.
 */

export interface PersonInput {
  name: string
  hebrew_name?: string | null
  birth_date: string
  birth_time?: string | null
  birth_place?: { lat?: number; lng?: number; name?: string } | null
  avatar_url?: string | null
  notes?: string | null
  is_self?: boolean
}

export type PersonUpdateInput = Partial<PersonInput> & {
  deleted_at?: string | null
}

export async function listPeopleWithTags(userId: string) {
  await connectMongo()

  const [people, tags] = await Promise.all([
    Person.find({ owner_id: userId, deleted_at: null }).sort({ name: 1 }).lean(),
    Tag.find({ $or: [{ is_system: true }, { owner_id: userId }] })
      .sort({ sort_order: 1 })
      .lean(),
  ])

  const peopleIds = people.map((p) => p._id)
  const personTags = peopleIds.length
    ? await PersonTag.find({ person_id: { $in: peopleIds } }).lean()
    : []

  const tagById = new Map(tags.map((t) => [String(t._id), t]))

  const peopleWithTags = people.map((person) => {
    const pTags = personTags
      .filter((pt) => String(pt.person_id) === String(person._id))
      .map((pt) => tagById.get(String(pt.tag_id)))
      .filter((t): t is NonNullable<typeof t> => Boolean(t))
    return { ...serialize(person), tags: serializeMany(pTags) }
  })

  return { people: peopleWithTags, tags: serializeMany(tags) }
}

async function setPersonTags(personObjId: ReturnType<typeof toObjectId>, tagIds: string[]) {
  await PersonTag.deleteMany({ person_id: personObjId })
  if (tagIds.length) {
    await PersonTag.insertMany(
      tagIds.map((tagId) => ({ person_id: personObjId, tag_id: toObjectId(tagId) })),
      { ordered: false }
    )
  }
}

export async function createPerson(
  userId: string,
  input: PersonInput,
  tagIds: string[] = []
) {
  await connectMongo()
  const person = await Person.create({ ...input, owner_id: userId })
  if (tagIds.length) {
    await setPersonTags(person._id, tagIds)
  }
  return serialize(person.toObject())
}

/** Returns the updated person, or null if it is not owned by the user. */
export async function updatePerson(
  userId: string,
  id: string,
  updates: PersonUpdateInput,
  tagIds?: string[]
) {
  await connectMongo()
  const personObjId = toObjectId(id)

  const person = await Person.findOneAndUpdate(
    { _id: personObjId, owner_id: userId },
    { $set: updates },
    { new: true }
  ).lean()

  if (!person) return null

  if (tagIds !== undefined) {
    await setPersonTags(personObjId, tagIds)
  }

  return serialize(person)
}

export async function softDeletePerson(userId: string, id: string) {
  await connectMongo()
  const res = await Person.updateOne(
    { _id: toObjectId(id), owner_id: userId },
    { $set: { deleted_at: new Date() } }
  )
  return res.matchedCount > 0
}

export async function restorePerson(userId: string, id: string) {
  await connectMongo()
  const res = await Person.updateOne(
    { _id: toObjectId(id), owner_id: userId },
    { $set: { deleted_at: null } }
  )
  return res.matchedCount > 0
}

export async function permanentlyDeletePerson(userId: string, id: string) {
  await connectMongo()
  const personObjId = toObjectId(id)
  const res = await Person.deleteOne({ _id: personObjId, owner_id: userId })
  if (res.deletedCount > 0) {
    await PersonTag.deleteMany({ person_id: personObjId })
  }
  return res.deletedCount > 0
}

export async function listTags(userId: string) {
  await connectMongo()
  const tags = await Tag.find({ $or: [{ is_system: true }, { owner_id: userId }] })
    .sort({ sort_order: 1 })
    .lean()
  return serializeMany(tags)
}

export async function createTag(
  userId: string,
  tag: { name: string; hebrew_name: string; color: string }
) {
  await connectMongo()
  const created = await Tag.create({ ...tag, owner_id: userId, is_system: false })
  return serialize(created.toObject())
}

/** Deletes a non-system tag owned by the user. Returns true if removed. */
export async function deleteTag(userId: string, id: string) {
  await connectMongo()
  const tagObjId = toObjectId(id)
  const res = await Tag.deleteOne({
    _id: tagObjId,
    owner_id: userId,
    is_system: false,
  })
  if (res.deletedCount > 0) {
    await PersonTag.deleteMany({ tag_id: tagObjId })
  }
  return res.deletedCount > 0
}
