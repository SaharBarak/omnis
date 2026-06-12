import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { deactivateBoardShare } from '@/lib/db/repositories/boards-repo'

type Ctx = { params: Promise<{ shareId: string }> }

/**
 * Deactivates a board share. Ownership is enforced in the repository by joining
 * the share to a board owned by requireUserId() before flipping `active`.
 */
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const userId = await requireUserId()
    const { shareId } = await params
    const ok = await deactivateBoardShare(userId, shareId)
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/boards/shares/[shareId]')
  }
}
