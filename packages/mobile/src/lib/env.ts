/**
 * Public runtime configuration — every value comes from EXPO_PUBLIC_* env
 * vars (inlined by Metro at bundle time). Documented in .env.example.
 */

const DEFAULT_API_URL = 'https://pleiad.io'

export const ENV = {
  /** Supabase project URL, e.g. https://<ref>.supabase.co. */
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  /** Supabase anon (publishable) key — safe to ship; it is a public key. */
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  /** Origin of the Pleiad API. */
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
  /**
   * RevenueCat public SDK keys (per platform). Paid plans are in-app purchases
   * — the stores are the merchant of record. Safe to ship in the bundle: these
   * are public keys; the secret key lives only on the server.
   */
  revenueCatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
  revenueCatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
  /**
   * The single address allowed to sign in with a password — the App Store
   * review demo account. Empty (the default) means no account can, and the
   * app is one-time-code only. Clear this var to retire the account.
   */
  reviewEmail: (process.env.EXPO_PUBLIC_REVIEW_EMAIL ?? '').trim().toLowerCase(),
} as const

/** True when the Supabase vars required for sign-in are present. */
export function isAuthConfigured(): boolean {
  return ENV.supabaseUrl.length > 0 && ENV.supabaseAnonKey.length > 0
}

/**
 * True for the one address permitted to use password sign-in (App Store
 * review). Always false when `EXPO_PUBLIC_REVIEW_EMAIL` is unset.
 */
export function isReviewAccount(email: string): boolean {
  return ENV.reviewEmail.length > 0 && email.trim().toLowerCase() === ENV.reviewEmail
}
