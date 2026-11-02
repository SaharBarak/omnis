import { calculateOracle } from '@pleiad/engine/calculations/oracle'
import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { dateToTzolkin } from '@pleiad/engine/calculations/tzolkin'
import { SEALS } from '@pleiad/engine/data/seals'
import { TONES } from '@pleiad/engine/data/tones'
import type { GlyphRef, MayaLayer } from './types'
import { sealGlyphSrc, toneGlyphSrc } from '@/lib/design/glyph-paths'

const capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

const sealRef = (n: number): GlyphRef => {
  const seal = SEALS[n - 1]
  return { n, name: seal.english, src: sealGlyphSrc(n, seal.english) }
}

const toneRef = (n: number): GlyphRef => {
  const tone = TONES[n - 1]
  return { n, name: tone.name, src: toneGlyphSrc(n, tone.name) }
}

/** Dreamspell kin, its oracle, and the traditional Tzolkin day for one date. Light: data tables only. */
export function buildMaya(date: string): MayaLayer {
  const kin = dateToKin(date)
  const seal = sealRef(kinToSeal(kin))
  const tone = toneRef(kinToTone(kin))
  const oracle = calculateOracle(kin)
  const tzolkin = dateToTzolkin(date)
  return {
    kin,
    title: `${capital(SEALS[seal.n - 1].color)} ${tone.name} ${seal.name}`,
    seal,
    tone,
    oracle: {
      guide: sealRef(oracle.guide),
      analog: sealRef(oracle.analog),
      antipode: sealRef(oracle.antipode),
      occult: sealRef(oracle.occult),
    },
    tzolkin: `${tzolkin.tone} ${tzolkin.daySign.yucatec}`,
  }
}
