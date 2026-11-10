import { z } from 'zod'
import { BirthInputSchema } from '../birth-input'
import { LARGEST_INPUT, fromBase64Url, toBase64Url } from '../share'
import type { BirthInput } from '../types'

/**
 * A map drawn signed out and kept for the account that signs in next
 * (docs/redesign/BENTO_V2.md "The hand-off"). It lives in one HttpOnly
 * cookie in the visitor's own browser, never in a URL and never on a server:
 * exactly one birth input, a nonce that tells one keep from the next, and
 * the account it was kept under, if any. Pure: the actions set and clear the
 * cookie; this module says what it holds.
 */

export const SKETCH_COOKIE = 'pleiad-sketch'

/** One hour: the hand-off serves the sign-up under way, not a later visit on a shared computer. */
export const SKETCH_TTL_S = 60 * 60

const NONCE = /^[A-Za-z0-9_-]{22}$/

export const SketchSchema = z.object({
  nonce: z.string().regex(NONCE),
  owner: z.string().min(1).max(64).nullable(),
  input: BirthInputSchema,
})

export type Sketch = z.output<typeof SketchSchema>

/** What a keep writes: the parsed input, its nonce and its owner. */
export interface SketchKeep {
  readonly nonce: string
  readonly owner: string | null
  readonly input: BirthInput
}

export const encodeSketch = (sketch: SketchKeep): string => toBase64Url(JSON.stringify({ nonce: sketch.nonce, owner: sketch.owner, input: sketch.input }))

/** The longest a valid sketch encodes to, from the largest input the schema accepts and the longest owner. */
export const MAX_SKETCH_LENGTH = encodeSketch({ nonce: 'x'.repeat(22), owner: 'x'.repeat(64), input: LARGEST_INPUT }).length

/** The cookie value for a keep, or null when it would not read back as the same sketch: a keep is only written when it can be offered. */
export function sketchValue(sketch: SketchKeep): string | null {
  const value = encodeSketch(sketch)
  return decodeSketch(value) ? value : null
}

/** Null for anything that is not one valid sketch. */
export function decodeSketch(code: string | null | undefined): Sketch | null {
  if (!code || code.length > MAX_SKETCH_LENGTH) return null
  try {
    const parsed = SketchSchema.safeParse(JSON.parse(fromBase64Url(code)))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

/** The sketch as this account may see it: its own, or one kept signed out; never another account's. */
export const sketchFor = (sketch: Sketch | null, userId: string): Sketch | null =>
  sketch && (sketch.owner === null || sketch.owner === userId) ? sketch : null

/** A fresh nonce: 16 random bytes as unpadded base64url, 22 characters. */
export const newNonce = (): string =>
  btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

/** The cookie's attributes, the same for setting and clearing, so a clear always hits the cookie it means. */
export const sketchCookie = (path: string, secure: boolean) =>
  Object.freeze({ httpOnly: true, sameSite: 'lax' as const, secure, path, maxAge: SKETCH_TTL_S })

/** A form's `input` field: the editor's birth input as JSON, parsed with the form's own schema; null for anything else. */
export function inputFromForm(value: FormDataEntryValue | null): BirthInput | null {
  if (typeof value !== 'string' || value.length > MAX_SKETCH_LENGTH) return null
  try {
    const parsed = BirthInputSchema.safeParse(JSON.parse(value))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}
