import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limit'
import {
  listRelationshipsWithPeople,
  createRelationship,
  RelationshipPeopleError,
  DuplicateRelationshipError,
} from '@/lib/db/repositories/relationships-repo'

const relationshipTypeSchema = z.enum([
  'family',
  'romantic',
  'friend',
  'professional',
  'other',
])

const createSchema = z.object({
  person1_id: z.string(),
  person2_id: z.string(),
  type: relationshipTypeSchema,
  subtype: z.string().nullable().optional(),
  bidirectional: z.boolean().optional(),
  strength: z.number().int().min(1).max(5).optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export async function GET() {
  try {
    const userId = await requireUserId()
    const relationships = await listRelationshipsWithPeople(userId)
    return NextResponse.json({ relationships })
  } catch (error) {
    return handleApiError(error, 'GET /api/relationships')
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = await rateLimiters.authenticatedApi.check(request, 'relationships:create')
    if (!rl.success) return rateLimitResponse(rl)
    const userId = await requireUserId()
    const body = await request.json()
    const input = createSchema.parse(body)
    const created = await createRelationship(userId, input)
    return NextResponse.json({ relationship: created }, { status: 201 })
  } catch (error) {
    if (error instanceof RelationshipPeopleError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof DuplicateRelationshipError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return handleApiError(error, 'POST /api/relationships')
  }
}
