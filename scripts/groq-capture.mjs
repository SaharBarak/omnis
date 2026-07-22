#!/usr/bin/env node
/**
 * Capture a free Groq LIVE API key into .prod.vars.
 *
 * Drives the Groq console through the Aside browser (you must be signed in to
 * console.groq.com in Aside — the login was completed already). Reads the key
 * from its one-time reveal and writes GROQ_API_KEY straight into ./.prod.vars
 * (gitignored). Prints ONLY a success flag + char count — never the secret.
 *
 *   node scripts/groq-capture.mjs
 *
 * Idempotent-ish: creates a key named "pleiad-prod". Re-running makes another;
 * delete extras in the Groq console if needed.
 */
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const VARS = join(ROOT, '.prod.vars')
const URL = 'https://console.groq.com/keys'

/* Newlines are collapsed to spaces before running in `aside repl`, so the
   automation body must contain NO // line comments. */
const AUTOMATION = `
const p = await openTab(${JSON.stringify(URL)});
await sleep(6000);
if (!/console\\.groq\\.com\\/keys/.test(p.url())) { console.log('NOT_LOGGED_IN ' + p.url()); }
else {
  await p.evaluate(() => [...document.querySelectorAll('button,a')].find(x => /create api key/i.test(x.textContent))?.click());
  await sleep(2500);
  await p.evaluate(() => { const inp = document.querySelector('input[name="keyName"]'); const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set; set.call(inp, 'pleiad-prod'); inp.dispatchEvent(new Event('input',{bubbles:true})); });
  for (let i = 0; i < 20; i++) { const ok = await p.evaluate(() => { const t = document.querySelector('input[name="cf-turnstile-response"]'); return !!(t && t.value); }); if (ok) break; await sleep(600); }
  await p.evaluate(() => { const dlg = document.querySelector('[role=dialog]') || document; [...dlg.querySelectorAll('button')].find(b => b.textContent.trim() === 'Submit')?.click(); });
  let key = null;
  for (let i = 0; i < 40 && !key; i++) {
    await sleep(400);
    try {
      key = await p.evaluate(() => {
        const rx = /gsk_[A-Za-z0-9]{20,}/;
        for (const el of document.querySelectorAll('input, textarea')) { const m = (el.value || '').match(rx); if (m) return m[0]; }
        const bm = document.body.innerText.match(rx); if (bm) return bm[0];
        return null;
      });
    } catch (e) {}
  }
  if (!key) {
    try {
      key = await p.evaluate(async () => {
        const b = [...document.querySelectorAll('button')].find(x => /copy/i.test(x.textContent) || /copy/i.test(x.getAttribute('aria-label') || ''));
        if (!b) return null;
        b.click();
        await new Promise(r => setTimeout(r, 700));
        try { const t = await navigator.clipboard.readText(); return /^gsk_/.test(t) ? t : null; } catch (e) { return null; }
      });
    } catch (e) {}
  }
  console.log('CAPTURED_GROQ_KEY=' + (key || ''));
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

function upsert(text, key, value) {
  const re = new RegExp(`^${key}=.*$`, 'm')
  const line = `${key}=${value}`
  return re.test(text) ? text.replace(re, line) : `${text.trimEnd()}\n${line}\n`
}

if (!existsSync(VARS)) {
  console.error('❌ .prod.vars not found. Run: cp .prod.vars.example .prod.vars')
  process.exit(1)
}

console.log('→ Creating Groq API key via Aside…')
const out = await runAside(AUTOMATION)

if (/NOT_LOGGED_IN/.test(out)) {
  console.error('❌ Not signed in to console.groq.com in Aside. Open it in Aside and log in, then re-run.')
  process.exit(1)
}

const key = out.match(/CAPTURED_GROQ_KEY=(gsk_\S+)/)?.[1] ?? ''
if (!/^gsk_/.test(key)) {
  console.error('⚠ Key NOT captured. The reveal modal may differ or Turnstile blocked submit.')
  console.error('  Aside tail:', out.split('\n').slice(-6).join(' ').replace(/gsk_[A-Za-z0-9]+/g, 'gsk_****'))
  process.exit(1)
}

const vars = upsert(readFileSync(VARS, 'utf8'), 'GROQ_API_KEY', key)
writeFileSync(VARS, vars)
console.log(`✓ Wrote GROQ_API_KEY to .prod.vars (${key.length} chars). LLM_PROVIDER=groq is already set.`)
