/**
 * BaZi — the Four Pillars of Destiny (#73).
 *
 * Every pillar is a stem-branch pair from the sexagenary cycle
 * (data/sexagenary.ts, the engine's one table of stems and branches):
 * - Day: pure JDN arithmetic — stem = 1+(JDN−1) mod 10, branch =
 *   1+(JDN+1) mod 12 (ytliu0.github.io/ChineseCalendar; anchor verified:
 *   27 Jan 2019 = jiǎzǐ at JDN 2458511, which gregorianToJDN reproduces).
 * - Year: the SOLAR year of Chinese astrology, changing at Li Chun (sun at
 *   315°, ~4 Feb) — not the lunisolar new year the civil calendar uses.
 * - Month: the solar month opened by each sectional term from Li Chun
 *   (Tiger month at 315°), stem from the year stem by the Five Tigers rule.
 * - Hour: two-hour branches from 23:00, stem from the day stem by the Five
 *   Rats rule. Late-zi (23:00-24:00) keeps the civil day's stem here —
 *   schools differ; this is the simpler convention, documented.
 *
 * The terms are the Chinese calendar's (`chinese-calendar.ts`), each dated
 * on its day in Beijing: a date takes the solar month and year whose term
 * falls on or before it. A date carries no birth instant or zone, so a
 * birth on a term's own day is read as past it — a date-level reading.
 */

import { BRANCHES, STEMS, pairAt, positionOf } from '../data/sexagenary'
import type { PhaseName } from '../data/wuxing'
import { nextSolarTerms, solarTermOn, solarYearOn } from './chinese-calendar'
import { daysFrom } from './day-search'
import { gregorianToJDN, parseDate } from './julian'

export const STEM_NAMES: readonly string[] = Object.freeze(STEMS.map((s) => s.pinyin))

export const BRANCH_NAMES: readonly string[] = Object.freeze(BRANCHES.map((b) => b.pinyin))

export type BaziElement = PhaseName

export interface StemBranch {
  /** 0-9 into STEM_NAMES. */
  readonly stem: number
  /** 0-11 into BRANCH_NAMES. */
  readonly branch: number
  readonly stemName: string
  readonly branchName: string
  /** Element of the stem. */
  readonly element: BaziElement
  /** Element the branch carries. */
  readonly branchElement: BaziElement
  readonly polarity: 'Yang' | 'Yin'
  readonly animal: string
  /** e.g. "Bing Wu — Yang Fire Horse". */
  readonly name: string
}

/** The pillar at a place in the sixty (0 Jia Zi). */
function fromCyclePosition(position: number): StemBranch {
  const { stem, branch } = pairAt(position)
  return {
    stem: stem.index,
    branch: branch.index,
    stemName: stem.pinyin,
    branchName: branch.pinyin,
    element: stem.phase,
    branchElement: branch.phase,
    polarity: stem.polarity,
    animal: branch.animal,
    name: `${stem.pinyin} ${branch.pinyin} — ${stem.polarity} ${stem.phase} ${branch.animal}`,
  }
}

const stemBranch = (stem: number, branch: number): StemBranch => fromCyclePosition(positionOf(stem, branch))

/** Position 0-59 in the sexagenary cycle (0 = Jia Zi). */
const cyclePosition = (sb: StemBranch): number => positionOf(sb.stem, sb.branch)

/** The BaZi (solar) year of a date — changes at Li Chun, not the new moon. */
export function baziYear(dateStr: string): number {
  return solarYearOn(dateStr)
}

export function yearPillar(dateStr: string): StemBranch {
  const y = baziYear(dateStr)
  return stemBranch((y - 4) % 10, (y - 4) % 12)
}

/** Terms to a solar month: its sectional term and its principal one. */
const TERMS_IN_MONTH = 2

/** 0 = Tiger month (from Li Chun), … 11 = Ox month. */
function solarMonthIndex(dateStr: string): number {
  return Math.floor(solarTermOn(dateStr).term.index / TERMS_IN_MONTH)
}

export function monthPillar(dateStr: string): StemBranch {
  const monthIndex = solarMonthIndex(dateStr)
  const year = yearPillar(dateStr)
  // Five Tigers: the Tiger month's stem follows the year stem.
  const stem = ((year.stem % 5) * 2 + 2 + monthIndex) % 10
  const branch = (2 + monthIndex) % 12
  return stemBranch(stem, branch)
}

export function dayPillar(dateStr: string): StemBranch {
  const { year, month, day } = parseDate(dateStr)
  const jdn = gregorianToJDN(year, month, day)
  return stemBranch((jdn - 1) % 10 /* 0-based Jia=0 ⇔ 1+(JDN−1)%10 */, (jdn + 1) % 12)
}

/** Hour branch from "HH:MM" (23:00-00:59 = Zi). */
function hourBranchIndex(timeStr: string): number {
  const hour = Number(timeStr.split(':')[0])
  return Math.floor(((hour + 1) % 24) / 2)
}

export function hourPillar(dateStr: string, timeStr: string): StemBranch {
  const branch = hourBranchIndex(timeStr)
  const day = dayPillar(dateStr)
  // Five Rats: the Zi hour's stem follows the day stem.
  const stem = ((day.stem % 5) * 2 + branch) % 10
  return stemBranch(stem, branch)
}

export interface BaziChart {
  readonly year: StemBranch
  readonly month: StemBranch
  readonly day: StemBranch
  /** Null when the birth time is unknown. */
  readonly hour: StemBranch | null
  /** The day stem — the chart's center, "the self". */
  readonly dayMaster: { readonly name: string; readonly element: BaziElement; readonly polarity: 'Yang' | 'Yin' }
  /** How many of the five elements appear across stems and branches. */
  readonly elementCounts: Readonly<Record<BaziElement, number>>
}

export function baziChart(dateStr: string, timeStr: string | null): BaziChart {
  const year = yearPillar(dateStr)
  const month = monthPillar(dateStr)
  const day = dayPillar(dateStr)
  const hour = timeStr !== null && /^\d{1,2}:\d{2}/.test(timeStr)
    ? hourPillar(dateStr, timeStr)
    : null

  const counts: Record<BaziElement, number> = {
    Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0,
  }
  for (const pillar of [year, month, day, hour]) {
    if (pillar === null) continue
    counts[pillar.element] += 1
    counts[pillar.branchElement] += 1
  }

  return {
    year,
    month,
    day,
    hour,
    dayMaster: { name: day.stemName, element: day.element, polarity: day.polarity },
    elementCounts: counts,
  }
}

// ---------------------------------------------------------------------------
// Luck pillars
// ---------------------------------------------------------------------------

export interface LuckPillar extends StemBranch {
  /** Age (in years) this decade begins. */
  readonly startAge: number
  readonly endAge: number
}

/** Days from birth to the sectional term that opens the next solar month (forward), or from the one that opened its own (backward). */
function daysToJie(dateStr: string, direction: 1 | -1): number {
  if (direction < 0) return daysFrom(solarTermOn(dateStr).date, dateStr) + 1
  const next = nextSolarTerms(dateStr, TERMS_IN_MONTH).find((t) => !t.term.principal)
  return next ? daysFrom(dateStr, next.date) : 0
}

/**
 * The eight decade pillars. Direction is forward for yang-year males and
 * yin-year females, backward otherwise; the first pillar begins at
 * (days to the next/previous month term) ÷ 3 years, the traditional rate
 * of one day per four months.
 */
export function luckPillars(dateStr: string, gender: 'male' | 'female'): LuckPillar[] {
  const year = yearPillar(dateStr)
  const month = monthPillar(dateStr)
  const yang = year.polarity === 'Yang'
  const forward = (yang && gender === 'male') || (!yang && gender === 'female')
  const direction: 1 | -1 = forward ? 1 : -1

  const startAge = Math.max(1, Math.round(daysToJie(dateStr, direction) / 3))
  const monthPosition = cyclePosition(month)

  const pillars: LuckPillar[] = []
  for (let i = 1; i <= 8; i++) {
    const sb = fromCyclePosition(monthPosition + direction * i)
    const from = startAge + (i - 1) * 10
    pillars.push({ ...sb, startAge: from, endAge: from + 9 })
  }
  return pillars
}

/** The year pillar of any Gregorian year (its Li Chun to the next). */
export function annualPillar(gregorianYear: number): StemBranch {
  return stemBranch((gregorianYear - 4) % 10, (gregorianYear - 4) % 12)
}

// ---------------------------------------------------------------------------
// Branch compatibility
// ---------------------------------------------------------------------------

/** The four harmony trines of the zodiac branches. */
const TRINES: readonly (readonly number[])[] = [
  [0, 4, 8],  // Rat, Dragon, Monkey
  [1, 5, 9],  // Ox, Snake, Rooster
  [2, 6, 10], // Tiger, Horse, Dog
  [3, 7, 11], // Rabbit, Goat, Pig
]

/** Six-harmony pairs (liu he). */
const SIX_HARMONIES = new Set(['0-1', '2-11', '3-10', '4-9', '5-8', '6-7'])

export type BaziRelation = 'trine' | 'harmony' | 'clash' | 'neutral'

export interface BaziBranchCompatibility {
  readonly relation: BaziRelation
  readonly note: string
}

/** Relation between two zodiac branches (0-11): trine ally, six harmony, clash, or neutral. */
export function baziBranchCompatibility(a: number, b: number): BaziBranchCompatibility {
  const x = ((a % 12) + 12) % 12
  const y = ((b % 12) + 12) % 12
  const key = x <= y ? `${x}-${y}` : `${y}-${x}`
  if (TRINES.some((t) => t.includes(x) && t.includes(y)) && x !== y) {
    return { relation: 'trine', note: 'Same harmony trine — natural allies four years apart.' }
  }
  if (SIX_HARMONIES.has(key)) {
    return { relation: 'harmony', note: 'A six-harmony pair — quietly complementary.' }
  }
  if ((x + 6) % 12 === y) {
    return { relation: 'clash', note: 'Opposite branches — the classic clash pair; friction and momentum.' }
  }
  return { relation: 'neutral', note: 'No special bond or clash between these branches.' }
}
