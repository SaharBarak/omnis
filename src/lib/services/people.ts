import { createPerson, type PersonInput } from '@/lib/db/repositories/people-repo'
import { getPlanLimits, PLANS } from '@/lib/services/billing'
import { getPersistentUsage, getUserPlan } from '@/lib/services/usage'

type Created = Awaited<ReturnType<typeof createPerson>>

export type CreateWithinPlan =
  | { readonly ok: true; readonly person: Created }
  | { readonly ok: false; readonly code: 'limit_exceeded'; readonly message: string }

/**
 * The one write path for a new saved person (POST /api/people, the v2 keep
 * actions): the plan's cap on saved people, then the insert. The cap reads the
 * same count the subscription API reports, so what is enforced and what the
 * app shows cannot drift; the two reads run together.
 */
export async function createPersonWithinPlan(userId: string, person: PersonInput, tagIds: readonly string[] = []): Promise<CreateWithinPlan> {
  const [plan, usage] = await Promise.all([getUserPlan(userId), getPersistentUsage(userId)])
  const limit = getPlanLimits(plan).profiles
  if (limit !== Infinity && usage.profiles >= limit) {
    return {
      ok: false,
      code: 'limit_exceeded',
      message: `You've reached your plan's limit of ${limit} ${limit === 1 ? 'person' : 'people'} on ${PLANS[plan].name}. Upgrade to add more.`,
    }
  }
  return { ok: true, person: await createPerson(userId, person, [...tagIds]) }
}
