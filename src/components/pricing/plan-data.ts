/**
 * Display copy for the public pricing page.
 *
 * Mirrors the entitlements in src/lib/services/billing.ts (PLANS) — that
 * file is the single source of truth for what each tier unlocks. If a limit
 * changes there, update this copy to match. Nothing on the pricing page may
 * promise something billing.ts does not enforce.
 */

export type PaidPlanId = 'explorer' | 'complete' | 'practitioner' | 'lifetime'

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
 * grid, not as an equal third column. The whole map at small scale: bonds are
 * included on purpose, because the map IS the product.
 */
export const EXPLORER_PLAN: PaidPlan = {
  id: 'explorer',
  name: 'Explorer',
  price: '$5',
  tagline: 'Every system, your inner circle',
  points: [
    'Up to 15 people',
    'All six systems on every chart',
    'Relationship readings & timeline',
    '5 AI interpretations a month',
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
      'Up to 25 people, kept forever',
      'All six systems on every chart',
      '50 AI interpretations, grounded in sources',
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

/**
 * Founding Lifetime — one-time launch offer rendered as a slim band under the
 * paid tiers grid. Top-tier entitlements (see billing.ts PLANS.lifetime):
 * unlimited people, advanced bonds, groups and API — paid once, never billed
 * again. Practitioner still buys more metered AI; nothing else.
 */
export const LIFETIME_PLAN = {
  id: 'lifetime',
  name: 'Founding Lifetime',
  price: '$79',
  priceNote: 'once',
  tagline: 'Unlimited people, forever. Early-supporter price.',
  points: [
    'Unlimited people, boards & bonds — for life',
    'Group analysis & API access',
    'One payment — never billed again',
  ],
  cta: 'Claim founding access',
} as const

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
  { label: 'People saved', free: '3', explorer: '15', complete: '25', practitioner: 'Unlimited' },
  { label: 'Systems', free: 'Dreamspell', explorer: 'All six', complete: 'All six', practitioner: 'All six' },
  { label: 'AI interpretations', free: '—', explorer: '5', complete: '25', practitioner: 'Unlimited' },
  { label: 'Boards', free: '—', explorer: '2', complete: '5', practitioner: 'Unlimited' },
  { label: 'Timeline view', free: '—', explorer: 'Included', complete: 'Included', practitioner: 'Included' },
  { label: 'Relationship readings', free: '—', explorer: 'Basic', complete: 'Basic', practitioner: 'Advanced' },
  { label: 'PDF exports', free: '—', explorer: '—', complete: 'Included', practitioner: 'Included' },
  { label: 'Group analysis', free: '—', explorer: '—', complete: '—', practitioner: 'Included' },
  { label: 'API access', free: '—', explorer: '—', complete: '—', practitioner: 'Included' },
] as const
