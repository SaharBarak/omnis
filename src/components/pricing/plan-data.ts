/**
 * Display copy for the public pricing page.
 *
 * Mirrors the entitlements in src/lib/services/billing.ts (PLANS) — that
 * file is the single source of truth for what each tier unlocks. If a limit
 * changes there, update this copy to match. Nothing on the pricing page may
 * promise something billing.ts does not enforce.
 */

export type PaidPlanId = 'complete' | 'practitioner'

export const FREE_PLAN = {
  name: 'Free',
  price: '$0',
  tagline: 'You and a few people',
  points: [
    'Save up to 3 people',
    'Dreamspell readings & daily kin',
    'Today board across the calendars',
  ],
} as const

export interface PaidPlan {
  readonly id: PaidPlanId
  readonly name: string
  readonly price: string
  readonly tagline: string
  readonly points: readonly string[]
  readonly cta: string
  readonly featured: boolean
}

export const PAID_PLANS: readonly PaidPlan[] = [
  {
    id: 'complete',
    name: 'Complete',
    price: '$9',
    tagline: 'Your whole map, all six systems',
    points: [
      'Up to 10 people, kept forever',
      'All six systems on every chart',
      '30 AI interpretations, grounded in sources',
      '5 boards & timeline view',
      'Relationship readings & PDF exports',
    ],
    cta: 'Grow your map',
    featured: true,
  },
  {
    id: 'practitioner',
    name: 'Practitioner',
    price: '$29',
    tagline: 'Maps for the people you read for',
    points: [
      'Unlimited people & boards',
      'Unlimited AI interpretations',
      'Advanced relationship tools',
      'Group analysis',
      'API access',
    ],
    cta: 'Go practitioner',
    featured: false,
  },
] as const

/** Comparison ledger — one row per entitlement in billing.ts PLANS.limits. */
export interface LedgerRow {
  readonly label: string
  readonly free: string
  readonly complete: string
  readonly practitioner: string
}

export const LEDGER_COLUMNS = ['Free', 'Complete', 'Practitioner'] as const

export const LEDGER_ROWS: readonly LedgerRow[] = [
  { label: 'People saved', free: '3', complete: '10', practitioner: 'Unlimited' },
  { label: 'Systems', free: 'Dreamspell', complete: 'All six', practitioner: 'All six' },
  { label: 'AI interpretations', free: '—', complete: '30', practitioner: 'Unlimited' },
  { label: 'Boards', free: '—', complete: '5', practitioner: 'Unlimited' },
  { label: 'Timeline view', free: '—', complete: 'Included', practitioner: 'Included' },
  { label: 'Relationship readings', free: '—', complete: 'Basic', practitioner: 'Advanced' },
  { label: 'PDF exports', free: '—', complete: 'Included', practitioner: 'Included' },
  { label: 'Group analysis', free: '—', complete: '—', practitioner: 'Included' },
  { label: 'API access', free: '—', complete: '—', practitioner: 'Included' },
] as const
