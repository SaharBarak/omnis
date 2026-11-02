import { EDGE_CEILING, MEASURED_PAIRS } from '@pleiad/engine/services/rarity'
import { PLANS } from '@/lib/services/billing'
import { CHART_SYSTEMS } from '@/lib/site/plans'

/**
 * Site questions. Counts are read from the catalog, the plans and the
 * measured base rates, so an answer cannot drift from what the product does.
 */

export interface SiteFaq {
  readonly question: string
  readonly answer: string
}

const n = (v: number): string => v.toLocaleString('en-US')

export const HOME_FAQ: readonly SiteFaq[] = [
  {
    question: 'Do I need an account to make a map?',
    answer:
      'No. The map draws in your browser from a birth date. An account keeps people so you can come back to them, and opens the pair and circle pages inside the app.',
  },
  {
    question: 'What do I need to enter?',
    answer:
      'A birth date draws the Kin ring, the numbers and the sky for that day. A birth time and place add the rising sign and the Human Design bodygraph. A name in Latin letters adds the expression number, and a Hebrew name lets two people be compared by gematria.',
  },
  {
    question: `How many systems does Pleiad read?`,
    answer: `${CHART_SYSTEMS.length} systems read from a birth, plus daily oracle draws and the calendars on the daily board. The free plan saves ${PLANS.free.limits.profiles} people with Dreamspell; paid plans open the rest.`,
  },
  {
    question: 'How is a tie weighed?',
    answer: `Each tie type was measured over ${n(MEASURED_PAIRS.dateOnly)} random pairs for the date-only systems and ${n(MEASURED_PAIRS.fullBirth)} for the systems that need a birth time. A tie's weight is minus log two of how often it fires. Ties found in ${Math.round(EDGE_CEILING * 100)}% of pairs or more never get a line on the map.`,
  },
  {
    question: 'Is AI drawing the charts?',
    answer:
      'No. Every value on a map comes from the calculation engine. AI readings on paid plans write about values the engine already computed and do not change them.',
  },
  {
    question: 'Is Dreamspell the Maya calendar?',
    answer:
      'Dreamspell is a modern calendar from the 1980s built on the 260-day count. The map labels it Dreamspell and shows the traditional Tzolkin day beside it.',
  },
  {
    question: 'Who can see the people I save?',
    answer: 'Saved people belong to your account. You decide when to make a share link and what it shows.',
  },
]

const lifetime = PLANS.lifetime.name

/** Billing questions for the pricing page. The stores are the merchant of record (billing.ts). */
export const BILLING_FAQ: readonly SiteFaq[] = [
  {
    question: 'Where do I pay?',
    answer:
      'In the Pleiad app on iPhone or Android. The App Store or Google Play bills you, so the purchase sits in the account you already pay for apps with. The web has no checkout.',
  },
  {
    question: 'Does a plan bought on my phone work on the web?',
    answer: 'Yes. Sign in with the same account on the web and the plan is there, with the same people.',
  },
  {
    question: `What is ${lifetime}?`,
    answer: 'One payment, no renewal. The table above lists what it opens, row by row.',
  },
  {
    question: 'How do I cancel?',
    answer:
      "From your device's subscription settings in the App Store or Google Play. The plan runs to the end of the period you paid for, and your saved people stay saved on the free plan.",
  },
  {
    question: 'Can I get a refund?',
    answer: 'Refunds go through the store you bought from, under its rules. The refund policy links to both request pages.',
  },
]
