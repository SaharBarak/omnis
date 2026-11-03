import { NextResponse } from 'next/server'
import { countBoards } from '@/lib/db/repositories/boards-repo'
import { getPlanLimits, PLANS, type PlanTier } from '@/lib/services/billing'
import { getUserPlan } from '@/lib/services/usage'

/**
 * Whether the user may add one more board: the plan's board cap (free = 0,
 * boards are a paid feature), counted from the boards they own. Every route
 * that adds a board, by creating or by duplicating, asks here. The count runs
 * beside the plan read: it only matters for capped tiers, but a cheap unused
 * count beats a serial round trip.
 */
export async function boardEntitlement(userId: string): Promise<{
  readonly plan: PlanTier
  readonly limits: ReturnType<typeof getPlanLimits>
  readonly refusal: NextResponse | null
}> {
  const [plan, existing] = await Promise.all([getUserPlan(userId), countBoards(userId)])
  const limits = getPlanLimits(plan)
  const cap = limits.boards
  const refusal =
    cap !== Infinity && existing >= cap
      ? NextResponse.json(
          {
            error:
              cap === 0
                ? `Boards aren't included on ${PLANS[plan].name}. Upgrade to create boards.`
                : `You've reached your plan's limit of ${cap} boards on ${PLANS[plan].name}. Upgrade for more.`,
            code: 'limit_exceeded',
          },
          { status: 403 }
        )
      : null
  return { plan, limits, refusal }
}
