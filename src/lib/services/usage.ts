/**
 * Usage Tracking Service
 * Tracks and enforces plan limits for users
 */

import { PLANS, PlanTier, getPlanLimits } from './billing'
import {
  getUserPlan as getUserPlanFromRepo,
  getUsage as getUsageFromRepo,
  incrementUsage as incrementUsageInRepo,
  type UsageMetric,
} from '@/lib/db/repositories/subscriptions-repo'
import { listPeopleWithTags } from '@/lib/db/repositories/people-repo'
import { listBoards } from '@/lib/db/repositories/boards-repo'

// Usage metrics (re-exported for existing consumers).
export type { UsageMetric }

export interface UsageData {
  userId: string
  period: string // YYYY-MM format
  profilesCount: number
  aiInterpretationsUsed: number
  boardsCount: number
  exportsCount: number
}

export interface LimitCheckResult {
  allowed: boolean
  current: number
  limit: number
  message?: string
}

// Mapping from usage metrics to plan limit keys
const metricToLimitKey: Record<UsageMetric, string> = {
  profiles_count: 'profiles',
  ai_interpretations_used: 'aiInterpretations',
  boards_count: 'boards',
  exports_count: 'exports',
}

/**
 * Get current period string (YYYY-MM)
 */
function getCurrentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Get user's current subscription plan
 */
export async function getUserPlan(userId: string): Promise<PlanTier> {
  // Validity logic (status + period_end check) lives in the repo, ported from
  // the Postgres get_user_plan RPC.
  return getUserPlanFromRepo(userId)
}

/**
 * Get current usage for a user
 */
export async function getCurrentUsage(userId: string): Promise<UsageData> {
  const period = getCurrentPeriod()
  const data = await getUsageFromRepo(userId, period)

  if (!data) {
    return {
      userId,
      period,
      profilesCount: 0,
      aiInterpretationsUsed: 0,
      boardsCount: 0,
      exportsCount: 0,
    }
  }

  return {
    userId: data.user_id,
    period: data.period,
    profilesCount: data.profiles_count || 0,
    aiInterpretationsUsed: data.ai_interpretations_used || 0,
    boardsCount: data.boards_count || 0,
    exportsCount: data.exports_count || 0,
  }
}

/**
 * Track usage increment
 */
export async function trackUsage(
  userId: string,
  metric: UsageMetric,
  amount: number = 1
): Promise<void> {
  const period = getCurrentPeriod()
  // Atomic $inc upsert in the repo, ported from the increment_usage RPC.
  await incrementUsageInRepo(userId, period, metric, amount)
}

/**
 * Check if user can perform action based on limits
 */
export async function checkLimit(
  userId: string,
  metric: UsageMetric
): Promise<LimitCheckResult> {
  const [plan, usage] = await Promise.all([
    getUserPlan(userId),
    getCurrentUsage(userId),
  ])

  const limits = getPlanLimits(plan)
  const limitKey = metricToLimitKey[metric]
  const limit = limits[limitKey as keyof typeof limits]

  // Get current value based on metric
  let current: number
  switch (metric) {
    case 'profiles_count':
      current = usage.profilesCount
      break
    case 'ai_interpretations_used':
      current = usage.aiInterpretationsUsed
      break
    case 'boards_count':
      current = usage.boardsCount
      break
    case 'exports_count':
      current = usage.exportsCount
      break
    default:
      current = 0
  }

  // Handle different limit types
  if (typeof limit === 'boolean') {
    return {
      allowed: limit,
      current,
      limit: limit ? Infinity : 0,
      message: limit ? undefined : `This feature is not available on the ${PLANS[plan].name} plan`,
    }
  }

  if (typeof limit === 'number') {
    const allowed = limit === Infinity || current < limit
    return {
      allowed,
      current,
      limit,
      message: allowed ? undefined : `You've reached your ${limitKey} limit (${current}/${limit}). Upgrade for more.`,
    }
  }

  return { allowed: true, current, limit: Infinity }
}

/**
 * Require limit check - throws if limit exceeded
 */
export async function requireLimit(
  userId: string,
  metric: UsageMetric
): Promise<void> {
  const result = await checkLimit(userId, metric)
  
  if (!result.allowed) {
    throw new LimitExceededError(metric, result.current, result.limit, result.message)
  }
}

/**
 * Check if a specific system is available for user's plan
 */
export async function isSystemAvailable(
  userId: string,
  system: string
): Promise<boolean> {
  const plan = await getUserPlan(userId)
  const limits = getPlanLimits(plan)
  return (limits.systems as readonly string[]).includes(system)
}

/**
 * Get all available systems for a user
 */
export async function getAvailableSystems(userId: string): Promise<readonly string[]> {
  const plan = await getUserPlan(userId)
  return getPlanLimits(plan).systems
}

/**
 * Custom error for limit exceeded
 */
export class LimitExceededError extends Error {
  constructor(
    public metric: UsageMetric,
    public current: number,
    public limit: number,
    message?: string
  ) {
    super(message || `Limit exceeded for ${metric}: ${current}/${limit}`)
    this.name = 'LimitExceededError'
  }
}

/**
 * People and boards are PERSISTENT resources, not monthly meters: what counts
 * is how many rows you own right now, and deleting one gives the slot back.
 * The monthly `usage_records` counters can't express that — nothing increments
 * them for people, and a month rollover would zero them while the rows live on.
 *
 * So the caps count rows, and this is the single place that does it. Anything
 * that *displays* a person/board count must call this, or it will disagree with
 * the limit the server actually enforces — which is exactly what happened:
 * settings and the paywall read the dead meter and said "0 / 3" forever.
 *
 * The self entry is free on every plan and is excluded here, matching the cap.
 */
export async function getPersistentUsage(
  userId: string
): Promise<{ profiles: number; boards: number }> {
  const [people, boards] = await Promise.all([
    listPeopleWithTags(userId),
    listBoards(userId),
  ])

  const tracked = people.people.filter(
    (p) => !(p as { is_self?: boolean }).is_self
  )

  return { profiles: tracked.length, boards: boards.length }
}

function percentage(used: number, limit: number): number {
  if (limit === Infinity || limit === 0) return 0
  return Math.round((used / limit) * 100)
}

/**
 * Get usage summary for billing page
 */
export async function getUsageSummary(userId: string) {
  const [plan, usage, persistent] = await Promise.all([
    getUserPlan(userId),
    getCurrentUsage(userId),
    getPersistentUsage(userId),
  ])

  const limits = getPlanLimits(plan)

  return {
    plan,
    period: usage.period,
    usage: {
      profiles: {
        used: persistent.profiles,
        limit: limits.profiles,
        percentage: percentage(persistent.profiles, limits.profiles),
      },
      aiInterpretations: {
        used: usage.aiInterpretationsUsed,
        limit: limits.aiInterpretations,
        percentage: percentage(
          usage.aiInterpretationsUsed,
          limits.aiInterpretations
        ),
      },
      boards: {
        used: persistent.boards,
        limit: limits.boards,
        percentage: percentage(persistent.boards, limits.boards),
      },
    },
    features: {
      exports: limits.exports,
      timeline: limits.timeline,
      relationships: limits.relationships,
      groupAnalysis: limits.groupAnalysis,
      apiAccess: limits.apiAccess,
    },
  }
}
