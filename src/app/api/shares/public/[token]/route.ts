import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/api/respond'
import { getSharedViewByToken } from '@/lib/db/repositories/shares-repo'

type Ctx = { params: Promise<{ token: string }> }

/**
 * PUBLIC route — intentionally does NOT call requireUserId(). Reads a
 * shared_view only by the unguessable token plus the `active` flag. Returns the
 * minimal metadata the public share page needs to decide expiry / password /
 * max-view gating; the owner_id is present on the row but the page never
 * surfaces it. The actual view-count increment happens via the `/view` POST.
 */
export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { token } = await params
    const view = await getSharedViewByToken(token)
    if (!view) {
      return NextResponse.json({ error: 'Not found or inactive' }, { status: 404 })
    }
    return NextResponse.json({ share: view })
  } catch (error) {
    return handleApiError(error, 'GET /api/shares/public/[token]')
  }
}
