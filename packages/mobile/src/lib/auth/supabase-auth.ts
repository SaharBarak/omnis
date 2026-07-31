import { makeRedirectUri } from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'

import { getSupabase } from '@/lib/supabase'

/**
 * Supabase Google OAuth for native — the authorization-code + PKCE flow run
 * through the system browser (expo-web-browser), matching what the server
 * verifies. The native @react-native-google-signin path is deliberately NOT
 * used: it depends on Google Play Services, which is absent on bare emulators
 * and on de-Googled devices; the browser flow works everywhere.
 *
 * Google is the only connection. The type is kept for the store's signature.
 */
export type AuthConnection = 'google'

export interface AuthTokens {
  accessToken: string
  refreshToken: string | null
  /** Epoch milliseconds at which the access token expires. */
  expiresAt: number
}

// Lets a redirect back into the app complete a pending web-auth session.
WebBrowser.maybeCompleteAuthSession()

/**
 * The deep link Supabase redirects back to. `pleiad://callback` must be added
 * to the Supabase project's Auth → URL Configuration → Redirect URLs allowlist,
 * and the scheme (`pleiad`) is declared in app.json so Android routes it back.
 */
function redirectUri(): string {
  return makeRedirectUri({ scheme: 'pleiad', path: 'callback' })
}

function codeFromUrl(url: string): string | null {
  // Prefer the URL API, but custom-scheme URLs (pleiad://…) don't always
  // populate searchParams across polyfills, so fall back to a regex.
  try {
    const viaUrl = new URL(url).searchParams.get('code')
    if (viaUrl !== null) return viaUrl
  } catch {
    // fall through to regex
  }
  const match = /[?&#]code=([^&]+)/.exec(url)
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Interactive login. Resolves to tokens, or null when the person dismissed the
 * browser (cancel is a non-event — no error surfaces).
 */
export async function loginAsync(): Promise<AuthTokens | null> {
  const redirectTo = redirectUri()

  const { data, error } = await getSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  })
  if (error) throw new Error(error.message)
  if (!data?.url) throw new Error('Sign-in failed: no authorization URL')

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
  if (result.type !== 'success') return null // cancel / dismiss

  const code = codeFromUrl(result.url)
  if (code === null) {
    throw new Error('Sign-in failed: no authorization code returned')
  }

  const { data: exchanged, error: exchangeError } =
    await getSupabase().auth.exchangeCodeForSession(code)
  if (exchangeError) throw new Error(exchangeError.message)

  const session = exchanged.session
  if (session === null) throw new Error('Sign-in failed: no session')
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token ?? null,
    expiresAt: (session.expires_at ?? 0) * 1000,
  }
}

/**
 * Email one-time-code sign-in (no provider config needed, unlike Google OAuth).
 * Sends a short code to the address; a new address is registered on first use.
 */
export async function requestEmailCodeAsync(email: string): Promise<void> {
  const { error } = await getSupabase().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  })
  if (error) throw new Error(error.message)
}

/**
 * Password sign-in, used only by the App Review demo account.
 *
 * Apple's reviewer needs working credentials, and cannot receive an emailed
 * one-time code. Rather than pin a fixed OTP (which would mean a trigger on
 * the `auth` schema and a permanent 6-digit credential), one account is given
 * a long password. The login screen only offers this field when the typed
 * address matches `EXPO_PUBLIC_REVIEW_EMAIL`; with that var unset — which is
 * the default — the path is unreachable and the app is OTP-only.
 */
export async function signInWithPasswordAsync(
  email: string,
  password: string
): Promise<AuthTokens> {
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw new Error(error.message)
  if (data.session === null) throw new Error('Sign-in failed: no session')
  return toTokens(data.session)
}

function toTokens(session: {
  access_token: string
  refresh_token: string | null
  expires_at?: number
}): AuthTokens {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token ?? null,
    expiresAt: (session.expires_at ?? 0) * 1000,
  }
}

/** Verify a 6-digit emailed code and return the session tokens. */
export async function verifyEmailCodeAsync(
  email: string,
  code: string
): Promise<AuthTokens> {
  const { data, error } = await getSupabase().auth.verifyOtp({
    email,
    token: code,
    type: 'email',
  })
  if (error) throw new Error(error.message)
  if (data.session === null) throw new Error('Verification failed')
  return toTokens(data.session)
}

/**
 * Complete sign-in from a magic-link code — the `code` param of the sign-in URL
 * (or the whole pasted URL). Uses the PKCE verifier saved at send time.
 */
export async function exchangeCodeAsync(codeOrUrl: string): Promise<AuthTokens> {
  const code = codeFromUrl(codeOrUrl) ?? codeOrUrl.trim()
  const { data, error } = await getSupabase().auth.exchangeCodeForSession(code)
  if (error) throw new Error(error.message)
  if (data.session === null) throw new Error('Sign-in failed: no session')
  return toTokens(data.session)
}

/** refresh_token grant. Throws when Supabase rejects the grant (revoked/expired). */
export async function refreshTokensAsync(
  refreshToken: string
): Promise<AuthTokens> {
  const { data, error } = await getSupabase().auth.refreshSession({
    refresh_token: refreshToken,
  })
  if (error) throw new Error(error.message)

  const session = data.session
  if (session === null) throw new Error('Token refresh failed')
  return {
    accessToken: session.access_token,
    // Supabase rotates refresh tokens; keep the previous one if none returned.
    refreshToken: session.refresh_token ?? refreshToken,
    expiresAt: (session.expires_at ?? 0) * 1000,
  }
}
