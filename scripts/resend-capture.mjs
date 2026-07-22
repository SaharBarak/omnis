#!/usr/bin/env node
/**
 * Capture a Resend API key into .prod.vars via the Aside browser.
 *
 * You must be signed in to resend.com in Aside (you are). Creates a Full-access
 * key named "pleiad-prod", reads its one-time reveal, writes RESEND_API_KEY into
 * ./.prod.vars. Prints ONLY a success flag + char count — never the secret.
 *
 *   node scripts/resend-capture.mjs
 */
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const VARS = join(ROOT, '.prod.vars')
const URL = 'https://resend.com/api-keys'

/* Newlines collapse to spaces before running in aside repl — NO // comments. */
const AUTOMATION = `
const p = await openTab(${JSON.stringify(URL)});
await sleep(6000);
if (!/resend\\.com\\/api-keys/.test(p.url())) { console.log('NOT_LOGGED_IN ' + p.url()); }
else {
  await p.evaluate(() => [...document.querySelectorAll('button,a')].find(x => /create api key/i.test(x.textContent))?.click());
  await sleep(2500);
  await p.evaluate(() => { const inp = document.querySelector('input[name="name"]'); const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; set.call(inp, 'pleiad-prod'); inp.dispatchEvent(new Event('input',{bubbles:true})); });
  await sleep(800);
  await p.evaluate(() => { const dlg = document.querySelector('[role=dialog]') || document; const b = [...dlg.querySelectorAll('button')].find(x => /^add/i.test(x.textContent.trim())); b && b.click(); });
  let key = null;
  for (let i = 0; i < 40 && !key; i++) {
    await sleep(400);
    try {
      key = await p.evaluate(() => {
        const rx = /re_[A-Za-z0-9_]{20,}/;
        for (const el of document.querySelectorAll('input, textarea, code, pre')) { const s = (el.value || el.textContent || ''); const m = s.match(rx); if (m) return m[0]; }
        const bm = document.body.innerText.match(rx); if (bm) return bm[0];
        return null;
      });
    } catch (e) {}
  }
  console.log('CAPTURED_RESEND=' + (key || ''));
}
`

function runAside(js) {
  return new Promise((resolve, reject) => {
    const child = spawn('aside', ['repl'], { stdio: ['pipe', 'pipe', 'pipe'] })
    let out = ''
    const kill = setTimeout(() => child.kill('SIGKILL'), 120_000)
    child.stdout.on('data', (d) => { out += d })
    child.stderr.on('data', (d) => { out += d })
    child.on('error', reject)
    child.on('close', () => { clearTimeout(kill); resolve(out) })
    child.stdin.write(js.replace(/\n/g, ' ') + '\n')
    child.stdin.end()
  })
}

if (!existsSync(VARS)) {
  console.error('❌ .prod.vars not found.')
  process.exit(1)
}

console.log('→ Creating Resend API key via Aside…')
const out = await runAside(AUTOMATION)

if (/NOT_LOGGED_IN/.test(out)) {
  console.error('❌ Not signed in to resend.com in Aside.')
  process.exit(1)
}

const key = out.match(/CAPTURED_RESEND=(re_\S+)/)?.[1] ?? ''
if (!/^re_/.test(key)) {
  console.error('⚠ Key NOT captured. Aside tail:', out.split('\n').slice(-6).join(' ').replace(/re_[A-Za-z0-9_]+/g, 're_****'))
  process.exit(1)
}

const re = /^RESEND_API_KEY=.*$/m
const line = `RESEND_API_KEY=${key}`
let vars = readFileSync(VARS, 'utf8')
vars = re.test(vars) ? vars.replace(re, line) : `${vars.trimEnd()}\n${line}\n`
writeFileSync(VARS, vars)
console.log(`✓ Wrote RESEND_API_KEY to .prod.vars (${key.length} chars, prefix ${key.slice(0, 3)}).`)
