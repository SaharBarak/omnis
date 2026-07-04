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
export async function GET(request: Request, { params }: Ctx) {
  try {
    const { token } = await params
    // Password gate: viewer supplies a candidate hash; the raw hash never
    // leaves the server (see getBoardByShareToken).
    const candidateHash = new URL(request.url).searchParams.get('ph')
    const result = await getBoardByShareToken(token, candidateHash)
    if (!result) {
      return NextResponse.json({ error: 'Not found or expired' }, { status: 404 })
    }
    if ('locked' in result) {
      return NextResponse.json({ locked: true }, { status: 401 })
    }
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error, 'GET /api/boards/shared/[token]')
  }
}
