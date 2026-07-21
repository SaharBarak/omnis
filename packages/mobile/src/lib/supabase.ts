import 'react-native-url-polyfill/auto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

import { ENV } from '@/lib/env'

/**
 * The one Supabase client — used ONLY for the auth handshake (email sign-in via
 * PKCE, code exchange, and refresh). The server (src/lib/auth-server.ts) accepts
 * a `Bearer <Supabase access token>`, so native auth must be Supabase.
 *
 * `persistSession` is OFF — the session itself lives in expo-secure-store via
 * the auth store's token-store (three keys, so SecureStore's ~2KB single-key
 * limit is never hit). This storage only ever holds the small, short-lived PKCE
 * `code_verifier`, but it is persisted (not in-memory) so a code sent by email
 * can still be exchanged after a reload.
 */

// SecureStore keys allow only [A-Za-z0-9._-]; Supabase's keys already fit, but
// sanitize defensively so a key can never be rejected.
const safeKey = (k: string): string => k.replace(/[^A-Za-z0-9._-]/g, '_')
const secureStorage = {
  getItem: (k: string): Promise<string | null> => SecureStore.getItemAsync(safeKey(k)),
  setItem: (k: string, value: string): Promise<void> =>
    SecureStore.setItemAsync(safeKey(k), value),
  removeItem: (k: string): Promise<void> => SecureStore.deleteItemAsync(safeKey(k)),
}

export const supabase: SupabaseClient = createClient(
  ENV.supabaseUrl,
  ENV.supabaseAnonKey,
  {
    auth: {
      storage: secureStorage,
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  }
)
