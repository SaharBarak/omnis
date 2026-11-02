/**
 * Where to send a user after sign-in. Same-origin paths only: an absolute URL,
 * a protocol-relative `//host`, the `/\host` form browsers read the same way,
 * or an encoded or control-character variant of either would turn the login
 * page into an open redirect. The path is parsed against a probe origin and
 * kept only if it stays there; what comes back is its normalised
 * path, query and hash.
 */

const PROBE = 'http://same-origin.invalid'
const CONTROL = /[\u0000-\u001f\u007f]/
const LEAVES_ORIGIN = /^[/\\]{2}/

const decoded = (path: string): string | null => {
  try {
    return decodeURIComponent(path)
  } catch {
    return null
  }
}

export function safeRedirect(redirectTo: string | null | undefined, fallback = '/app'): string {
  if (!redirectTo || redirectTo[0] !== '/' || redirectTo.includes('\\') || CONTROL.test(redirectTo)) return fallback
  let url: URL
  try {
    url = new URL(redirectTo, PROBE)
  } catch {
    return fallback
  }
  if (url.origin !== PROBE) return fallback
  const plain = decoded(url.pathname)
  if (plain === null || LEAVES_ORIGIN.test(plain) || CONTROL.test(plain)) return fallback
  return `${url.pathname}${url.search}${url.hash}`
}
