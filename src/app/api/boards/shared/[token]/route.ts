import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/api/respond'
import { getBoardByShareToken } from '@/lib/db/repositories/boards-repo'
import { hashSharePassword } from '@/lib/share/share-token'

type Ctx = { params: Promise<{ token: string }> }

/**
 * PUBLIC route — intentionally does NOT call requireUserId(). Access is gated
 * solely by the unguessable share token plus the share's `active`/expiry/
 * max-view state inside getBoardByShareToken, which returns only the minimal
 * board data needed for a public viewer (never owner_id).
 *
 * GET  /api/boards/shared/[token]              — for shares without a password.
 * POST /api/boards/shared/[token] { password? } — same, with a password
 * attempt in the request BODY. Passwords must never ride in the URL: query
 * strings land in server/proxy logs, browser history, and Referer headers.
 * The candidate is hashed here and compared server-side; the stored hash
 * never leaves the server.
 */
async function resolveSharedBoard(
  token: string,
  password: string | undefined
): Promise<NextResponse> {
  const candidateHash = password ? await hashSharePassword(password) : null
  const result = await getBoardByShareToken(token, candidateHash)
  if (!result) {
    return NextResponse.json({ error: 'Not found or expired' }, { status: 404 })
  }
  if ('locked' in result) {
    return NextResponse.json({ locked: true }, { status: 401 })
  }
  return NextResponse.json(result)
}

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { token } = await params
    return await resolveSharedBoard(token, undefined)
  } catch (error) {
    return handleApiError(error, 'GET /api/boards/shared/[token]')
  }
}

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { token } = await params
    const body = (await request.json().catch(() => ({}))) as {
      password?: unknown
    }
    const password =
      typeof body.password === 'string' && body.password.length > 0
        ? body.password
        : undefined
    return await resolveSharedBoard(token, password)
  } catch (error) {
    return handleApiError(error, 'POST /api/boards/shared/[token]')
  }
}
