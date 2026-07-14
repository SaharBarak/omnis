/**
 * Auth0 connection names.
 *
 * The tenant (dev-kaipd4klyg48p0ai) is shared with other products
 * (ThePeaceBoard, Taroo, Taruu). Connections are enabled per-application, so
 * Pleiad keeps its own database connection — `pleiad-users`, enabled only on
 * the Pleiad web + mobile clients. That is what keeps the user stores apart;
 * naming the wrong connection here silently reunites them.
 *
 * Mobile carries its own copy in packages/mobile/src/lib/auth/auth0.ts.
 */
export const DB_CONNECTION = 'pleiad-users'
export const GOOGLE_CONNECTION = 'google-oauth2'
export const APPLE_CONNECTION = 'apple'
