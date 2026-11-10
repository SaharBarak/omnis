/**
 * The sexagenary cycle (干支 gānzhī): the ten heavenly stems and the twelve
 * earthly branches, turning together so that a stem meets a branch of its
 * own parity, sixty pairs from 甲子 (Jia Zi) to 癸亥 (Gui Hai) before both
 * come round. Each stem has its phase and polarity, two stems to a phase,
 * yang then yin; each branch its animal and the phase it carries. Tables as
 * in https://en.wikipedia.org/wiki/Heavenly_Stems ,
 * https://en.wikipedia.org/wiki/Earthly_Branches and
 * https://en.wikipedia.org/wiki/Sexagenary_cycle . The one table of stems
 * and branches the engine reads: years (`calendars.ts`), days and pillars
 * (`bazi.ts`) and the Chinese calendar's months and days
 * (`chinese-calendar.ts`).
 */

import type { PhaseName } from './wuxing'

export type Polarity = 'Yang' | 'Yin'

export interface Stem {
  /** 0 (Jia) to 9 (Gui). */
  readonly index: number
  readonly character: string
  readonly pinyin: string
  readonly phase: PhaseName
  readonly polarity: Polarity
}

export interface Branch {
  /** 0 (Zi) to 11 (Hai). */
  readonly index: number
  readonly character: string
  readonly pinyin: string
  readonly animal: string
  /** The phase the branch carries. */
  readonly phase: PhaseName
}

const STEM_ROWS = [
  ['甲', 'Jia', 'Wood'],
  ['乙', 'Yi', 'Wood'],
  ['丙', 'Bing', 'Fire'],
  ['丁', 'Ding', 'Fire'],
  ['戊', 'Wu', 'Earth'],
  ['己', 'Ji', 'Earth'],
  ['庚', 'Geng', 'Metal'],
  ['辛', 'Xin', 'Metal'],
  ['壬', 'Ren', 'Water'],
  ['癸', 'Gui', 'Water'],
] as const

const BRANCH_ROWS = [
  ['子', 'Zi', 'Rat', 'Water'],
  ['丑', 'Chou', 'Ox', 'Earth'],
  ['寅', 'Yin', 'Tiger', 'Wood'],
  ['卯', 'Mao', 'Rabbit', 'Wood'],
  ['辰', 'Chen', 'Dragon', 'Earth'],
  ['巳', 'Si', 'Snake', 'Fire'],
  ['午', 'Wu', 'Horse', 'Fire'],
  ['未', 'Wei', 'Goat', 'Earth'],
  ['申', 'Shen', 'Monkey', 'Metal'],
  ['酉', 'You', 'Rooster', 'Metal'],
  ['戌', 'Xu', 'Dog', 'Earth'],
  ['亥', 'Hai', 'Pig', 'Water'],
] as const

export const STEMS: readonly Stem[] = Object.freeze(
  STEM_ROWS.map(([character, pinyin, phase], index) => Object.freeze({ index, character, pinyin, phase, polarity: index % 2 === 0 ? 'Yang' : 'Yin' } as const)),
)

export const BRANCHES: readonly Branch[] = Object.freeze(BRANCH_ROWS.map(([character, pinyin, animal, phase], index) => Object.freeze({ index, character, pinyin, animal, phase })))

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

/** Stems and branches turn together until both come round: sixty. */
export const SEXAGENARY_CYCLE = (STEMS.length * BRANCHES.length) / gcd(STEMS.length, BRANCHES.length)

/** A place in the sixty: its stem and branch, written and in pinyin. */
export interface StemBranchPair {
  /** 0 (Jia Zi) to 59 (Gui Hai). */
  readonly position: number
  readonly stem: Stem
  readonly branch: Branch
  /** e.g. "丙午". */
  readonly characters: string
  /** e.g. "Bing Wu". */
  readonly pinyin: string
}

const within = (n: number, of: number): number => ((Math.round(n) % of) + of) % of

/** The pair at a place in the sixty, counted from 0 (Jia Zi), any integer. */
export function pairAt(position: number): StemBranchPair {
  const p = within(position, SEXAGENARY_CYCLE)
  const stem = STEMS[p % STEMS.length]
  const branch = BRANCHES[p % BRANCHES.length]
  if (!stem || !branch) throw new RangeError(`No pair at ${position}`)
  return { position: p, stem, branch, characters: `${stem.character}${branch.character}`, pinyin: `${stem.pinyin} ${branch.pinyin}` }
}

/** The place in the sixty of a stem and a branch of the same parity (0 Jia Zi). */
export function positionOf(stem: number, branch: number): number {
  const s = within(stem, STEMS.length)
  const b = within(branch, BRANCHES.length)
  if (s % 2 !== b % 2) throw new RangeError(`Stem ${s} never meets branch ${b}`)
  /* The place p with p ≡ s (mod 10) and p ≡ b (mod 12): six candidates for s, one of them b's. */
  const found = Array.from({ length: SEXAGENARY_CYCLE / STEMS.length }, (_, k) => s + k * STEMS.length).find((p) => p % BRANCHES.length === b)
  if (found === undefined) throw new RangeError(`No place for stem ${s}, branch ${b}`)
  return found
}
