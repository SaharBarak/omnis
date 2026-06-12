import { connectMongo } from '@/lib/db/connection'
import { Person, Prediction } from '@/lib/db/models'
import type {
  IPrediction,
  PredictionSystem,
  PredictionType,
  PredictionIntensity,
} from '@/lib/db/models'
import { serialize, toObjectId } from '@/lib/db/serialize'

/**
 * Predictions domain repository.
 *
 * Predictions are tied to a `person_id` (the person is owned by a user) and
 * carry their own `owner_id` (Better Auth id). Tenant isolation lives here now
 * that Postgres RLS is gone.
 *
 * Two classes of function:
 *  - USER-CONTEXT functions take `userId: string` as the first argument and
 *    filter every query by `owner_id: userId`. Callers MUST pass the id from
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
  await connectMongo()

  let id
  try {
    id = toObjectId(predictionId)
  } catch {
    return null
  }

  const row = await Prediction.findOne({ _id: id, owner_id: ownerId })
    .select('interpretation computed_at expires_at')
    .lean()

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
  await connectMongo()

  let id
  try {
    id = toObjectId(predictionId)
  } catch {
    return
  }

  await Prediction.updateOne(
    { _id: id, owner_id: ownerId },
    {
      $set: {
        interpretation: input.interpretation,
        computed_at: new Date(input.computed_at),
        expires_at: new Date(input.expires_at),
      },
    }
  )
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
 * Intensity is a Postgres TEXT column whose `DESC` ordering is lexical
 * ('peak' > 'medium' > 'low' > 'high'); we reproduce that exact lexical
 * ordering via $sort on a string field so behaviour is identical.
 */
export async function getPredictionsForRange(
  userId: string,
  startDate: string,
  endDate: string,
  systems?: string[] | null
): Promise<PredictionRangeRow[]> {
  await connectMongo()

  const match: Record<string, unknown> = {
    owner_id: userId,
    start_date: { $lte: endDate },
    end_date: { $gte: startDate },
  }
  if (systems && systems.length > 0) {
    match.system = { $in: systems as PredictionSystem[] }
  }

  const rows = await Prediction.find(match)
    .select('person_id system type start_date end_date intensity themes interpretation data')
    .sort({ start_date: 1, intensity: -1 })
    .lean()

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
  await connectMongo()

  const person = await Person.findOne({
    _id: toObjectId(personId),
    owner_id: userId,
    deleted_at: null,
  })
    .select('name birth_date')
    .lean()

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
  await connectMongo()

  const people = await Person.find({
    birth_date: { $nin: [null, ''] },
    deleted_at: null,
  })
    .select('owner_id birth_date name')
    .lean()

  return people.map((p) => {
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
  await connectMongo()

  const existing = await Prediction.exists({
    person_id: toObjectId(personId),
    type: type as PredictionType,
    start_date: startDate,
  })
  return existing != null
}

/**
 * SYSTEM CONTEXT. Insert a freshly-computed prediction. The owner_id is taken
 * from the originating person row (not from any request input).
 */
export async function systemInsertPrediction(
  input: UpsertPredictionInput
): Promise<void> {
  await connectMongo()

  const doc: Partial<IPrediction> = {
    person_id: toObjectId(input.person_id),
    owner_id: input.owner_id,
    system: input.system as PredictionSystem,
    type: input.type as PredictionType,
    start_date: input.start_date,
    end_date: input.end_date,
    intensity: input.intensity as PredictionIntensity,
    themes: input.themes,
    data: input.data,
    computed_at: input.computed_at,
    expires_at: input.expires_at,
  }
  await Prediction.create(doc)
}

/**
 * SYSTEM CONTEXT. Delete predictions whose expires_at is in the past.
 * Mirrors `.from('predictions').delete().lt('expires_at', now)`.
 */
export async function systemDeleteExpiredPredictions(
  now: Date = new Date()
): Promise<number> {
  await connectMongo()
  const res = await Prediction.deleteMany({ expires_at: { $lt: now } })
  return res.deletedCount ?? 0
}
