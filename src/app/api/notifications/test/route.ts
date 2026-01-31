import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendTestNotificationEmail } from '@/lib/services/notifications'

export const dynamic = 'force-dynamic'

// Get authenticated user from server-side Supabase client
async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { user, supabase }
}

/**
 * POST /api/notifications/test
 *
 * Send a test notification to the current user
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's email and name from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, first_name')
      .eq('id', user.id)
      .single()

    const email = profile?.email || user.email
    const name = profile?.first_name || 'Friend'

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
    console.error('Error sending test notification:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send test notification' },
      { status: 500 }
    )
  }
}
