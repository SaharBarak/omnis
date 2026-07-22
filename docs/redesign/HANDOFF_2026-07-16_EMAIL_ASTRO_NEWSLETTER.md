# Handoff — Email layer, astro phenomena, newsletter→Resend, mobile push (2026-07-16)

Long session. Five threads: the mobile map drag-to-pin landed, an IG reel became a
playbook, the pre-deploy playbook was run against Pleiad, the whole email layer was
rebuilt + proven live, and daily astro phenomena now flow into email + push.

> ⚠️ **Two commits are UNPUSHED**: `9d9fb58` and `695f674`. `origin/redesign/knowledge-experience`
> is at `b8dd1f2`. Push them (`git push origin redesign/knowledge-experience`) or they're
> only on this machine.

---

## 1. Commits this session (branch `redesign/knowledge-experience`)

| Commit | What | Pushed? |
|---|---|---|
| `f0aac29` | **mobile**: M3 redesign + system glyphs + **map drag-to-pin**, squashed as one verified unit (211 files) | ✅ |
| `4bf32e1` | **email**: shared branded template layer, on-brand mail, deliverability headers | ✅ |
| `9d9fb58` | **engine+email**: `getDailyAstroPhenomena` + newsletter→Resend-audience sync + astro in daily-kin email | ❌ **unpushed** |
| `695f674` | **notifications**: reach mobile push users (channel fix) + astro in digest & push | ❌ **unpushed** |

`bfc1ba4`, `b8dd1f2`, `fd3900a`, `e6ea6b0` are **other sessions'** commits interleaved on
this same branch — it is shared. Commit by explicit path, never `git add -A`.

---

## 2. Map drag-to-pin — DONE, committed, NOT live-walked

Drag a star → it pins where dropped (sim holds it fixed like the self star; the rest
reflow around it). Double-tap toggles a pin. Pinned stars wear a secondary ring. A hint
("Drag a star to keep it in place") fades once anything is pinned.

- Persistence = **local, pinned-nodes only**, `{personId:{x,y}}` in **expo-secure-store**
  keyed by userId (`packages/mobile/src/lib/map/layout-store.ts`). Chose local over the
  boards API (mobile boards client is read-only); secure-store is already native in the
  dev build → **no rebuild**, and pinned-only keeps the payload under the ~2KB Android cap
  (capped at 48).
- `use-force-layout.ts` reworked: rAF loop lifted to refs so pin/unpin/drag can restart it;
  `applyFixed()` pulls a fixed node's live position each frame; loop stays warm at
  `DRAG_ALPHA` during a drag; reduced-motion re-settles synchronously. `simulation.ts`
  untouched (already honored `pinned`).
- Verified: tsc 0, eslint 0/0, 1117 tests, full `expo export` clean (worklets + React
  Compiler + Hermes). **Live finger-drag walk NOT done** — the dev build re-gates to login
  and I can't sign in as the user. Emulator boots fine (`pleiad` AVD, `-dns-server 8.8.8.8`).

## 3. Skills-and-workflows repo — reel → playbook (done, nothing owed)

IG reel `DYSOYhQtDBX` by **Mohamad Al Sayed (@sayed.developer)** transcribed **locally**
(yt-dlp `--cookies-from-browser chrome` + faster-whisper small/int8). It's a 43s pre-deploy
readiness drill (9 gates).

**A parallel run of yours had already pushed the same work** to `SaharBarak/skills-and-workflows`
(`playbooks/pre-deploy-readiness.md` + `transcriptions/deployment-readiness-checklist.md`).
Per your call: **kept theirs, dropped mine**. That repo is clean at `origin/main`, nothing owed.

## 4. Pre-deploy playbook run against Pleiad — 6 PASS, 2 GAP

Stack reality: **Cloudflare Workers via OpenNext** (not Vercel), Drizzle→Postgres direct
(**RLS off by design** — isolation is 100% app-layer `owner_id` filters), Supabase auth.

PASS: tenant isolation (app-layer, no DB net — worth a live A-reads-B test), token expiry
(otp 1800s), input sanitization, API origin (no CORS, all 37 routes self-auth), rate
limiting (CF KV shared store), error handling, DB indexes.

**GAP 8 — logging/monitoring**: PostHog client-only, **no error tracker, no server logger**
(bare `console.error` → ephemeral Workers logs), no health route. *(Partly addressed since:
`bfc1ba4` added critical-error alert emails — another session's commit.)*
**GAP 9 — rollback**: platform rollback is unblocked (migrations are manual, not in build),
but `drizzle/0002_billing_provider_rename.sql` **renames** paddle_*→billing_* columns, so a
code rollback past it breaks billing. No runbook. Confirm whether 0002 is applied to prod.

---

## 5. Email — the big one

### Who triggers what (the answer to "who/when/why")

Scheduling is a **separate Cloudflare Worker** `workers/cron/` (`npm run deploy:cron`) that
calls the CRON_SECRET-gated Next routes. The "Vercel Cron" comments in the routes are **stale**.

| Email | Trigger | When | Recipients |
|---|---|---|---|
| Contact relay | user submits form | on submit | team inbox (replyTo=sender) |
| Newsletter welcome | new signup only | on subscribe | the subscriber |
| **Daily Kin blast** | cron worker | **06:00 UTC** | all confirmed newsletter subs |
| **Daily digest** | cron worker | **08:00 UTC** | app users w/ digest on (also fires push) |
| Event notification | *nothing* | — | **dead code, no callers** |
| Test notification | user taps test | on tap | self |
| Critical error alert | unhandled 500 | throttled 1/10min | `ALERT_EMAIL` |

`daily-predictions` (04:00 UTC) **computes+stores only, sends nothing** — it's the feed the
08:00 digest reads.

### Resend truth (corrects the cutover doc)

**`pleiad.io` is ALREADY verified** — domain `b09bc5f6-c2d2-48b0-966b-c7bc871a8bb6`,
us-east-1. DKIM `resend._domainkey` ✓, SPF `TXT send` ✓, MX `send` ✓; DMARC on the zone is
`v=DMARC1; p=none` (present → satisfies the bulk-sender rule). **`docs/playbooks/production-cutover.md`
is WRONG** to list domain verification as a pending human step. Check the API, not the doc.

- **Live sends proven twice** (HTTP 200): a template test and a real astro daily-kin preview.
- Drive Resend **via `curl`** — the API sits behind Cloudflare and **python-urllib gets 403
  code 1010**. `RESEND_API_KEY` is in `.prod.vars`; `CLOUDFLARE_API_TOKEN` there is **EMPTY**.

### What was built

- `src/lib/email/` — one branded shell (`layout.ts` `renderEmail`, colours from
  `landing-tokens` COLORS, brand `#7D5BC9`, killing the stale gold `#c9a55c`), `send.ts`
  (`sendMarketingEmail`/`sendTransactionalEmail`: one Resend client, error handling, RFC 8058
  `List-Unsubscribe` + one-click POST on bulk), `from.ts` (`EMAIL_FROM` +
  `EMAIL_FROM_MARKETING` for an optional marketing subdomain), `unsubscribe.ts` (one shared
  HMAC one-click URL builder), `audience.ts` (Resend Audience sync).
- Fixed: the welcome mail's **static `/unsubscribe`** → signed one-click. User-supplied names
  now HTML-escaped. Contact route stays plain-text internal ops mail (correct as-is).
- **Resend Audience created live**: **"Pleiad Daily Kin" → `a6d3ae26-c6e9-40f3-886b-b226d645a670`**.
  `RESEND_AUDIENCE_ID` appended to `.prod.vars` + `.env.local` (both gitignored); documented in
  `.env.example`. Subscribe mirrors (add/reactivate), both unsubscribe paths mirror (suppress).
  Best-effort — never blocks the DB write. **Newsletter source of truth stays Postgres**;
  Resend is a mirror. Broadcasts migration NOT done (daily-kin still self-hosts the fan-out).

## 6. Astro phenomena — new engine service

`packages/engine/src/services/astro-phenomena.ts` → `getDailyAstroPhenomena(date)` returns
`{moon{phase,illumination,daysToFull,daysToNew}, sun, retrogrades[], aspects[], transitions[], summary}`.
Built from existing ephemeris fns (`getLunation`, `getCurrentPlanetaryPositions`,
`calculateNatalChart().aspects`), plus a 2-date diff for transitions (retrograde
stations, sign ingress, **cardinal-only** moon phases). 7 tests. Verified real output for
2026-07-16: *Waxing Crescent 6% lit · Mercury, Neptune, Pluto retrograde · Sun in Cancer*.

**Deliberately NOT built**: eclipses (needs node-distance-at-syzygy), exact next new/full
dates, personal transit-to-natal (`Transit`/`TransitReport` types exist, nothing emits them).
Also: `PredictionType` declares `'transit'|'retrograde'` and nothing emits them — the astro
service is standalone, it does **not** yet feed the `PredictionEvent` pipeline.

Wired into: daily-kin email ("Sky today" block + astro preheader), digest email (compact
`astro.summary` line), push body (kin + moon phase).

## 7. Mobile push — the channel fix (`695f674`)

**The bug**: the push fan-out reused the *email* digest recipient query
(`channels @> ['email']`), but the mobile settings screen only ever sets `dailyDigest`, never
`channels` (stays default `['in-app']`). So a push-only mobile user got **neither** email nor
push — despite the opt-in sheet promising "today's kin, the moon…".

**The fix**: `listAllEnabledDigestRecipients` now returns every enabled daily-digest user
regardless of channel, carrying each user's `channels`; the hour-gate drops the email filter
too; `processDailyDigestNotifications` sends **email only if `channels.includes('email')`** but
**always** builds a push draft (push is gated downstream on having a device token). Dead
`channelsInclude` helper removed. Token registration/opt-in/delivery were already fully wired.

---

## 8. Website — BUILT but UNCOMMITTED (on purpose)

`DownloadCta` + `NewsletterSignup` (`src/components/landing-v2/`), slotted into `page.tsx`
after `PricingV2`. App is **pre-launch** (user confirmed) → section is **"coming soon"** and
reuses the existing `GetTheApp` + `src/lib/store-links.ts`, which light up automatically once
`NEXT_PUBLIC_APP_STORE_URL`/`PLAY_STORE_URL` are set — **no dead links ship**. The signup posts
to `/api/newsletter/subscribe` (→ Resend audience), Turnstile-gated (no-op unconfigured).

**Why uncommitted**: `page.tsx` and `landing-v2/index.ts` are mid-rewrite by the parallel
**site-unification session** (−185 lines, old homepage being torn out). My wiring can't be split
from their WIP. 4 files ride along with their 144-file dirty set — they commit as one unit.
tsc 0 / eslint 0 on all of it.

## 9. OPEN / next

1. **Push `9d9fb58` + `695f674`.**
2. **Security review of the email flows is RUNNING and never reported** (agent
   `a3c3765ec0757b709`, resumed from transcript). It covers: XSS in email templates, unsubscribe
   HMAC (constant-time? forgeable?), the broadened digest query (cross-user leak?), header
   injection, email-bombing/open-redirect, secret leakage. **Get its findings before trusting
   the email layer.** Re-run if lost.
3. Live-walk the map drag (needs a real sign-in on the emulator).
4. Optional email: verified **marketing subdomain** → set `EMAIL_FROM_MARKETING`; tighten DMARC
   `p=none`→`p=quarantine`; set `EMAIL_POSTAL_ADDRESS` (CAN-SPAM footer renders only when set).
5. **Dead code** to kill or wire: `sendEventNotificationEmail` (no callers); newsletter
   **double opt-in** (`confirm()`, `/confirm` route, `listActiveSubscribers`,
   `preferences.daily_kin` filter all exist, all unused — `subscribe()` sets `confirmed:true`
   immediately). Left as single opt-in; enabling double opt-in is a product call.
6. Gate 8/9 from the pre-deploy audit (error tracker + health route; the `0002` rename rollback trap).
7. `processDailyDigestNotifications` ignores each user's chosen `daily_digest_time` — once the
   hour-gate matches it sends to everyone. Pre-existing.
