import { NextRequest, NextResponse } from 'next/server'
import { patchSchema } from './schemas'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limit'
import {
  updatePerson,
  softDeletePerson,
  restorePerson,
  permanentlyDeletePerson,
} from '@/lib/db/repositories/people-repo'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const rl = await rateLimiters.authenticatedApi.check(request, 'people:update')
    if (!rl.success) return rateLimitResponse(rl)
    const userId = await requireUserId()
    const { id } = await params
    const body = await request.json()
    const { updates, tagIds, action } = patchSchema.parse(body)

    if (action === 'restore') {
      const ok = await restorePerson(userId, id)
      if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json({ ok: true })
    }

    const person = await updatePerson(userId, id, updates, tagIds)
    if (!person) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ person })
  } catch (error) {
    return handleApiError(error, 'PATCH /api/people/[id]')
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const rl = await rateLimiters.authenticatedApi.check(request, 'people:delete')
    if (!rl.success) return rateLimitResponse(rl)
    const userId = await requireUserId()
    const { id } = await params
    const permanent =
      new URL(request.url).searchParams.get('permanent') === 'true'

    const ok = permanent
      ? await permanentlyDeletePerson(userId, id)
      : await softDeletePerson(userId, id)

    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/people/[id]')
  }
}
