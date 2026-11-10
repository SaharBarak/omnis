import { NextResponse, type NextRequest } from 'next/server'

import { getSupabaseServerClient } from '@/lib/supabase/server'

/** Clears the Supabase session cookies and returns to the marketing home. */
async function signOut(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(`${request.nextUrl.origin}/`)
}

// POST-only: a state-changing sign-out must not be triggerable by a GET (an
// <img>/link on a third-party page would force-log-out the visitor). The app's
// own sign-out clears the session client-side via supabase.auth.signOut().
export const POST = signOut
