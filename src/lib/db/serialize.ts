/**
 * Row-contract helpers for the Postgres data layer.
 *
 * Drizzle rows are already plain snake_case objects with an `id` string and
 * ISO-string timestamps (schema uses mode: 'string'), so `serialize` is a
 * defensive normalizer rather than a converter: it turns any stray Date into
 * an ISO string and recurses through nested values. The exported names and
 * the BadIdError contract are unchanged from the Mongo era so repositories
 * and routes keep their imports.
 */

type Plain = Record<string, unknown>

function convertValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(convertValue)
  if (typeof value === 'object') return convertObject(value as Plain)
  return value
}

function convertObject(input: Plain): Plain {
  const out: Plain = {}
  for (const [key, val] of Object.entries(input)) {
    out[key] = convertValue(val)
  }
  return out
}

export function serialize<T = Plain>(row: unknown): T {
  return convertValue(row) as T
}

export function serializeMany<T = Plain>(rows: unknown[]): T[] {
  return rows.map((r) => serialize<T>(r))
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Validate an entity id from untrusted client input. Throws BadIdError on
 * anything that is not a UUID (the Postgres PK shape). Replaces toObjectId.
 */
export function toEntityId(id: string): string {
  if (typeof id !== 'string' || !UUID_RE.test(id)) {
    throw new BadIdError(`Invalid id: ${id}`)
  }
  return id.toLowerCase()
}

/** Non-throwing UUID check for route-level guards. */
export function isEntityId(id: string): boolean {
  return typeof id === 'string' && UUID_RE.test(id)
}

export class BadIdError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BadIdError'
  }
}
