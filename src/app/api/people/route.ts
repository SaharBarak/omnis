import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limit'
import { listPeopleWithTags, createPerson } from '@/lib/db/repositories/people-repo'
import { getUserPlan, getPersistentUsage } from '@/lib/services/usage'
import { getPlanLimits, PLANS } from '@/lib/services/billing'

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

    // Plan entitlement: cap saved profiles per the user's tier. getPersistentUsage
    // is the same count the subscription API reports, so what we enforce here and
    // what the app shows the user cannot drift apart.
    const plan = await getUserPlan(userId)
    const profileLimit = getPlanLimits(plan).profiles
    if (profileLimit !== Infinity) {
      const { profiles: tracked } = await getPersistentUsage(userId)
      if (tracked >= profileLimit) {
        return NextResponse.json(
          {
            error: `You've reached your plan's limit of ${profileLimit} ${profileLimit === 1 ? 'person' : 'people'} on ${PLANS[plan].name}. Upgrade to add more.`,
            code: 'limit_exceeded',
          },
          { status: 403 }
        )
      }
    }

    const created = await createPerson(userId, person, tagIds ?? [])
    return NextResponse.json({ person: created }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/people')
  }
}
