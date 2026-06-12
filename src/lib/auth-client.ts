'use client'

import { createAuthClient } from 'better-auth/react'
import { magicLinkClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : undefined),
  plugins: [magicLinkClient()],
})

export const { signIn, signOut, signUp, useSession, getSession } = authClient
