/**
 * Copy the local `.env` public vars up to EAS so cloud builds get them.
 *
 * `packages/mobile/.env` is gitignored and there is no `.easignore`, so EAS
 * never sees it — the values have to live as EAS environment variables. This
 * reads the local file and pushes each var to the `production` and `preview`
 * environments, printing only names and lengths so nothing lands in a log.
 *
 * Usage:  cd packages/mobile && npm run env:push
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ENV_FILE = resolve(PACKAGE_ROOT, '.env')
const ENVIRONMENTS = ['production', 'preview']

/**
 * Every var pushed here is `EXPO_PUBLIC_*`, which Metro inlines into the
 * JS bundle — all of them are public by construction (the Supabase anon key
 * and the RevenueCat SDK keys are designed to ship in clients). They are
 * created as `plaintext` so their values stay readable in the EAS dashboard;
 * nothing secret belongs on this list.
 */
const PUSHABLE = /^EXPO_PUBLIC_[A-Z0-9_]+$/

function parseEnvFile(path) {
  let raw
  try {
    raw = readFileSync(path, 'utf8')
  } catch {
    console.error(`No .env at ${path} — nothing to push.`)
    process.exit(1)
  }
  const entries = []
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const name = trimmed.slice(0, eq).trim()
    const value = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
    if (value !== '') entries.push([name, value])
  }
  return entries
}

const pushable = parseEnvFile(ENV_FILE).filter(([name]) => PUSHABLE.test(name))

if (pushable.length === 0) {
  console.error('No EXPO_PUBLIC_* vars found in .env — nothing to push.')
  process.exit(1)
}

let failed = 0
for (const [name, value] of pushable) {
  const args = [
    'env:create',
    '--name',
    name,
    '--value',
    value,
    '--visibility',
    'plaintext',
    '--scope',
    'project',
    '--type',
    'string',
    '--force',
    '--non-interactive',
    ...ENVIRONMENTS.flatMap((environment) => ['--environment', environment]),
  ]
  try {
    execFileSync('eas', args, { cwd: PACKAGE_ROOT, stdio: ['ignore', 'ignore', 'pipe'] })
    console.log(`pushed  ${name}  (${value.length} chars) → ${ENVIRONMENTS.join(', ')}`)
  } catch (error) {
    failed += 1
    const detail = String(error.stderr ?? error.message).trim().split('\n').slice(-3).join(' ')
    console.error(`FAILED  ${name}: ${detail}`)
  }
}

console.log('')
console.log(`${pushable.length - failed}/${pushable.length} pushed. Verify with: eas env:list production`)
process.exit(failed > 0 ? 1 : 0)
