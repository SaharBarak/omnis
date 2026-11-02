import { PORTAL_LOOP, SKY_LOOP } from '@/lib/data/lab-media'
import { SYSTEM_FLAVORS } from '@/lib/design/system-flavors'

/** A system page's art: the mural still for its band and tiles, and its colour token. */
export interface SystemArt {
  readonly mural: string
  readonly accent: string
}

/**
 * The art each system page wears, by route path, held once so the page's
 * banner and the tiles that link to it can never disagree.
 */
export const SYSTEM_ART: Readonly<Record<string, SystemArt>> = {
  '/app/calendar': { mural: SYSTEM_FLAVORS.dreamspell.muralSrc, accent: 'var(--sys-dreamspell)' },
  '/app/numerology': { mural: SYSTEM_FLAVORS.gematria.muralSrc, accent: 'var(--sys-gematria)' },
  '/app/bazi': { mural: SYSTEM_FLAVORS.astrology.muralSrc, accent: 'var(--sys-astrology)' },
  '/app/gene-keys': { mural: SYSTEM_FLAVORS.humanDesign.muralSrc, accent: 'var(--sys-human-design)' },
  '/app/oracles': { mural: PORTAL_LOOP.poster, accent: 'var(--brand)' },
  '/app/tree-of-life': { mural: SYSTEM_FLAVORS.gematria.muralSrc, accent: 'var(--sys-gematria)' },
  '/app/moon': { mural: SKY_LOOP.poster, accent: 'var(--brand)' },
}

/** The art for a system route; every system route has a row (systems.test.ts). */
export const systemArt = (path: string): SystemArt => {
  const art = SYSTEM_ART[path]
  if (!art) throw new Error(`No system art for ${path}`)
  return art
}
