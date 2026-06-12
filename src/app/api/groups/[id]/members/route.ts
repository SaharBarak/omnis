import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import {
  addMemberToGroup,
  removeMemberFromGroup,
  setGroupMembers,
} from '@/lib/db/repositories/groups-repo'

const postSchema = z.union([
  z.object({ personId: z.string() }),
  z.object({ personIds: z.array(z.string()) }),
])

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Ctx) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const body = postSchema.parse(await request.json())

    // `personIds` replaces the full membership set (setGroupMembers);
    // `personId` adds a single member.
    if ('personIds' in body) {
      const ok = await setGroupMembers(userId, id, body.personIds)
      if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json({ ok: true })
    }

    const result = await addMemberToGroup(userId, id, body.personId)
    if (result === 'not_found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (result === 'duplicate') {
      return NextResponse.json(
        { error: 'Person is already a member of this group' },
        { status: 409 }
      )
    }
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/groups/[id]/members')
  }
}

export async function DELETE(request: Request, { params }: Ctx) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const personId = new URL(request.url).searchParams.get('personId')
    if (!personId) {
      return NextResponse.json(
        { error: 'personId is required' },
        { status: 400 }
      )
    }

    const ok = await removeMemberFromGroup(userId, id, personId)
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/groups/[id]/members')
  }
}
