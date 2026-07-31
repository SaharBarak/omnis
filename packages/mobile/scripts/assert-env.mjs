/**
 * Build-time guard for the public runtime config.
 *
 * Metro inlines `EXPO_PUBLIC_*` at bundle time. `src/lib/env.ts` falls back to
 * `''` when a var is absent, so a build with no env configured used to succeed
 * and ship a bundle whose Supabase client threw `supabaseKey is required.` on
 * first import — a launch crash with a green build.
 *
 * EAS clones the repo, and `packages/mobile/.env` is gitignored, so local
 * values never reach a cloud build. The values must exist as EAS environment
 * variables (`npm run env:push`). This script is wired to the
 * `eas-build-pre-install` hook so a misconfigured build fails loudly in the
 * first seconds instead of silently at launch on a reviewer's phone.
 */

/** Vars without which the app cannot boot. */
const REQUIRED = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY']

/** Vars whose absence degrades a feature but still boots. */
const RECOMMENDED = [
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_REVENUECAT_IOS_KEY',
  'EXPO_PUBLIC_REVENUECAT_ANDROID_KEY',
]

const isBlank = (name) => {
  const value = process.env[name]
  return value === undefined || value.trim() === ''
}

const missing = REQUIRED.filter(isBlank)
const absent = RECOMMENDED.filter(isBlank)

for (const name of REQUIRED.filter((n) => !isBlank(n))) {
  console.log(`env ok        ${name} (${process.env[name].length} chars)`)
}
for (const name of absent) {
  console.warn(`env missing   ${name} — the feature reading it will be inert`)
}

if (missing.length > 0) {
  console.error('')
  console.error('Build aborted — required public env vars are unset:')
  for (const name of missing) console.error(`  · ${name}`)
  console.error('')
  console.error('Set them on EAS, then rebuild:')
  console.error('  cd packages/mobile && npm run env:push')
  console.error('')
  process.exit(1)
}
