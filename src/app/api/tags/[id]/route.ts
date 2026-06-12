import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { deleteTag } from '@/lib/db/repositories/people-repo'

type Ctx = { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const ok = await deleteTag(userId, id)
    if (!ok) {
      return NextResponse.json(
        { error: 'Not found or not deletable' },
        { status: 404 }
      )
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/tags/[id]')
  }
}
