import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/api/respond'
import { incrementSharedViewCount } from '@/lib/db/repositories/shares-repo'

type Ctx = { params: Promise<{ token: string }> }

/**
 * PUBLIC route — intentionally does NOT call requireUserId(). Ports the
 * `increment_shared_view_count(TEXT)` RPC: matches by token + active + unexpired,
 * atomically bumps the view count (or deactivates on the max-view cap). Returns
 * `{ ok }` so the caller can react to a capped/expired share without leaking
 * anything about the underlying owner.
 */
export async function POST(_request: Request, { params }: Ctx) {
  try {
    const { token } = await params
    const ok = await incrementSharedViewCount(token)
    return NextResponse.json({ ok })
  } catch (error) {
    return handleApiError(error, 'POST /api/shares/public/[token]/view')
  }
}
