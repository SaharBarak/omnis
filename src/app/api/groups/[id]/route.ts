import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import {
  getGroupWithMembers,
  updateGroup,
  deleteGroup,
} from '@/lib/db/repositories/groups-repo'

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
})

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const group = await getGroupWithMembers(userId, id)
    if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ group })
  } catch (error) {
    return handleApiError(error, 'GET /api/groups/[id]')
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const body = await request.json()
    const updates = patchSchema.parse(body)

    const group = await updateGroup(userId, id, updates)
    if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ group })
  } catch (error) {
    return handleApiError(error, 'PATCH /api/groups/[id]')
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const ok = await deleteGroup(userId, id)
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/groups/[id]')
  }
}
