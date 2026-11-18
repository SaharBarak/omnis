/**
 * The typed event map. It is the source of the event table in
 * docs/analytics/north-star.md: an event that is not declared here does not
 * compile, and a declared event has a call site.
 *
 * Names are `snake_case`, `object_verb`, past tense. Property names are
 * `snake_case`; booleans start `is_` or `has_`.
 */

/** Where a newsletter form sits. One entry per form on the site. */
export const NEWSLETTER_PLACEMENTS = ['landing_download_cta'] as const
export type NewsletterPlacement = (typeof NEWSLETTER_PLACEMENTS)[number]

export function asNewsletterPlacement(value: unknown): NewsletterPlacement | null {
  return NEWSLETTER_PLACEMENTS.find((placement) => placement === value) ?? null
}

/** Events sent from the browser through `track()`. */
export type ClientEventMap = {
  landing_cta_clicked: Record<never, never>
  calculate_completed: { kin: number }
  signup_started: { method: 'google' | 'email_signup' | 'email_password' }
  onboarding_completed: Record<never, never>
  person_created: { is_self: boolean }
  group_created: { members: number }
  share_created: { share_type: string }
  /** Shared names: same meaning and property types on every site. */
  user_logged_in: { method: string }
  lead_submitted: { channel: 'contact_form'; placement: 'contact_page' }
}

/** Events sent from route handlers through `trackServer()`. */
export type ServerEventMap = {
  /** All shared names. `method` is the Supabase auth provider. */
  user_signed_up: { method: string }
  user_logged_in: { method: string }
  newsletter_subscribed: { placement: NewsletterPlacement }
  checkout_completed: {
    plan: string
    product_id: string | null
    value: number
    currency: string
  }
}

export type ClientEvent = keyof ClientEventMap
export type ServerEvent = keyof ServerEventMap
