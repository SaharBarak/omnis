import { and, asc, desc, eq, inArray, isNotNull, isNull, lt, lte, gte, ne } from 'drizzle-orm'

import { getDb } from '@/lib/db/client'
import { people, predictions } from '@/lib/db/schema'
import { serialize, toEntityId } from '@/lib/db/serialize'

/**
 * Predictions domain repository.
 *
 * Predictions are tied to a `person_id` (the person is owned by a user) and
 * carry their own `owner_id` (auth user id). Tenant isolation lives here now
 * that Postgres RLS is gone.
 *
 * Two classes of function:
 *  - USER-CONTEXT functions take `userId: string` as the first argument and
 *    filter every query by `owner_id = userId`. Callers MUST pass the id from
 *    requireUserId(), never from client input.
 *  - SYSTEM-CONTEXT functions are prefixed `system*` and are only reachable from
 *    the cron route (authorized by CRON_SECRET). They operate across all owners
 *    and explicitly persist the owner_id derived from each person row.
 */

// ============================================================================
// Shared shapes
// ============================================================================

export interface PredictionRangeRow {
  id: string
  person_id: string | null
  system: string
  type: string
  start_date: string
  end_date: string
  intensity: string
  themes: string[]
  interpretation: string | null
  data: Record<string, unknown>
}

export interface CachedInterpretationRow {
  interpretation: string | null
  computed_at: string
  expires_at: string
}

export interface UpsertPredictionInput {
  person_id: string
  owner_id: string
  system: string
  type: string
  start_date: string
  end_date: string
  intensity: string
  themes: string[]
  data: Record<string, unknown>
  computed_at: Date
  expires_at: Date
}

// ============================================================================
// AI cache (user/system agnostic — keyed by an already-owned prediction id)
// ============================================================================

/**
 * Read the cached AI interpretation for a single prediction by its id.
 *
 * Owner-scoped: filters by both the prediction id AND owner_id so a caller can
 * never read an interpretation cached on another user's prediction, even with a
 * valid id. Returns `null` when the id is malformed or no owned row exists.
 */
export async function getCachedInterpretation(
  predictionId: string,
  ownerId: string
): Promise<CachedInterpretationRow | null> {
  const db = getDb()

  let id: string
  try {
    id = toEntityId(predictionId)
  } catch {
    return null
  }

  const rows = await db
    .select({
      interpretation: predictions.interpretation,
      computed_at: predictions.computed_at,
      expires_at: predictions.expires_at,
    })
    .from(predictions)
    .where(and(eq(predictions.id, id), eq(predictions.owner_id, ownerId)))
    .limit(1)

  const row = rows[0]
  if (!row) return null

  return {
    interpretation: row.interpretation ?? null,
    computed_at: new Date(row.computed_at).toISOString(),
    expires_at: new Date(row.expires_at).toISOString(),
  }
}

/**
 * Persist an AI interpretation onto an existing prediction row.
 * Owner-scoped: only updates a prediction owned by ownerId. No-op when the id
 * is malformed or no owned row matches.
 */
export async function cacheInterpretation(
  predictionId: string,
  ownerId: string,
  input: { interpretation: string; computed_at: string; expires_at: string }
): Promise<void> {
  const db = getDb()

  let id: string
  try {
    id = toEntityId(predictionId)
  } catch {
    return
  }

  await db
    .update(predictions)
    .set({
      interpretation: input.interpretation,
      computed_at: new Date(input.computed_at).toISOString(),
      expires_at: new Date(input.expires_at).toISOString(),
    })
    .where(and(eq(predictions.id, id), eq(predictions.owner_id, ownerId)))
}

// ============================================================================
// USER-CONTEXT reads
// ============================================================================

/**
 * Port of the Postgres RPC `get_predictions_for_range`.
 *
 * The RPC used `WHERE p.owner_id = auth.uid()` (SECURITY DEFINER) — here the
 * owner is passed explicitly from requireUserId(). Overlap predicate and sort
 * are preserved:
 *   start_date <= p_end_date AND end_date >= p_start_date
 *   (optional) system = ANY(p_systems)
 *   ORDER BY start_date ASC, intensity DESC
 *
 * Intensity is a TEXT column whose `DESC` ordering is lexical
 * ('peak' > 'medium' > 'low' > 'high'); the original RPC behaved the same way,
 * so ordering is identical.
 */
export async function getPredictionsForRange(
  userId: string,
  startDate: string,
  endDate: string,
  systems?: string[] | null
): Promise<PredictionRangeRow[]> {
  const db = getDb()

  const conditions = [
    eq(predictions.owner_id, userId),
    lte(predictions.start_date, endDate),
    gte(predictions.end_date, startDate),
  ]
  if (systems && systems.length > 0) {
    conditions.push(inArray(predictions.system, systems))
  }

  const rows = await db
    .select({
      id: predictions.id,
      person_id: predictions.person_id,
      system: predictions.system,
      type: predictions.type,
      start_date: predictions.start_date,
      end_date: predictions.end_date,
      intensity: predictions.intensity,
      themes: predictions.themes,
      interpretation: predictions.interpretation,
      data: predictions.data,
    })
    .from(predictions)
    .where(and(...conditions))
    .orderBy(asc(predictions.start_date), desc(predictions.intensity))

  return rows.map((row) => {
    const s = serialize<Record<string, unknown>>(row)
    return {
      id: s.id as string,
      person_id: (s.person_id as string | null) ?? null,
      system: s.system as string,
      type: s.type as string,
      start_date: s.start_date as string,
      end_date: s.end_date as string,
      intensity: s.intensity as string,
      themes: (s.themes as string[]) ?? [],
      interpretation: (s.interpretation as string | null) ?? null,
      data: (s.data as Record<string, unknown>) ?? {},
    }
  })
}

/**
 * Owner-scoped fetch of a single person used by the timeline route to verify
 * the caller owns the person before generating a timeline. Returns the minimal
 * fields needed (id, name, birth_date) or null if missing / not owned.
 */
export async function getPersonForTimeline(
  userId: string,
  personId: string
): Promise<{ id: string; name: string; birth_date: string | null } | null> {
  const db = getDb()

  const rows = await db
    .select({ id: people.id, name: people.name, birth_date: people.birth_date })
    .from(people)
    .where(
      and(
        eq(people.id, toEntityId(personId)),
        eq(people.owner_id, userId),
        isNull(people.deleted_at)
      )
    )
    .limit(1)

  const person = rows[0]
  if (!person) return null

  const s = serialize<Record<string, unknown>>(person)
  return {
    id: s.id as string,
    name: (s.name as string) ?? '',
    birth_date: (s.birth_date as string | null) ?? null,
  }
}

// ============================================================================
// SYSTEM-CONTEXT (cron only — authorized by CRON_SECRET)
// ============================================================================

/**
 * All people that have a birth_date set, across every owner. SYSTEM CONTEXT:
 * intentionally NOT owner-scoped — only the cron (CRON_SECRET) calls this.
 * Mirrors `.from('people').select('id, owner_id, birth_date, first_name').not('birth_date', 'is', null)`.
 */
export async function systemListPeopleWithBirthDate(): Promise<
  { id: string; owner_id: string; birth_date: string; name: string }[]
> {
  const db = getDb()

  const rows = await db
    .select({
      id: people.id,
      owner_id: people.owner_id,
      birth_date: people.birth_date,
      name: people.name,
    })
    .from(people)
    .where(
      and(isNotNull(people.birth_date), ne(people.birth_date, ''), isNull(people.deleted_at))
    )

  return rows.map((p) => {
    const s = serialize<Record<string, unknown>>(p)
    return {
      id: s.id as string,
      owner_id: s.owner_id as string,
      birth_date: s.birth_date as string,
      name: (s.name as string) ?? '',
    }
  })
}

/**
 * SYSTEM CONTEXT. Does a cached prediction with this (person, type, start_date)
 * already exist? Mirrors the cron's existence check before insert.
 */
export async function systemPredictionExists(
  personId: string,
  type: string,
  startDate: string
): Promise<boolean> {
  const db = getDb()

  const rows = await db
    .select({ id: predictions.id })
    .from(predictions)
    .where(
      and(
        eq(predictions.person_id, toEntityId(personId)),
        eq(predictions.type, type),
        eq(predictions.start_date, startDate)
      )
    )
    .limit(1)

  return rows.length > 0
}

/**
 * SYSTEM CONTEXT. Insert a freshly-computed prediction. The owner_id is taken
 * from the originating person row (not from any request input).
 */
export async function systemInsertPrediction(
  input: UpsertPredictionInput
): Promise<void> {
  const db = getDb()

  await db.insert(predictions).values({
    person_id: toEntityId(input.person_id),
    owner_id: input.owner_id,
    system: input.system,
    type: input.type,
    start_date: input.start_date,
    end_date: input.end_date,
    intensity: input.intensity,
    themes: input.themes,
    data: input.data,
    computed_at: input.computed_at.toISOString(),
    expires_at: input.expires_at.toISOString(),
  })
}

/**
 * SYSTEM CONTEXT. Delete predictions whose expires_at is in the past.
 * Mirrors `.from('predictions').delete().lt('expires_at', now)`.
 */
export async function systemDeleteExpiredPredictions(
  now: Date = new Date()
): Promise<number> {
  const db = getDb()
  const deleted = await db
    .delete(predictions)
    .where(lt(predictions.expires_at, now.toISOString()))
    .returning({ id: predictions.id })
  return deleted.length
}
