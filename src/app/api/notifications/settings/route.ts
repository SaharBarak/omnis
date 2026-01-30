import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getNotificationSettings,
  upsertNotificationSettings,
} from '@/lib/services/notifications'
import type { NotificationSettings } from '@/lib/types/prediction'

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

// Get authenticated user from server-side Supabase client
async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * GET /api/notifications/settings
 *
 * Get current user's notification settings
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const settings = await getNotificationSettings(user.id)

    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        success: true,
        data: {
          userId: user.id,
          ...defaultSettings,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/notifications/settings
 *
 * Update current user's notification settings
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate and sanitize input
    const settings: NotificationSettings = {
      userId: user.id,
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
    console.error('Error updating notification settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
