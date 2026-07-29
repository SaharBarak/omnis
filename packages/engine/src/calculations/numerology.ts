/**
 * Pythagorean numerology (#72) — the full personal-numbers suite the PRD
 * lists: Life Path, Expression/Destiny, Soul Urge, Personality, Birthday,
 * Maturity, Pinnacles, Challenges, Personal Year/Month/Day, Compatibility.
 *
 * Conventions (documented so the numbers are reproducible):
 * - Letter values are the Pythagorean 1-9 table on A-Z. Names are uppercased
 *   and stripped to A-Z first; a name with no mappable letters (e.g. written
 *   in Hebrew) yields null for the name-based numbers.
 * - Master numbers 11, 22, 33 are preserved wherever tradition keeps them:
 *   final reductions and the Life Path's month/day/year components.
 *   Challenges reduce fully (1-9 by construction); the Y is a vowel only
 *   when its word has no A/E/I/O/U.
 * - Personal Year runs on the calendar year (universal year + birth month
 *   and day), the common modern convention.
 */

import { parseDate } from './julian'

const LETTER_VALUES: Readonly<Record<string, number>> = Object.freeze({
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
})

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U'])
const MASTERS = new Set([11, 22, 33])

/** Sum the decimal digits of a non-negative integer. */
function digitSum(n: number): number {
  let sum = 0
  for (let x = Math.abs(n); x > 0; x = Math.floor(x / 10)) sum += x % 10
  return sum
}

/**
 * Reduce to a single digit, optionally stopping on the master numbers
 * 11 / 22 / 33 along the way.
 */
export function reduceNumber(n: number, keepMasters = true): number {
  let x = Math.abs(n)
  while (x > 9) {
    if (keepMasters && MASTERS.has(x)) return x
    x = digitSum(x)
  }
  return x
}

/** Uppercased A-Z words of a name; non-Latin letters drop out. */
function nameWords(name: string): string[] {
  return name
    .toUpperCase()
    .split(/[^A-Z]+/)
    .filter((w) => w.length > 0)
}

/** Y counts as a vowel only in words with no other vowel (e.g. "Lynn"). */
function isVowelIn(word: string, index: number): boolean {
  const ch = word[index]
  if (VOWELS.has(ch)) return true
  if (ch !== 'Y') return false
  return ![...word].some((c) => VOWELS.has(c))
}

function sumName(name: string, pick: 'all' | 'vowels' | 'consonants'): number | null {
  const words = nameWords(name)
  if (words.length === 0) return null
  let total = 0
  let picked = false
  for (const word of words) {
    for (let i = 0; i < word.length; i++) {
      const vowel = isVowelIn(word, i)
      if (pick === 'vowels' && !vowel) continue
      if (pick === 'consonants' && vowel) continue
      total += LETTER_VALUES[word[i]] ?? 0
      picked = true
    }
  }
  return picked ? reduceNumber(total) : null
}

// ---------------------------------------------------------------------------
// Birth-date numbers
// ---------------------------------------------------------------------------

/** Life Path — month, day, year each reduced (masters kept), then summed. */
export function lifePathNumber(birthDateStr: string): number {
  const { year, month, day } = parseDate(birthDateStr)
  return reduceNumber(reduceNumber(month) + reduceNumber(day) + reduceNumber(digitSum(year)))
}

/** Birthday number — the day of the month, reduced with masters kept. */
export function birthdayNumber(birthDateStr: string): number {
  return reduceNumber(parseDate(birthDateStr).day)
}

// ---------------------------------------------------------------------------
// Name numbers
// ---------------------------------------------------------------------------

/** Expression (a.k.a. Destiny) — every letter of the full name. */
export function expressionNumber(fullName: string): number | null {
  return sumName(fullName, 'all')
}

/** Soul Urge (Heart's Desire) — the vowels. */
export function soulUrgeNumber(fullName: string): number | null {
  return sumName(fullName, 'vowels')
}

/** Personality — the consonants. */
export function personalityNumber(fullName: string): number | null {
  return sumName(fullName, 'consonants')
}

/** Maturity — Life Path + Expression, reduced. Null without a mappable name. */
export function maturityNumber(birthDateStr: string, fullName: string): number | null {
  const expression = expressionNumber(fullName)
  if (expression === null) return null
  return reduceNumber(lifePathNumber(birthDateStr) + expression)
}

// ---------------------------------------------------------------------------
// Pinnacles & challenges
// ---------------------------------------------------------------------------

export interface Pinnacle {
  readonly number: number
  /** Inclusive age range; the fourth pinnacle is open-ended (toAge null). */
  readonly fromAge: number
  readonly toAge: number | null
}

/**
 * The four pinnacles. The first runs to age 36 − Life Path; the second and
 * third each take nine years; the fourth is lifelong.
 */
export function pinnacles(birthDateStr: string): Pinnacle[] {
  const { year, month, day } = parseDate(birthDateStr)
  const m = reduceNumber(month)
  const d = reduceNumber(day)
  const y = reduceNumber(digitSum(year))
  const p1 = reduceNumber(m + d)
  const p2 = reduceNumber(d + y)
  const p3 = reduceNumber(p1 + p2)
  const p4 = reduceNumber(m + y)
  const firstEnd = 36 - reduceNumber(lifePathNumber(birthDateStr), false)
  return [
    { number: p1, fromAge: 0, toAge: firstEnd },
    { number: p2, fromAge: firstEnd + 1, toAge: firstEnd + 9 },
    { number: p3, fromAge: firstEnd + 10, toAge: firstEnd + 18 },
    { number: p4, fromAge: firstEnd + 19, toAge: null },
  ]
}

/** The four challenges — absolute differences, fully reduced (1-9, often 0). */
export function challenges(birthDateStr: string): number[] {
  const { year, month, day } = parseDate(birthDateStr)
  const m = reduceNumber(month, false)
  const d = reduceNumber(day, false)
  const y = reduceNumber(digitSum(year), false)
  const c1 = reduceNumber(Math.abs(m - d), false)
  const c2 = reduceNumber(Math.abs(d - y), false)
  const c3 = reduceNumber(Math.abs(c1 - c2), false)
  const c4 = reduceNumber(Math.abs(m - y), false)
  return [c1, c2, c3, c4]
}

// ---------------------------------------------------------------------------
// Personal cycles
// ---------------------------------------------------------------------------

/** Personal Year — birth month + birth day + universal year, reduced. */
export function personalYearNumber(birthDateStr: string, targetDateStr: string): number {
  const { month, day } = parseDate(birthDateStr)
  const { year } = parseDate(targetDateStr)
  return reduceNumber(reduceNumber(month) + reduceNumber(day) + reduceNumber(digitSum(year)))
}

/** Personal Month — personal year + calendar month, reduced. */
export function personalMonthNumber(birthDateStr: string, targetDateStr: string): number {
  const { month } = parseDate(targetDateStr)
  return reduceNumber(personalYearNumber(birthDateStr, targetDateStr) + reduceNumber(month))
}

/** Personal Day — personal month + calendar day, reduced. */
export function personalDayNumber(birthDateStr: string, targetDateStr: string): number {
  const { day } = parseDate(targetDateStr)
  return reduceNumber(personalMonthNumber(birthDateStr, targetDateStr) + reduceNumber(day))
}

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

/**
 * Natural-match groups of the classic Life Path compatibility reading:
 * numbers sharing an element harmonize most easily.
 */
const NATURAL_MATCHES: readonly (readonly number[])[] = [
  [1, 5, 7], // mind
  [2, 4, 8], // body / builders
  [3, 6, 9], // heart / creatives
]

export type NumerologyHarmony = 'natural' | 'compatible' | 'challenging'

export interface NumerologyCompatibility {
  readonly a: number
  readonly b: number
  readonly harmony: NumerologyHarmony
  readonly note: string
}

const CHALLENGING_PAIRS = new Set(
  [
    [1, 2], [1, 6], [2, 5], [3, 4], [3, 8], [4, 5],
    [5, 6], [6, 7], [7, 8], [8, 9], [2, 9], [4, 9],
  ].map(([x, y]) => `${x}-${y}`)
)

function pairKey(a: number, b: number): string {
  return a <= b ? `${a}-${b}` : `${b}-${a}`
}

/** Life Path compatibility; master numbers read through their root digit. */
export function numerologyCompatibility(
  lifePathA: number,
  lifePathB: number
): NumerologyCompatibility {
  const a = reduceNumber(lifePathA, false)
  const b = reduceNumber(lifePathB, false)
  const natural = NATURAL_MATCHES.some((g) => g.includes(a) && g.includes(b))
  const harmony: NumerologyHarmony = natural
    ? 'natural'
    : CHALLENGING_PAIRS.has(pairKey(a, b))
      ? 'challenging'
      : 'compatible'
  const note =
    harmony === 'natural'
      ? 'Same element — these paths reinforce each other without effort.'
      : harmony === 'compatible'
        ? 'Different elements that trade strengths — workable with awareness.'
        : 'Opposed rhythms — growth comes from the friction, not in spite of it.'
  return { a: lifePathA, b: lifePathB, harmony, note }
}

// ---------------------------------------------------------------------------
// The full chart
// ---------------------------------------------------------------------------

export interface NumerologyChart {
  readonly lifePath: number
  readonly birthday: number
  /** Null when the name has no A-Z letters (e.g. Hebrew script). */
  readonly expression: number | null
  readonly soulUrge: number | null
  readonly personality: number | null
  readonly maturity: number | null
  readonly pinnacles: readonly Pinnacle[]
  readonly challenges: readonly number[]
  readonly personalYear: number
  readonly personalMonth: number
  readonly personalDay: number
}

/** Everything at once, for a person's numerology page. */
export function numerologyChart(
  birthDateStr: string,
  fullName: string,
  targetDateStr: string
): NumerologyChart {
  return {
    lifePath: lifePathNumber(birthDateStr),
    birthday: birthdayNumber(birthDateStr),
    expression: expressionNumber(fullName),
    soulUrge: soulUrgeNumber(fullName),
    personality: personalityNumber(fullName),
    maturity: maturityNumber(birthDateStr, fullName),
    pinnacles: pinnacles(birthDateStr),
    challenges: challenges(birthDateStr),
    personalYear: personalYearNumber(birthDateStr, targetDateStr),
    personalMonth: personalMonthNumber(birthDateStr, targetDateStr),
    personalDay: personalDayNumber(birthDateStr, targetDateStr),
  }
}

/** One-line meanings for 1-9 + masters, shared by web and mobile pages. */
export const NUMBER_MEANINGS: Readonly<Record<number, string>> = Object.freeze({
  1: 'The initiator — independence, drive, beginnings',
  2: 'The diplomat — partnership, sensitivity, balance',
  3: 'The voice — expression, creativity, joy',
  4: 'The builder — structure, discipline, foundations',
  5: 'The traveler — freedom, change, appetite for life',
  6: 'The caretaker — responsibility, harmony, home',
  7: 'The seeker — analysis, solitude, the inner world',
  8: 'The executive — power, ambition, material mastery',
  9: 'The humanitarian — completion, compassion, the long view',
  11: 'Master intuitive — illumination carried at high voltage',
  22: 'Master builder — vision made concrete at scale',
  33: 'Master teacher — compassion raised to a discipline',
  0: 'No charge — this cycle carries no lesson of its own',
})
