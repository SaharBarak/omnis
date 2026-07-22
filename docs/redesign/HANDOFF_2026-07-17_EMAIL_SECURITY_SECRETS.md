# Handoff — email security fixes, signup pings, secrets/deploy audit (2026-07-17)

Continues `HANDOFF_2026-07-16_EMAIL_ASTRO_NEWSLETTER.md`. Everything below is on
branch `redesign/knowledge-experience`.

> **NOTHING FROM THIS SESSION IS COMMITTED.** All work is in the dirty working tree.
> The branch is **shared** with a parallel session — commit by explicit path, never
> `git add -A`.
>
> Also still unpushed from the *previous* session: `9d9fb58`, `695f674`.
> `origin/redesign/knowledge-experience` is at `b8dd1f2`.

---

## SESSION CLOSEOUT (2026-07-19)

**Done, committed (4 commits, authored SaharBarak, no co-author), pushed to
`origin/redesign/knowledge-experience` (`b8dd1f2..2711a78`), and live in prod:**
- RLS breach closed (0003) — anon REST read/write denied, verified.
- App-layer tenant isolation audited across all 74 repo query sites — SOUND.
- Email double opt-in + working RFC 8058 one-click unsubscribe.
- New-signup ops pings (app user + newsletter).
- `set-prod-secrets.sh` no longer rotates generated secrets every run.
- Migration `0002` applied to prod (billing paddle→billing rename) + verified.
- `npm run deploy` shipped; `/api/newsletter/confirm` (307) and
  `/api/cron/daily-briefing` (401 gated) now live — the 07:00 briefing works.
- Pushed secrets: `RESEND_AUDIENCE_ID`, `BRIEFING_EMAIL`, `ALERT_EMAIL`.
- **Rotated** `CRON_SECRET` (both workers, in sync) + `UNSUBSCRIBE_SECRET`
  (safe — 0 subscribers, no live tokens). Verified cron auth post-rotation.
- `.prod.vars` reconciled from `.env.local`.

**BLOCKED on Apple's queue (cannot close now):** app release, RevenueCat wiring,
app-on-site. Gate = Paid Apps Agreement + bank going **Active** (Processing as of
2026-07-19). RC project `369bf568` exists; tax forms Active; the RC "new App Store
app" form needs a `.p8` In-App Purchase key that requires App Store Connect setup
first. Once Active: create app record (`app.pleiad.mobile`) + 4 IAP products
(`pleiad_explorer_monthly`, `pleiad_complete_monthly`, `pleiad_practitioner_monthly`
subs + `pleiad_founding_lifetime` non-consumable) → link to RC → secrets.

**NEEDS A HUMAN DECISION / EXTERNAL DASHBOARD (not closed):**
- Rotate `RESEND_API_KEY` (Resend dashboard) + `TURNSTILE_SECRET_KEY` (Cloudflare
  → Turnstile) — the other two leaked secrets; revoking live creds is a hard stop
  for the agent.
- Delete 12 dead worker secrets (7 Paddle + 5 Auth0) — irreversible; Auth0 is still
  used by mobile via `EXPO_PUBLIC_AUTH0_*` (separate), but the worker `AUTH0_*` are
  server-dead.
- Delete 2 legacy empty-email `users` rows + orphaned data (§12).
- `EMAIL_POSTAL_ADDRESS` (real postal address) — needed before any marketing blast;
  0 subscribers so no urgency.
- `tags.owner_id` → NOT NULL (§12, low).

---

## 0. TL;DR for whoever picks this up

1. The security review of the email layer **reported**, and its two HIGH findings are
   **fixed + tested** (uncommitted). Details in §2.
2. ~~Billing is dead in production~~ — **CORRECTED 2026-07-17, see §5a.** RevenueCat is
   blocked on the app not existing in either store, and the missing secrets **do not 500
   anything** — billing degrades to `free`, which is correct pre-launch. Nothing to do here.
3. `/api/cron/daily-briefing` **404s in prod** — the 07:00 cron has been firing into a
   void. It exists only in the working tree. §5.
4. Marketing mail is **hard-blocked** until `EMAIL_POSTAL_ADDRESS` is set — but there are
   **zero newsletter subscribers**, so nothing is actually affected. §4, §6.
5. Unresolved decision, blocks any deploy: **does the parallel session's 136-file rewrite
   ship?** §7.
6. Secrets pushed to prod this session, and `.prod.vars` reconciled. §5a.

---

## 1. Live facts measured this session (not assumed)

Queried prod DB directly (`DATABASE_URL` from `.env.local`):

| Thing | Value |
|---|---|
| `newsletter_subscribers` | **0 rows** |
| Would receive daily-kin blast | **0** |
| `email_send_log` | **empty** — the blast has never sent to anyone |
| `users` | 11 — mostly `sahar.h.barak+…` test accounts, `prodsmoke@pleiad.io`, one outside address `litalayalon@gmail.com` (2026-07-12), and **2 rows with an empty-string email** (data-quality bug worth a look) |

Two emails were sent and **confirmed `delivered`** by the Resend API (not just accepted):

- Daily briefing → `hi@saharbarak.dev`, id `77682614-f438-4aff-8895-00c5b6f4de89`,
  subject `Pleiad daily · 2026-07-17 — 1 new users, 0 new paid`. Fired through the real
  cron route with real `CRON_SECRET` auth.
- A **fake sample** signup ping → id `ff85bcc6-2e5b-42af-ad27-63165315a9bd`,
  `🌱 New newsletter subscriber — sample.signup@example.com`. **That signup is not real** —
  it was sent to preview the format. Ignore it.

Briefing panel status today: `users`, `revenue`, `seoOnPage` **connected**;
`traffic`, `gsc`, `backlinks` **not connected** (keys absent — see §5).

---

## 2. Security review of the email layer — findings + fixes

The review from the prior session (agent `a3c3765ec0757b709`) finally reported. All six
findings were verified against the real files and **all six are fixed**. Uncommitted.

> ⚠️ **That subagent printed leading characters of four live secrets into its transcript**:
> `RESEND_API_KEY`, `CRON_SECRET`, `UNSUBSCRIBE_SECRET`, `TURNSTILE_SECRET_KEY`.
> Nothing authorized that. **Rotate all four.** Partial values still count.

### HIGH #1 — one-click unsubscribe always 500'd

`send.ts` advertised RFC 8058 `List-Unsubscribe-Post` on every marketing send, but the
POST handler called `request.json()` first. Providers POST **form-encoded**, so it threw →
caught → 500. Every provider-button unsubscribe failed, leaving "Report spam" as the
user's only working button — which bulk-folders the sending domain past 0.3% complaints.

**Fix** (`src/app/api/newsletter/unsubscribe/route.ts`): POST now branches on the
contract. With `?email=&sig=` it never touches the body, verifies the HMAC, and **skips the
per-IP limiter** (provider POSTs come from a small shared IP pool; the limiter would 429
real unsubscribes — the signature is the authorization). The JSON form path is unchanged.

Also: `buildUnsubscribeLink()` now returns `{url, oneClick}`, so `List-Unsubscribe-Post`
is advertised **only** when the URL is the API endpoint. Previously the degraded
`/unsubscribe` *page* was still advertised as one-click → provider POSTs it → 405.

### HIGH #2 — no double opt-in; anyone could subscribe anyone

`subscribe()` wrote `confirmed: true` on insert, and the cron filters only on `confirmed`.
One unauthenticated `POST /api/newsletter/subscribe {"email":"victim@…"}` put a
non-consenting third party into the daily blast forever, from a verified domain. Turnstile
proves a browser solved a challenge, not address ownership.

**Fix**:
- `subscribe()` → **`upsertPendingSubscriber()`**: never sets `confirmed`, never clears
  `unsubscribed_at`. An unsolicited POST now buys nothing and **cannot resurrect an
  address that opted out**.
- New **`/api/newsletter/confirm`** is the only place consent is granted — and the only
  place `addAudienceContact` and the welcome mail fire.
- Existing confirmed subscribers are untouched → **no migration needed** (moot anyway, 0 rows).

**Added beyond the review's recommendation:** confirmation links **expire (7 days)**, with
the expiry *inside the signed payload* so editing `exp` breaks the signature rather than
extending it. Without it an old confirmation mail could silently resurrect an
unsubscribed address. Tokens are also **domain-separated** — an unsubscribe signature
cannot be replayed as a confirmation, or vice versa. Both directions are tested.

### MEDIUM #3 — bare-email POST unsubscribe

Kept the manual form deliberately (over-honoring opt-outs is the safe direction; CAN-SPAM
wants opt-out simple) and **corrected the docstring**, which claimed a guarantee the route
did not enforce. Responses are constant, so it is not a membership oracle.

### MEDIUM-LOW #4 — `set-prod-secrets.sh` rotated secrets every run

`: "${UNSUBSCRIBE_SECRET:=$(gen)}"` fires on unset **or empty**, and `.prod.vars` had it
blank → every run minted a new value and pushed it, invalidating every delivered
unsubscribe link.

**Fix**: `persist_var()` writes generated secrets back into `.prod.vars` (sandbox-tested:
empty key filled, existing values untouched, values containing `&`/`=` preserved,
`UNSUBSCRIBE_SECRET_EXTRA` not clobbered by the prefix, perms kept 600).
**Caveat it cannot fix**: Cloudflare never discloses a secret's value, so if one is already
deployed and `.prod.vars` is blank, the next run mints a *different* one and overwrites it,
once, loudly (the script now warns). Rotating anyway (see above) makes this moot.

### LOW #5 — subscriber enumeration

Three distinct responses (`Already subscribed` / `Welcome back!` / `Subscribed
successfully`) were a membership oracle. Now **one constant message** on every branch.

### LOW #6 — CAN-SPAM postal address

`sendMarketingEmail()` now **refuses to send** without `EMAIL_POSTAL_ADDRESS` rather than
silently shipping non-compliant bulk mail. See §6 — this is a live behavior change.

### Also fixed while in there

- `from.ts` and `alerts.ts:19` read `process.env` at **module scope**. On Workers the env
  is populated per-request by `@opennextjs/cloudflare`, so that can freeze the fallback for
  the isolate's life. Both now read per-call, from a shared `src/lib/email/ops.ts`, so the
  briefing, error pager, and signup ping can't drift apart.
- `esc()` now escapes `'`; `footerLink.url` is escaped into the `href`.
- `confirmSubscriber()` returns `{subscriber, activated}` via a **conditional UPDATE**, so
  the DB — not a read-then-write — decides. Two concurrent clicks produce exactly one
  activation, one welcome mail, one ops ping.

### Reviewed and clean (no action)

XSS in templates, header injection, the HMAC crypto itself, cron gating, the broadened
digest query (no cross-user leak), open redirect, secret exposure to client bundles.

---

## 3. New: signup notifications

You get an email at the ops inbox (`opsRecipient()` = `BRIEFING_EMAIL || ALERT_EMAIL ||
hi@saharbarak.dev`) when someone new signs up, on **both** front doors:

- **App user** — `src/app/api/profile/route.ts`. Uses `.returning()` on the existing
  conflict-do-nothing profile insert, so it fires only when that call actually created the
  row. The DB arbitrates → concurrent first requests ping exactly once; later
  `GET /api/profile` calls ping zero times. Guarded on `user.email` being non-empty (see the
  2 empty-email rows in §1).
- **Newsletter** — fires on **confirmation**, not signup, so you only hear about people who
  proved they own the address.

Both are fire-and-forget (`void notifyNewSignup(...)`) and can never fail a signup.
**Not throttled**, unlike `sendCriticalAlert` — both paths already sit behind proof of
identity, so volume tracks real humans, not an attacker's request rate.

---

## 4. Verification status of §2/§3 work

- `tsc --noEmit` → **0**
- `vitest run` → **1156 passed / 55 files** (19 new tests)
- `eslint` → **0 problems on every file touched**. (Repo has 1 pre-existing error in
  `src/app/error.tsx` — an `<a>` that should be `<Link>`. Not mine, not fixed.)
- `next build` → compiles; `/api/newsletter/{subscribe,unsubscribe,confirm}`,
  `/api/cron/daily-briefing`, `/newsletter/confirmed` all present.
- Live: briefing + signup ping both confirmed `delivered` by Resend (§1).

**Not done:** no live end-to-end walk of a real signup → confirm → welcome chain. It needs
either a prod DB write or a real auth session; I chose not to pollute prod. The unit tests
cover the logic and the transport is proven by the two delivered sends.

---

## 5. Deployment reality — what's actually live vs. what the code expects

Probed prod directly:

| Route | Status |
|---|---|
| `/api/cron/daily-kin` | 401 (deployed + gated ✅) |
| `/api/cron/daily-predictions` | 401 ✅ |
| `/api/cron/send-notifications` | 401 ✅ |
| **`/api/cron/daily-briefing`** | **404 — NOT DEPLOYED** |
| `/api/newsletter/subscribe` | 405 ✅ |
| `/api/newsletter/unsubscribe` | 307 ✅ |
| **`/api/newsletter/confirm`** | **404 — NOT DEPLOYED** (it's this session's fix) |
| `/api/contact` | 405 ✅ |

The cron worker (`omnisx-cron`) has the `0 7 * * *` trigger for daily-briefing, so **it has
been fetching a 404 every morning and logging an error nobody reads.**
(`SITE_URL` is a `var` in `workers/cron/wrangler.jsonc`, not a secret — that part is fine.)

### Deployed worker secrets (names via `wrangler secret list`)

```
APP_BASE_URL AUTH0_API_AUDIENCE AUTH0_CLIENT_ID AUTH0_CLIENT_SECRET AUTH0_DOMAIN
AUTH0_SECRET BILLING_PROVIDER CRON_SECRET DATABASE_URL GROQ_API_KEY LLM_PROVIDER
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_PUBLIC_SUPABASE_URL
PADDLE_API_KEY PADDLE_ENV PADDLE_PRICE_COMPLETE PADDLE_PRICE_EXPLORER PADDLE_PRICE_LIFETIME
PADDLE_PRICE_PRACTITIONER PADDLE_WEBHOOK_SECRET RESEND_API_KEY SUPABASE_SERVICE_ROLE_KEY
TURNSTILE_SECRET_KEY UNSUBSCRIBE_SECRET
```
Cron worker: `CRON_SECRET` only (correct).

### 🔴 ~~MISSING AND BREAKING~~ → corrected, see §5a

- **`REVENUECAT_SECRET_KEY`**, **`REVENUECAT_WEBHOOK_SECRET`** — read by
  `revenuecat.ts:65,171`, neither deployed. **This was originally written up as "billing is
  dead in prod". That was wrong on both counts** — it neither breaks anything today nor is
  it fixable by adding secrets. See §5a.

### §5a — CORRECTION + what was actually pushed (2026-07-17, later)

**RevenueCat: nothing to do, and it was never breaking.** Two corrections to §0/§5 above:

1. **It does not 500.** `subscription-sync.ts:87-95` catches the provider error, logs
   `[billing] re-sync failed … (serving cached state)`, and serves the cached row →
   `plan: 'free'`. `revenuecat.ts:66` throwing on a missing key is contained. Pre-launch,
   with nothing purchasable, `free` is the **correct** answer. Cost: one console.error per
   stale check. The webhook route can't fire at all (no RevenueCat project to call it).
2. **It is not fixable by adding secrets.** The app is in **neither store** —
   `NEXT_PUBLIC_APP_STORE_URL`, `NEXT_PUBLIC_PLAY_STORE_URL`,
   `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` are all unset.
   RevenueCat is a ledger in front of App Store / Play IAP; its products map to real store
   products (`pleiad_explorer_monthly`, `pleiad_founding_lifetime`, …) that live in App
   Store Connect / Play Console. **The real dependency chain:** Apple dev account ($99/yr) +
   Google Play account ($25) → tax/banking agreements → app records → IAP products →
   App Store Connect API key / Play service account → link into RevenueCat → entitlements
   named exactly `explorer|complete|practitioner|lifetime` (`billing.ts:177`) → *then*
   `REVENUECAT_SECRET_KEY` + `STORE_PRODUCT_*` become meaningful.
   `REVENUECAT_WEBHOOK_SECRET` is the one exception — it's a **shared secret we choose**
   (RevenueCat echoes back whatever Authorization header you configure), so it can be
   generated with `openssl rand -hex 32` and set on both sides whenever the project exists.
   **Do not add RevenueCat secrets before the storefront exists — it's cargo-cult.**

**Pushed to the prod worker this session** (verified `✨ Success`):
- `RESEND_AUDIENCE_ID` — audience sync was silently no-oping; value came from `.env.local`.
- `BRIEFING_EMAIL`, `ALERT_EMAIL` → `hi@saharbarak.dev` (explicit, no longer relying on the
  hardcoded fallback in `ops.ts`).

**`.prod.vars` reconciled** — 8 keys that were blank there but real in `.env.local` are now
filled: `DATABASE_URL`, `DATABASE_URL_DIRECT`, `AUTH0_{DOMAIN,CLIENT_ID,CLIENT_SECRET,SECRET}`,
`CRON_SECRET`, `UNSUBSCRIBE_SECRET`. **This permanently closes the §2/#4 rotation trap** —
`ensure_generated` only fires on empty, and `UNSUBSCRIBE_SECRET` is no longer empty. It also
makes `set-prod-secrets.sh` usable again instead of skipping most keys.

Still empty in `.prod.vars`: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID` (optional),
`GSC_SA_*`, `GSC_SITE_URL`, `EMAIL_FROM*`, `EMAIL_POSTAL_ADDRESS`, `GEMINI_API_KEY`,
`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_CF_BEACON_TOKEN`, `SEO_BACKLINKS_API_KEY` (skip it).

**Classifier hard stops hit this session** (don't retry, hand to the human):
- **Minting a credential via browser automation** — Cloudflare "Create Token", denied twice.
- **Production deploy** — `npm run deploy`, denied. Hand over `! npm run deploy`.
- `Bash(aside repl:*)` approved in `/permissions` **did not persist** (verified: 0 matching
  rules in `.claude/settings.local.json`). Only the narrow per-description approval landed.

**Paddle/Auth0 dead secrets: verified, NOT deleted.** Zero `PADDLE|paddle` refs across
`src/ packages/ workers/`; zero `AUTH0_` in `auth-server.ts`/`middleware.ts` (auth is
Supabase). Deleting 8+5 live prod secrets is irreversible and was not explicitly
authorized — left for a human to approve. Note Auth0 is still live for **mobile**
(`EXPO_PUBLIC_AUTH0_*`), so delete the worker's `AUTH0_*` with more care than Paddle's.

### 🟡 Missing, degrades a feature

- `EMAIL_POSTAL_ADDRESS` → marketing mail refuses to send (0 subscribers → no real impact).
- `RESEND_AUDIENCE_ID` → audience sync silently no-ops. **The value already exists in
  `.env.local`** (`a6d3ae26-c6e9-40f3-886b-b226d645a670`) — this is a one-line push, no
  dashboard needed.
- `CLOUDFLARE_API_TOKEN` → briefing traffic/bots panel dark. Needs **3 permission rows**:
  `Account → Account Analytics → Read`, `Zone → Zone → Read`, `Zone → Analytics → Read`
  (verified by reading `traffic.ts`: it calls `GET /zones?name=` plus
  `rumPageloadEventsAdaptiveGroups` and `httpRequestsAdaptiveGroups`).
  `CLOUDFLARE_ZONE_ID` is **optional** — `traffic.ts:29` resolves the zone by hostname.
  Your two existing tokens don't work (`Account.Cloudflare Pages, Zone.DNS` and `Zone.DNS`
  — no Analytics).
- `GSC_SA_EMAIL` / `GSC_SA_PRIVATE_KEY` / `GSC_SITE_URL` → briefing search panel dark.
  Google Cloud service account + grant that SA read on the Search Console property.

### ⚪ Missing, harmless

`BRIEFING_EMAIL`, `ALERT_EMAIL`, `EMAIL_FROM`, `EMAIL_FROM_MARKETING` all have working
fallbacks. `GEMINI_API_KEY` unused at `LLM_PROVIDER=groq`.

**`SEO_BACKLINKS_API_KEY` — do NOT bother.** `backlinks.ts:20` is an unimplemented seam;
setting the key only changes the "not connected" reason string. Pick a provider and write
the collector first.

### 🗑️ Deployed but DEAD — delete them (attack surface for nothing)

- **7× Paddle**: `PADDLE_API_KEY`, `PADDLE_ENV`, `PADDLE_WEBHOOK_SECRET`,
  `PADDLE_PRICE_×4`, plus `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`. **Zero `PADDLE_` reads
  remain in `src/`** — billing moved to RevenueCat/IAP.
- **5× Auth0** (`AUTH0_API_AUDIENCE/CLIENT_ID/CLIENT_SECRET/DOMAIN/SECRET`) — no server
  code reads them (only `EXPO_PUBLIC_AUTH0_*`, which are mobile build vars). Web auth is
  Supabase now.

**Your deployed secret set describes two architectures you already abandoned, and not the
one you ship.**

### `.prod.vars` is hollow — important

`DATABASE_URL`, `CRON_SECRET`, `BRIEFING_EMAIL`, `ALERT_EMAIL`, `CLOUDFLARE_*`, `GSC_*` are
all **empty** in `.prod.vars`; the real `DATABASE_URL`/`CRON_SECRET`/`UNSUBSCRIBE_SECRET`
live in `.env.local`, while `RESEND_API_KEY` is the reverse (only in `.prod.vars`).
**So `set-prod-secrets.sh` today would skip most keys** ("⚠ skip … empty in .prod.vars").
Reconcile the two files before trusting that script. Push individually meanwhile.

---

## 6. Decisions that are the human's, not the agent's

- **`EMAIL_POSTAL_ADDRESS`** — I declined to invent one, twice, including when asked to use
  a fictional one ("island de bill"). A fabricated address in a CAN-SPAM footer *is* the
  violation, and mailbox providers read a bogus footer address as a spam signal — on a
  domain whose reputation this session was spent protecting. It must be an address mail can
  actually reach. **Recommendation: not the home address** — it's published in every
  marketing email, forever, archived and scraped. Israel Post PO box (ת.ד.), an
  accountant's/lawyer's address with permission, a coworking space with membership, or a
  virtual mailbox. Format: `Pleiad — ת.ד. 1234, Tel Aviv 6100000, Israel`.
  **Zero urgency: there are 0 subscribers.**
- **Resend needs nothing.** Verified against the docs: Resend has **no postal-address
  setting** at account, audience, or broadcast level — broadcasts expose only
  `{{{RESEND_UNSUBSCRIBE_URL}}}`. The address lives in our own `layout.ts` because we
  self-host the daily-kin fan-out. The Cloudflare secret is the whole job.

---

## 7. 🚧 THE BLOCKING DECISION — deploy

**Never answered. Blocks everything downstream.**

The working tree is **136 tracked files, +10,377 / −9,714** — the overwhelming majority is
the **parallel site-unification session's rewrite** (`zone-layers.tsx` deleted,
`zone-embeds.tsx` gutted, every `learn/*` page rewritten, `page.tsx` mid-rewrite per the
2026-07-16 handoff). It builds, tests pass, no conflict markers — but *compiles* ≠ *finished*.

**OpenNext builds the whole tree, so this session's security fixes cannot be deployed
without also shipping that session's WIP to pleiad.io.** Either sync with that session
first, or accept it ships. That call was never made.

Related pre-deploy traps still open from the 2026-07-16 audit:
- `drizzle/0002_billing_provider_rename.sql` **renames** `paddle_*` → `billing_*`. A code
  rollback past it breaks billing. No runbook. **Confirm whether 0002 is applied to prod.**
- Gate 8: still no error tracker / server logger / health route (partly softened by
  `bfc1ba4`'s critical-error alert emails).

---

## 8. Aside — corrected mechanics (memory files updated)

Two long-standing notes were **wrong** and cost previous sessions time:

- **`aside mcp` is the agent interface** — an MCP server over stdio exposing a single
  `repl` tool. Register: `claude mcp add aside --scope local -- aside mcp` (**already done,
  in `~/.claude.json` under this project**). **Tools only appear after a Claude Code
  restart** — registering mid-session does nothing for that session.
- The MCP repl scope is **persistent across tool calls** → the `mkfifo`/`nohup`
  session-holding hack is **obsolete**. (Use fresh variable names per call.)
- The MCP repl **has a filesystem** — `fs`, `path`, `Buffer`, `pwd`. The old note said "no
  filesystem access, needs a Node wrapper for secret capture." **False** for the MCP
  server; it can write `.prod.vars` itself. Also has `fetch()` with the user's cookies, and
  `snapshot(page)` is the documented primary way to read a page.
- **`open -a Aside "<url>"` gives a tab that SURVIVES repl exits** and is then visible to
  `listBrowserTabs()` → `attachBrowserTab(targetId)`. Tabs from `openTab()` in the *CLI*
  die when the process exits; app tabs don't. This is the clean way to hand the user a tab
  to click, and to drive multi-step flows across invocations.
- **Cookies persist in the browser profile.** Google OAuth into Cloudflare worked with **no
  MFA** — the Aside browser is now logged into Cloudflare and was left on
  `dash.cloudflare.com/profile/api-tokens` at the **Create API Token** template picker.
- `aside account status` reports **signed out** for all 4 accounts; `repl` works anyway
  (this only breaks `exec`'s built-in models).

### Where Aside got stuck (read this before retrying)

The permission classifier **blocks minting a credential via browser automation** — clicking
Cloudflare's "Create Token" was denied twice. Reading an existing secret out of a dashboard
is fine (that's what the wrapper pattern was for); *creating* one is not.

`Bash(aside repl:*)` was approved in the `/permissions` UI but **did not persist** — I
verified `.claude/settings.local.json` (46 allow rules, zero matching `aside`) and
`~/.claude/settings.json` (empty). Only the narrow per-description approval landed, which
is why one step went through and the next didn't. **If you want this driven end-to-end,
make sure that rule actually saves first.**

---

## 9. Next steps, in the order I'd do them

1. **Rotate 4 leaked secrets** — `RESEND_API_KEY`, `CRON_SECRET`, `UNSUBSCRIBE_SECRET`,
   `TURNSTILE_SECRET_KEY` (§2). Do it before anything else touches prod.
2. **Fix billing** — create `REVENUECAT_SECRET_KEY` + `REVENUECAT_WEBHOOK_SECRET` +
   4× `STORE_PRODUCT_*`, push to the worker. Prod billing is currently dead. (§5)
3. **Answer §7** — ship the parallel session's rewrite, or sync with it.
4. **Commit this session's work by explicit path** (file list in §10), then push
   `9d9fb58` + `695f674` + the new commit.
5. **Deploy** — unblocks `/api/cron/daily-briefing` (currently 404 daily) and
   `/api/newsletter/confirm`.
6. Push `RESEND_AUDIENCE_ID` (value already in `.env.local` — free win).
7. Delete the 12 dead Paddle/Auth0 secrets.
8. Reconcile `.prod.vars` vs `.env.local` so `set-prod-secrets.sh` is usable again.
9. `CLOUDFLARE_API_TOKEN` (3 rows, §5) → briefing traffic panel.
10. GSC service account → briefing search panel.
11. `EMAIL_POSTAL_ADDRESS` when a real box exists (§6). No rush — 0 subscribers.
12. Confirm `drizzle/0002` is applied to prod; write the rollback runbook (§7).
13. Optional: the 2 empty-email `users` rows (§1); dead `sendEventNotificationEmail`;
    `processDailyDigestNotifications` still ignores each user's `daily_digest_time`.

---

## 10. File-by-file: this session's changes (all uncommitted)

**New**
```
src/lib/api/email-token.ts            purpose-separated, expiring HMAC tokens
src/lib/api/email-token.test.ts       15 tests (incl. cross-purpose replay, expiry)
src/lib/email/links.ts                buildUnsubscribeLink() -> {url, oneClick}, buildConfirmUrl()
src/lib/email/ops.ts                  opsRecipient() / alertRecipient(), call-time env
src/app/api/newsletter/confirm/       double opt-in step 2 — the only consent grant
src/app/api/newsletter/newsletter.test.ts   17 tests — the consent + one-click regression suite
src/app/newsletter/confirmed/page.tsx confirmation landing page
```

**Modified**
```
src/app/api/newsletter/subscribe/route.ts    double opt-in; constant response; no audience add
src/app/api/newsletter/unsubscribe/route.ts  RFC 8058 one-click POST; limiter exemption
src/lib/db/repositories/newsletter-repo.ts   upsertPendingSubscriber(); confirmSubscriber() -> {activated}
src/lib/email/send.ts                        unsubscribe:{url,oneClick}; postal-address gate
src/lib/email/from.ts                        module-scope env read -> call-time fns
src/lib/email/layout.ts                      esc() escapes '; href escaped
src/lib/email/index.ts                       re-exports
src/lib/alerts.ts                            notifyNewSignup(); shared esc; call-time recipient
src/app/api/profile/route.ts                 new-app-user ping via .returning()
src/app/api/cron/daily-kin/route.ts          new link API
src/app/api/cron/daily-kin/daily-kin.test.ts +4 tests (one-click headers, postal gate)
src/app/api/cron/daily-briefing/route.ts     opsRecipient()
src/app/api/contact/route.ts                 emailFrom()
src/components/landing-v2/newsletter-signup.tsx  honest double opt-in copy + docstring
scripts/set-prod-secrets.sh                  persist_var/ensure_generated; EMAIL_* in CF_SECRETS
.env.example                                 EMAIL_FROM, EMAIL_POSTAL_ADDRESS documented
```

**Deleted** (superseded — imports all updated, `tsc` clean)
```
src/lib/api/unsubscribe-token.ts       -> src/lib/api/email-token.ts
src/lib/api/unsubscribe-token.test.ts  -> src/lib/api/email-token.test.ts
src/lib/email/unsubscribe.ts           -> src/lib/email/links.ts
```

**Untracked from the parallel session, riding along** (not mine, not reviewed by me):
`src/lib/email/daily-briefing.ts` + test, `src/lib/services/briefing/*`,
`src/app/api/cron/daily-briefing/`, `src/app/api/contact/`,
`src/components/landing-v2/{download-cta,newsletter-signup}.tsx`.

---

## 12. Supabase DB audit (2026-07-19, read-only against prod)

23 tables. Row counts: `people` 26, `predictions` 25, `computed_results` 53, `profiles` 11,
`groups` 6, `relationships` 6, `group_members`/`shared_views` 4; **`subscriptions` 0**,
`newsletter_subscribers` 0, `email_send_log` 0, most others 0. Mixed real-ish test data.

### 🔴 CRITICAL — migration `0002` is NOT applied to prod

`drizzle.__drizzle_migrations` has **2 rows** (applied 2026-07-04, 2026-07-10) = `0000` +
`0001` only. `0002_billing_provider_rename.sql` is **unapplied**, confirmed by live columns:
`subscriptions` still has `paddle_customer_id` / `paddle_subscription_id` and **no
`billing_provider` column at all**. But `schema.ts` / `subscriptions-repo.ts:46-48` expect
`billing_provider` / `billing_customer_id` / `billing_subscription_id`.

**Code is AHEAD of the DB.** Any read/write of `subscriptions` through the repo throws
`column "billing_provider" does not exist`. **Dormant only** because `subscription-sync.ts:87`
catches it → serves `free`, and there are 0 rows. **This is the real answer to the §7
"is 0002 applied?" open question: NO.** It must be applied before ANY billing works.
Apply: `DATABASE_URL=<direct> npx drizzle-kit migrate` (or run the SQL). Non-destructive
(rename + add column). Do it against `DATABASE_URL_DIRECT` (not the pooler). Low risk —
0 rows to rename.

### 🟠 HIGH — 2 of 11 users are un-emailable (legacy-auth artifact)

Two `users` rows have **empty email + null name**, ids `google-oauth2|…` and `auth0|…` —
**Auth0 sub formats, not Supabase UUIDs** (live users are UUIDs). So they're **legacy Auth0
accounts stranded by the auth→Supabase migration**, each still carrying data (one owns 4
`people`, one owns 1). They can receive **no** email at all (digest/notifications send to
`users.email`). **Not a code bug** — `auth-server.ts:52` captures email correctly for
Supabase; a new login mints a fresh UUID user and won't reuse these. **Fix = data cleanup**,
not code: backfill their email from the IdP, or delete the 2 dead rows + their orphaned
domain data. Low stakes (test-era accounts) but they skew every "users" count and the
briefing's user stats.

### 🟡 By design — verify, don't panic

- **RLS is OFF on all 23 tables** (`relrowsecurity=false` everywhere). This is the
  documented design — isolation is 100% app-layer `owner_id`/`user_id` filters in the repos.
  **Every owner column IS indexed** (13/13 checked), so tenant-filter perf is fine. The
  design's single point of failure is a route/repo that forgets the filter. **Recommend a
  live A-reads-B probe** (two users, confirm neither can read the other's people/boards/
  predictions via the real API) before trusting it in production. Not yet done.
- **No DB-level FKs from owner columns → `users`.** The only FKs are between domain tables
  (people→computed_results, groups→group_members, etc., all sensible ON DELETE). Owner
  columns (`people.owner_id`, `subscriptions.user_id`, …) have **no** FK to `users` —
  intentional-ish (ids come from an external IdP) but nothing prevents orphans. **Checked:
  0 orphans right now** across all 13 owner columns, 0 profiles-without-user, 0
  users-without-profile, 0 duplicate subscriptions, 0 duplicate emails. Clean today, but
  unguaranteed.
- **`tags.owner_id` is NULLABLE** — the only owner column that is (all 12 others NOT NULL).
  Inconsistent; 0 rows so harmless. Tighten to NOT NULL when convenient.

### ⚪ LOW / noted

- No table-level `UNIQUE` *constraints* — uniqueness is enforced by unique *indexes*
  (`newsletter_email_uq`, etc.), which is functionally equivalent. Not a finding.
- FK delete rules look deliberate: CASCADE within an owner's object graph
  (person→computed_results/relationships/tags), SET NULL where history should survive
  (prediction→calendar_event, subscriber→email_send_log).

### DB audit — recommended actions, ordered

1. **Apply `0002` to prod** (unblocks all billing; do before RevenueCat wiring). 🔴
2. Live **A-reads-B isolation probe** (the one real risk of the RLS-off design). 🟡
3. Clean up the **2 legacy empty-email users** + their orphaned data. 🟠 (low stakes)
4. `tags.owner_id` → NOT NULL. ⚪ (whenever)

---

## 11. Suggested commit split (explicit paths — the branch is shared)

```sh
# 1) email security fixes
git add src/lib/api/email-token.ts src/lib/api/email-token.test.ts \
        src/lib/email/links.ts src/lib/email/send.ts src/lib/email/from.ts \
        src/lib/email/layout.ts src/lib/email/index.ts \
        src/app/api/newsletter/subscribe/route.ts \
        src/app/api/newsletter/unsubscribe/route.ts \
        src/app/api/newsletter/confirm/ src/app/newsletter/ \
        src/app/api/newsletter/newsletter.test.ts \
        src/lib/db/repositories/newsletter-repo.ts \
        src/app/api/cron/daily-kin/route.ts src/app/api/cron/daily-kin/daily-kin.test.ts \
        src/app/api/contact/route.ts
git rm src/lib/api/unsubscribe-token.ts src/lib/api/unsubscribe-token.test.ts \
       src/lib/email/unsubscribe.ts
# fix(email): double opt-in + working RFC 8058 one-click unsubscribe

# 2) signup pings + ops recipient
git add src/lib/alerts.ts src/lib/email/ops.ts src/app/api/profile/route.ts \
        src/app/api/cron/daily-briefing/route.ts
# feat(alerts): email ops on every new signup (app user + newsletter)

# 3) secrets script + env docs
git add scripts/set-prod-secrets.sh .env.example
# fix(scripts): stop rotating generated secrets on every run
```
