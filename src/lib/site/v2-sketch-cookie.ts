import { cookies } from 'next/headers'
import { V2_GATE } from './v2-routes'
import { SKETCH_COOKIE, decodeSketch, sketchCookie, sketchValue, type Sketch, type SketchKeep } from '@/lib/atlas/app/sketch'

/**
 * The kept map's cookie for v2 (docs/redesign/BENTO_V2.md "The hand-off"),
 * scoped to the v2 app, the only pages that offer it. Server only: actions
 * write and clear it, server components read it. Setting and clearing share
 * one attribute set, so a clear always reaches the cookie it means.
 */

const attributes = () => sketchCookie(V2_GATE.prefix, process.env.NODE_ENV === 'production')

export async function readSketch(): Promise<Sketch | null> {
  return decodeSketch((await cookies()).get(SKETCH_COOKIE)?.value)
}

/** Holds the keep; false when it would not read back, so nothing is written that could never be offered. */
export async function writeSketch(sketch: SketchKeep): Promise<boolean> {
  const value = sketchValue(sketch)
  if (value === null) return false
  ;(await cookies()).set(SKETCH_COOKIE, value, attributes())
  return true
}

export async function clearSketch(): Promise<void> {
  ;(await cookies()).set(SKETCH_COOKIE, '', { ...attributes(), maxAge: 0 })
}
