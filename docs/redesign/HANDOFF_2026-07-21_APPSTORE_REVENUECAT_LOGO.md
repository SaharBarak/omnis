# Handoff — App Store/RevenueCat wiring, security closeout, logo task (2026-07-21)

Continues `HANDOFF_2026-07-17_EMAIL_SECURITY_SECRETS.md`. Branch
`redesign/knowledge-experience`. **All code work is committed AND pushed** (0 unpushed;
`origin` at `e733a6a`). Remaining work is dashboard/asset, not code.

---

## 0. TL;DR

- **Security, email, DB, deploy, secrets: DONE this session.** Committed, pushed, live.
- **App Store + RevenueCat: ~70% wired, blocked on a manual dashboard step.** RC app +
  `.p8` done, bundle registered, ASC app record created, subscription group created — but
  the **4 IAP products are NOT created yet** (browser automation kept misfiring on Apple's
  SPA; handed to the user). See §3 — this is the main open thread.
- **Logo task: just started, nothing generated.** User wants Higgsfield-generated logo
  options shown in an HTML picker + social/favicon. See §5.

---

## 1. Done this session — code (committed + pushed, live in prod)

Commits (all authored SaharBarak, **no** Claude co-author, per the global rule):
```
e733a6a feat(ops): add /api/health probe; drop dead Auth0/Paddle from deploy script
2711a78 fix(scripts): persist generated secrets instead of rotating every run
75cd18d feat(alerts): email ops on every new signup (app user + newsletter)
466d6be fix(email): double opt-in + working RFC 8058 one-click unsubscribe
a8f8168 fix(security): enable RLS deny-all on all tables
```
Prior session's `9d9fb58` + `695f674` are also now pushed.

- **RLS breach closed** (`drizzle/0003`) — the public anon key could read+write every table
  via Supabase PostgREST; RLS deny-all now blocks anon/authenticated, app bypasses as the
  `postgres` owner. Verified. See [[supabase-rls-breach]] memory.
- **App-layer tenant isolation audited** (all 74 repo query sites) — SOUND, no IDOR.
- **Email**: double opt-in + working RFC 8058 one-click unsubscribe + signup ops pings.
- **Migration 0002 applied to prod** (paddle→billing rename) via `npm run db:migrate` +
  verified; billing reads no longer throw.
- **Deployed** (`npm run deploy`, user-run) — `/api/newsletter/confirm`,
  `/api/cron/daily-briefing`, `/api/health` all live now.
- **Secrets**: pushed `RESEND_AUDIENCE_ID`, `BRIEFING_EMAIL`, `ALERT_EMAIL`; **rotated**
  `CRON_SECRET` (both workers) + `UNSUBSCRIBE_SECRET`; **deleted 13 dead secrets** (8 Paddle
  + 5 Auth0, verified zero server reads, prod healthy after); reconciled `.prod.vars`.
- **DB cleanup**: deleted the 2 legacy empty-email Auth0 users + their orphaned data
  (9 users now, was 11).
- **Health route** `/api/health` (gate 8): DB-ping, 503 on failure.

---

## 2. Apple Developer setup — DONE (user did the human/legal parts)

- Apple Developer account active; **Paid Apps Agreement = ACTIVE** (was Processing);
  bank (Bank Hapoalim, ILS/USD) + tax (W-8BEN, Article 14 / 10% / "sale of applications")
  all submitted and Active.
- **Bundle ID `app.pleiad.mobile` registered** in the Developer portal (shows as "Pleiad").
- **App Store Connect app record created**: **Pleiad.io** (app id `6793060798`, iOS,
  English U.S., SKU `pleiad`). NOTE: display name is "Pleiad.io" because plain **"Pleiad"
  is taken** on the App Store — changeable before submission.
- **EU trader status** notice is present in ASC — must be filled before App Store
  submission (not blocking product creation).

## RevenueCat — DONE so far

- Project **Pleiad.io** = `369bf568`.
- **App Store app created in RC** = app `appfb6b99cde7`, with the **In-App Purchase `.p8`
  key** uploaded (Key ID `6JLZR6XM6A`, Issuer ID `4cbb6a02-45f5-44b8-934c-874d033a5475`).
  The `.p8` is in the user's `~/Downloads/SubscriptionKey_6JLZR6XM6A.p8` (a private key —
  do NOT read/handle it; it's already uploaded to RC).

---

## 3. 🚧 THE MAIN OPEN THREAD — 4 IAP products + RC wiring

### State in App Store Connect (app `6793060798`)
- **Subscription group "Pleiad Subscriptions"** created — group id **`22252675`**.
- ⚠️ **Its localization is WRONG: set to Arabic by mistake** (an automation `selectOption`
  misfire). Must be fixed to **English (U.S.)**, group display name "Pleiad".
- **0 subscriptions created**, **0 non-consumables**. The products do NOT exist yet.

### Why automation was stopped
Browser automation via `aside repl` against Apple's App Store Connect SPA repeatedly
misfired — non-persisting subscription creates, stale refs, loading states, and the
**Arabic-instead-of-English** localization error above (in a LIVE billing account). It was
handed to the user. **Do NOT resume blind browser automation on ASC billing** without
screenshot-verifying every step; prefer having the user click these.

### The 4 products to create (values from `src/lib/services/billing.ts`)
| Product ID | Type | Duration | Price | Display name | Description |
|---|---|---|---|---|---|
| `pleiad_explorer_monthly` | Auto-renewable (in group 22252675) | 1 month | $5 | Explorer | 15 profiles across all 6 systems |
| `pleiad_complete_monthly` | Auto-renewable (in group) | 1 month | $9 | Complete | 25 profiles, all systems, exports |
| `pleiad_practitioner_monthly` | Auto-renewable (in group) | 1 month | $29 | Practitioner | Unlimited profiles, groups & API |
| `pleiad_founding_lifetime` | **Non-Consumable** (In-App Purchases, NOT the group) | — | $79 | Founding Lifetime | Everything, forever — one-time |

Entitlement identifiers the code expects (RC side): `explorer`, `complete`,
`practitioner`, `lifetime` (from `getPlanFromEntitlementId`, `billing.ts:177`).

### Remaining steps once products exist (this part is reliable — no SPA fragility)
1. Fix the group localization → English (U.S.).
2. Create the 4 products (user, in Aside — faster/safer than automation).
3. In RC: import the products from App Store (RC auto-syncs via the `.p8`), attach each to
   its entitlement, build an **Offering**.
4. **Secrets → worker**: capture `REVENUECAT_SECRET_KEY` (RC → API keys — it's a secret
   key, capture via the wrapper pattern, never to transcript); generate
   `REVENUECAT_WEBHOOK_SECRET` (`openssl rand -hex 32`, set on both the RC webhook config
   pointing at `https://pleiad.io/api/billing/webhook` AND `wrangler secret put`); set the
   four `STORE_PRODUCT_{EXPLORER,COMPLETE,PRACTITIONER,LIFETIME}` = the product IDs above;
   push all via `wrangler secret put` (worked fine this session).
5. Redeploy (`npm run deploy`, user-run) so `STORE_PRODUCT_*` reach the build.

### The bigger reality (state it plainly)
**Nothing is purchasable until the mobile app is built and submitted.** ASC says: "Your
first subscription group must be submitted with a new app version." Configuring IAP + RC
makes the billing *code* functional (sandbox + ready-for-launch), but real purchases need
the Expo app built, uploaded, reviewed, released — a separate large effort.

---

## 4. Aside / browser automation notes (this session)

- `aside repl` (CLI) worked for Cloudflare/Google OAuth logins (no MFA on those), form
  fills, and file upload (`setInputFiles` by path — used for the `.p8`, never read its
  bytes). See [[aside-browser-mechanics]].
- **Classifier HARD STOPS confirmed this session** (hand to user, don't retry): minting a
  credential in a dashboard (Cloudflare token, Apple IAP key — user clicked Generate);
  entering passwords (RevenueCat login, Apple ID); production DB writes were allowed via
  `db:migrate`/`wrangler` but NOT via ad-hoc `tsx` (RLS enable was blocked → user pasted SQL).
- **Apple ASC SPA is hostile to automation** — loading states, shifting refs, silent
  validation. Screenshot-verify; prefer user clicks for anything that writes.
- `app.pleiad.mobile` is the bundle id (`packages/mobile/app.json`).

---

## 5. 🎨 LOGO TASK — just started, nothing produced yet

User's ask (verbatim intent): the current logo "is not right — not taken from the actual
app"; wants a **different logo**. Use **Higgsfield** (`higgsfield-generate` skill) to
generate **a few logo options**, present them in an **HTML picker** so the user chooses,
and also produce a **social preview icon** and **favicon**.

Brand facts gathered (for good prompts):
- Colors (`src/lib/design/landing-tokens.ts`): ground `#0B0D16`, brand `#7D5BC9` (purple),
  brandSoft `#A78FDF`, brandBright `#EFEAFA`. Existing mark uses a **✦ star glyph**.
- Product: "Pleiad — The Living Map of Your People." Maps people across six wisdom systems
  (Astrology, Dreamspell, Tzolkin, Human Design, Gematria). Cosmic / star-cluster theme
  (Pleiades star cluster is the namesake).
- Current assets in `public/`: `favicon.ico`, `apple-touch-icon.png`, `og-image.png`,
  `icons/`. These are what the user considers "not right".

Not started: no Higgsfield calls made, no options generated, no HTML built. Next session:
read the `higgsfield-generate` skill, generate ~4-6 logo concepts (star-cluster / Pleiades
/ ✦ motifs in the purple palette on dark ground), build a self-contained HTML gallery in
scratchpad or as an Artifact for the user to pick, then derive favicon + og-image from the
chosen mark.

---

## 6. Still open from prior handoffs (unchanged, not blocking)

- Rotate `RESEND_API_KEY` + `TURNSTILE_SECRET_KEY` (external dashboards — user only; the
  other two leaked secrets were rotated this session).
- `EMAIL_POSTAL_ADDRESS` before any marketing blast (0 subscribers → no urgency).
- `tags.owner_id` → NOT NULL (low).
- The parallel site-unification session's ~130 frontend files are still uncommitted in the
  working tree (learn/*, app/*, landing-v2/* except my newsletter edits) — their commit.
- Build + submit the mobile app (the real gate for live purchases).

---

## 7. Quick-resume checklist for next session

1. Read this + `[[supabase-rls-breach]]` + `[[aside-browser-mechanics]]`.
2. Ask the user: did the 4 IAP products get created in ASC? If yes → do §3 steps 3-5
   (RC import → entitlements → offering → secrets → redeploy). If no → give values (§3),
   let them click, or carefully drive with screenshot verification.
3. Logo task (§5) — Higgsfield options → HTML picker → favicon + og.
