/**
 * Provision the App Store review demo account.
 *
 * Apple requires working credentials for any app behind a login, and their
 * reviewer cannot receive an emailed one-time code. This creates one Supabase
 * user with a generated password and email already confirmed. The mobile app
 * offers the password field only for the address in `EXPO_PUBLIC_REVIEW_EMAIL`
 * (see `src/lib/env.ts` → `isReviewAccount`), so no other account can use it.
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from the repo's
 * .env.local. The service-role key is never printed. The generated password is
 * printed once — put it in App Store Connect → App Review Information, and
 * nowhere else.
 *
 * Usage:  node packages/mobile/scripts/create-review-account.mjs [email]
 */

import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const EMAIL = (process.argv[2] ?? 'appreview@pleiad.io').trim().toLowerCase()

function readEnv(file) {
  const map = {}
  for (const line of readFileSync(resolve(REPO_ROOT, file), 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    map[trimmed.slice(0, eq).trim()] = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
  }
  return map
}

const env = readEnv('.env.local')
const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// 32 URL-safe chars — far stronger than the 6-char project minimum, and well
// past anything worth brute-forcing on a public auth endpoint.
const password = randomBytes(24).toString('base64url')

const response = await fetch(`${url}/auth/v1/admin/users`, {
  method: 'POST',
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: EMAIL,
    password,
    email_confirm: true,
    user_metadata: { role: 'app_store_review' },
  }),
})

const body = await response.json().catch(() => ({}))

if (!response.ok) {
  const detail = body.msg ?? body.message ?? body.error_description ?? JSON.stringify(body)
  if (response.status === 422 || /already/i.test(String(detail))) {
    console.error(`User ${EMAIL} already exists.`)
    console.error('Rotate its password in the Supabase dashboard, or delete it and re-run.')
  } else {
    console.error(`Failed (${response.status}): ${detail}`)
  }
  process.exit(1)
}

console.log('')
console.log('Review account created.')
console.log('')
console.log(`  email     ${EMAIL}`)
console.log(`  password  ${password}`)
console.log(`  user id   ${body.id}`)
console.log('')
console.log('Next:')
console.log(`  1. cd packages/mobile && eas env:create --name EXPO_PUBLIC_REVIEW_EMAIL \\`)
console.log(`       --value ${EMAIL} --environment production --environment preview \\`)
console.log(`       --visibility plaintext --scope project --type string --non-interactive`)
console.log('  2. Rebuild (the address is inlined at bundle time).')
console.log('  3. Paste both values into ASC → App Review Information → Sign-In Required.')
console.log('')
console.log('The password is shown once. Store it in your password manager now.')
console.log('')
