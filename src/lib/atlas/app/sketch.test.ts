import { describe, expect, it } from 'vitest'
import { MAX_SKETCH_LENGTH, SKETCH_COOKIE, decodeSketch, encodeSketch, inputFromForm, newNonce, sketchCookie, sketchFor, sketchValue, type SketchKeep } from './sketch'
import { LARGEST_INPUT, toBase64Url } from '../share'

const INPUT = { date: '1987-07-26', time: '14:30', place: { lat: 32.08, lng: 34.78, label: 'Tel Aviv, Israel' }, name: null, hebrewName: null }

const keep = (over: Partial<SketchKeep> = {}): SketchKeep => ({ nonce: newNonce(), owner: null, input: INPUT, ...over })

describe('the sketch cookie', () => {
  it('round-trips one input with its nonce and owner', () => {
    const sketch = keep({ owner: 'user-1' })
    expect(decodeSketch(encodeSketch(sketch))).toEqual(sketch)
  })

  it('refuses what the form would refuse', () => {
    expect(decodeSketch(encodeSketch(keep({ input: { ...INPUT, date: '1987-02-30' } })))).toBeNull()
    expect(decodeSketch(encodeSketch(keep({ nonce: 'short' })))).toBeNull()
    expect(decodeSketch(toBase64Url(JSON.stringify([{ id: 'a', input: INPUT }])))).toBeNull()
    expect(decodeSketch('not base64 at all!')).toBeNull()
    expect(decodeSketch(undefined)).toBeNull()
  })

  it('refuses anything longer than the largest valid sketch before parsing it', () => {
    expect(decodeSketch('a'.repeat(MAX_SKETCH_LENGTH + 1))).toBeNull()
  })

  it('fits the largest valid sketch in one cookie, name and attributes included', () => {
    const largest = encodeSketch(keep({ owner: 'x'.repeat(64), input: LARGEST_INPUT }))
    expect(largest.length).toBe(MAX_SKETCH_LENGTH)
    expect(decodeSketch(largest)).not.toBeNull()
    const attributes = '; Path=/lab/bento-v2/app; Max-Age=3600; HttpOnly; Secure; SameSite=Lax'
    expect(new TextEncoder().encode(`${SKETCH_COOKIE}=${largest}${attributes}`).length).toBeLessThan(4096)
  })

  it('draws a fresh 22-character nonce each time', () => {
    const a = newNonce()
    expect(a).toMatch(/^[A-Za-z0-9_-]{22}$/)
    expect(newNonce()).not.toBe(a)
  })

  it('offers a sketch to its owner, or to anyone when it was kept signed out', () => {
    const mine = decodeSketch(encodeSketch(keep({ owner: 'user-1' })))
    const anon = decodeSketch(encodeSketch(keep()))
    expect(sketchFor(mine, 'user-1')).toEqual(mine)
    expect(sketchFor(mine, 'user-2')).toBeNull()
    expect(sketchFor(anon, 'user-2')).toEqual(anon)
    expect(sketchFor(null, 'user-1')).toBeNull()
  })

  it('sets and clears with the same scoped, script-proof attributes', () => {
    expect(sketchCookie('/lab/bento-v2/app', true)).toEqual({ httpOnly: true, sameSite: 'lax', secure: true, path: '/lab/bento-v2/app', maxAge: 3600 })
  })

  it('writes only a keep that reads back, and refuses half a surrogate pair', () => {
    expect(sketchValue(keep())).not.toBeNull()
    expect(inputFromForm(JSON.stringify({ ...INPUT, name: '\ud800'.repeat(40) }))).toBeNull()
    expect(sketchValue(keep({ input: { ...INPUT, name: '\ud800'.repeat(40) } }))).toBeNull()
    expect(inputFromForm(JSON.stringify({ ...INPUT, name: 'Noa \ud83c\udf1f' }))?.name).toBe('Noa \ud83c\udf1f')
  })
})
