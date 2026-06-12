import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import {
  updateSharedView,
  deleteSharedView,
} from '@/lib/db/repositories/shares-repo'

const patchSchema = z.object({
  active: z.boolean().optional(),
})

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const body = await request.json()
    const updates = patchSchema.parse(body)
    const share = await updateSharedView(userId, id, updates)
    if (!share) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ share })
  } catch (error) {
    return handleApiError(error, 'PATCH /api/shares/[id]')
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const ok = await deleteSharedView(userId, id)
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/shares/[id]')
  }
}
