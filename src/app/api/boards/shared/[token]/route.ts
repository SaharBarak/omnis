import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/api/respond'
import { getBoardByShareToken } from '@/lib/db/repositories/boards-repo'

type Ctx = { params: Promise<{ token: string }> }

/**
 * PUBLIC route — intentionally does NOT call requireUserId(). Access is gated
 * solely by the unguessable share token plus the share's `active`/expiry/
 * max-view state inside getBoardByShareToken, which returns only the minimal
 * board data needed for a public viewer (never owner_id).
 */
export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { token } = await params
    const result = await getBoardByShareToken(token)
    if (!result) {
      return NextResponse.json({ error: 'Not found or expired' }, { status: 404 })
    }
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error, 'GET /api/boards/shared/[token]')
  }
}
