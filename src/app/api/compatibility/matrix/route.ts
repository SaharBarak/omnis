import { NextResponse } from 'next/server'

import { calculateFiveSystemCompatibility } from '@pleiad/engine/services/compatibility'
import { requireUserId } from '@/lib/auth-server'
import { handleApiError } from '@/lib/api/respond'
import { listPeopleWithTags } from '@/lib/db/repositories/people-repo'
import {
  bulkUpsertResults,
  getResultsBySystemForPeople,
  type BulkResultInput,
} from '@/lib/db/repositories/computed-results-repo'
import {
  MATRIX_ENGINE_VERSION,
  MATRIX_PAIR_SYSTEM,
  MAX_MATRIX_PEOPLE,
  type MatrixPairScore,
  type MatrixPersonInput,
  buildPairCacheData,
  isFreshPairCache,
  orderForMatrix,
  pairCacheKey,
  pairVersion,
  slimPair,
  sortPair,
} from '@/lib/services/resonance-matrix'

/**
 * GET /api/compatibility/matrix
 *
 * N×N five-system resonance matrix over the owner's (non-deleted) people.
 * Pairwise scores are cached in computed_results keyed per unordered pair
 * (row anchored on the lower person id, version = engine + higher id, both
 * persons' updated_at embedded in the payload); only missing/stale pairs are
 * recomputed. Hard-capped at MAX_MATRIX_PEOPLE people.
 *
 * 200 → { people, pairs, meta }
 * 401 → not authenticated
 * 422 → { code: 'matrix_too_large' } when people > MAX_MATRIX_PEOPLE
 */

interface CachedRow {
  person_id: string
  version: string
  data: unknown
}

function toCompatInput(p: MatrixPersonInput) {
  return {
    birthDate: p.birth_date,
    birthTime: p.birth_time ?? null,
    birthPlace: p.birth_place ?? null,
    hebrewName: p.hebrew_name ?? null,
    name: p.name,
  }
}

export async function GET() {
  try {
    const userId = await requireUserId()

    const { people } = await listPeopleWithTags(userId)
    if (people.length > MAX_MATRIX_PEOPLE) {
      return NextResponse.json(
        {
          error: `The resonance matrix supports up to ${MAX_MATRIX_PEOPLE} people (you have ${people.length}).`,
          code: 'matrix_too_large',
          max: MAX_MATRIX_PEOPLE,
        },
        { status: 422 }
      )
    }

    const ordered = orderForMatrix(people as unknown as MatrixPersonInput[])
    const byId = new Map(ordered.map((p) => [p.id, p]))

    const cachedRows =
      ordered.length >= 2
        ? ((await getResultsBySystemForPeople(
            userId,
            ordered.map((p) => p.id),
            MATRIX_PAIR_SYSTEM
          )) as unknown as CachedRow[])
        : []
    const cacheMap = new Map(
      cachedRows.map((r) => [`${r.person_id}:${r.version}`, r])
    )

    const pairs: MatrixPairScore[] = []
    const toUpsert: BulkResultInput[] = []
    let cachedCount = 0

    for (let i = 0; i < ordered.length; i++) {
      for (let j = i + 1; j < ordered.length; j++) {
        const [lo, hi] = sortPair(ordered[i].id, ordered[j].id)
        const loP = byId.get(lo)!
        const hiP = byId.get(hi)!

        const cached = cacheMap.get(pairCacheKey(lo, hi))
        if (cached && isFreshPairCache(cached.data, loP.updated_at, hiP.updated_at)) {
          pairs.push(cached.data.pair)
          cachedCount++
          continue
        }

        const full = calculateFiveSystemCompatibility(
          toCompatInput(loP),
          toCompatInput(hiP)
        )
        const pair = slimPair(lo, hi, full)
        pairs.push(pair)
        toUpsert.push({
          person_id: lo,
          system: MATRIX_PAIR_SYSTEM,
          version: pairVersion(hi),
          data: buildPairCacheData(pair, loP.updated_at, hiP.updated_at) as unknown as Record<
            string,
            unknown
          >,
        })
      }
    }

    if (toUpsert.length > 0) {
      await bulkUpsertResults(userId, toUpsert)
    }

    return NextResponse.json({
      people: ordered.map((p) => ({
        id: p.id,
        name: p.name,
        hebrew_name: p.hebrew_name ?? null,
        is_self: Boolean(p.is_self),
      })),
      pairs,
      meta: {
        engineVersion: MATRIX_ENGINE_VERSION,
        peopleCount: ordered.length,
        pairCount: pairs.length,
        cachedCount,
        computedCount: toUpsert.length,
      },
    })
  } catch (error) {
    return handleApiError(error, 'GET /api/compatibility/matrix')
  }
}
