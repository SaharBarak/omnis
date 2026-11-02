// Real-screen captures for the product film, 2x device scale, over CDP.
// usage: node capture.mjs <out-dir> <base-url>
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const [outDir, base] = process.argv.slice(2)
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 9500 + Math.floor(Math.random() * 300)
const W = 1440
const H = 900
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'film-'))}`, 'about:blank'], { stdio: 'ignore' })
let url
for (let i = 0; i < 60 && !url; i++) { try { url = (await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()).webSocketDebuggerUrl } catch { await sleep(200) } }
const ws = new WebSocket(url)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let seq = 0
const pending = new Map()
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } })
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const id = ++seq; pending.set(id, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result))); ws.send(JSON.stringify({ id, method, params, sessionId })) })

const open = async (route) => {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Page.enable', {}, sessionId)
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: false }, sessionId)
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, sessionId)
  await send('Page.navigate', { url: `${base}${route}` }, sessionId)
  await sleep(7000)
  return { targetId, sessionId }
}
const js = (sessionId, expression) => send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId).then((r) => r.result.value)
const type = async (sessionId, selector, text, index = 0) => {
  await js(sessionId, `document.querySelectorAll(${JSON.stringify(selector)})[${index}].focus()`)
  for (const ch of text) { await send('Input.insertText', { text: ch }, sessionId); await sleep(40) }
}
const shot = async (sessionId, name, full = false) => {
  await js(sessionId, "document.querySelectorAll('nextjs-portal').forEach((e) => e.remove())")
  await sleep(150)
  const { cssContentSize } = await send('Page.getLayoutMetrics', {}, sessionId)
  const height = full ? Math.ceil(cssContentSize.height) : H
  const scrollY = full ? 0 : await js(sessionId, 'window.scrollY')
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full, clip: { x: 0, y: full ? 0 : scrollY, width: W, height, scale: 1 } }, sessionId)
  writeFileSync(join(outDir, `${name}.png`), Buffer.from(data, 'base64'))
  console.log(name, W, height)
}
const fillDate = async (sessionId, index, [d, m, y]) => {
  await type(sessionId, 'input[aria-label="Day"]', d, index)
  await type(sessionId, 'input[aria-label="Month"]', m, index)
  await type(sessionId, 'input[aria-label="Year"]', y, index)
}
const clickText = (sessionId, text) => js(sessionId, `(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim().startsWith(${JSON.stringify(text)})); b?.click(); return !!b })()`)

// 1. One person: /calculate
{
  const { targetId, sessionId } = await open('/calculate')
  await shot(sessionId, '1a-calculate-empty')
  await fillDate(sessionId, 0, ['14', '03', '1991'])
  await sleep(400)
  await shot(sessionId, '1b-calculate-filled')
  console.log('clicked', await clickText(sessionId, 'Calculate'))
  await sleep(4000)
  await shot(sessionId, '1c-calculate-result', true)
  await send('Target.closeTarget', { targetId })
}

// 2. Two people: /compatibility
{
  const { targetId, sessionId } = await open('/compatibility')
  await type(sessionId, '#name1', 'Maya')
  await fillDate(sessionId, 0, ['14', '03', '1991'])
  await type(sessionId, '#name2', 'Ari')
  await fillDate(sessionId, 1, ['25', '08', '1983'])
  await sleep(400)
  await shot(sessionId, '2a-compat-filled')
  console.log('clicked', await clickText(sessionId, 'Check compatibility'))
  await sleep(5000)
  await shot(sessionId, '2b-compat-result', true)
  await send('Target.closeTarget', { targetId })
}

// 3. The day: /today
{
  const { targetId, sessionId } = await open('/today')
  await shot(sessionId, '3a-today', true)
  await send('Target.closeTarget', { targetId })
}

ws.close()
chrome.kill('SIGKILL')
