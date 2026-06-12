import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { duplicateBoard } from '@/lib/db/repositories/boards-repo'

const bodySchema = z
  .object({
    newName: z.string().min(1).max(200).nullable().optional(),
  })
  .default({})

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Ctx) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { newName } = bodySchema.parse(body)

    const newBoardId = await duplicateBoard(userId, id, newName ?? null)
    if (!newBoardId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ id: newBoardId }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/boards/[id]/duplicate')
  }
}
