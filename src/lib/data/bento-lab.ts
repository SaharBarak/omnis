import { dateToKin, kinToSeal, kinToTone } from '@pleiad/engine/calculations/dreamspell'
import { calculateOracle } from '@pleiad/engine/calculations/oracle'
import { SEALS } from '@pleiad/engine/data/seals'
import { TONES } from '@pleiad/engine/data/tones'
import { BASE_RATE, surprisal } from '@pleiad/engine/services/rarity'
import { PLANS } from '@/lib/services/billing'
import { SYSTEM_FLAVORS, type SystemKey } from '@/lib/design/system-flavors'
import { sealGlyphSrc } from '@/lib/design/glyph-paths'
import { SYSTEM_CATALOG } from '@/lib/system-preferences'
import { getTodayAcrossSystems } from '@/lib/today-board'

/**
 * Data for the bento hero lab (docs/redesign/BENTO_HERO_LAB.md). Every value
 * a lab card shows is derived here from the engine, the measured base rates
 * or the plan table, so no card can carry an invented number.
 */

export interface SealRef {
  readonly number: number
  readonly name: string
  readonly color: string
  readonly src: string
}

export type OracleRole = 'guide' | 'analog' | 'antipode' | 'occult'

export interface OracleSeat {
  readonly role: OracleRole
  readonly seal: SealRef
}

export interface TieWorth {
  readonly type: string
  readonly label: string
  readonly share: number
  readonly percent: string
  readonly bits: number
}

export interface ReadingSystems {
  readonly count: number
  /** "Dreamspell, Tzolkin, Long Count and 7 more" — names the first few, counts the rest. */
  readonly lead: string
}

export interface PlanRow {
  readonly key: string
  readonly name: string
  readonly price: string
  readonly line: string
}

export interface SystemLink {
  readonly key: SystemKey
  readonly name: string
  readonly href: string
  readonly accent: string
}

export interface LabToday {
  readonly date: string
  readonly kin: number
  readonly tone: number
  readonly toneName: string
  readonly seal: SealRef
  readonly label: string
  readonly moon: string
  readonly sun: string
  readonly gate: string
  readonly hebrewDate: string
}

export interface BentoLabData {
  readonly today: LabToday
  readonly oracle: readonly OracleSeat[]
  readonly guideOdds: TieWorth
  /** The tie nearly every pair has: the counterweight that makes the guide tie mean something. */
  readonly commonest: TieWorth
  readonly ties: readonly TieWorth[]
  readonly readingSystems: ReadingSystems
  readonly plans: readonly PlanRow[]
  readonly systems: readonly SystemLink[]
}

const TIE_LABELS: ReadonlyArray<readonly [type: string, label: string]> = [
  ['guide', 'Dreamspell guide'],
  ['double-whammy-core', 'Sun–Moon double whammy'],
  ['companionship', 'Human Design companionship'],
  ['element', 'Shared element'],
  ['cross-aspect', 'Any cross-aspect'],
]

const LAB_PLANS = ['free', 'explorer', 'complete'] as const

const LAB_SYSTEMS: readonly SystemKey[] = ['dreamspell', 'humanDesign', 'astrology']

const LEAD_NAMED = 3

const toSealRef = (n: number): SealRef => {
  const seal = SEALS.find((s) => s.number === n)
  if (!seal) throw new RangeError(`No seal ${n}`)
  return { number: n, name: seal.english, color: seal.color, src: sealGlyphSrc(n, seal.english) }
}

const formatPercent = (p: number): string =>
  p >= 0.1 ? `${Math.round(p * 100)}%` : `${(p * 100).toFixed(2).replace(/0$/, '')}%`

const toTieWorth = ([type, label]: readonly [string, string]): TieWorth => {
  const rate = BASE_RATE[type]
  if (rate === undefined) throw new RangeError(`No measured base rate for ${type}`)
  return { type, label, share: rate, percent: formatPercent(rate), bits: Math.round(surprisal(type) * 10) / 10 }
}

const commonestOf = (ties: readonly TieWorth[]): TieWorth => {
  const [first, ...rest] = ties
  if (!first) throw new RangeError('No ties to compare')
  return rest.reduce((top, tie) => (tie.share > top.share ? tie : top), first)
}

const toReadingSystems = (): ReadingSystems => {
  const labels = SYSTEM_CATALOG.filter((system) => system.group === 'readings').map((system) => system.label)
  const named = labels.slice(0, LEAD_NAMED)
  const rest = labels.length - named.length
  const lead =
    rest > 0
      ? `${named.join(', ')} and ${rest} more`
      : new Intl.ListFormat('en', { type: 'conjunction' }).format(named)
  return { count: labels.length, lead }
}

const toPlanRow = (key: (typeof LAB_PLANS)[number]): PlanRow => {
  const plan = PLANS[key]
  const people = Number.isFinite(plan.limits.profiles) ? `${plan.limits.profiles} people` : 'Unlimited people'
  const systems =
    plan.limits.systems.length === 1 ? 'Dreamspell reading' : `${plan.limits.systems.length} systems`
  const pairs = plan.limits.relationships ? ' · pair maps' : ''
  return {
    key,
    name: plan.name,
    price: plan.price === 0 ? '$0' : `$${plan.price} / mo`,
    line: `${people} · ${systems}${pairs}`,
  }
}

const toSystemLink = (key: SystemKey): SystemLink => {
  const flavor = SYSTEM_FLAVORS[key]
  return { key, name: flavor.name, href: flavor.learnHref, accent: flavor.accentSoft }
}

export function buildBentoLab(now: Date = new Date()): BentoLabData {
  const date = now.toISOString().split('T')[0]
  const kin = dateToKin(date)
  const tone = kinToTone(kin)
  const board = getTodayAcrossSystems(now)
  const oracle = calculateOracle(kin)
  const ties = TIE_LABELS.map(toTieWorth)

  return {
    today: {
      date,
      kin,
      tone,
      toneName: TONES.find((t) => t.number === tone)?.name ?? '',
      seal: toSealRef(kinToSeal(kin)),
      label: board.kin,
      moon: board.moon,
      sun: board.sun,
      gate: board.gate,
      hebrewDate: board.hebrewDate,
    },
    oracle: (['guide', 'analog', 'occult', 'antipode'] as const).map((role) => ({
      role,
      seal: toSealRef(oracle[role]),
    })),
    guideOdds: ties[0],
    commonest: commonestOf(ties),
    ties,
    readingSystems: toReadingSystems(),
    plans: LAB_PLANS.map(toPlanRow),
    systems: LAB_SYSTEMS.map(toSystemLink),
  }
}
