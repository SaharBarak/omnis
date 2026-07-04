/**
 * Local smoke test for the Drizzle repositories against a real Postgres.
 * Exercises the owner-scoped CRUD + tenant-isolation guards end-to-end.
 * Run with DATABASE_URL pointed at a local pgvector Postgres:
 *   DATABASE_URL=postgresql://postgres:omnisx@localhost:5433/omnisx \
 *     npx tsx scripts/smoke-repos.ts
 */
import { createPerson, listPeopleWithTags, updatePerson, softDeletePerson } from '@/lib/db/repositories/people-repo'
import { createGroup, getGroupWithMembers, addMemberToGroup } from '@/lib/db/repositories/groups-repo'
import { createRelationship } from '@/lib/db/repositories/relationships-repo'
import { getUserPlan, incrementUsage, getUsage } from '@/lib/db/repositories/subscriptions-repo'

const A = 'auth0|userA'
const B = 'auth0|userB'
let pass = 0
let fail = 0
function ok(name: string, cond: boolean) {
  if (cond) { pass++; console.log('  ok  ', name) }
  else { fail++; console.log('  FAIL', name) }
}

async function main() {
  // People CRUD (user A)
  const p1 = await createPerson(A, { name: 'Maya Ronen', birth_date: '1990-05-15' })
  const p2 = await createPerson(A, { name: 'Ari Katz', birth_date: '1988-11-02' })
  ok('createPerson returns uuid id', /^[0-9a-f-]{36}$/.test(p1.id as string))

  const listA = await listPeopleWithTags(A)
  ok('listPeopleWithTags sees both', listA.people.length === 2)
  ok('list carries tags array', Array.isArray(listA.people[0].tags))

  // Tenant isolation: user B sees none of A's people
  const listB = await listPeopleWithTags(B)
  ok('tenant isolation: B sees 0 people', listB.people.length === 0)

  // Update + soft delete
  await updatePerson(A, p2.id as string, { notes: 'cofounder' })
  const afterSoft = await softDeletePerson(A, p2.id as string)
  ok('softDeletePerson true', afterSoft === true)
  const listA2 = await listPeopleWithTags(A)
  ok('soft-deleted person hidden', listA2.people.length === 1)

  // Relationship (bidirectional canonicalization → reversed dup rejected).
  // Use a fresh live person — p2 was soft-deleted above.
  const p3 = await createPerson(A, { name: 'Noa Bar', birth_date: '1992-03-21' })
  await createRelationship(A, { person1_id: p1.id as string, person2_id: p3.id as string, type: 'friend' })
  let dupRejected = false
  try {
    await createRelationship(A, { person1_id: p3.id as string, person2_id: p1.id as string, type: 'friend' })
  } catch (e) {
    dupRejected = (e as Error).name === 'DuplicateRelationshipError'
  }
  ok('reversed bidirectional relationship rejected', dupRejected)

  // Groups + IDOR guard: A cannot add B's (nonexistent-to-A) person
  const g = await createGroup(A, { name: 'Home circle' }, [p1.id as string])
  const withMembers = await getGroupWithMembers(A, g.id as string)
  ok('group has 1 owned member', withMembers?.members.length === 1)

  const foreign = await createPerson(B, { name: 'Dana Levi', birth_date: '1995-01-01' })
  const idorResult = await addMemberToGroup(A, g.id as string, foreign.id as string)
  ok('IDOR: cross-tenant addMember rejected (not_found)', idorResult === 'not_found')
  const withMembers2 = await getGroupWithMembers(A, g.id as string)
  ok('group still has only owned member', withMembers2?.members.length === 1)

  // Billing: default plan free, usage increment
  const plan = await getUserPlan(A)
  ok('getUserPlan default free', plan === 'free')
  await incrementUsage(A, '2026-07', 'profiles_count', 2)
  await incrementUsage(A, '2026-07', 'profiles_count', 3)
  const usage = await getUsage(A, '2026-07')
  ok('usage increment accumulates to 5', usage?.profiles_count === 5)

  console.log(`\n${pass} passed, ${fail} failed`)
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((e) => { console.error(e); process.exit(1) })
