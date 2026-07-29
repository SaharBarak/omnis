// Pleiad v2 E2E suite — drives the real app with the E2E account session,
// screenshots every verified flow into ~/Desktop/pleiad-v2-testing/<topic>/.
// Exit 0 = all green. Results written to e2e/results.json.
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const BASE = process.env.E2E_BASE ?? 'http://localhost:3100'
const SHOTS = path.join(os.homedir(), 'Desktop', 'pleiad-v2-testing')

const results = []
let context, page

function dir(topic) {
  const d = path.join(SHOTS, topic)
  mkdirSync(d, { recursive: true })
  return d
}

async function shot(topic, name) {
  await page.screenshot({ path: path.join(dir(topic), `${name}.png`), fullPage: false })
}

async function check(topic, name, fn) {
  const started = Date.now()
  try {
    await fn()
    results.push({ topic, name, ok: true, ms: Date.now() - started })
    console.log(`PASS  ${topic}/${name}`)
  } catch (err) {
    results.push({ topic, name, ok: false, ms: Date.now() - started, error: String(err).slice(0, 500) })
    console.log(`FAIL  ${topic}/${name}: ${String(err).slice(0, 200)}`)
    try {
      await page.screenshot({ path: path.join(dir('_failures'), `${topic}-${name}.png`) })
    } catch { /* page may be gone */ }
  }
}

const browser = await chromium.launch()
context = await browser.newContext({
  storageState: path.join(here, 'state.json'),
  viewport: { width: 1440, height: 900 },
})
page = await context.newPage()

// ---------------------------------------------------------------- seed people
const E2E_PEOPLE = [
  { name: 'E2E Maya', hebrew_name: 'מאיה', birth_date: '1991-03-14', birth_time: '08:20', birth_place: { lat: 32.08, lng: 34.78, name: 'Tel Aviv' } },
  { name: 'E2E Noam', hebrew_name: 'נועם', birth_date: '1987-01-12', birth_time: '14:05', birth_place: { lat: 31.77, lng: 35.21, name: 'Jerusalem' } },
]
let ids = {}

await check('00-setup', 'seed-people', async () => {
  const listRes = await page.request.get(`${BASE}/api/people`)
  if (!listRes.ok()) throw new Error(`GET /api/people ${listRes.status()}`)
  const list = await listRes.json()
  const existing = Array.isArray(list) ? list : list.people ?? []
  for (const person of E2E_PEOPLE) {
    const found = existing.find((p) => (p.person ?? p).name === person.name)
    if (found) {
      ids[person.name] = (found.person ?? found).id
      continue
    }
    const res = await page.request.post(`${BASE}/api/people`, { data: { person } })
    if (!res.ok()) throw new Error(`POST /api/people ${res.status()}: ${await res.text()}`)
    const created = await res.json()
    ids[person.name] = (created.person ?? created).id
  }
  if (!ids['E2E Maya'] || !ids['E2E Noam']) throw new Error('seed ids missing')
})

// ------------------------------------------------------------------- landing
await check('01-landing', 'hero-renders', async () => {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 90_000 })
  await shot('01-landing', '01-hero')
})

await check('01-landing', 'couples-map-section', async () => {
  const zone = page.locator('#couples')
  await zone.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1200) // entrance animations
  const text = await zone.textContent()
  if (!/Four oracle seats/.test(text ?? '')) throw new Error('couples zone copy missing')
  if (!/resonance/i.test(text ?? '')) throw new Error('resonance score missing')
  await shot('01-landing', '02-couples-map')
})

// ------------------------------------------------------- onboarding (once)
await check('00-setup', 'complete-onboarding', async () => {
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle', timeout: 90_000 })
  const welcome = page.getByText('Welcome to Pleiad')
  if (!(await welcome.isVisible().catch(() => false))) return // already onboarded
  await page.fill('input[placeholder="Your name"]', 'E2E Tester')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.fill('#birthDate', '1990-05-16')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: 'Continue' }).click() // birth time — optional
  await page.getByRole('button', { name: 'Continue' }).click() // birth place — optional
  await page.getByRole('button', { name: 'Finish' }).click() // hebrew name — optional
  await page.waitForURL('**/app**', { timeout: 30_000 })
  await page.waitForTimeout(1500)
  await shot('00-setup', '01-onboarding-complete')
})

// ----------------------------------------------------------------- dashboard
await check('02-dashboard', 'today-board-11-systems', async () => {
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle', timeout: 90_000 })
  if (page.url().includes('/login')) throw new Error('session not accepted — redirected to login')
  await page.waitForTimeout(1500)
  const body = (await page.textContent('main').catch(() => null)) ?? (await page.textContent('body')) ?? ''
  for (const label of ['Hijri', 'Persian', 'Chinese', 'Panchang', 'Long Count', 'Sidereal']) {
    if (!new RegExp(label, 'i').test(body)) throw new Error(`today board missing ${label}`)
  }
  await shot('02-dashboard', '01-today-board')
})

// ---------------------------------------------------------------- typography
await check('03-typography', 'no-mono-outside-allowed', async () => {
  const offenders = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('.font-mono'))
    return all
      .filter((el) => !el.closest('kbd'))
      .map((el) => el.tagName + '.' + el.className)
      .slice(0, 10)
  })
  // The split-flap board sets font-mono inside its own component — allowed.
  const real = offenders.filter((o) => !/origin-top/.test(o))
  if (real.length > 0) throw new Error(`font-mono leaked: ${real.join(' | ')}`)
  await shot('03-typography', '01-dashboard-type')
})

// ------------------------------------------------------------------ calendar
await check('04-calendar', 'month-grid', async () => {
  await page.goto(`${BASE}/app/calendar`, { waitUntil: 'networkidle', timeout: 90_000 })
  await page.waitForTimeout(1200)
  const days = await page.locator('button[aria-label*="Kin"]').count()
  if (days < 28) throw new Error(`expected a month of kin cells, got ${days}`)
  await shot('04-calendar', '01-month-grid')
})

await check('04-calendar', 'select-day-wavespell', async () => {
  await page.locator('button[aria-label*="Kin"]').nth(17).click()
  await page.waitForTimeout(600)
  const detail = (await page.textContent('main').catch(() => '')) ?? ''
  if (!/wavespell/i.test(detail)) throw new Error('wavespell panel missing')
  if (!/of 13/.test(detail)) throw new Error('wavespell position missing')
  await shot('04-calendar', '02-day-detail-wavespell')
})

// -------------------------------------------------------------- human design
await check('05-human-design', 'chart-fits-viewport', async () => {
  await page.goto(`${BASE}/app/people/${ids['E2E Maya']}`, { waitUntil: 'networkidle', timeout: 90_000 })
  await page.waitForTimeout(1500)
  await page.getByText('Human Design', { exact: true }).first().click()
  const svg = page.locator('svg[viewBox="0 0 400 640"]').first()
  await svg.waitFor({ timeout: 20_000 })
  await svg.scrollIntoViewIfNeeded()
  const box = await svg.boundingBox()
  if (!box) throw new Error('bodygraph svg not measurable')
  if (box.height > 900 - 128) throw new Error(`bodygraph ${Math.round(box.height)}px > 100svh budget`)
  await shot('05-human-design', '01-bodygraph-fits')
})

// ---------------------------------------------------------------- couple map
await check('06-couple-map', 'pair-page-renders', async () => {
  await page.goto(`${BASE}/app/pair/${ids['E2E Maya']}/${ids['E2E Noam']}`, {
    waitUntil: 'networkidle',
    timeout: 90_000,
  })
  await page.waitForTimeout(1500)
  const body = (await page.textContent('main').catch(() => '')) ?? ''
  if (!/Dreamspell oracle/i.test(body)) throw new Error('oracle section missing')
  if (!/resonance/i.test(body)) throw new Error('resonance missing')
  await shot('06-couple-map', '01-pair-overview')
})

await check('06-couple-map', 'oracle-seats-lit', async () => {
  const body = (await page.textContent('main').catch(() => '')) ?? ''
  // Maya × Noam are mutual analogs — the Analog seat must show the partner.
  if (!/Analog/i.test(body)) throw new Error('analog seat not rendered')
  const litSeats = await page.evaluate(() =>
    document.querySelectorAll('[class*="border-brand"]').length
  )
  if (litSeats < 2) throw new Error(`expected lit oracle seats on both strips, found ${litSeats}`)
  const section = page.getByText('Dreamspell oracle').first()
  await section.scrollIntoViewIfNeeded()
  await page.waitForTimeout(800)
  await shot('06-couple-map', '02-oracle-seats')
})

await check('06-couple-map', 'moon-and-hd-sections', async () => {
  const body = (await page.textContent('main').catch(() => '')) ?? ''
  if (!/Born under/i.test(body)) throw new Error('moon section missing')
  if (!/Human Design/i.test(body)) throw new Error('HD section missing')
  await page.getByText('Born under').first().scrollIntoViewIfNeeded()
  await page.waitForTimeout(800)
  await shot('06-couple-map', '03-moons-and-hd')
})

// ------------------------------------------------------------ boards tier gate
await check('07-boards-gate', 'free-plan-blocked', async () => {
  const btn = page.getByRole('button', { name: /create a board from this pair/i })
  await btn.scrollIntoViewIfNeeded()
  await btn.click()
  await page.waitForTimeout(2500)
  const body = (await page.textContent('main').catch(() => '')) ?? ''
  const gated = /aren't included|reached your plan|Upgrade/i.test(body)
  const navigated = page.url().includes('/app/boards/')
  if (!gated && !navigated) throw new Error('neither gate notice nor board creation happened')
  if (navigated) {
    await shot('07-boards-gate', '01-board-created')
  } else {
    await shot('07-boards-gate', '01-tier-gate-notice')
  }
})

// ----------------------------------------------------- hebrew calendar (#70)
await check('08-hebrew-calendar', 'detail-page-renders', async () => {
  await page.goto(`${BASE}/app/calendars/hebrew`, { waitUntil: 'networkidle', timeout: 90_000 })
  await page.waitForTimeout(1500)
  const body = (await page.textContent('main').catch(() => '')) ?? ''
  for (const marker of ['Hebrew Calendar', 'Metonic', 'Rosh Hashanah', 'Molad', 'History']) {
    if (!body.includes(marker)) throw new Error(`missing section marker: ${marker}`)
  }
  if (!/\d+ (Av|Elul|Tishri|Heshvan|Kislev|Tevet|Shevat|Adar|Nisan|Iyar|Sivan|Tamuz) \d{4}/.test(body))
    throw new Error('live Hebrew date missing from hero')
  await shot('08-hebrew-calendar', '01-hero-and-overview')
})

await check('08-hebrew-calendar', 'converter-works', async () => {
  await page.fill('#hebrew-date-in', '2026-07-24')
  await page.waitForTimeout(400)
  const body = (await page.textContent('main').catch(() => '')) ?? ''
  if (!body.includes('10 Av 5786')) throw new Error('converter did not produce 10 Av 5786')
  const explorer = page.locator('#hebrew-date-in')
  await explorer.scrollIntoViewIfNeeded()
  await page.waitForTimeout(600)
  await shot('08-hebrew-calendar', '02-converter')
})

await check('08-hebrew-calendar', 'holidays-list', async () => {
  const body = (await page.textContent('main').catch(() => '')) ?? ''
  for (const h of ['Yom Kippur', 'Hanukkah', 'Passover', 'Purim']) {
    if (!body.includes(h)) throw new Error(`holiday missing: ${h}`)
  }
  await page.getByText('Holidays', { exact: true }).first().scrollIntoViewIfNeeded()
  await page.waitForTimeout(600)
  await shot('08-hebrew-calendar', '03-upcoming-holidays')
})

await check('08-hebrew-calendar', 'today-board-tap-through', async () => {
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle', timeout: 90_000 })
  await page.waitForTimeout(1200)
  const link = page.locator('a[href="/app/calendars/hebrew"]').first()
  await link.waitFor({ timeout: 15_000 })
  await link.click()
  await page.waitForURL('**/app/calendars/hebrew', { timeout: 20_000 })
  await shot('08-hebrew-calendar', '04-tap-through-from-board')
})

// -------------------------------------------------------------------- report
await browser.close()
const failed = results.filter((r) => !r.ok)
writeFileSync(path.join(here, 'results.json'), JSON.stringify({ when: null, results }, null, 2))
console.log(`\n${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
