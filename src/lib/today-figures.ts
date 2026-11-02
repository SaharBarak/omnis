import { chineseYear, siderealSun } from '@pleiad/engine/calculations/calendars'
import { dateToLongCount, daysSinceCreation } from '@pleiad/engine/calculations/long-count'
import { getMoonReading } from '@pleiad/engine/calculations/moon'
import { SEALS } from '@pleiad/engine/data/seals'
import { GATES } from '@pleiad/engine/data/human-design-gates'
import { HEXAGRAMS, TRIGRAMS } from '@pleiad/engine/data/iching'
import { ZODIAC_SIGNS } from '@pleiad/engine/data/zodiac-signs'
import { sunNow } from '@pleiad/engine/services/today'
import { buildMaya } from '@/lib/atlas/maya'
import { BAZI_ELEMENT_COLORS } from '@/lib/design/bazi-elements'
import { signGlyphSrc } from '@/lib/design/glyph-paths'
import type { TodayAcrossSystems } from '@/lib/today-board'

/** What a day-board tile draws (`todayFigures` builds it; blocks/board-art.tsx draws it). Plain data, safe to send to a client. */
export type DayArt =
  /** The day's seal inside the twenty-seal ring, its seat at the top, the tone as a bar-and-dot mark. */
  | { readonly kind: 'seal'; readonly src: string; readonly seat: number; readonly seats: number; readonly tone: number }
  /** A glyph drawn in the row's colour (a zodiac sign). */
  | { readonly kind: 'glyph'; readonly src: string }
  /** The Moon's disc at its Sun–Moon elongation, 0 new, 180 full. */
  | { readonly kind: 'moon'; readonly angle: number }
  /** Six lines, bottom first, solid where yang; `active` is the line the Sun is on, 1 at the bottom. */
  | { readonly kind: 'hexagram'; readonly lines: readonly boolean[]; readonly active: number }
  /** A word in its own script. */
  | { readonly kind: 'script'; readonly text: string; readonly lang: string }
  /** Bar-and-dot numerals, one per place, largest place first. */
  | { readonly kind: 'bars'; readonly places: readonly number[] }
  /** The five elements in generating order, one lit. */
  | { readonly kind: 'elements'; readonly order: readonly string[]; readonly lit: string }

/** One tile's face: the drawing, the value set large, and the words under it. */
export interface DayFace {
  readonly art: DayArt
  readonly big: string
  readonly small: string
  readonly note?: string
}

export type TodayFigures = Partial<Readonly<Record<keyof TodayAcrossSystems, DayFace>>>

/**
 * The day's board as figures: one glyph, disc or mark per row, computed by
 * the engine for the same day the board's text comes from. Server only (the
 * Sun and Moon read the ephemeris); clients receive the plain data. A row
 * whose figure cannot be computed keeps its text tile.
 */

const noonOf = (day: string): Date => new Date(`${day}T12:00:00Z`)

const attempt = <T>(build: () => T): T | undefined => {
  try {
    return build()
  } catch {
    return undefined
  }
}

const signArt = (name: string): DayArt => {
  const sign = ZODIAC_SIGNS.find((s) => s.name === name)
  if (!sign) throw new RangeError(`No sign ${name}`)
  return { kind: 'glyph', src: signGlyphSrc(sign.number, sign.name) }
}

/** Six lines, bottom first, solid where the line is yang: the lower trigram, then the upper. */
const hexagramLines = (gate: number): readonly boolean[] => {
  const hexagram = HEXAGRAMS.find((h) => h.number === gate)
  if (!hexagram) throw new RangeError(`No hexagram ${gate}`)
  const trigram = (name: string) => TRIGRAMS.find((t) => t.name === name)?.lines ?? []
  const [lower, upper] = hexagram.trigrams
  return [...trigram(lower), ...trigram(upper)].map((line) => line === 1)
}

const hebrewParts = (day: string, locale: string): Readonly<Record<string, string>> =>
  Object.fromEntries(
    new Intl.DateTimeFormat(`${locale}-u-ca-hebrew`, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
      .formatToParts(noonOf(day))
      .map((part) => [part.type, part.value]),
  )

const kinFace = (day: string): DayFace => {
  const maya = buildMaya(day)
  return {
    art: { kind: 'seal', src: maya.seal.src, seat: maya.seal.n, seats: SEALS.length, tone: maya.tone.n },
    big: String(maya.kin),
    small: maya.title,
    note: `Traditional Tzolkin ${maya.tzolkin}`,
  }
}

const moonFace = (day: string, board: TodayAcrossSystems): DayFace => {
  const reading = getMoonReading(day)
  return { art: { kind: 'moon', angle: reading.angle }, big: `${Math.round(reading.illumination * 100)}%`, small: `lit · ${board.moon}` }
}

type Sun = ReturnType<typeof sunNow>

const sunFace = (sun: Sun): DayFace => ({ art: signArt(sun.sign), big: `${sun.degree}°`, small: sun.sign })

const gateFace = ({ gate, line }: Sun): DayFace => ({
  art: { kind: 'hexagram', lines: hexagramLines(gate), active: line },
  big: `${gate}.${line}`,
  small: GATES.find((g) => g.number === gate)?.name ?? `Gate ${gate}`,
})

const hebrewFace = (day: string): DayFace => {
  const en = hebrewParts(day, 'en')
  const he = hebrewParts(day, 'he')
  return { art: { kind: 'script', text: he.month, lang: 'he' }, big: en.day, small: `${en.month} ${en.year}` }
}

const longCountFace = (day: string, board: TodayAcrossSystems): DayFace => {
  const lc = dateToLongCount(day)
  return {
    art: { kind: 'bars', places: [lc.baktun, lc.katun, lc.tun, lc.winal, lc.kin] },
    big: board.longCount,
    small: `Day ${daysSinceCreation(day).toLocaleString('en-US')} of the count`,
  }
}

const siderealFace = (day: string): DayFace => {
  const sun = siderealSun(day)
  return { art: signArt(sun.sign), big: `${sun.degree}°`, small: `${sun.sign}, Lahiri` }
}

const chineseFace = (day: string): DayFace | undefined => {
  const year = chineseYear(noonOf(day))
  if (!year) return undefined
  return {
    art: { kind: 'elements', order: Object.keys(BAZI_ELEMENT_COLORS), lit: year.element },
    big: year.animal,
    small: `${year.polarity} ${year.element}`,
  }
}

/** Figures for `day` (YYYY-MM-DD), the day `board` was computed for. */
export function todayFigures(day: string, board: TodayAcrossSystems): TodayFigures {
  const sun = attempt(() => sunNow(day))
  const faces: readonly (readonly [keyof TodayAcrossSystems, DayFace | undefined])[] = [
    ['kin', attempt(() => kinFace(day))],
    ['moon', attempt(() => moonFace(day, board))],
    ['sun', sun && attempt(() => sunFace(sun))],
    ['gate', sun && attempt(() => gateFace(sun))],
    ['hebrewDate', attempt(() => hebrewFace(day))],
    ['longCount', attempt(() => longCountFace(day, board))],
    ['sidereal', attempt(() => siderealFace(day))],
    ['chineseYear', attempt(() => chineseFace(day))],
  ]
  return Object.fromEntries(faces.filter((entry): entry is readonly [keyof TodayAcrossSystems, DayFace] => entry[1] !== undefined))
}
