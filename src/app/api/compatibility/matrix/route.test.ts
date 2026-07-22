import { describe, it, expect, vi, beforeEach } from 'vitest'

import { calculateFiveSystemCompatibility } from '@pleiad/engine/services/compatibility'
import { GET } from './route'
import { requireUserId } from '@/lib/auth-server'
import { listPeopleWithTags } from '@/lib/db/repositories/people-repo'
import {
  bulkUpsertResults,
  getResultsBySystemForPeople,
} from '@/lib/db/repositories/computed-results-repo'
import {
  MATRIX_PAIR_SYSTEM,
  buildPairCacheData,
  pairVersion,
  slimPair,
  sortPair,
} from '@/lib/services/resonance-matrix'

// Better Auth session — real UnauthorizedError class so handleApiError's
// instanceof check maps it to a 401.
vi.mock('@/lib/auth-server', () => {
  class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized') {
      super(message)
      this.name = 'UnauthorizedError'
    }
  }
  return {
    requireUserId: vi.fn(),
    UnauthorizedError,
  }
})

vi.mock('@/lib/db/repositories/people-repo', () => ({
  listPeopleWithTags: vi.fn(),
}))

vi.mock('@/lib/db/repositories/computed-results-repo', () => ({
  getResultsBySystemForPeople: vi.fn(),
  bulkUpsertResults: vi.fn(),
}))

const USER_ID = 'user-123'

function uuid(n: number): string {
  const hex = n.toString(16).padStart(12, '0')
  return `00000000-0000-4000-8000-${hex}`
}

function makePerson(n: number, overrides: Record<string, unknown> = {}) {
  return {
    id: uuid(n),
    owner_id: USER_ID,
    name: `Person ${n}`,
    hebrew_name: null,
    birth_date: `199${n % 10}-0${(n % 9) + 1}-15`,
    birth_time: null,
    birth_place: null,
    avatar_url: null,
    notes: null,
    is_self: false,
    deleted_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-06-01T00:00:00.000Z',
    tags: [],
    ...overrides,
  }
}

function setupAuthed() {
  vi.mocked(requireUserId).mockResolvedValue(USER_ID)
}

function setupPeople(people: ReturnType<typeof makePerson>[]) {
  vi.mocked(listPeopleWithTags).mockResolvedValue({ people, tags: [] } as never)
}

/** A fresh cached row for the pair, with a sentinel score to detect cache use. */
function cachedRowFor(
  a: ReturnType<typeof makePerson>,
  b: ReturnType<typeof makePerson>,
  sentinelScore: number
) {
  const [lo, hi] = sortPair(a.id, b.id)
  const [loP, hiP] = a.id === lo ? [a, b] : [b, a]
  const full = calculateFiveSystemCompatibility(
    { birthDate: loP.birth_date },
    { birthDate: hiP.birth_date }
  )
  const pair = { ...slimPair(lo, hi, full), overallScore: sentinelScore }
  return {
    id: uuid(9000),
    person_id: lo,
    system: MATRIX_PAIR_SYSTEM,
    version: pairVersion(hi),
    data: buildPairCacheData(pair, loP.updated_at, hiP.updated_at),
    computed_at: '2026-06-02T00:00:00.000Z',
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getResultsBySystemForPeople).mockResolvedValue([])
  vi.mocked(bulkUpsertResults).mockResolvedValue(0)
})

describe('GET /api/compatibility/matrix', () => {
  it('returns 401 when unauthenticated', async () => {
    const { UnauthorizedError } = await import('@/lib/auth-server')
    vi.mocked(requireUserId).mockRejectedValue(new UnauthorizedError())

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
    expect(listPeopleWithTags).not.toHaveBeenCalled()
  })

  it('computes N(N-1)/2 pairs for N people and caches them', async () => {
    setupAuthed()
    setupPeople([makePerson(1), makePerson(2), makePerson(3), makePerson(4)])

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.pairs).toHaveLength(6)
    expect(body.meta).toMatchObject({
      peopleCount: 4,
      pairCount: 6,
      cachedCount: 0,
      computedCount: 6,
    })
    // Every pair is stored sorted (p1 < p2) under the pair-cache system.
    for (const pair of body.pairs) {
      expect(pair.p1 < pair.p2).toBe(true)
      expect(pair.overallScore).toBeGreaterThanOrEqual(0)
      expect(pair.overallScore).toBeLessThanOrEqual(100)
    }
    expect(bulkUpsertResults).toHaveBeenCalledTimes(1)
    const [userId, rows] = vi.mocked(bulkUpsertResults).mock.calls[0]
    expect(userId).toBe(USER_ID)
    expect(rows).toHaveLength(6)
    expect(rows.every((r) => r.system === MATRIX_PAIR_SYSTEM)).toBe(true)
  })

  it('serves fresh cached pairs without recomputing or rewriting', async () => {
    setupAuthed()
    const p1 = makePerson(1)
    const p2 = makePerson(2)
    setupPeople([p1, p2])
    vi.mocked(getResultsBySystemForPeople).mockResolvedValue([
      cachedRowFor(p1, p2, 99),
    ] as never)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.pairs).toHaveLength(1)
    expect(body.pairs[0].overallScore).toBe(99) // sentinel → came from cache
    expect(body.meta).toMatchObject({ cachedCount: 1, computedCount: 0 })
    expect(bulkUpsertResults).not.toHaveBeenCalled()
  })

  it('recomputes only stale pairs (person updated after caching)', async () => {
    setupAuthed()
    const p1 = makePerson(1)
    const p2 = makePerson(2)
    const p3 = makePerson(3)
    setupPeople([p1, p2, p3])

    const freshRow = cachedRowFor(p1, p2, 99)
    // Stale: cached before p3's latest update.
    const staleRow = cachedRowFor(p1, p3, 98)
    staleRow.data = buildPairCacheData(
      staleRow.data.pair,
      p1.updated_at,
      '2026-01-01T00:00:00.000Z' // does not match p3.updated_at
    )
    vi.mocked(getResultsBySystemForPeople).mockResolvedValue([
      freshRow,
      staleRow,
    ] as never)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.pairs).toHaveLength(3)
    expect(body.meta).toMatchObject({ cachedCount: 1, computedCount: 2 })
    const [, rows] = vi.mocked(bulkUpsertResults).mock.calls[0]
    expect(rows).toHaveLength(2) // stale pair + missing (p2,p3) pair
  })

  it('rejects libraries over the hard cap with a clear error', async () => {
    setupAuthed()
    setupPeople(Array.from({ length: 41 }, (_, i) => makePerson(i + 1)))

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(422)
    expect(body.code).toBe('matrix_too_large')
    expect(body.max).toBe(40)
    expect(getResultsBySystemForPeople).not.toHaveBeenCalled()
    expect(bulkUpsertResults).not.toHaveBeenCalled()
  })

  it('returns no pairs for fewer than two people', async () => {
    setupAuthed()
    setupPeople([makePerson(1)])

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.people).toHaveLength(1)
    expect(body.pairs).toHaveLength(0)
    expect(bulkUpsertResults).not.toHaveBeenCalled()
  })

  it('pins the self person first on the matrix axes', async () => {
    setupAuthed()
    const self = makePerson(3, { is_self: true, name: 'Me' })
    setupPeople([makePerson(1), makePerson(2), self])

    const res = await GET()
    const body = await res.json()

    expect(body.people[0]).toMatchObject({ id: self.id, is_self: true })
  })
})
