import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import {
  listBoardShares,
  createBoardShare,
} from '@/lib/db/repositories/boards-repo'

const createSchema = z.object({
  url_token: z.string().min(1).max(128),
  permissions: z.enum(['view', 'comment', 'edit']).optional(),
  expires_at: z.string().nullable().optional(),
  max_views: z.number().int().positive().nullable().optional(),
  password_hash: z.string().nullable().optional(),
})

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const shares = await listBoardShares(userId, id)
    if (shares === null) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ shares })
  } catch (error) {
    return handleApiError(error, 'GET /api/boards/[id]/shares')
  }
}

export async function POST(request: Request, { params }: Ctx) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const body = await request.json()
    const input = createSchema.parse(body)
    const share = await createBoardShare(userId, id, input)
    if (share === null) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ share }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/boards/[id]/shares')
  }
}
