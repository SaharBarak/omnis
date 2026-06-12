import { Types } from 'mongoose'

/**
 * Convert a Mongoose lean document into the plain JSON shape the frontend
 * expects (carried over from the Supabase row contract):
 *  - `_id` (ObjectId) -> `id` (string)
 *  - any ObjectId value -> string
 *  - Date -> ISO string
 *  - `__v` dropped
 * Recurses through nested objects and arrays.
 */
type Plain = Record<string, unknown>

function convertValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (value instanceof Types.ObjectId) return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(convertValue)
  if (typeof value === 'object') {
    // Bson ObjectId from the raw driver (not instanceof mongoose Types)
    const maybeId = value as { _bsontype?: string; toString(): string }
    if (maybeId._bsontype === 'ObjectId') return maybeId.toString()
    return convertObject(value as Plain)
  }
  return value
}

function convertObject(input: Plain): Plain {
  const out: Plain = {}
  for (const [key, val] of Object.entries(input)) {
    if (key === '__v') continue
    if (key === '_id') {
      out.id = convertValue(val)
      continue
    }
    out[key] = convertValue(val)
  }
  return out
}

export function serialize<T = Plain>(doc: unknown): T {
  return convertValue(doc) as T
}

export function serializeMany<T = Plain>(docs: unknown[]): T[] {
  return docs.map((d) => serialize<T>(d))
}

/** Validate + build an ObjectId from untrusted client input. Throws on bad id. */
export function toObjectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadIdError(`Invalid id: ${id}`)
  }
  return new Types.ObjectId(id)
}

export class BadIdError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BadIdError'
  }
}
