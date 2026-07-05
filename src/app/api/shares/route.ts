import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import {
  listSharedViews,
  createSharedView,
} from '@/lib/db/repositories/shares-repo'
import { generateShareToken, hashSharePassword } from '@/lib/share/share-token'

// The client NEVER supplies url_token or password_hash: the token is minted
// server-side (unguessable, server-owned) and the raw password is hashed
// here. The created row — including its url_token — is returned to the caller.
const createSchema = z.object({
  share_type: z.enum(['person', 'relationship', 'group', 'graph']),
  options: z.record(z.string(), z.unknown()).optional(),
  expires_at: z.string().nullable().optional(),
  max_views: z.number().int().positive().nullable().optional(),
  password: z.string().min(1).max(128).nullable().optional(),
})

export async function GET() {
  try {
    const userId = await requireUserId()
    const shares = await listSharedViews(userId)
    return NextResponse.json({ shares })
  } catch (error) {
    return handleApiError(error, 'GET /api/shares')
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId()
    const body = await request.json()
    const { password, ...input } = createSchema.parse(body)
    const share = await createSharedView(userId, {
      ...input,
      url_token: generateShareToken(),
      password_hash: password ? await hashSharePassword(password) : null,
    })
    return NextResponse.json({ share }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/shares')
  }
}
