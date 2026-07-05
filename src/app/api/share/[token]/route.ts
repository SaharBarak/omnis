import { NextRequest, NextResponse } from 'next/server'

import { handleApiError } from '@/lib/api/respond'
import {
  getSharedViewByToken,
  getSharedViewOwnerIdByToken,
  incrementSharedViewCount,
  verifySharePassword,
} from '@/lib/db/repositories/shares-repo'
import { getGroupWithMembers } from '@/lib/db/repositories/groups-repo'
import { analyzeGroup } from '@/lib/services/group-analysis'
import {
  hashSharePassword,
  toPublicGroupAnalysis,
  type PublicShareResponse,
} from '@/lib/share/public-share'
import {
  addRateLimitHeaders,
  rateLimiters,
  rateLimitResponse,
} from '@/lib/rate-limit'
import type { GroupWithMembers, ShareOptions } from '@/lib/types/relationship'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ token: string }> }

/**
 * PUBLIC route — intentionally does NOT call requireUserId(). This is the
 * single content endpoint behind the anonymous /share/[token] page: it
 * resolves a share by its unguessable token and returns the shared content
 * as a safe projection (never password_hash, owner_id, or raw member birth
 * data — see src/lib/share/public-share.ts).
 *
 * Semantics enforced server-side, in order:
 * 1. IP rate limit (same publicApi limiter as /api/knowledge/search).
 * 2. Token + active lookup → 404.
 * 3. Expiry → 410.
 * 4. Password → 401 { requiresPassword: true } until the correct password is
 *    POSTed; verification happens via verifySharePassword so the hash never
 *    leaves the server.
 * 5. Atomic view-count increment (incrementSharedViewCount) — the conditional
 *    UPDATE is the max_views race fix; a false return means capped/expired.
 * 6. Content load through the owner-scoped groups repository, keyed by the
 *    share's owner (resolved internally, never surfaced).
 *
 * GET  /api/share/[token]           — for shares without a password.
 * POST /api/share/[token] { password? } — same, with a password attempt.
 */
async function resolveShare(
  request: NextRequest,
  token: string,
  password: string | undefined
): Promise<NextResponse> {
  const rateLimit = await rateLimiters.publicApi.check(request, 'public-share')
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit)
  }
  const respond = (body: unknown, status = 200) =>
    addRateLimitHeaders(NextResponse.json(body, { status }), rateLimit)

  const view = await getSharedViewByToken(token)
  if (!view) {
    return respond({ error: 'Not found or inactive' }, 404)
  }

  if (view.expires_at && new Date(view.expires_at) < new Date()) {
    return respond({ error: 'Link has expired' }, 410)
  }

  if (view.requires_password) {
    if (!password) {
      return respond({ requiresPassword: true }, 401)
    }
    const candidateHash = await hashSharePassword(password)
    const valid = await verifySharePassword(token, candidateHash)
    if (!valid) {
      return respond({ requiresPassword: true, error: 'Incorrect password' }, 401)
    }
  }

  // Atomic conditional UPDATE — cap check + increment in one statement, so
  // concurrent anonymous viewers cannot race past max_views.
  const counted = await incrementSharedViewCount(token)
  if (!counted) {
    const capped = view.max_views !== null && view.view_count >= view.max_views
    return respond(
      { error: capped ? 'Link has reached maximum views' : 'Link has expired' },
      410
    )
  }

  const options = view.options as unknown as ShareOptions
  const payload: PublicShareResponse = {
    share: { share_type: view.share_type, options },
  }

  if (view.share_type === 'group' && typeof options.groupId === 'string') {
    const ownerId = await getSharedViewOwnerIdByToken(token)
    const group = ownerId
      ? await getGroupWithMembers(ownerId, options.groupId)
      : null
    if (!group) {
      return respond({ error: 'Shared content is no longer available' }, 404)
    }
    payload.group = toPublicGroupAnalysis(
      analyzeGroup(group as unknown as GroupWithMembers)
    )
  }

  return respond(payload)
}

export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const { token } = await params
    return await resolveShare(request, token, undefined)
  } catch (error) {
    return handleApiError(error, 'GET /api/share/[token]')
  }
}

export async function POST(request: NextRequest, { params }: Ctx) {
  try {
    const { token } = await params
    const body = (await request.json().catch(() => ({}))) as {
      password?: unknown
    }
    const password =
      typeof body.password === 'string' && body.password.length > 0
        ? body.password
        : undefined
    return await resolveShare(request, token, password)
  } catch (error) {
    return handleApiError(error, 'POST /api/share/[token]')
  }
}
