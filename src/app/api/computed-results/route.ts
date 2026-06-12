import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import {
  getResultsForPerson,
  getResultsForPeople,
  upsertResult,
  deleteResultsForPerson,
} from '@/lib/db/repositories/computed-results-repo'

const systemSchema = z.enum([
  'dreamspell',
  'tzolkin',
  'longcount',
  'humandesign',
  'astrology',
  'gematria',
])

const upsertSchema = z.object({
  personId: z.string(),
  system: systemSchema,
  version: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
  computed_at: z.string().optional(),
})

/**
 * GET /api/computed-results?personId=...   -> results for one person
 * GET /api/computed-results?personIds=a,b  -> results for many people
 * Always scoped to the authenticated user via the parent Person's owner_id.
 */
export async function GET(request: Request) {
  try {
    const userId = await requireUserId()
    const { searchParams } = new URL(request.url)
    const personId = searchParams.get('personId')
    const personIds = searchParams.get('personIds')

    if (personIds !== null) {
      const ids = personIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const results = await getResultsForPeople(userId, ids)
      return NextResponse.json({ results })
    }

    if (personId !== null) {
      const results = await getResultsForPerson(userId, personId)
      return NextResponse.json({ results })
    }

    return NextResponse.json(
      { error: 'personId or personIds is required' },
      { status: 400 }
    )
  } catch (error) {
    return handleApiError(error, 'GET /api/computed-results')
  }
}

/** POST /api/computed-results — upsert one computed result for a person. */
export async function POST(request: Request) {
  try {
    const userId = await requireUserId()
    const body = await request.json()
    const { personId, system, version, data, computed_at } =
      upsertSchema.parse(body)
    const result = await upsertResult(userId, personId, {
      system,
      version,
      data,
      computed_at,
    })
    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ result })
  } catch (error) {
    return handleApiError(error, 'POST /api/computed-results')
  }
}

/** DELETE /api/computed-results?personId=... — invalidate all results. */
export async function DELETE(request: Request) {
  try {
    const userId = await requireUserId()
    const { searchParams } = new URL(request.url)
    const personId = searchParams.get('personId')
    if (!personId) {
      return NextResponse.json(
        { error: 'personId is required' },
        { status: 400 }
      )
    }
    const deletedCount = await deleteResultsForPerson(userId, personId)
    return NextResponse.json({ deletedCount })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/computed-results')
  }
}
