import { PRIVACY } from './privacy'
import { REFUND } from './refund'
import { TERMS } from './terms'
import type { LegalDoc, LegalSlug } from './types'

export type { Block, Inline, LegalDoc, LegalSection, LegalSlug, Rich } from './types'
export { CONTACT_ADDRESS } from './contact'

export const LEGAL_DOCS: Readonly<Record<LegalSlug, LegalDoc>> = { terms: TERMS, privacy: PRIVACY, refund: REFUND }

const UPDATED = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

/** "January 25, 2026". UTC, so server and browser agree. */
export const updatedLabel = (doc: LegalDoc): string => UPDATED.format(new Date(`${doc.updated}T00:00:00Z`))

/** "1. Acceptance of Terms": sections are numbered by position. */
export const numberedHeading = (doc: LegalDoc, index: number): string => `${index + 1}. ${doc.sections[index].heading}`

/** Plain text of a run, for search, reading time and tests. */
export const plainText = (run: readonly (string | { readonly text: string })[]): string =>
  run.map((part) => (typeof part === 'string' ? part : part.text)).join('')
