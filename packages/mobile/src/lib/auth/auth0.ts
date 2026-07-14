import {
  AuthRequest,
  ResponseType,
  exchangeCodeAsync,
  fetchDiscoveryAsync,
  makeRedirectUri,
  refreshAsync,
  type DiscoveryDocument,
  type TokenResponse,
} from 'expo-auth-session'

import { ENV, isAuthConfigured } from '@/lib/env'

/**
 * Auth0 Authorization Code + PKCE via expo-auth-session — runs in Expo Go
 * (no native Auth0 module). Discovery is fetched from the tenant's
 * OIDC metadata and cached for the process lifetime.
 */

/**
 * The Auth0 tenant is shared with other products; connections are enabled
 * per-application, so Pleiad has its own database connection and only the
 * Pleiad clients can see it. Naming the shared connection here would reunite
 * the user stores. Web keeps its copy in src/lib/auth-connections.ts.
 */
export const DB_CONNECTION = 'pleiad-users'

export type AuthConnection = 'google-oauth2' | 'apple' | typeof DB_CONNECTION

const SCOPES = ['openid', 'profile', 'email', 'offline_access']

export interface AuthTokens {
  accessToken: string
  refreshToken: string | null
  /** Epoch milliseconds at which the access token expires. */
  expiresAt: number
}

let discoveryPromise: Promise<DiscoveryDocument> | null = null

function getDiscovery(): Promise<DiscoveryDocument> {
  discoveryPromise ??= fetchDiscoveryAsync(`https://${ENV.auth0Domain}`).catch(
    (error: unknown) => {
      discoveryPromise = null
      throw error instanceof Error ? error : new Error('Auth0 discovery failed')
    }
  )
  return discoveryPromise
}

function getRedirectUri(): string {
  // Auth0 rejects a bare `pleiad://` (its callback-url validator requires a host),
  // so the scheme must carry one. The Android intent filter matches on scheme, so
  // any host works — but it must match the whitelisted callback exactly.
  return makeRedirectUri({ scheme: 'pleiad', path: 'callback' })
}

function toTokens(
  response: TokenResponse,
  previousRefreshToken: string | null = null
): AuthTokens {
  return {
    accessToken: response.accessToken,
    // Auth0 rotates refresh tokens; keep the previous one if none returned.
    refreshToken: response.refreshToken ?? previousRefreshToken,
    expiresAt: (response.issuedAt + (response.expiresIn ?? 0)) * 1000,
  }
}

/**
 * Interactive login. Resolves to tokens, or null when the person dismissed
 * the browser (F1: cancel is a non-event — no error surfaces).
 */
export async function loginAsync(connection?: AuthConnection): Promise<AuthTokens | null> {
  if (!isAuthConfigured()) {
    throw new Error(
      'Sign-in is not configured. Set EXPO_PUBLIC_AUTH0_DOMAIN and EXPO_PUBLIC_AUTH0_CLIENT_ID.'
    )
  }
  const discovery = await getDiscovery()
  const redirectUri = getRedirectUri()
  const request = new AuthRequest({
    clientId: ENV.auth0ClientId,
    redirectUri,
    responseType: ResponseType.Code,
    scopes: SCOPES,
    usePKCE: true,
    extraParams: {
      ...(ENV.auth0Audience.length > 0 ? { audience: ENV.auth0Audience } : {}),
      ...(connection !== undefined ? { connection } : {}),
    },
  })

  const result = await request.promptAsync(discovery)
  if (result.type === 'error') {
    throw new Error(result.error?.description ?? result.error?.message ?? 'Sign-in failed')
  }
  if (result.type !== 'success') return null // cancel / dismiss / locked

  const code = result.params.code
  if (code === undefined) throw new Error('Sign-in failed: no authorization code returned')

  const response = await exchangeCodeAsync(
    {
      clientId: ENV.auth0ClientId,
      code,
      redirectUri,
      extraParams: { code_verifier: request.codeVerifier ?? '' },
    },
    discovery
  )
  return toTokens(response)
}

/** refresh_token grant. Throws when Auth0 rejects the grant (revoked, expired). */
export async function refreshTokensAsync(refreshToken: string): Promise<AuthTokens> {
  const discovery = await getDiscovery()
  const response = await refreshAsync(
    {
      clientId: ENV.auth0ClientId,
      refreshToken,
      ...(ENV.auth0Audience.length > 0
        ? { extraParams: { audience: ENV.auth0Audience } }
        : {}),
    },
    discovery
  )
  return toTokens(response, refreshToken)
}
