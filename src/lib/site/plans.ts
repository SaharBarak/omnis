import { PRICING_PLANS } from '@/components/pricing/plan-data'
import { PLANS } from '@/lib/services/billing'
import { signInHref } from '@/lib/site/routes'
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/store-links'
import { SYSTEM_CATALOG } from '@/lib/system-preferences'

/**
 * Plan cards and the comparison ledger, derived from the limits billing
 * enforces (`PLANS.limits`). Names and prices come from billing, cadence and
 * the recommended plan from the pricing data, short lines from PLAN_COPY.
 * No count is typed by hand.
 */

export type PlanId = keyof typeof PLANS

type Limits = (typeof PLANS)[PlanId]['limits']

const READING_SYSTEMS = SYSTEM_CATALOG.filter((s) => s.group === 'readings')

export interface PlanCard {
  readonly id: PlanId
  readonly name: string
  readonly price: string
  readonly cadence: string
  readonly tagline: string
  readonly cta: string
  readonly featured: boolean
  readonly facts: readonly string[]
  readonly action: PlanAction
}

/**
 * Where a plan's button goes. Paid plans are in-app purchases, so a paid
 * button opens the store listing; before a listing is live it opens the
 * account, where the person starts free (store-links.ts).
 */
export interface PlanAction {
  readonly href: string
  readonly external: boolean
}

const STORE_URL = APP_STORE_URL || PLAY_STORE_URL || null

export function planAction(id: PlanId, store: string | null = STORE_URL): PlanAction {
  if (id !== 'free' && store !== null) return { href: store, external: true }
  return { href: signInHref('/app'), external: false }
}

const ORDER: readonly PlanId[] = ['free', 'explorer', 'complete', 'practitioner', 'lifetime']

const pricing = (id: PlanId) => PRICING_PLANS.find((p) => p.id === id) ?? null

/** One line and one action per plan. Counts stay out of the copy; the facts carry them. */
const PLAN_COPY: Readonly<Record<PlanId, { readonly tagline: string; readonly cta: string }>> = {
  free: { tagline: 'Try the map on a few people', cta: 'Start free' },
  explorer: { tagline: 'Your closest people, every reading', cta: 'Choose Explorer' },
  complete: { tagline: 'A wider circle, with exports', cta: 'Choose Complete' },
  practitioner: { tagline: 'For people who read for others', cta: 'Choose Practitioner' },
  lifetime: { tagline: 'Pay once, keep everyone', cta: 'Pay once' },
}

/** The systems a plan can open: every key any plan lists. Daily oracle draws are open to all and stay out. */
export const CHART_SYSTEMS: readonly string[] = [...new Set(ORDER.flatMap((id) => PLANS[id].limits.systems))]

const people = (n: number): string => (n === Infinity ? 'Unlimited people' : `Up to ${n} people`)

const systems = (keys: readonly string[]): string => {
  const names = READING_SYSTEMS.filter((s) => keys.includes(s.key)).map((s) => s.label)
  if (names.length === 1) return `${names[0]} only`
  if (keys.length === CHART_SYSTEMS.length) return `All ${keys.length} chart systems`
  return `${keys.length} of ${CHART_SYSTEMS.length} chart systems`
}

const ai = (n: number): string | null =>
  n === 0 ? null : n === Infinity ? 'Unlimited AI readings' : `${n} AI readings a month`

const boards = (n: number): string | null => (n === 0 ? null : n === Infinity ? 'Unlimited boards' : `${n} boards`)

const relations = (r: Limits['relationships']): string | null =>
  r === false ? null : r === 'advanced' ? 'Pair and circle readings, advanced' : 'Pair readings'

export function planFacts(limits: Limits): readonly string[] {
  return [
    people(limits.profiles),
    systems(limits.systems),
    relations(limits.relationships),
    ai(limits.aiInterpretations),
    boards(limits.boards),
    limits.timeline ? 'Timeline' : null,
    limits.exports ? 'PDF exports' : null,
    limits.groupAnalysis ? 'Group analysis' : null,
    limits.apiAccess ? 'API access' : null,
  ].filter((f): f is string => f !== null)
}

export function planCards(): readonly PlanCard[] {
  return ORDER.map((id) => {
    const plan = PLANS[id]
    const listed = pricing(id)
    return {
      id,
      name: plan.name,
      price: `$${plan.price}`,
      cadence: plan.price === 0 ? '' : (listed?.priceNote ?? '/mo'),
      tagline: PLAN_COPY[id].tagline,
      cta: PLAN_COPY[id].cta,
      featured: listed?.featured ?? false,
      facts: planFacts(plan.limits),
      action: planAction(id),
    }
  })
}

export interface LedgerLine {
  readonly label: string
  readonly values: Readonly<Record<PlanId, string | null>>
}

const line = (label: string, read: (l: Limits) => string | null): LedgerLine => ({
  label,
  values: Object.fromEntries(ORDER.map((id) => [id, read(PLANS[id].limits)])) as Record<PlanId, string | null>,
})

const count = (n: number): string | null => (n === 0 ? null : n === Infinity ? 'Unlimited' : String(n))
const yes = (b: boolean): string | null => (b ? 'Included' : null)

/** One line per entitlement; null means not included. */
export function planLedger(): readonly LedgerLine[] {
  return [
    line('People saved', (l) => count(l.profiles)),
    line('Chart systems', (l) => (l.systems.length === CHART_SYSTEMS.length ? 'All' : `${l.systems.length} of ${CHART_SYSTEMS.length}`)),
    line('Pair readings', (l) => (l.relationships === false ? null : l.relationships === 'advanced' ? 'Advanced' : 'Basic')),
    line('AI readings a month', (l) => count(l.aiInterpretations)),
    line('Boards', (l) => count(l.boards)),
    line('Timeline', (l) => yes(l.timeline)),
    line('PDF exports', (l) => yes(l.exports)),
    line('Group analysis', (l) => yes(l.groupAnalysis)),
    line('API access', (l) => yes(l.apiAccess)),
  ]
}

export const PLAN_ORDER = ORDER

/** The cheapest plan that opens a system, or null when no plan lists it. */
export const planThatOpens = (system: string): PlanId | null =>
  [...ORDER]
    .sort((a, b) => PLANS[a].price - PLANS[b].price)
    .find((id) => (PLANS[id].limits.systems as readonly string[]).includes(system)) ?? null
