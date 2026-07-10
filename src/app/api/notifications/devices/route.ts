import { NextResponse } from 'next/server'
import { z } from 'zod'

import { handleApiError } from '@/lib/api/respond'
import { requireUserId } from '@/lib/auth-server'
import {
  registerPushToken,
  unregisterPushToken,
} from '@/lib/db/repositories/push-tokens-repo'

const registerSchema = z.object({
  expoPushToken: z.string().min(1).max(4096),
  platform: z.enum(['ios', 'android']),
})

/** Register (or re-home) a device push token for the authenticated user. */
export async function POST(request: Request) {
  try {
    const userId = await requireUserId()
    const body = registerSchema.parse(await request.json())
    await registerPushToken(userId, body.expoPushToken, body.platform)
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'notifications/devices')
  }
}

/** Unregister a device push token (sign-out / permission revoked). */
export async function DELETE(request: Request) {
  try {
    const userId = await requireUserId()
    const token = new URL(request.url).searchParams.get('token')
    if (!token) {
      return NextResponse.json({ error: 'token required' }, { status: 400 })
    }
    const removed = await unregisterPushToken(userId, token)
    return NextResponse.json({ ok: removed })
  } catch (error) {
    return handleApiError(error, 'notifications/devices')
  }
}
