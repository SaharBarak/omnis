import { and, gte, eq, sql, inArray } from 'drizzle-orm'

import { getDb } from '@/lib/db/client'
import { users, subscriptions } from '@/lib/db/schema'
import type { UsersData, RevenueData } from '@/lib/services/briefing/types'

/**
 * System-level reads for the daily briefing. Cross-tenant by design (the cron
 * has no user), authorized solely by CRON_SECRET at the route. No PII leaves
 * here — only counts and plan labels.
 */

/** Plans that count as "paid" (everything except the free tier). */
const PAID_PLANS = ['explorer', 'complete', 'practitioner', 'lifetime']
/** Subscription statuses that count as live revenue. */
const LIVE_STATUSES = ['active', 'trialing']

export async function systemUserStats(sinceIso: string, prevSinceIso: string, weekAgoIso: string): Promise<UsersData> {
  const db = getDb()
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      new24h: sql<number>`count(*) filter (where ${users.created_at} >= ${sinceIso})::int`,
      prev24h: sql<number>`count(*) filter (where ${users.created_at} >= ${prevSinceIso} and ${users.created_at} < ${sinceIso})::int`,
      new7d: sql<number>`count(*) filter (where ${users.created_at} >= ${weekAgoIso})::int`,
    })
    .from(users)

  // Engagement: people on maps, and how many users actually built / read a map.
  // Fault-isolated on its own so a query issue here can never blank the core
  // registration numbers above.
  let peopleTotal = 0
  let activeUsers = 0
  let usersWithReadings = 0
  try {
    const rows = (await db.execute(sql`
      select
        (select count(*)::int from people where deleted_at is null) as people_total,
        (select count(distinct owner_id)::int from people where deleted_at is null) as active_users,
        (select count(distinct p.owner_id)::int
           from computed_results c join people p on p.id = c.person_id
          where p.deleted_at is null) as users_with_readings
    `)) as unknown as Array<{
      people_total: number
      active_users: number
      users_with_readings: number
    }>
    const r = rows[0]
    peopleTotal = Number(r?.people_total ?? 0)
    activeUsers = Number(r?.active_users ?? 0)
    usersWithReadings = Number(r?.users_with_readings ?? 0)
  } catch (err) {
    console.error('[briefing] engagement stats failed:', err)
  }

  return {
    total: row?.total ?? 0,
    new24h: row?.new24h ?? 0,
    prev24h: row?.prev24h ?? 0,
    new7d: row?.new7d ?? 0,
    peopleTotal,
    activeUsers,
    usersWithReadings,
  }
}

export async function systemRevenueStats(sinceIso: string): Promise<RevenueData> {
  const db = getDb()

  // New paid subs in the window.
  const [newRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(subscriptions)
    .where(
      and(
        inArray(subscriptions.plan, PAID_PLANS),
        inArray(subscriptions.status, LIVE_STATUSES),
        gte(subscriptions.created_at, sinceIso),
      ),
    )

  // Active paid subs grouped by plan.
  const byPlan = await db
    .select({ plan: subscriptions.plan, count: sql<number>`count(*)::int` })
    .from(subscriptions)
    .where(and(inArray(subscriptions.plan, PAID_PLANS), inArray(subscriptions.status, LIVE_STATUSES)))
    .groupBy(subscriptions.plan)

  // Active paid subs set to cancel at period end.
  const [cancelRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(subscriptions)
    .where(
      and(
        inArray(subscriptions.plan, PAID_PLANS),
        inArray(subscriptions.status, LIVE_STATUSES),
        eq(subscriptions.cancel_at_period_end, true),
      ),
    )

  const activePaidByPlan = byPlan
    .map((r) => ({ plan: r.plan, count: r.count }))
    .sort((a, b) => b.count - a.count)

  return {
    newPaid24h: newRow?.n ?? 0,
    activePaidByPlan,
    activePaidTotal: activePaidByPlan.reduce((s, r) => s + r.count, 0),
    canceling: cancelRow?.n ?? 0,
  }
}
