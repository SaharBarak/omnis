import { link, type Inline } from './types'

/** Addresses the policies name. The contact page lists the same ones. */
export const CONTACT_ADDRESS = Object.freeze({
  support: 'support@pleiad.io',
  privacy: 'privacy@pleiad.io',
})

export const mailto = (address: string): Inline => link(address, `mailto:${address}`)
