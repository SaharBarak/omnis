import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limit'
import { listPeopleWithTags } from '@/lib/db/repositories/people-repo'
import { createPersonWithinPlan } from '@/lib/services/people'

const birthPlaceSchema = z
  .object({
    lat: z.number().optional(),
    lng: z.number().optional(),
    name: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    timezone: z.string().optional(),
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

export async function POST(request: NextRequest) {
  try {
    const rl = await rateLimiters.authenticatedApi.check(request, 'people:create')
    if (!rl.success) return rateLimitResponse(rl)
    const userId = await requireUserId()
    const body = await request.json()
    const { person, tagIds } = createSchema.parse(body)

    const created = await createPersonWithinPlan(userId, person, tagIds ?? [])
    if (!created.ok) return NextResponse.json({ error: created.message, code: created.code }, { status: 403 })
    return NextResponse.json({ person: created.person }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/people')
  }
}
