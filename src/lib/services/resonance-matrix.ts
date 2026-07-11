import type {
  CompatSystem,
  FiveSystemCompatibility,
  SystemScore,
} from '@pleiad/engine/services/compatibility'

/**
 * Resonance Matrix — pure helpers shared by the matrix API route and the
 * /app/graph matrix view. Everything in this module is deterministic and
 * dependency-free (no db, no fetch) so both sides can import it and the
 * helpers stay unit-testable.
 *
 * Cache design (computed_results):
 *  - one row per unordered pair, keyed on the table's existing unique index
 *    (person_id, system, version):
 *      person_id = the lexicographically LOWER person id of the pair,
 *      system    = MATRIX_PAIR_SYSTEM,
 *      version   = `${MATRIX_ENGINE_VERSION}:${higherPersonId}`.
 *  - the stored payload embeds both persons' updated_at values; a cache row
 *    is fresh only while both match the live rows (birth-data edits bump
 *    people.updated_at, invalidating the pair without any explicit hook).
 *  - bumping MATRIX_ENGINE_VERSION invalidates every pair at once.
 */

/** Bump when the five-system engine or the slim pair shape changes. */
export const MATRIX_ENGINE_VERSION = 'five-system-v1'

/** computed_results.system discriminator for pairwise cache rows. */
export const MATRIX_PAIR_SYSTEM = 'compat_pair'

/** Hard cap — N(N-1)/2 pairs; 40 people = 780 pairs is the ceiling. */
export const MAX_MATRIX_PEOPLE = 40

/** Minimal person shape the matrix needs (subset of the people row). */
export interface MatrixPersonInput {
  id: string
  name: string
  hebrew_name?: string | null
  birth_date: string
  birth_time?: string | null
  birth_place?: { lat?: number | null; lng?: number | null } | null
  is_self?: boolean
  updated_at: string
}

/** Slim pairwise result — enough for the heatmap + breakdown panel. */
export interface MatrixPairScore {
  /** Lower person id of the pair (sorted). */
  p1: string
  /** Higher person id of the pair (sorted). */
  p2: string
  overallScore: number
  systems: Record<CompatSystem, SystemScore>
  availableSystems: CompatSystem[]
  summary: { english: string; hebrew: string }
}

/** Payload stored in computed_results.data for a pair row. */
export interface MatrixPairCacheData {
  engine: string
  p1UpdatedAt: string
  p2UpdatedAt: string
  pair: MatrixPairScore
}

/** Stable unordered pair key: ids sorted lexicographically. */
export function sortPair(idA: string, idB: string): [string, string] {
  return idA < idB ? [idA, idB] : [idB, idA]
}

/** computed_results.version for the pair row anchored on the lower id. */
export function pairVersion(higherId: string): string {
  return `${MATRIX_ENGINE_VERSION}:${higherId}`
}

/** Map lookup key for a cached pair row: `${person_id}:${version}`. */
export function pairCacheKey(lowerId: string, higherId: string): string {
  return `${lowerId}:${pairVersion(higherId)}`
}

/** Reduce the full engine result to the slim matrix shape. */
export function slimPair(
  p1: string,
  p2: string,
  full: FiveSystemCompatibility
): MatrixPairScore {
  return {
    p1,
    p2,
    overallScore: full.overallScore,
    systems: full.systems,
    availableSystems: full.availableSystems,
    summary: full.summary,
  }
}

export function buildPairCacheData(
  pair: MatrixPairScore,
  p1UpdatedAt: string,
  p2UpdatedAt: string
): MatrixPairCacheData {
  return { engine: MATRIX_ENGINE_VERSION, p1UpdatedAt, p2UpdatedAt, pair }
}

/** Structural guard for untrusted jsonb from the cache table. */
export function isPairCacheData(data: unknown): data is MatrixPairCacheData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  const pair = d.pair as Record<string, unknown> | undefined
  return (
    typeof d.engine === 'string' &&
    typeof d.p1UpdatedAt === 'string' &&
    typeof d.p2UpdatedAt === 'string' &&
    !!pair &&
    typeof pair === 'object' &&
    typeof pair.p1 === 'string' &&
    typeof pair.p2 === 'string' &&
    typeof pair.overallScore === 'number' &&
    !!pair.systems &&
    typeof pair.systems === 'object'
  )
}

/**
 * A cached pair is fresh while the engine version and both persons'
 * updated_at timestamps still match the live rows.
 */
export function isFreshPairCache(
  data: unknown,
  p1UpdatedAt: string,
  p2UpdatedAt: string
): data is MatrixPairCacheData {
  return (
    isPairCacheData(data) &&
    data.engine === MATRIX_ENGINE_VERSION &&
    data.p1UpdatedAt === p1UpdatedAt &&
    data.p2UpdatedAt === p2UpdatedAt
  )
}

/**
 * Matrix axis order: the owner's self entry pinned first, everyone else in
 * the order given (the people repo already sorts by name).
 */
export function orderForMatrix<T extends { is_self?: boolean }>(people: T[]): T[] {
  return [...people].sort((a, b) => Number(b.is_self ?? false) - Number(a.is_self ?? false))
}

// ---------------------------------------------------------------------------
// Color ramp — violet→neutral sequential scale for score cells.
// Low resonance stays a quiet white/10 neutral on the dark ground; high
// resonance climbs the brand violet ramp to brand-bright. Never red/green.
// ---------------------------------------------------------------------------

export interface MatrixRampStep {
  /** Inclusive lower bound of the bucket (score 0-100). */
  min: number
  /** Cell fill. */
  fill: string
  /** Score numeral color that stays legible on the fill. */
  text: string
}

/** Ordered low→high; scoreBucket picks the last step whose min <= score. */
export const MATRIX_RAMP: readonly MatrixRampStep[] = [
  { min: 0, fill: 'hsl(0 0% 100% / 0.05)', text: 'hsl(0 0% 100% / 0.55)' },
  { min: 35, fill: 'hsl(258 50% 57% / 0.18)', text: 'hsl(0 0% 100% / 0.7)' },
  { min: 50, fill: 'hsl(258 50% 57% / 0.38)', text: 'hsl(0 0% 100% / 0.8)' },
  { min: 65, fill: 'hsl(258 50% 57% / 0.62)', text: 'hsl(0 0% 100% / 0.92)' },
  { min: 80, fill: 'hsl(258 56% 72% / 0.85)', text: 'hsl(229 33% 6.5% / 0.9)' },
  { min: 90, fill: 'hsl(259 62% 95% / 0.95)', text: 'hsl(229 33% 6.5%)' },
] as const

/** Bucket index into MATRIX_RAMP for a 0-100 score (clamped). */
export function scoreBucket(score: number): number {
  const s = Math.max(0, Math.min(100, score))
  let idx = 0
  for (let i = 0; i < MATRIX_RAMP.length; i++) {
    if (s >= MATRIX_RAMP[i].min) idx = i
  }
  return idx
}

/** Ramp step for a score — cell fill + numeral color. */
export function scoreRampStep(score: number): MatrixRampStep {
  return MATRIX_RAMP[scoreBucket(score)]
}
