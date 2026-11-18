/**
 * Keeps one-time codes and signed tokens out of analytics.
 *
 * This site puts them in URLs: the Supabase auth return leg (`?code=`, and
 * `#access_token=` on implicit flows), the newsletter confirm and unsubscribe
 * links (`?sig=`, `?email=`), and the public share pages, whose path segment
 * is the capability to read the share. Every string property is checked, because the
 * SDK copies the page URL into several of them (`$current_url`, `$referrer`,
 * the initial-visit person properties, exception frames).
 */

/** Query and fragment parameters whose values never leave the browser. */
export const SENSITIVE_PARAMS = [
  'code',
  'token',
  'access_token',
  'refresh_token',
  'id_token',
  'provider_token',
  'sig',
  'signature',
  'email',
  'password',
  'secret',
  'key',
  'apikey',
] as const

/**
 * Property names whose value is a credential whatever it looks like. Narrower
 * than the URL list on purpose: `token` is the SDK's own project-token field
 * and `email` is a person property, and both must pass through.
 */
export const SECRET_KEYS: ReadonlySet<string> = new Set([
  'password',
  'secret',
  'access_token',
  'refresh_token',
  'id_token',
  'provider_token',
  'authorization',
])

/** Routes whose next path segment is a bearer token (`/share/[token]`). */
export const TOKEN_PATH_PREFIXES = ['share', 'shared'] as const

export const REDACTED = 'redacted'

const PARAM_PATTERN = new RegExp(
  `([?&#](?:${SENSITIVE_PARAMS.join('|')})=)[^&#\\s"']*`,
  'gi'
)

const PATH_PATTERN = new RegExp(`(/(?:${TOKEN_PATH_PREFIXES.join('|')})/)[^/?#\\s"']+`, 'g')

export function redactText(value: string): string {
  return value.replace(PARAM_PATTERN, `$1${REDACTED}`).replace(PATH_PATTERN, `$1${REDACTED}`)
}

/**
 * Deep copy with every string value redacted and every `SECRET_KEYS` entry
 * replaced. Other non-string leaves pass through.
 */
export function redactValue<T>(value: T): T {
  if (typeof value === 'string') return redactText(value) as T
  if (Array.isArray(value)) return value.map(redactValue) as T
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        SECRET_KEYS.has(key.toLowerCase()) ? REDACTED : redactValue(entry),
      ])
    ) as T
  }
  return value
}
