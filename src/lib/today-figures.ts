import { SIDEREAL_AYANAMSA, YEARS_IN_CYCLE, calendarMonth, chineseYearOf, siderealSun } from '@pleiad/engine/calculations/calendars'
import { noonOf } from '@pleiad/engine/calculations/day-search'
import { chineseYearOn } from '@pleiad/engine/calculations/chinese-calendar'
import { lunationOn } from '@pleiad/engine/calculations/sky-dates'
import { PLACE_DAYS, dateToLongCount, daysSinceCreation } from '@pleiad/engine/calculations/long-count'
import { getLunation } from '@pleiad/engine/calculations/moon'
import { SEALS } from '@pleiad/engine/data/seals'
import { GATES } from '@pleiad/engine/data/human-design-gates'
import { hexagramLines } from '@pleiad/engine/data/iching'
import { ZODIAC_SIGNS } from '@pleiad/engine/data/zodiac-signs'
import { sunNow } from '@pleiad/engine/services/today'
import { FULL_TURN, SIGN_DEGREES } from '@/lib/boards/parts'
import { skyOf } from '@/lib/boards/sky'
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

/** A value's place in its cycle: `at` of `of` units gone, today counted to its middle (BENTO_V2.md "Cycle tracks"), and that place as read aloud. */
export interface DayCycle {
  readonly at: number
  readonly of: number
  /** Today's place in words, for assistive tech where the track is only seen: "day 28 of 30". */
  readonly said: string
}

/** One tile's face: the drawing, the value set large, the words under it, and where the value stands in its cycle. */
export interface DayFace {
  readonly art: DayArt
  readonly big: string
  readonly small: string
  readonly note?: string
  readonly cycle?: DayCycle
}

export type TodayFigures = Partial<Readonly<Record<keyof TodayAcrossSystems, DayFace>>>

/**
 * The day's board as figures: one glyph, disc or mark per row, computed by
 * the engine for the same day the board's text comes from. Server only (the
 * Sun and Moon read the ephemeris); clients receive the plain data. A row
 * whose figure cannot be computed keeps its text tile.
 */

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

/** Today is the `n`th unit (1 first) of a cycle of `of`: part way through it, so counted to its middle; `said` reads that place aloud. */
export const inUnit = (n: number, of: number, said: string): DayCycle => ({ at: n - 0.5, of, said })


/** The month's name in Hebrew script, for the figure. */
const hebrewMonthScript = (day: string): string =>
  new Intl.DateTimeFormat('he-u-ca-hebrew', { month: 'long', timeZone: 'UTC' }).formatToParts(noonOf(day)).find((part) => part.type === 'month')?.value ?? ''

/** The Hebrew month `day` falls in, as the engine counts it. */
const hebrewMonth = (day: string) => {
  const month = calendarMonth(day, 'hebrew')
  if (!month) throw new RangeError(`No Hebrew month for ${day}`)
  return month
}

/** A Hebrew month runs 29 days or 30. */
export const hebrewMonthLength = (day: string): number => hebrewMonth(day).length

const kinFace = (day: string): DayFace => {
  const maya = buildMaya(day)
  return {
    art: { kind: 'seal', src: maya.seal.src, seat: maya.seal.n, seats: SEALS.length, tone: maya.tone.n },
    big: String(maya.kin),
    small: maya.title,
    note: `Traditional Tzolkin ${maya.tzolkin}`,
  }
}

const moonFace = (day: string): DayFace => {
  const lunation = getLunation(day)
  /* The lunation's days counted at noon, as the Moon's board lays them out (`lunationOn`). */
  const age = lunationOn(day, skyOf(day)).at
  return {
    art: { kind: 'moon', angle: lunation.angle },
    big: `${Math.round(lunation.illumination * 100)}%`,
    small: `lit · ${lunation.phase}`,
    cycle: { at: lunation.angle, of: FULL_TURN, said: `day ${age} of the lunation` },
  }
}

type Sun = ReturnType<typeof sunNow>

const KIN_IN_WINAL = PLACE_DAYS.winal / PLACE_DAYS.kin

/** The Sun's degree in its sign, as said: whole degrees gone of the sign's thirty. */
const inSign = (degree: number): DayCycle => inUnit(degree + 1, SIGN_DEGREES, `${degree} of ${SIGN_DEGREES} degrees`)

const sunFace = (sun: Sun): DayFace => ({ art: signArt(sun.sign), big: `${sun.degree}°`, small: sun.sign, cycle: inSign(sun.degree) })

const gateFace = ({ gate, line }: Sun): DayFace => {
  const lines = hexagramLines(gate)
  return {
    art: { kind: 'hexagram', lines, active: line },
    big: `${gate}.${line}`,
    small: GATES.find((g) => g.number === gate)?.name ?? `Gate ${gate}`,
    cycle: inUnit(line, lines.length, `line ${line} of ${lines.length}`),
  }
}

const hebrewFace = (day: string): DayFace => {
  const month = hebrewMonth(day)
  return {
    art: { kind: 'script', text: hebrewMonthScript(day), lang: 'he' },
    big: String(month.day),
    small: `${month.month} ${month.year}`,
    cycle: inUnit(month.day, month.length, `day ${month.day} of ${month.length}`),
  }
}

const longCountFace = (day: string, board: TodayAcrossSystems): DayFace => {
  const lc = dateToLongCount(day)
  return {
    art: { kind: 'bars', places: [lc.baktun, lc.katun, lc.tun, lc.winal, lc.kin] },
    big: board.longCount,
    small: `Day ${daysSinceCreation(day).toLocaleString('en-US')} of the count`,
    cycle: inUnit(lc.kin + 1, KIN_IN_WINAL, `day ${lc.kin + 1} of the winal's ${KIN_IN_WINAL}`),
  }
}

const siderealFace = (day: string): DayFace => {
  const sun = siderealSun(day)
  return { art: signArt(sun.sign), big: `${sun.degree}°`, small: `${sun.sign}, ${SIDEREAL_AYANAMSA}`, cycle: inSign(sun.degree) }
}

/** The Chinese year in force on `day`, by the engine's reading of the calendar's new Moons. */
const chineseFace = (day: string): DayFace | undefined => {
  const began = chineseYearOn(day)
  if (began === null) return undefined
  const year = chineseYearOf(began)
  return {
    art: { kind: 'elements', order: Object.keys(BAZI_ELEMENT_COLORS), lit: year.element },
    big: year.animal,
    small: `${year.polarity} ${year.element}`,
    cycle: inUnit(year.cycle, YEARS_IN_CYCLE, `year ${year.cycle} of ${YEARS_IN_CYCLE}`),
  }
}

/** Figures for `day` (YYYY-MM-DD), the day `board` was computed for. */
export function todayFigures(day: string, board: TodayAcrossSystems): TodayFigures {
  const sun = attempt(() => sunNow(day))
  const faces: readonly (readonly [keyof TodayAcrossSystems, DayFace | undefined])[] = [
    ['kin', attempt(() => kinFace(day))],
    ['moon', attempt(() => moonFace(day))],
    ['sun', sun && attempt(() => sunFace(sun))],
    ['gate', sun && attempt(() => gateFace(sun))],
    ['hebrewDate', attempt(() => hebrewFace(day))],
    ['longCount', attempt(() => longCountFace(day, board))],
    ['sidereal', attempt(() => siderealFace(day))],
    ['chineseYear', attempt(() => chineseFace(day))],
  ]
  return Object.fromEntries(faces.filter((entry): entry is readonly [keyof TodayAcrossSystems, DayFace] => entry[1] !== undefined))
}
