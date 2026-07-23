import { NextResponse } from 'next/server'
import { z } from 'zod'

import { notifyAppInstallation } from '@/lib/alerts'
import { handleApiError } from '@/lib/api/respond'
import { getSession, UnauthorizedError } from '@/lib/auth-server'
import {
  registerFirstInstallation,
  type InstallationInput,
} from '@/lib/db/repositories/installations-repo'
import { ensureUserAndProfile } from '@/lib/services/identity'

const installationSchema = z.object({
  channel: z.enum(['native', 'pwa']),
  platform: z.enum(['android', 'ios', 'web']),
})

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) throw new UnauthorizedError()
    const installation: InstallationInput = installationSchema.parse(await request.json())

    await ensureUserAndProfile(session.user)
    const firstSeen = await registerFirstInstallation(session.user.id, installation)

    if (firstSeen && session.user.email) {
      await notifyAppInstallation({
        ...installation,
        email: session.user.email,
        name: session.user.name,
      })
    }

    return NextResponse.json({ ok: true, firstSeen }, { status: firstSeen ? 201 : 200 })
  } catch (error) {
    return handleApiError(error, 'POST /api/installations')
  }
}
