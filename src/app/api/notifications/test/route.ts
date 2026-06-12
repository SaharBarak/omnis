import { NextResponse } from 'next/server'
import { getSession, UnauthorizedError } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { getProfile } from '@/lib/db/repositories/notifications-repo'
import { sendTestNotificationEmail } from '@/lib/services/notifications'

export const dynamic = 'force-dynamic'

/**
 * POST /api/notifications/test
 *
 * Send a test notification to the current user. USER-context: reads the
 * caller's own session + profile only. The recipient is always the
 * authenticated user's email — never an address from the request.
 */
export async function POST() {
  try {
    const session = await getSession()
    const user = session?.user
    if (!user) {
      throw new UnauthorizedError()
    }

    // Name comes from the app profile (display_name); email comes from the
    // Better Auth user record. Both are scoped to the authenticated user.
    const profile = await getProfile(user.id)
    const email = user.email
    const name =
      (profile as { display_name?: string } | null)?.display_name ||
      user.name ||
      'Friend'

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'No email address found' },
        { status: 400 }
      )
    }

    // Send test email
    const result = await sendTestNotificationEmail(email, name)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to send test notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Test notification sent to ${email}`,
      emailId: result.id,
    })
  } catch (error) {
    return handleApiError(error, 'POST /api/notifications/test')
  }
}
