#!/usr/bin/env node
/**
 * Capture the Paddle LIVE server API key + client-side token into .prod.vars.
 *
 * Drives the Paddle dashboard through the Aside browser (you must be signed in
 * to Paddle in Aside — you already are). Reads each secret from its one-time
 * reveal modal and writes it straight into ./.prod.vars (gitignored). Prints
 * ONLY success flags and character counts — never the secret value.
 *
 *   node scripts/paddle-capture.mjs
 *
 * Creates one API key + one client-side token, both named "pleiad-prod-live".
 * Does NOT revoke existing keys (revoking live payment creds is your call — do
 * it in the Paddle console). Re-running makes additional keys.
 */
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const VARS = join(ROOT, '.prod.vars')
const URL = 'https://vendors.paddle.com/authentication-v2'

// --- browser automation (runs inside `aside repl`; single line at call time) ---
/* NOTE: newlines are collapsed to spaces before this runs in `aside repl`,
   so the automation body must contain NO // line comments (they would eat
   the rest of the one-liner). Block comments only, outside the string. */
const AUTOMATION = `
const p = await openTab(${JSON.stringify(URL)});
await sleep(5000);

async function readReveal() {
  await p.waitForSelector('[role=dialog] input.paddle-input, .paddle-dialog input', { timeout: 12000 });
  for (let i = 0; i < 30; i++) {
    const v = await p.evaluate(() => {
      const inp = document.querySelector('[role=dialog] input.paddle-input, .paddle-dialog input');
      const val = inp && inp.value ? inp.value : '';
      return /^(pdl_|live_)/.test(val) && val.length > 20 ? val : '';
    });
    if (v) return v;
    await sleep(400);
  }
  return '';
}

async function createAndReveal(newLabel) {
  await p.evaluate((lbl) => [...document.querySelectorAll('button,a')]
    .find(x => x.textContent.trim() === lbl)?.click(), newLabel);
  await p.waitForSelector('[role=dialog]', { timeout: 8000 });
  await sleep(800);
  await p.evaluate(() => {
    const dlg = document.querySelector('[role=dialog]');
    const name = dlg.querySelector('input[type=text], input:not([type])');
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    set.call(name, 'pleiad-prod-live');
    name.dispatchEvent(new Event('input', { bubbles: true }));
    for (const c of dlg.querySelectorAll('input[type=checkbox]')) if (!c.checked) c.click();
  });
  await sleep(600);
  await p.click('[role=dialog] button:has-text("Save")').catch(async () => {
    await p.evaluate(() => [...document.querySelector('[role=dialog]').querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Save')?.click());
  });
  const secret = await readReveal();
  await p.evaluate(() => document.querySelector('[aria-label="close dialog"]')?.click()).catch(() => {});
  await sleep(1500);
  return secret;
}

const MODE = ${JSON.stringify(process.argv[2] || 'both')};

if (MODE === 'api' || MODE === 'both') {
  const apiKey = await createAndReveal('New API key');
  console.log('CAPTURED_API_KEY=' + apiKey);
}

if (MODE === 'token' || MODE === 'both') {
  await p.evaluate(() => [...document.querySelectorAll('button,[role=tab],a')]
    .find(x => x.textContent.trim() === 'Client-side tokens')?.click());
  await sleep(3000);
  const clientToken = await createAndReveal('New Client-side token');
  console.log('CAPTURED_CLIENT_TOKEN=' + clientToken);
}
`

function runAside(js) {
  return new Promise((resolve, reject) => {
    const child = spawn('aside', ['repl'], { stdio: ['pipe', 'pipe', 'pipe'] })
    let out = ''
    const kill = setTimeout(() => child.kill('SIGKILL'), 150_000)
    child.stdout.on('data', (d) => { out += d })
    child.stderr.on('data', (d) => { out += d })
    child.on('error', reject)
    child.on('close', () => { clearTimeout(kill); resolve(out) })
    child.stdin.write(js.replace(/\n/g, ' ') + '\n')
    child.stdin.end()
  })
}

function upsert(text, key, value) {
  const line = `${key}=${value}`
  const re = new RegExp(`^${key}=.*$`, 'm')
  return re.test(text) ? text.replace(re, line) : `${text.trimEnd()}\n${line}\n`
}

if (!existsSync(VARS)) {
  console.error('❌ .prod.vars not found. Run: cp .prod.vars.example .prod.vars')
  process.exit(1)
}

console.log('→ Driving Paddle dashboard via Aside (revoke strays → create key + token)…')
const out = await runAside(AUTOMATION)

const apiKey = out.match(/CAPTURED_API_KEY=(\S+)/)?.[1] ?? ''
const clientToken = out.match(/CAPTURED_CLIENT_TOKEN=(\S+)/)?.[1] ?? ''

let vars = readFileSync(VARS, 'utf8')
let wrote = []

if (/^(pdl_live_apikey_|live_)/.test(apiKey)) {
  vars = upsert(vars, 'PADDLE_API_KEY', apiKey)
  wrote.push(`PADDLE_API_KEY (${apiKey.length} chars)`)
} else {
  console.error('⚠ API key NOT captured. Aside tail:')
  console.error(out.split('\n').slice(-8).join('\n').replace(/(pdl_|live_)[A-Za-z0-9]+/g, '$1****'))
}

if (/^(live_|test_|pdl_)/.test(clientToken)) {
  vars = upsert(vars, 'NEXT_PUBLIC_PADDLE_CLIENT_TOKEN', clientToken)
  wrote.push(`NEXT_PUBLIC_PADDLE_CLIENT_TOKEN (${clientToken.length} chars)`)
} else {
  console.error('⚠ Client-side token NOT captured — create it manually in Paddle → Client-side tokens.')
}

if (wrote.length) {
  writeFileSync(VARS, vars)
  console.log('✓ Wrote to .prod.vars: ' + wrote.join(', '))
}

console.log(`\nDone. Still needed in .prod.vars before deploy:
  • PADDLE_WEBHOOK_SECRET + PADDLE_PRICE_* → run: PADDLE_LIVE_API_KEY=<paste> node scripts/paddle-live-setup.mjs
  • RESEND_API_KEY, TURNSTILE_SECRET_KEY, GEMINI_API_KEY (held secrets)
Then: ./scripts/set-prod-secrets.sh`)
