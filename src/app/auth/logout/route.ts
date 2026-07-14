import { NextResponse, type NextRequest } from 'next/server'

import { getSupabaseServerClient } from '@/lib/supabase/server'

/** Clears the Supabase session cookies and returns to the marketing home. */
async function signOut(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(`${request.nextUrl.origin}/`)
}

export const GET = signOut
export const POST = signOut
