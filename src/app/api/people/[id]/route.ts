import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import {
  updatePerson,
  softDeletePerson,
  restorePerson,
  permanentlyDeletePerson,
} from '@/lib/db/repositories/people-repo'

const birthPlaceSchema = z
  .object({
    lat: z.number().optional(),
    lng: z.number().optional(),
    name: z.string().optional(),
  })
  .nullable()

const patchSchema = z.object({
  updates: z
    .object({
      name: z.string().min(1).max(200).optional(),
      hebrew_name: z.string().nullable().optional(),
      birth_date: z.string().optional(),
      birth_time: z.string().nullable().optional(),
      birth_place: birthPlaceSchema.optional(),
      avatar_url: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
      is_self: z.boolean().optional(),
      deleted_at: z.string().nullable().optional(),
    })
    .default({}),
  tagIds: z.array(z.string()).optional(),
  // action: 'restore' clears the soft-delete flag
  action: z.enum(['restore']).optional(),
})

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Ctx) {
  try {
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

export async function DELETE(request: Request, { params }: Ctx) {
  try {
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
