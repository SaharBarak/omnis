/**
 * Public runtime configuration — every value comes from EXPO_PUBLIC_* env
 * vars (inlined by Metro at bundle time). Documented in .env.example.
 */

const DEFAULT_API_URL = 'https://omnisx.sahar-h-barak.workers.dev'

export const ENV = {
  /** Auth0 tenant domain, e.g. pleiad.eu.auth0.com (no scheme). */
  auth0Domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? '',
  /** Auth0 native application client id. */
  auth0ClientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID ?? '',
  /** Auth0 API audience — must match the API identifier the server verifies. */
  auth0Audience: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE ?? '',
  /** Origin of the Pleiad API. */
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
  /**
   * TestFlight escape hatch (F11): '1' lets iOS builds use the Android
   * hosted-checkout path. Production iOS ships without it — the paywall
   * shows the App Store reader pattern (copy the web pricing link) instead.
   */
  iosCheckout: process.env.EXPO_PUBLIC_IOS_CHECKOUT === '1',
} as const

/** True when the Auth0 vars required for sign-in are all present. */
export function isAuthConfigured(): boolean {
  return ENV.auth0Domain.length > 0 && ENV.auth0ClientId.length > 0
}
