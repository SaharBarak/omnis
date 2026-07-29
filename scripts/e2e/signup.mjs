// Front-door signup/sign-in for the E2E account through the real /login UI.
// Submit button: "Continue" (signin) / "Create account" (signup).
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const BASE = process.env.E2E_BASE ?? 'http://localhost:3100'
const EMAIL = 'sahar.h.barak+e2e@gmail.com'

const pwFile = path.join(here, '.e2e-password')
let password
if (existsSync(pwFile)) {
  password = readFileSync(pwFile, 'utf8').trim()
} else {
  password = randomBytes(18).toString('base64url')
  writeFileSync(pwFile, password, { mode: 0o600 })
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('#email', { timeout: 30_000 })

// Attempt sign-in first — the account may already exist and be confirmed.
await page.fill('#email', EMAIL)
await page.fill('#password', password)
await page.click('button[type="submit"]')
try {
  await page.waitForURL('**/app**', { timeout: 15_000 })
  await page.context().storageState({ path: path.join(here, 'state.json') })
  console.log('RESULT: signed-in')
  await browser.close()
  process.exit(0)
} catch {
  /* not signed in — try signup */
}

await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('#email')
await page.getByRole('button', { name: 'Sign up' }).click()
await page.fill('#email', EMAIL)
await page.fill('#password', password)
await page.click('button[type="submit"]')
await page.waitForTimeout(5000)
const body = (await page.textContent('body')) ?? ''
if (/check your inbox/i.test(body)) {
  console.log('RESULT: confirmation-sent')
} else if (/already registered|already exists/i.test(body)) {
  console.log('RESULT: exists-but-password-wrong-or-unconfirmed')
} else {
  console.log('RESULT: unknown; page says:', body.replace(/\s+/g, ' ').slice(0, 300))
}
await browser.close()
