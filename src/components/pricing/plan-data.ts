/**
 * Display copy for the public pricing page.
 *
 * Mirrors the entitlements in src/lib/services/billing.ts (PLANS) — that
 * file is the single source of truth for what each tier unlocks. If a limit
 * changes there, update this copy to match. Nothing on the pricing page may
 * promise something billing.ts does not enforce.
 */

export type PaidPlanId = 'explorer' | 'complete' | 'practitioner'

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

/**
 * Entry paid tier — rendered as a slim row above the Complete/Practitioner
 * grid, not as an equal third column. The whole map, small scale, no AI.
 */
export const EXPLORER_PLAN: PaidPlan = {
  id: 'explorer',
  name: 'Explorer',
  price: '$5',
  tagline: 'Every system, a few people',
  points: [
    'Up to 5 people',
    'All six systems on every chart',
    '2 boards & timeline view',
  ],
  cta: 'Open the whole map',
  featured: false,
} as const

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
  readonly explorer: string
  readonly complete: string
  readonly practitioner: string
}

export const LEDGER_COLUMNS = ['Free', 'Explorer', 'Complete', 'Practitioner'] as const

export const LEDGER_ROWS: readonly LedgerRow[] = [
  { label: 'People saved', free: '3', explorer: '5', complete: '10', practitioner: 'Unlimited' },
  { label: 'Systems', free: 'Dreamspell', explorer: 'All six', complete: 'All six', practitioner: 'All six' },
  { label: 'AI interpretations', free: '—', explorer: '—', complete: '30', practitioner: 'Unlimited' },
  { label: 'Boards', free: '—', explorer: '2', complete: '5', practitioner: 'Unlimited' },
  { label: 'Timeline view', free: '—', explorer: 'Included', complete: 'Included', practitioner: 'Included' },
  { label: 'Relationship readings', free: '—', explorer: '—', complete: 'Basic', practitioner: 'Advanced' },
  { label: 'PDF exports', free: '—', explorer: '—', complete: 'Included', practitioner: 'Included' },
  { label: 'Group analysis', free: '—', explorer: '—', complete: '—', practitioner: 'Included' },
  { label: 'API access', free: '—', explorer: '—', complete: '—', practitioner: 'Included' },
] as const
