#!/usr/bin/env node
/**
 * One-shot (idempotent) Paddle LIVE environment setup for Pleiad.
 *
 * Creates the four catalog products + prices and the production webhook
 * notification destination, then writes PADDLE_PRICE_* + PADDLE_WEBHOOK_SECRET
 * straight into ./.prod.vars. Prints price ids (not secret) and a masked
 * webhook-secret confirmation — never the API key.
 *
 * Usage (key read from .prod.vars automatically after paddle-capture.mjs):
 *   node scripts/paddle-live-setup.mjs
 * Or explicitly:
 *   PADDLE_LIVE_API_KEY=pdl_live_... node scripts/paddle-live-setup.mjs
 *
 * Safe to re-run: matches products by name and prices by description, creates
 * only what's missing.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const VARS = join(ROOT, '.prod.vars')

const readVar = (name) => {
  if (!existsSync(VARS)) return ''
  return readFileSync(VARS, 'utf8').match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1]?.trim() ?? ''
}

const API = 'https://api.paddle.com'
const KEY = process.env.PADDLE_LIVE_API_KEY || readVar('PADDLE_API_KEY')

if (!KEY) {
  console.error('❌ No live key. Run scripts/paddle-capture.mjs first, or set PADDLE_LIVE_API_KEY.')
  process.exit(1)
}
if (!KEY.startsWith('pdl_live_') && !KEY.startsWith('live_')) {
  console.error('❌ Key does not look like a LIVE key (expected pdl_live_… / live_…). Refusing.')
  process.exit(1)
}

const WEBHOOK_URL = 'https://pleiad.io/api/billing/webhook'
// Keep in lockstep with SUBSCRIPTION_EVENTS in src/app/api/billing/webhook/route.ts
const WEBHOOK_EVENTS = [
  'subscription.created',
  'subscription.activated',
  'subscription.trialing',
  'subscription.updated',
  'subscription.past_due',
  'subscription.paused',
  'subscription.resumed',
  'subscription.canceled',
  'transaction.completed',
]

// Mirrors PLANS in src/lib/services/billing.ts (USD, cents).
const CATALOG = [
  { envKey: 'PADDLE_PRICE_EXPLORER',     product: 'Pleiad Explorer',          desc: 'Explorer monthly',     amount: '500',  recurring: true },
  { envKey: 'PADDLE_PRICE_COMPLETE',     product: 'Pleiad Complete',          desc: 'Complete monthly',     amount: '900',  recurring: true },
  { envKey: 'PADDLE_PRICE_PRACTITIONER', product: 'Pleiad Practitioner',      desc: 'Practitioner monthly', amount: '2900', recurring: true },
  { envKey: 'PADDLE_PRICE_LIFETIME',     product: 'Pleiad Founding Lifetime', desc: 'Founding Lifetime (one-time)', amount: '7900', recurring: false },
]

async function paddle(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(json.error ?? json)}`)
  }
  return json.data
}

async function listAll(path) {
  const out = []
  let after = ''
  for (;;) {
    const sep = path.includes('?') ? '&' : '?'
    const page = await paddle('GET', `${path}${sep}per_page=200${after ? `&after=${after}` : ''}`)
    out.push(...page)
    if (page.length < 200) return out
    after = page[page.length - 1].id
  }
}

const results = {}

// --- products + prices ---
const products = await listAll('/products?status=active')
for (const item of CATALOG) {
  let product = products.find((p) => p.name === item.product)
  if (product) {
    console.log(`• product exists: ${item.product} (${product.id})`)
  } else {
    product = await paddle('POST', '/products', { name: item.product, tax_category: 'standard' })
    console.log(`✓ product created: ${item.product} (${product.id})`)
  }

  const prices = await listAll(`/prices?product_id=${product.id}&status=active`)
  let price = prices.find(
    (p) =>
      p.unit_price?.amount === item.amount &&
      p.unit_price?.currency_code === 'USD' &&
      Boolean(p.billing_cycle) === item.recurring
  )
  if (price) {
    console.log(`  • price exists: ${item.desc} (${price.id})`)
  } else {
    price = await paddle('POST', '/prices', {
      product_id: product.id,
      description: item.desc,
      unit_price: { amount: item.amount, currency_code: 'USD' },
      ...(item.recurring ? { billing_cycle: { interval: 'month', frequency: 1 } } : {}),
      quantity: { minimum: 1, maximum: 1 },
    })
    console.log(`  ✓ price created: ${item.desc} (${price.id})`)
  }
  results[item.envKey] = price.id
}

// --- webhook notification destination ---
const settings = await listAll('/notification-settings')
let hook = settings.find((s) => s.destination === WEBHOOK_URL)
if (hook) {
  console.log(`• webhook destination exists (${hook.id})`)
} else {
  hook = await paddle('POST', '/notification-settings', {
    description: 'Pleiad production webhook',
    destination: WEBHOOK_URL,
    type: 'url',
    subscribed_events: WEBHOOK_EVENTS,
    traffic_source: 'platform',
  })
  console.log(`✓ webhook destination created (${hook.id})`)
}

// --- write results into .prod.vars ---
const upsert = (text, key, value) => {
  const re = new RegExp(`^${key}=.*$`, 'm')
  const line = `${key}=${value}`
  return re.test(text) ? text.replace(re, line) : `${text.trimEnd()}\n${line}\n`
}

if (!existsSync(VARS)) {
  console.error('\n⚠ .prod.vars missing — printing price ids instead:')
  for (const [k, v] of Object.entries(results)) console.log(`${k}=${v}`)
  process.exit(0)
}

let vars = readFileSync(VARS, 'utf8')
for (const [k, v] of Object.entries(results)) vars = upsert(vars, k, v)
const secret = hook.endpoint_secret_key
if (secret) vars = upsert(vars, 'PADDLE_WEBHOOK_SECRET', secret)
writeFileSync(VARS, vars)

console.log('\n✓ Wrote to .prod.vars:')
for (const [k, v] of Object.entries(results)) console.log(`   ${k}=${v}`) // price ids are not secret
console.log(`   PADDLE_WEBHOOK_SECRET=${secret ? secret.slice(0, 8) + '…(' + secret.length + ' chars)' : 'NOT RETURNED — reveal in Paddle → Notifications'}`)
console.log('\nStill needed: NEXT_PUBLIC_PADDLE_CLIENT_TOKEN (paddle-capture.mjs handles it), plus held secrets RESEND/TURNSTILE/GEMINI. Then ./scripts/set-prod-secrets.sh.')
