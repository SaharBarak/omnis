import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import {
  getNotificationSettings,
  upsertNotificationSettings,
} from '@/lib/services/notifications'
import type { NotificationSettings } from '@pleiad/engine/types/prediction'

export const dynamic = 'force-dynamic'

// Default notification settings
const defaultSettings: Omit<NotificationSettings, 'userId'> = {
  enabled: true,
  channels: ['in-app'],
  dailyDigest: false,
  dailyDigestTime: '08:00',
  weeklyDigest: false,
  weeklyDigestDay: 0,
  advanceNotice: 1,
  systems: ['dreamspell', 'tzolkin'],
  minIntensity: 'medium',
}

/**
 * GET /api/notifications/settings
 *
 * Get the current user's notification settings. USER-context: scoped to
 * requireUserId(); a user can only read their own settings.
 */
export async function GET() {
  try {
    const userId = await requireUserId()

    const settings = await getNotificationSettings(userId)

    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        success: true,
        data: {
          userId,
          ...defaultSettings,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    return handleApiError(error, 'GET /api/notifications/settings')
  }
}

/**
 * PUT /api/notifications/settings
 *
 * Update the current user's notification settings. USER-context: the persisted
 * `userId` is always requireUserId(), never taken from the request body.
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await requireUserId()

    const body = await request.json()

    // Validate and sanitize input
    const settings: NotificationSettings = {
      userId,
      enabled: typeof body.enabled === 'boolean' ? body.enabled : true,
      channels: Array.isArray(body.channels)
        ? body.channels.filter((c: string) => ['in-app', 'email', 'sms'].includes(c))
        : ['in-app'],
      dailyDigest: typeof body.dailyDigest === 'boolean' ? body.dailyDigest : false,
      dailyDigestTime: typeof body.dailyDigestTime === 'string'
        && /^\d{2}:\d{2}$/.test(body.dailyDigestTime)
        ? body.dailyDigestTime
        : '08:00',
      weeklyDigest: typeof body.weeklyDigest === 'boolean' ? body.weeklyDigest : false,
      weeklyDigestDay: typeof body.weeklyDigestDay === 'number'
        && body.weeklyDigestDay >= 0
        && body.weeklyDigestDay <= 6
        ? body.weeklyDigestDay
        : 0,
      advanceNotice: typeof body.advanceNotice === 'number'
        && body.advanceNotice >= 0
        && body.advanceNotice <= 30
        ? body.advanceNotice
        : 1,
      systems: Array.isArray(body.systems)
        ? body.systems.filter((s: string) =>
            ['dreamspell', 'tzolkin', 'longcount', 'astrology', 'humandesign'].includes(s)
          )
        : ['dreamspell', 'tzolkin'],
      minIntensity: ['low', 'medium', 'high', 'peak'].includes(body.minIntensity)
        ? body.minIntensity
        : 'medium',
    }

    const result = await upsertNotificationSettings(settings)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to save settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    return handleApiError(error, 'PUT /api/notifications/settings')
  }
}
