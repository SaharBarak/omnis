import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import {
  getBoard,
  updateBoard,
  deleteBoard,
} from '@/lib/db/repositories/boards-repo'

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  canvas: z.record(z.string(), z.unknown()).optional(),
  layers: z.array(z.record(z.string(), z.unknown())).optional(),
  thumbnail: z.string().nullable().optional(),
  is_public: z.boolean().optional(),
})

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const board = await getBoard(userId, id)
    if (!board) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ board })
  } catch (error) {
    return handleApiError(error, 'GET /api/boards/[id]')
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const body = await request.json()
    const updates = patchSchema.parse(body)
    const board = await updateBoard(userId, id, updates)
    if (!board) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ board })
  } catch (error) {
    return handleApiError(error, 'PATCH /api/boards/[id]')
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const ok = await deleteBoard(userId, id)
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/boards/[id]')
  }
}
