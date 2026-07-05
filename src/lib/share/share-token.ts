/**
 * Server-side share-link crypto. Tokens and password hashes are ALWAYS minted
 * here, inside the share-create API routes — never by the browser — so a
 * malicious client cannot choose (or reuse) a token, and the hashing scheme
 * has a single server-owned definition. Web Crypto only, so everything works
 * in both the Cloudflare Workers runtime and Node.
 */

const TOKEN_ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'

/**
 * Generates an unguessable, URL-safe share token from an unambiguous
 * alphabet (no 0/O/1/l/I). Uses rejection sampling so every character is
 * uniformly distributed (no modulo bias).
 */
export function generateShareToken(length = 16): string {
  const maxUnbiased =
    Math.floor(256 / TOKEN_ALPHABET.length) * TOKEN_ALPHABET.length
  let result = ''
  while (result.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length * 2))
    for (const byte of bytes) {
      if (byte < maxUnbiased && result.length < length) {
        result += TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length]
      }
    }
  }
  return result
}

/**
 * SHA-256 hex digest of a share password. Both share creation (hash at rest)
 * and share viewing (candidate verification) go through this single function,
 * so the stored hash never leaves the server and the two sides can't drift.
 */
export async function hashSharePassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
