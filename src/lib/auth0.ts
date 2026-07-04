import { Auth0Client } from '@auth0/nextjs-auth0/server'

/**
 * Auth0 server client (v4 SDK). Reads AUTH0_DOMAIN, AUTH0_CLIENT_ID,
 * AUTH0_CLIENT_SECRET, AUTH0_SECRET, APP_BASE_URL from the environment.
 * Mounted by middleware.ts, which serves /auth/login, /auth/logout,
 * /auth/callback, /auth/profile and keeps the session cookie rolling.
 */
export const auth0 = new Auth0Client({
  appBaseUrl:
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000',
})
