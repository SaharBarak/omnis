/**
 * Store links.
 *
 * Paid plans are in-app purchases — the App Store and Google Play are the
 * merchant of record. Every upgrade path on the web therefore ends at the app,
 * not at a checkout.
 *
 * The URLs are unset until the app ships; surfaces should fall back to a
 * "coming soon" state rather than rendering a dead link.
 */

export const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL || null
export const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL || null

/** True once at least one store listing is live. */
export const hasStoreLinks = Boolean(APP_STORE_URL || PLAY_STORE_URL)
