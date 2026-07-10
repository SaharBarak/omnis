import * as SecureStore from 'expo-secure-store'

/**
 * Token persistence — expo-secure-store only (Keychain / EncryptedSharedPrefs).
 * Never AsyncStorage: these are bearer credentials.
 */

const ACCESS_TOKEN_KEY = 'pleiad.auth.accessToken'
const REFRESH_TOKEN_KEY = 'pleiad.auth.refreshToken'
const EXPIRES_AT_KEY = 'pleiad.auth.expiresAt'

export interface StoredTokens {
  accessToken: string
  refreshToken: string | null
  /** Epoch milliseconds at which the access token expires. */
  expiresAt: number
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const [accessToken, refreshToken, expiresAtRaw] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(EXPIRES_AT_KEY),
  ])
  if (accessToken === null || expiresAtRaw === null) return null
  const expiresAt = Number(expiresAtRaw)
  if (!Number.isFinite(expiresAt)) return null
  return { accessToken, refreshToken, expiresAt }
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    tokens.refreshToken !== null
      ? SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken)
      : SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.setItemAsync(EXPIRES_AT_KEY, String(tokens.expiresAt)),
  ])
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(EXPIRES_AT_KEY),
  ])
}
