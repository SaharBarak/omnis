import { create } from 'zustand'


import {
  exchangeCodeAsync,
  loginAsync,
  refreshTokensAsync,
  requestEmailCodeAsync,
  verifyEmailCodeAsync,
  type AuthTokens,
} from './supabase-auth'
import { readJwtSub } from './jwt'
import { clearTokens, loadTokens, saveTokens } from './token-store'
import { queryClient, queryPersister } from '@/lib/query-client'

/**
 * Auth session state. Tokens live in module scope (never in React state —
 * components only see the status) and persist via expo-secure-store.
 */

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn'

interface AuthState {
  status: AuthStatus
  /**
   * Supabase user id (the access token's `sub`). This is the id the server
   * scopes every row by, and the id we hand RevenueCat as the appUserID —
   * which is what makes a purchase on this phone unlock the same account on
   * the web.
   */
  userId: string | null
  /** Load persisted tokens once at boot; resolves status from 'loading'. */
  hydrate: () => Promise<void>
  /**
   * Interactive Google (Supabase) login. A dismissed browser resolves quietly
   * (F1); real failures reject with a message for inline display. Requires the
   * Google provider to be enabled on the Supabase project.
   */
  signIn: () => Promise<void>
  /** Email one-time-code: step 1 — send the code to the address. */
  requestEmailCode: (email: string) => Promise<void>
  /**
   * Email sign-in: step 2 — complete it from the email. Accepts either a
   * 6-digit code (verifyOtp) or the magic-link code / URL (exchangeCode).
   */
  verifyEmailCode: (email: string, codeOrLink: string) => Promise<void>
  /** Wipe tokens + purge the query cache (F12) → 'signedOut'. */
  signOut: () => Promise<void>
  /**
   * Current access token; silently refreshes when <60s to expiry. A failed
   * refresh wipes tokens and flips to 'signedOut', resolving null.
   */
  getAccessToken: () => Promise<string | null>
}

const REFRESH_MARGIN_MS = 60_000

let tokens: AuthTokens | null = null
let refreshPromise: Promise<AuthTokens | null> | null = null

/**
 * Attach the session to RevenueCat. Best-effort: billing must never be able to
 * block sign-in. Dynamic import keeps the native SDK off the boot path.
 */
async function identifyPurchaserSafely(userId: string | null): Promise<void> {
  if (userId === null) return
  try {
    const { identifyPurchaser } = await import('@/lib/billing/purchases')
    await identifyPurchaser(userId)
  } catch {
    // No RevenueCat key, Expo Go preview mode, or a network blip — the paywall
    // surfaces this itself; signing in must still succeed.
  }
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  status: 'loading',
  userId: null,

  hydrate: async () => {
    try {
      const stored = await loadTokens()
      if (stored !== null) {
        tokens = stored
        const userId = readJwtSub(stored.accessToken)
        set({ status: 'signedIn', userId })
        await identifyPurchaserSafely(userId)
      } else {
        set({ status: 'signedOut', userId: null })
      }
    } catch {
      // Unreadable keychain entries — treat as signed out, keep boot alive.
      tokens = null
      set({ status: 'signedOut', userId: null })
    }
  },

  signIn: async () => {
    const next = await loginAsync()
    if (next === null) return // dismissed — stay where we are, no error
    tokens = next
    await saveTokens(next)
    const userId = readJwtSub(next.accessToken)
    set({ status: 'signedIn', userId })
    await identifyPurchaserSafely(userId)
  },

  requestEmailCode: async (email) => {
    await requestEmailCodeAsync(email)
  },

  verifyEmailCode: async (email, codeOrLink) => {
    const trimmed = codeOrLink.trim()
    // A bare 6-digit value is an OTP token; anything else is a magic-link code.
    const next = /^\d{6}$/.test(trimmed)
      ? await verifyEmailCodeAsync(email, trimmed)
      : await exchangeCodeAsync(trimmed)
    tokens = next
    await saveTokens(next)
    const userId = readJwtSub(next.accessToken)
    set({ status: 'signedIn', userId })
    await identifyPurchaserSafely(userId)
  },

  signOut: async () => {
    // Best-effort push unregister BEFORE the token wipe — the DELETE needs
    // the bearer token. Dynamic import avoids a module cycle (push → api →
    // this store); every failure path inside is already silent.
    try {
      const { unregisterPush } = await import('@/lib/notifications/push')
      await unregisterPush()
    } catch {
      // Never block sign-out on push cleanup.
    }
    // Detach the device from this user so the next account cannot inherit
    // their entitlements.
    try {
      const { forgetPurchaser } = await import('@/lib/billing/purchases')
      await forgetPurchaser()
    } catch {
      // Never block sign-out on billing cleanup.
    }
    tokens = null
    refreshPromise = null
    await clearTokens().catch(() => undefined)
    queryClient.clear()
    // clear() reaches AsyncStorage only through the persister's throttled
    // subscription — if the app dies inside that window the previous user's
    // cache would survive for the next sign-in. Drop the persisted copy
    // directly so no other account can restore this user's data.
    await queryPersister.removeClient()
    set({ status: 'signedOut', userId: null })
  },

  getAccessToken: async () => {
    const current = tokens
    if (current === null) return null
    if (current.expiresAt - Date.now() > REFRESH_MARGIN_MS) return current.accessToken
    if (current.refreshToken === null) {
      await get().signOut()
      return null
    }
    // Single-flight: concurrent callers share one refresh request.
    refreshPromise ??= refreshTokensAsync(current.refreshToken)
      .then(async (next) => {
        tokens = next
        await saveTokens(next)
        return next
      })
      .catch(async () => {
        await get().signOut()
        return null
      })
      .finally(() => {
        refreshPromise = null
      })
    const refreshed = await refreshPromise
    return refreshed?.accessToken ?? null
  },
}))

/** Hook alias — `const { status, signIn } = useAuth()`. */
export const useAuth = useAuthStore
