import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import {
  updateRelationship,
  deleteRelationship,
  DuplicateRelationshipError,
} from '@/lib/db/repositories/relationships-repo'

const relationshipTypeSchema = z.enum([
  'family',
  'romantic',
  'friend',
  'professional',
  'other',
])

const patchSchema = z.object({
  type: relationshipTypeSchema.optional(),
  subtype: z.string().nullable().optional(),
  bidirectional: z.boolean().optional(),
  strength: z.number().int().min(1).max(5).optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const body = await request.json()
    const updates = patchSchema.parse(body)

    const relationship = await updateRelationship(userId, id, updates)
    if (!relationship)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ relationship })
  } catch (error) {
    if (error instanceof DuplicateRelationshipError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return handleApiError(error, 'PATCH /api/relationships/[id]')
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const ok = await deleteRelationship(userId, id)
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/relationships/[id]')
  }
}
