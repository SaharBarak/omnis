import { Redirect } from 'expo-router'

/**
 * Auth0 redirects to `pleiad://callback?code=…&state=…`.
 *
 * expo-auth-session consumes that link out of band and completes the PKCE
 * exchange, so nothing needs to happen here — but the link is still delivered
 * to the router, and without a route to catch it the person watches the
 * "Unmatched Route" 404 flash mid-sign-in. This is the catcher: it renders
 * nothing and sends them to the root, which is already gating on the session
 * the exchange just stored.
 */
export default function AuthCallbackScreen() {
  return <Redirect href="/" />
}
