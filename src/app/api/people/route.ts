import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { listPeopleWithTags, createPerson } from '@/lib/db/repositories/people-repo'

const birthPlaceSchema = z
  .object({
    lat: z.number().optional(),
    lng: z.number().optional(),
    name: z.string().optional(),
  })
  .nullable()

const createSchema = z.object({
  person: z.object({
    name: z.string().min(1).max(200),
    hebrew_name: z.string().nullable().optional(),
    birth_date: z.string(),
    birth_time: z.string().nullable().optional(),
    birth_place: birthPlaceSchema.optional(),
    avatar_url: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    is_self: z.boolean().optional(),
  }),
  tagIds: z.array(z.string()).optional(),
})

export async function GET() {
  try {
    const userId = await requireUserId()
    const data = await listPeopleWithTags(userId)
    return NextResponse.json(data)
  } catch (error) {
    return handleApiError(error, 'GET /api/people')
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId()
    const body = await request.json()
    const { person, tagIds } = createSchema.parse(body)
    const created = await createPerson(userId, person, tagIds ?? [])
    return NextResponse.json({ person: created }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/people')
  }
}
