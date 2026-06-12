/**
 * Usage Tracking Service
 * Tracks and enforces plan limits for users
 */

import {
  getUserPlan as getUserPlanFromRepo,
  getUsage as getUsageFromRepo,
  incrementUsage as incrementUsageInRepo,
  type UsageMetric,
} from '@/lib/db/repositories/subscriptions-repo'
import { PLANS, PlanTier, getPlanLimits } from './billing'

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
 * Get usage summary for billing page
 */
export async function getUsageSummary(userId: string) {
  const [plan, usage] = await Promise.all([
    getUserPlan(userId),
    getCurrentUsage(userId),
  ])

  const limits = getPlanLimits(plan)

  return {
    plan,
    period: usage.period,
    usage: {
      profiles: {
        used: usage.profilesCount,
        limit: limits.profiles,
        percentage: limits.profiles === Infinity ? 0 : Math.round((usage.profilesCount / limits.profiles) * 100),
      },
      aiInterpretations: {
        used: usage.aiInterpretationsUsed,
        limit: limits.aiInterpretations,
        percentage: limits.aiInterpretations === Infinity ? 0 : Math.round((usage.aiInterpretationsUsed / limits.aiInterpretations) * 100),
      },
      boards: {
        used: usage.boardsCount,
        limit: limits.boards,
        percentage: limits.boards === Infinity ? 0 : Math.round((usage.boardsCount / limits.boards) * 100),
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
