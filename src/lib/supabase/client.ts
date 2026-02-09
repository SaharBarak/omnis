import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (typeof window !== 'undefined') {
    console.log('[Supabase] Creating client with URL:', supabaseUrl)
    console.log('[Supabase] Anon key present:', !!supabaseKey)
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
