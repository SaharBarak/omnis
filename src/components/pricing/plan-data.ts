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
  /** Billing cadence rendered after the price: '/mo' or 'once'. */
  readonly priceNote: string
  readonly tagline: string
  readonly points: readonly string[]
  readonly cta: string
  readonly featured: boolean
  /** Optional chip in the card header (e.g. the recommended-plan badge). */
  readonly badge?: string
}

/**
 * Entry paid tier — first card in the paid-plans row. The whole map at
 * small scale: bonds are included on purpose, because the map IS the product.
 */
export const EXPLORER_PLAN: PaidPlan = {
  id: 'explorer',
  name: 'Explorer',
  price: '$5',
  priceNote: '/mo',
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
    priceNote: '/mo',
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
    badge: 'Most people land here',
  },
  {
    id: 'practitioner',
    name: 'Practitioner',
    price: '$29',
    priceNote: '/mo',
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
 * Founding Lifetime — one-time launch offer, last card in the paid-plans
 * row. Top-tier entitlements (see billing.ts PLANS.lifetime): unlimited
 * people, advanced bonds, groups and API — paid once, never billed again.
 * Practitioner still buys more metered AI; nothing else.
 */
export const LIFETIME_PLAN: PaidPlan = {
  id: 'lifetime',
  name: 'Founding Lifetime',
  price: '$79',
  priceNote: 'once',
  tagline: 'Unlimited people, forever. Early-supporter price.',
  points: [
    'Unlimited people, boards & bonds (for life)',
    'Group analysis & API access',
    'One payment, never billed again',
  ],
  cta: 'Claim founding access',
  featured: false,
  badge: 'One-time launch offer',
} as const

/**
 * The pricing page's paid row, in narrative order: entry tier, the
 * recommended plan, the pro plan, then the one-time founding offer.
 * All four render through the same card anatomy.
 */
export const PRICING_PLANS: readonly PaidPlan[] = [
  EXPLORER_PLAN,
  ...PAID_PLANS,
  LIFETIME_PLAN,
] as const

/** Comparison ledger — one row per entitlement in billing.ts PLANS.limits. */
export interface LedgerRow {
  readonly label: string
  readonly free: string
  readonly explorer: string
  readonly complete: string
  readonly practitioner: string
  readonly lifetime: string
}

export const LEDGER_COLUMNS = [
  'Free',
  'Explorer',
  'Complete',
  'Practitioner',
  'Lifetime',
] as const

export const LEDGER_ROWS: readonly LedgerRow[] = [
  { label: 'People saved', free: '3', explorer: '15', complete: '25', practitioner: 'Unlimited', lifetime: 'Unlimited' },
  { label: 'Systems', free: 'Dreamspell', explorer: 'All six', complete: 'All six', practitioner: 'All six', lifetime: 'All six' },
  { label: 'AI interpretations', free: '—', explorer: '5', complete: '50', practitioner: 'Unlimited', lifetime: '50' },
  { label: 'Boards', free: '—', explorer: '2', complete: '5', practitioner: 'Unlimited', lifetime: 'Unlimited' },
  { label: 'Timeline view', free: '—', explorer: 'Included', complete: 'Included', practitioner: 'Included', lifetime: 'Included' },
  { label: 'Relationship readings', free: '—', explorer: 'Basic', complete: 'Basic', practitioner: 'Advanced', lifetime: 'Advanced' },
  { label: 'PDF exports', free: '—', explorer: '—', complete: 'Included', practitioner: 'Included', lifetime: 'Included' },
  { label: 'Group analysis', free: '—', explorer: '—', complete: '—', practitioner: 'Included', lifetime: 'Included' },
  { label: 'API access', free: '—', explorer: '—', complete: '—', practitioner: 'Included', lifetime: 'Included' },
] as const
