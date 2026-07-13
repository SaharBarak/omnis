# Session Handoff — Redesign (updated 2026-07-13)

Continue point for the Pleiad knowledge-experience redesign. Read this +
MAIN_PURPOSE.md first; everything else on demand.

## CURRENT STATE (2026-07-13, later) — READ FIRST

Tree health: **typecheck ✓ · 1132/1132 tests ✓ · homepage renders 200**.
HEAD = `6bc30a0` (the other session kept committing; my work sits on top, uncommitted).
Two sessions share this tree. This section is written by the **web** session.

### 1. The engine was wrong. Four correctness bugs, all fixed. **NOT COMMITTED.**

The homepage looked like decoration because it *was* decoration — but chasing that
down turned into an engine audit, and the engine was the real problem. Read
**`docs/redesign/CONNECTION_ATLAS.md`** first; it is now the authority for what
any map may draw. Everything below is verified by measurement, not opinion.

**🔴 BUG 1 — `getAnalog` was wrong. Every analog this engine ever emitted was incorrect.**
`oracle-tables.ts` held a hardcoded map citing "DREAMSPELL_SPEC.md (authoritative)".
**That file does not exist in this repository.** The pairs had no consistent sum
(1↔17 sums to 18, 2↔19 to 21, 13↔20 to 33) and broke the colour rule that *defines*
analog (it mapped Red→Red). Correct rule: the seals sum to 19. Now a formula, not a
map, with `data/oracle-tables.test.ts` proving six invariants across all 20 seals.
26 tests had encoded the bug — one describe block was literally named after the
phantom spec. **Tests that assert a bug will defend it forever.**

**🔴 BUG 2 — house cusps were never read.** `astrology.ts` looked for
`ChartPosition.Ecliptic.DecimalDegrees` on a House; that field lives under
`StartPosition`. It silently fell back to `i * 30`, so **every natal chart in the
product used 30° buckets from 0° Aries, and `planet.house` was wrong on every
chart.** The committed golden had it baked in as `0°00' Aries`, `0°00' Taurus`, …
Nobody reads a snapshot. Now real, anchored to Asc (h1) and MC (h10), both hemispheres.

**🔴 BUG 3 — the Dreamspell oracle ignored tone.** `guide`/`analog`/`antipode`/`occult`
compared seals only, firing ~20× too often (5% instead of 1-in-260). Now exact:
occult collapses to `kin₁ + kin₂ = 261`. The seal-only matches survive as
`analog-seal` etc. — a real but weaker claim, honestly named. Measured after the
fix: guide 0.378%, occult 0.406%, analog 0.434% (theory 0.385%).

**🔴 BUG 4 — `trecena-match` was not a trecena.** It bucketed day-sign 1-20 into
halves (43.7% of pairs). Now the real 13-day run of the 260-count: **5.00%**, exactly theory.

**🔴 DELETED — the gematria pair score was fabricated.** `30 + (sharedRoot ? 45 : 0) +
25×(1−|v1−v2|/max)`. Difference-of-values, shared digital root, graded 0-100 — none
have *any* traditional basis; that is 1900s Western numerology in Hebrew clothing.
Replaced by `nameValueMatch` (exact equality, the only relation the tradition
sanctions). Gematria's fusion weight is now 0 and it is absent from `availableSystems`.

### 2. SURPRISAL is now the scoring spine — `packages/engine/src/services/rarity.ts`

The core finding: **most ties fire on nearly everyone and therefore say nothing.**
Measured over 780–7,140 random pairs: `cross-aspect` 100%, `dominance` 96.3%,
`compromise` 96.0%, `electromagnetic` 95.4%, `house-overlay` 100%.

So every tie is now weighted by `−log₂(measured base rate)`. A `guide` (0.38%) is
8.0 bits; an `electromagnetic` (95.4%) is 0.07 bits. The traditions rated them 18 vs
12 (1.5×). Information content rates them **115:1**, with no human opinion involved.
Ranking, headline callouts and the pair "rarity" score all derive from this. The
hand-written `TIE_INTEREST` table is gone.

**⚠️ The method caught the published literature being wrong — twice.**
- A 3-planet **stellium overlay** fires on **60.6%** of pairs, not the ~4% sources
  claim (Sun/Mercury/Venus are never >76° apart; Placidus houses are wide). The
  published 4% is really the *four*-planet rate (measured 7.4%).
- A **double whammy** across all 15 planet pairs fires on **73.6%**. The famous
  ~7-10% is per *specific* pair — Sun–Moon 9.4%, Venus–Mars 9.1%. Hence
  `double-whammy-core` (rare, the headline) vs generic `double-whammy` (quiet).

**If you add a relation, MEASURE its base rate before adding it to `BASE_RATE`.**
A guessed rate silently reintroduces the exact problem that module exists to remove.

### 3. New engine capability

- `services/hd-relations.ts` — wires `composite-bodygraph.ts`, which was written,
  tested and **called by nothing**. HD now leads with **emergent definition** (the
  centres the pair defines that *neither has alone*), connection themes (9-0 → 5-4),
  split bridging, profile harmony. Electromagnetic is demoted to a **count**.
  Themes spread 35.5 / 33.8 / 22.6 / 6.5 / **1.0**% — real variation, where
  existence-of-electromagnetic was a flat 95%.
- `synastry.ts` rewritten — 8 new contact types exposed as a **`discriminators`**
  list (T2/T3 only): `double-whammy`, `tight-aspect` (≤1°), `vertex-contact`,
  `node-axis-integration`, `node-contact`, `angle-contact`, `house-overlay`,
  `stellium-overlay`. Plus a real Vertex (`calculations/vertex.test.ts` asserts the
  *definition* — due west on the prime vertical — because "houses 5-8" is a
  mid-northern rule of thumb that fails in the southern hemisphere). Returns `null`
  above |lat| 66° rather than guessing.
- Dreamspell/Tzolk'in gained wavespell, castle, Earth Family, Year Bearers, Lords of
  the Night. Every rate measured over 7,140 pairs; every one lands on theory.
- **NEVER FABRICATE:** anything needing birth time or place returns nothing when that
  data is absent. A Moon without a birth time carries ±7° error — larger than every
  orb — so Moon-based claims are suppressed outright.

### 4. Homepage — rebuilt on all of it

- **`ego-star.tsx`** (new) — the hero map is the **Dreamspell oracle cross made of
  people**: guide above, analog right, antipode left, occult below (the app's own
  convention, `components/cards/OracleMap.tsx`). Position *is* the relation. Icons are
  each person's real seal glyph. Layer chips select systems; "consolidate" combines them.
- `demo-graph.tsx` **deleted** — the 15-edge hairball where every line was true and
  worthless (a complete graph carries no information in its edges).
- `homepage-demo.ts` — six people whose birth dates were **re-searched** so Maya's
  five spokes are genuine 1-in-260 oracle relations (Ari kin 164 guide, Noam kin 99
  analog, Tal kin 190 antipode, Omer kin 201 occult since 60+201=261, Dana kin 220
  same-seal). `buildEgoStar` **throws** rather than draw a spoke the engine didn't
  find — that throw is the design working.
- Circles are computed by `buildPenta` (they previously listed people who **don't
  exist** — "Shai", "Lior" — with invented insights). Callouts select themselves by
  surprisal instead of a hardcoded list that had already gone stale.
- `zone-embeds.tsx` fabrications gone: it asserted `Kin 113 · Leo · MG 5/1` for Maya
  while the engine said kin 60, and labelled Maya↔Ari "Occult partners" when the
  engine says `guide`.

### Still open (recorded in CONNECTION_ATLAS.md §9)
- **Arrows.** `guide` is asymmetric (5-cycles) and our impl is order-dependent;
  house overlays and split-bridges are directional. Data carries direction; the map
  doesn't draw it yet.
- **GAP kin** deliberately NOT implemented — no reachable source enumerates the 52
  portals in text, and a wrong list is worse than none.
- **Per-system 0-100 scores are still tradition-weighted constants.** Surprisal
  governs ranking and rarity; those numbers should be retired in favour of bits.
- **Type/Strategy/Authority interplay** — what Jovian says to *lead* with. We compute
  `profileFit`; it isn't surfaced.

### Next actions
1. **COMMIT.** 35 files, uncommitted, in a tree another session is actively
   committing to. Engine semantics changed (analog, oracle, trecena, gematria, houses)
   — mobile reads the same engine.
2. Paddle orphans still live (see §2 below): revoke the ~5 stray live API keys.

### 2. Billing pivoted Paddle → store IAP (other session, committed `a36cd81`)
**This supersedes the Paddle production cutover I completed earlier the same
day.** Paddle is now fully removed from `src` (0 refs); billing is App Store /
Google Play IAP via RevenueCat behind a provider seam (`billing-provider.ts`,
`billing-providers/`). `scripts/paddle-*.mjs` were deleted in that commit.

**ORPHANED, needs cleanup — nobody has done this:**
- Live Paddle **products, prices, and the `pleiad.io/api/billing/webhook`
  notification destination** still exist in the Paddle account (I created them
  live on 07-12). Wind them down or leave them dormant, but they are real.
- Stray live Paddle **API keys** still Active: `pleiad-production`,
  `pleiad-prod`, `pleiad-live`, `pleiad-map`, `pleiad-prod-live`, plus
  duplicate `pleiad-prod-live` client tokens. **Revoke them** (Paddle →
  Authentication). Revoking live payment creds is user-only; the agent
  classifier blocks it.
- `PADDLE_*` secrets are still set on the Cloudflare Worker — now unused.

### 3. Shipped and live (earlier 07-12), still valid
- **Groq is the LLM provider.** `src/lib/services/llm.ts` provider seam,
  `LLM_PROVIDER=groq` (default), Gemini kept as fallback. Key captured +
  validated (200, llama-3.3-70b). **Gemini's FREE tier trains on your prompts**
  — never point it at real user birth data; paid key only.
- Resend + Turnstile keys captured and pushed to the Worker.
- `scripts/deploy-prod.sh` — **use this, not `npm run deploy`.** The plain
  deploy bakes `.env.local` (dev/sandbox) values into the client bundle;
  this wrapper sources the live `NEXT_PUBLIC_*` from `.prod.vars`.
- Credential capture via Aside browser automation works well
  (`scripts/groq-capture.mjs`, `resend-capture.mjs` as the pattern): Node
  wrapper drives `aside repl`, reads the secret off stdout, writes
  `.prod.vars`, prints only a char count. Aside repl has **no filesystem** and
  **tabs don't persist between calls** — do a whole flow in one invocation.
  Portal/SPA menus need **real pointer clicks** (`p.click`/`getByText`), not
  DOM `.click()`.

### Next actions
1. Decide: commit the homepage work (it's cleanly separable from billing).
2. Revoke the stray Paddle live keys + decide the fate of the live Paddle
   products/webhook.
3. Finish homepage §6/§7 + sticky mobile CTA, then deploy via
   `./scripts/deploy-prod.sh`.

## MOBILE SESSION — RESUME HERE (2026-07-11)

**The React Native app is BUILT (M0–M3) and its backend is LIVE + proven
end-to-end against production.** Full details in the dated sections lower
down; this is the fast resume.

**Where it lives:** `packages/mobile` (Expo SDK 57, `@pleiad/mobile`),
sharing `packages/engine` + `packages/api-client` with web. Specs in
`specs/mobile/` (README first, then RUNBOOK.md).

**Proven live** (deployed worker, real Auth0, prod Supabase): PKCE login →
audience-scoped token → `/api/people` 200 + `/api/notifications/devices`
201. Auth0 fully configured (API `https://api.pleiad.app`, Native app
`Pleiad Mobile` cid `PcBpDL7E8HUkNwWG4j0w2E93M3J3q1FZ`, callback/logout
URLs, connections, user-delegated API-access grant). `AUTH0_API_AUDIENCE`
secret set; `device_push_tokens` migrated; `packages/mobile/.env` holds
real creds (gitignored). Suite 1049 green, typecheck clean.

**THE ONE THING LEFT — needs a phone / device SDK (absent on the build
machine):**
1. `cd packages/mobile && npx expo start` → open in Expo Go → sign in →
   walk flows F1–F12 (specs/mobile/USER_FLOWS.md). Everything it calls is
   live and verified; this is on-device visual/UX confirmation only.
2. `eas init` (sets the projectId push registration needs) → EAS build →
   TestFlight / Play internal. This is the M4 store track — not started.
3. Deferred by design (spec'd, not built): boards editing, PDF cards,
   native IAP (RevenueCat), offline write queue, he/RTL.
Verification scripts to re-run anytime:
`scratchpad/verify/pkce-prod.mjs` (bearer+push proof — regenerate if the
scratchpad was cleared; pattern in git history + RUNBOOK §3–5).

Aside/tooling gotchas learned this session: Auth0 callback/logout fields
are tag-inputs (comma strings become ONE malformed chip — enter each URL
then dispatch Enter keydown/keypress/keyup); Aside `t.fill` marks
redux-form dirty (native value setter alone does not); one browser
session per `aside repl`; screenshots return a Buffer (pipe base64
through Bash, `fs` unavailable in the sandbox); Aside browser can die —
`open -a Aside` + ~15s to revive.

---

## BILLING PIVOTED: Paddle → store IAP (2026-07-13) — `a36cd81`, `4c7008f`

**Paddle is dead and must not be retried.** It rejected pleiad.io on *category*:
its AUP prohibits "digital services associated with pseudo-science, including
… clairvoyance, horoscopes, fortune-telling". No copy rewrite fixes that (the
app computes natal charts; checkout sat inside `/app`), and faking it risks a
MATCH/TMF listing. Researched and also ruled out: **Polar** (prohibits the same,
item 31), **Stripe** (restricts it AND does not support Israeli merchants at
all), **Lemon Squeezy** (Stripe-owned), **PayPal** (bans psychic/fortune-teller).
**Dodo** allows it + pays Israel but has public reports of frozen payouts.
Root cause: an MoR carries the legal liability, so it polices categories — the
whole MoR model is closed to this product. (Nebula/Obrio, the biggest astrology
app, bills as its *own* entity with direct acquiring + store IAP.)

**Decision: the stores are the biller.** Paid access is an in-app purchase;
Apple/Google are the merchant of record (payment + global tax) and pay Israeli
developers. The web is a free client that unlocks from the IAP entitlement.
Nothing to migrate — Paddle never took a live payment.

**Architecture.** RevenueCat's `app_user_id` IS the Auth0 sub, so a purchase on
a phone unlocks the same account on the web. Everything keys by `user_id`.
`usage.ts` / `PLANS.limits` / `requireLimit` were already provider-agnostic and
are **untouched** — only what *writes* the `subscriptions` table changed.
- `billing-provider.ts` = the seam (fetchEntitlement / verifyWebhook /
  getManagementUrl); only normalized types cross it. A web card acquirer can be
  added later without touching the webhook, sync, or gating.
- `billing-providers/revenuecat.ts` = REST only, no SDK.
- Re-fetch-as-truth preserved; Founding Lifetime still sticky; sync now
  self-heals a paying user whose webhook was missed.
- Web can't sell: `/api/billing/checkout` deleted; `/portal` now returns the OS
  subscription-management deep link; every upgrade CTA points at the app.
- DB: `paddle_*` → `billing_*` + `billing_provider` (migration `0002`, a
  hand-written RENAME — drizzle's non-interactive diff would DROP+ADD).
- Legal pages corrected (Apple/Google are MoR and decide refunds; the
  self-processed 14-day guarantee is gone — it was no longer truthful).
- Mobile: real IAP, Offerings + Restore Purchases, `Purchases.logIn(auth0Sub)`.
  Expo Go still runs (RevenueCat Preview API Mode); real purchases need a dev build.

Health: root+mobile typecheck ✓ · **1088 tests ✓** · lint 0 errors (web) ·
`next build` ✓ 50/50 · iOS Hermes export ✓ · migrations clean on fresh pg16 ·
smoke-repos 12/12.

### REMAINING — all user-gated (this is now the ONLY path to revenue)
1. **RevenueCat account** → project + API keys: secret key (server) +
   public iOS/Android SDK keys (mobile `.env`).
2. **App Store Connect + Play Console**: Apple Developer + Play accounts on the
   Israeli entity; create the 4 products (`explorer`/`complete`/`practitioner`
   monthly + `lifetime` non-consumable). Enroll in the **Apple Small Business
   Program** (15% not 30%).
3. **RevenueCat dashboard wiring** — entitlements MUST be named exactly
   `explorer` | `complete` | `practitioner` | `lifetime` (the server maps
   entitlement id → plan by name), and offering packages should carry the same
   identifiers. Point the webhook at `https://pleiad.io/api/billing/webhook`
   with an Authorization header value == `REVENUECAT_WEBHOOK_SECRET`.
4. Secrets: `REVENUECAT_SECRET_KEY`, `REVENUECAT_WEBHOOK_SECRET`,
   `BILLING_PROVIDER=revenuecat`, `STORE_PRODUCT_*`, and (once listed)
   `NEXT_PUBLIC_APP_STORE_URL` / `NEXT_PUBLIC_PLAY_STORE_URL` →
   `./scripts/set-prod-secrets.sh`.
5. `npm run db:migrate` (applies `0002`) → `npm run deploy`.
6. **EAS build → TestFlight / Play internal → submit.** Frame as
   self-reflection/entertainment, no predictive claims (Apple 1.1.6).
7. E2E to prove the whole idea: buy in TestFlight as Auth0 user U → log into
   pleiad.io as U in a browser → paid features unlock.

Trade-offs accepted: 15–30% store cut; **web/desktop users cannot buy** (the
funnel ends at "download the app"); Apple is a single point of failure (ship
Play too). If the cut bites later, add a web acquirer behind the seam —
shortlist: Nuvei/SafeCharge (Israeli-founded), Solidgate (high-risk verticals,
Nebula's ecosystem), Rapyd (Israeli), Cardcom/Tranzila (Israeli domestic).

## GO-LIVE READY (2026-07-12) — SUPERSEDED by the billing pivot above
(Paddle steps below are dead — kept only for the RESEND/GROQ/TURNSTILE secrets,
which are still valid and still need pushing.)

## GO-LIVE READY (2026-07-12) — user runs 2 commands

Paddle live go-live + Higgsfield brand refresh done to the buildable edge.
`.prod.vars` is FULLY loaded (verified): Paddle **LIVE** key + 4 live prices
+ webhook secret, RESEND_API_KEY, GROQ_API_KEY, LLM_PROVIDER=groq, and
TURNSTILE_SECRET_KEY — every previously-held secret filled (only
CLOUDFLARE_API_TOKEN blank; only GH-Actions needs it, manual deploy uses
local wrangler auth). Worker still holds **sandbox** Paddle + lacks
GROQ/RESEND/TURNSTILE secrets (agent-blocked from pushing). AI interpret is
code-live (groq) but 503s until GROQ_API_KEY is on the worker.

**THE TWO STEPS (classifier blocks agents — user runs, `!` prefix):**
1. `./scripts/set-prod-secrets.sh` — pushes live Paddle + RESEND + GROQ +
   LLM_PROVIDER + TURNSTILE to the worker (overwrites sandbox Paddle).
2. `npm run deploy` — rebuilds (bakes live NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
   + turnstile site key) AND ships the new brand assets. Then real-card
   checkout E2E + check og-image on a share-debugger.

Committed this session: `9ee3922` provider-agnostic LLM service (Groq
default, Gemini fallback) + capture/live-setup scripts; `6eca940` manifest
+ OG label brand fix; `ec594d9`+`bb58bc8` Higgsfield **Pleiades cluster**
social card (og-image.png, Space Grotesk wordmark) + PWA icons
(512/192/apple-touch/maskable) — favicon.ico kept geometric (16px
legibility); removed the dynamic opengraph-image route so the static
cluster card is the universal preview. HF art raws + composite scripts in
scratchpad (regen: `scratchpad/compose-og.mjs` + `compose-icons.mjs`,
prompts in `hf-brand-plan.md`).

## CURRENT STATE (2026-07-11) — read this section first

**Product: Pleiad · live at https://pleiad.io (+www; omnisx.workers.dev
kept as alias — Auth0 works on BOTH).** Health: typecheck ✓ · 1049 web
tests ✓ · deployed + live-verified. TWO parallel sessions share this
tree: the web session (this CURRENT STATE section) and the mobile session
(packages/mobile — see MOBILE SESSION block above).

### Shipped by this session since the 07-05 sections below
- **Self on map** (`0bdd933`, `adc3949`) — onboarding upserts an is_self
  person (cap-exempt, server-minted); You badge; graph render fixed
  (initials discs, seal rings, brand halo '· You', zoom clamp 3.2 +
  spread forces — was invisible gray-800 labels + giant discs).
- **Moon Map** (`/app/moon`) — lunation from Sun–Moon elongation via the
  astrology ephemeris (src/lib/calculations/moon.ts, eclipse-anchored
  tests); natal-phase buckets; MoonGlyph SVG (elliptical terminator).
- **Brand** — mark = **the Asterism** (core + kin nodes + map lines;
  src/components/brand-mark.tsx, mono variant for sidebar tile). Icon
  set + OGs regenerated via Chromium rasterize (ImageMagick DROPS SVG
  strokes — never use it for this). Login reskinned dark. NOTE: app-dir
  src/app/favicon.ico overrides public/ — update BOTH.
- **Reel-wave** (`a4f619b`..`7000164`) — 6-step get-to-value checklist
  (2nd session later moved persistence localStorage→profiles.preferences);
  Paddle webhook re-fetch-as-truth + timing-safe sig + stale re-sync;
  Founding Lifetime $79 one-time (sticky, never downgraded by sync);
  PostHog scaffold env-gated (6 funnel events, identify/reset).
- **Marketing playbooks** — docs/marketing/playbooks/ (16 vendored from
  coreyhaines31/marketingskills, MIT) + docs/NEXT_STEPS.md ledger.
- **pleiad.io cutover** (`13485ed`+) — custom domains via wrangler
  routes (`workers_dev: true` REQUIRED or the alias 404s); all omnis.app
  refs swapped; Paddle webhook + cron + secrets repointed; Paddle
  products renamed "Pleiad *". 2nd session: Auth0 whitelisted pleiad.io,
  Search Console verified, email DNS live, /refund page, .prod.vars +
  scripts/set-prod-secrets.sh runbook.
- **Turnstile hardened** — per-request env read (module-scope capture
  saw an empty secret forever on Workers — real bug), fail-closed
  verifier, 9 tests. Widget on the newsletter form.
- **Resonance Matrix LIVE** — MAPS_ROADMAP #1: Map ↔ Matrix toggle on
  /app/graph, five-system pairwise scores server-computed + cached in
  computed_results, self pinned, violet resonance ramp, breakdown sheet.
  (Builder agent stalled on the route test only — small debt.)
- **Composite Bodygraph + Penta** (`94f9864`) — MAPS_ROADMAP #2 DONE (not
  yet deployed). Pair mode inside the matrix breakdown sheet: two charts
  overlaid, channels classified electromagnetic/companionship/dominance/
  compromise (engine services/composite-bodygraph.ts, cross-verified vs
  hd-compatibility), per-person gate dots, emergent centers ringed violet.
  Group mode: Penta tab on group analysis (3+ charted members) showing
  group-only definition + contributor gates. SVG anatomy extracted to
  components/human-design/bodygraph-layout.ts (shared by all 3 views).
  Suite 1077.
- **Bodygraph fixed** (`097cf84`) — TWO real bugs: (1) engine CHANNELS data
  had 6-59 twice and NO 34-57 (Power) — wrong type/authority for anyone
  with gates 34+57; (2) chart drew all 36 channels as overlapping
  center-to-center lines. Now canonical: per-channel lanes (verified vs
  reference charts via Aside), midpoint gate-halves (hanging gates render),
  64 gate labels, integration bundle routed left of G, center names →
  tooltips. Visual-verified via SSR preview + Aside screenshots. Suite 1080.
- **DEPLOYED 2026-07-12** (version `ac62b701`) — everything above + the
  LLM service (`9ee3922`, other session) + brand manifest fix live on
  pleiad.io. MATRIX_ENGINE_VERSION bumped v1→v2 (`9f2780e`) so cached
  pair scores recompute with the fixed HD channel data. Smoked: landing
  200 + GATE cell, canonical pleiad.io, /app 307, APIs 401 fail-closed.
  Cron worker untouched (calls SITE_URL routes, bundles no engine).
- **FULL PROD E2E PASS 2026-07-12** (then redeployed `dd74ac0e` w/ fix):
  local 1080 tests ✓ · anon sweep (16 pages 200, gates 307, APIs 401,
  webhook unsigned 403, share 404, knowledge search live) · Playwright
  browser E2E on prod: fresh Auth0 signup → 5-step onboarding → self
  person Kin 161 golden ✓ → person create (Kin 239) → bodygraph 36
  canonical lanes LIVE → matrix (60/100, HD 97 after birth-place edit —
  pair cache invalidation proven) → composite bodygraph in sheet ✓.
  Test account sahar.h.barak+pleiadtest0712@gmail.com kept (pw died w/
  scratchpad; reset via Auth0 if needed); test person deleted.
  FIXED from findings: /onboarding was ungated (shell only, no data
  leak) → now in PROTECTED_PATHS (`c725665`).
  Backlog notes: geocoder suggestion not keyboard-selectable
  (ArrowDown+Enter no-op, mouse-only); Map/Matrix toggle is a
  clickable Badge (no button role); onboarding card still light-theme
  (C4 backlog); 17 lint errors in packages/mobile (mobile session's,
  unescaped apostrophes).

### Open — USER-GATED (task board #s)
1. **#25 Paddle production go-live**: KYB (user was mid-flow in Aside);
   then live products/prices + live PADDLE_* + client token → .prod.vars;
   sandbox checkout E2E separately needs the sandbox "Default Payment
   Link" dashboard setting (scratchpad e2e-checkout.mjs is ready).
2. **#14/#18 held secrets**: RESEND_API_KEY (email DNS live, domain
   verifying), TURNSTILE_SECRET_KEY + NEXT_PUBLIC_TURNSTILE_SITE_KEY
   (build-time var!). Then: set-prod-secrets.sh, PADDLE_ENV=production,
   redeploy, live checkout + email E2E.
3. **#24 Auth0 app logo**: needs M2M grant (read:clients update:clients)
   on the Management API. Tenant branding is SHARED with Peace Board —
   do NOT change it; dedicated tenant is the real fix.

### Open — BUILDABLE (no gates)
- **Circle Calendar** — MAPS_ROADMAP #3 (absorbs moon map), next build
  item. Then Tzolkin Galaxy (#4). (#2 Composite/Penta shipped `94f9864`.)
- Matrix route test; homepage pricing teaser still 3 plans; #23 shadcn
  dashboard polish; Supabase Sydney latency (migrate while DB small).

### Hard-won this session (gotchas)
- E2E on prod: fresh-signup pattern in scratchpad e2e-signup-lib.mjs
  (Auth0 signup → onboarding walk); test creds die with scratchpad.
- Auth0 NEVER skips consent for localhost callbacks (accept once).
- wrangler `routes`+custom_domain silently disables workers.dev unless
  `workers_dev: true` is explicit.
- Deploy script pins NEXT_PUBLIC_SITE_URL at BUILD time — .env.local
  otherwise leaks localhost into prod canonicals (bit us once).
- Parallel sessions: commit by EXPLICIT paths only, never `git add -A`.

## Branch state

- **Active branch: `redesign/knowledge-experience`**. Product renamed
  **Pleiad** (2026-07-04). Nothing pushed anywhere yet, no PRs.
- Health: typecheck ✓ · **937/937 tests ✓** · `next build` ✓ · deployed.
  **Lint is currently broken (pre-existing, not this work):** eslint.config.mjs
  references `react-hooks/*` and `import/*` rules but doesn't register those
  plugins in the flat config; registering them makes eslint-plugin-import OOM.
  Needs proper flat-config wiring. Tracked as a backlog item.

## Polish sweep (2026-07-05) — 6-agent fan-out, committed + deployed

Ran 6 parallel agents (3 writers on disjoint dirs, 3 read-only reporters),
integrated the high-value fixes, committed in 5 themed commits on top of the
live deploy, and redeployed. All typecheck + 937 tests green.

- **Security (`36a9334`)** — HIGH fix: plan entitlements were UI-only (free
  users got unlimited profiles + unlimited paid-Gemini AI). Now enforced
  server-side in /api/ai/interpret (requireLimit + trackUsage), /api/people
  (profile cap), /api/boards (board cap). Cron routes fail closed via
  timing-safe `src/lib/api/cron-auth.ts` (were fail-open outside production).
  Headers: X-Frame DENY, HSTS, Permissions-Policy, report-only CSP.
- **Pricing/marketing (`61c7ead`)** — free tier 1→3 people; fixed live copy
  lies (Complete "unlimited"→"up to 10", FAQ "1 profile"→"3"); hero leads
  with the free reading not the signup wall.
- **SEO (`a1e7b05`)** — JSON-LD now SSR (was client-only, invisible to
  crawlers/AI); canonicals fixed; fabricated aggregateRating removed;
  llms.txt + AI-crawler allowlist; `/app` noindexed.
- **Docs (`b40f4b5`)** — learn guides aligned to shipped reality (Tzolkin/
  Long Count are real engines; dropped 2 unshipped Gematria promises).
- **Dashboard (`d7eab9a`)** — reskinned to landing design language
  (src/app/app/dashboard.css); cards use real usePeople() data (was a 16-entry
  Hebrew TEST_PEOPLE fixture); exhaustive Hebrew/mock removal (gematria letters
  kept as data).

### Second wave (2026-07-05 pm) — DONE, committed, NOT yet deployed

8 agents across 2 waves. All green: typecheck ✓ · **905/905 tests** (count
dropped from 945: dead predictions/tags test files deleted, limiter+HMAC
tests added) · `next build` ✓ (48/48 pages).

- **Pricing (`a231a0b`)** — body rebuilt from billing.ts PLANS: free lead
  band, asymmetric Complete-featured tiers, entitlement ledger table;
  fake trial/SLA/SSO/Contact-Sales gone. Checkout reuses
  POST /api/billing/checkout. `src/components/pricing/plan-data.ts`
  mirrors PLANS (documented source of truth).
- **Group share (`533956b`)** — public GET/POST /api/share/[token], safe
  projections (no owner_id/password_hash/member birth data), server-side
  pw hash, atomic view cap. Live-E2E'd 14/14 against dev+real DB.
- **Onboarding (`8c45340`)** — AppShell gates on
  profile.onboarding_completed → /onboarding (middleware stays DB-free);
  birthPlaceSchema keeps city/country/timezone (zod was stripping); jsonb
  $type widened; 8 regression tests.
- **Boards (`5431513`)** — export dialog wired (html2canvas PNG/JPEG/SVG
  existed unmounted); share UI BUILT not deleted (backend existed e2e):
  share-link dialog + public read-only viewer /shared/[token]; 2 /boards
  backlinks → /app/boards.
- **Copy+SEO (`79d674b`)** — framing: five traditions/flavors, SIX computed
  systems (Long Count rides inside Tzolkin; compatibility genuinely scores
  five — never say six there). Learn/about/contact/login canonicals
  relative via metadataBase; OG wordmark omnis.app→Pleiad.
- **Security (`d6ba2f2`)** — rate limiter now Cloudflare-KV fixed-window
  (in-memory fallback when binding absent/errors); CSP enforced (was
  report-only); share tokens+pw hashes minted server-side ONLY (fixed
  latent bug: board shares stored raw pw in password_hash — old
  pw-protected board shares won't unlock, none existed); boards viewer pw
  ?ph= query → POST body + unlock form; unsubscribe links HMAC-signed
  (UNSUBSCRIBE_SECRET, fails closed). Also carries the scraper submodule
  de-registration (commit-ordering accident, harmless).
- **Cleanup (`77722ef`)** — REMOVED: /api/predictions/* + use-predictions
  (page computes client-side), relationships graph route (page builds own
  nodes/links), tag CRUD write path, UpgradeCTA, placeholder plans.ts.
  MOUNTED: AIInterpretation per daily event on /app/predictions (the
  metered paid feature's only consumer); share revocation in ShareDialog
  (active links + view counts + revoke). Note: tags now system-seed-only;
  people-form tag pickers vestigial until system tags seeded.
- **Knowledge (`7655047`)** — packages/scraper now in-repo package (was
  dead submodule gitlink). Corpus = src/lib/docs/content.ts (what /learn
  renders), 6 docs → 60 chunks, local Xenova/bge-small-en-v1.5 (matches
  Workers-AI query side, verified compatible, scores 0.77-0.92 local).
  `npm run ingest:knowledge` (+:dry-run/:verify), idempotent upserts.

**Deploy + user-only steps (IN ORDER — deploy fails with placeholder KV id):**
1. `npx wrangler kv namespace create RATE_LIMIT_KV` → paste id over
   REPLACE_WITH_RATE_LIMIT_KV_NAMESPACE_ID in wrangler.jsonc.
2. `npx wrangler secret put UNSUBSCRIBE_SECRET` (e.g. openssl rand -hex 32).
3. `npm run deploy` (blocked for agent by permission classifier).
4. Prod corpus: `DATABASE_URL='<supabase session-pooler URI>' npm run
   ingest:knowledge` then `npm run ingest:knowledge:verify`.

### Third wave (2026-07-05 eve) — DONE + DEPLOYED

All green: typecheck ✓ · **lint FIXED, 0 errors/64 warnings/~11s** ·
**918/918 tests** · build ✓ · deployed + smoke-verified.

- **Explorer tier (`e0dc70a`)** — $5/mo: all six systems, 5 profiles,
  2 boards, timeline; no AI/relationships/exports/groups/API ("whole map,
  small scale, no AI"). Paddle sandbox pro_01kwst8kdad72ya2syp5sschfr /
  pri_01kwst90ww53xqm03p594grsm7; PADDLE_PRICE_EXPLORER pushed as worker
  secret + .env.local. isPaidPlanTier killed the last two-paid-plan
  hardcode; entitlements enforce automatically (plan-generic
  requireLimit). Pricing page: slim Explorer row above featured grid +
  ledger column; settings upgrade surface updated. 15 new billing tests.
  NOTE: homepage PricingV2 teaser still shows 3 plans (design decision).
- **Lint fixed (`131462a`)** — root cause: unscoped override object
  leaked into .open-next/.wrangler where eslint-config-next's plugins
  (registered with a files glob) are undefined; 77MB bundle trees also
  caused the OOM. Global ignores scope lint to src/ + packages/scraper.
  import rules via resolver-free eslint-plugin-import-x (first=error
  fixed everywhere; order/no-duplicates=warn, autofixable, ratchet later).
- **Cleanup pass 2 (`1ed136d`)** — deleted 12 verified-dead files
  (TzolkinGrid, 4 landing-v1, ui/form+scroll-area, analytics, email.ts,
  3 dead barrels) + 3 deps; people-form tag picker removed (tag CRUD
  gone, no system tags seeded; read paths + legacy assignments kept).
- **Deploy correctness (`072592a` + `afd40d5`)** — CRITICAL bug fixed:
  `npm run deploy` was inlining .env.local's localhost into
  NEXT_PUBLIC_SITE_URL at build → prod canonicals said
  http://localhost:3100. Deploy script now pins the workers.dev origin;
  stale omnis.app vars in both wrangler configs corrected; cron worker
  redeployed (SITE_URL fixed). RATE_LIMIT_KV namespace created
  (a57499088e054890b17bec5d8a0b73ce) + wired; UNSUBSCRIBE_SECRET pushed
  (mirrored in .env.local). Prod smoke: canonicals correct, Explorer
  live on /pricing, CSP enforced, gates hold.

### Still-open backlog
1. **Add-ons + one-time AI packs** — deferred (product decisions; user
   AFK on the ask). Explorer shipped without them.
2. **Supabase Sydney latency** — user AFK on region question; default =
   keep for now. To migrate: user creates eu-central-1 project (or
   `npx supabase login`), then schema migrate + secrets swap + verify
   (DB near-empty, cheap now, pricier later).
3. **omnis.app emails** (hello@/privacy@/support@) — left until custom
   domain decision (user AFK on the ask). Env fallback strings
   `?? 'https://omnis.app'` harmless (prod env pinned at build now).
4. **Paddle checkout E2E** on live origin (sandbox card 4242…) — worth a
   pass now that three paid tiers exist; then business verification →
   live keys.
5. RESEND_API_KEY + GEMINI_API_KEY still unset — newsletter/daily-kin
   cron + AI interpret 503/skip until provided.
6. Knowledge corpus: pipeline committed but DORMANT per user ("not
   needed atm") — `npm run ingest:knowledge` when wanted.

## Platform migration (2026-07-04) — Mongo→Supabase, Better Auth→Auth0

Stack SWAPPED per user: MongoDB/Mongoose → **Supabase Postgres (Drizzle)**;
Better Auth → **Auth0 v4**; deploy stays **Cloudflare Workers**; billing
**Paddle sandbox**. All code done, committed, green. **Blocked only on live
secrets** — see `docs/SETUP.md` (exact env + commands, all free tier).

- Data: `src/lib/db/schema.ts` (21 tables, pgvector(384)), `client.ts`
  (postgres.js + Supavisor pooler), migration `drizzle/0000_*.sql` (has
  `CREATE EXTENSION vector`). Old `src/lib/db/models`, `connection.ts`,
  `mongo-client.ts`, `auth.ts`, `auth-client.ts`, Mongo migrate script all
  DELETED. `serialize.ts`: `toObjectId`→`toEntityId`/`isEntityId` (UUID).
- Repos: all 10 ported by parallel agents + hand-fixed. Row contract
  preserved (routes untouched). knowledge-search: Atlas $vectorSearch →
  pgvector cosine, **normalized to Atlas [0,1] score** so 0.7 threshold
  still means the same.
- Auth: `src/lib/auth0.ts`, `auth-server.ts` maps session→{id,email,name,
  image}, `middleware.ts` mounts Auth0 + gates pages (preserves rolled
  cookie on redirects). `use-auth.ts` + login page = Auth0 Universal Login
  (redirect; removed false "magic-link sent" UI). Identity mirror + profile
  bootstrap in GET/PATCH `/api/profile` (`ensureUserAndProfile`).
- Security fixes (medium code-review, 5 finders): public share routes no
  longer leak `password_hash`/`owner_id` (server-side `verifySharePassword`
  + safe projections); atomic view-count increment (max_views race);
  `src/lib/db/ownership.ts` guards group-member + person-tag writes against
  cross-tenant IDOR; bidirectional relationships canonicalize endpoint order.
- **Greenfield notes (NOT bugs, no live data yet):** Auth0 `sub` ≠ any old
  owner_id — fine, empty DB; new users create rows under their sub. If real
  Mongo data ever needs importing, an id-remap + `toEntityId` UUID-shape
  caveat apply (see review findings, angle C).
- **Supabase project ref `vgqncswfgetxwujrfavb`** (user's account). Apply
  schema: `npm run db:migrate` once `DATABASE_URL_DIRECT` is set.

## Verified against a real Postgres (2026-07-04, local docker)

Ran the migration + repos against `pgvector/pgvector:pg16` on `localhost:5433`
(no Supabase creds needed) — caught 3 real bugs the migration introduced:

- `npm run db:migrate` applies clean: 21 tables, `vector` extension on,
  `content_chunks.embedding vector(384)`.
- `scripts/smoke-repos.ts` — 12/12 assertions (people CRUD, tenant
  isolation, soft-delete, relationship canonicalization, group IDOR guard,
  billing usage). Rerun anytime with
  `DATABASE_URL=postgresql://postgres:omnisx@localhost:5433/omnisx npx tsx scripts/smoke-repos.ts`.
- Anonymous funnel walked (Playwright, dev on local pg): landing/learn/
  pricing/calculate 200; **flow 2 calculate computes for real** (Kin 17
  Self-Existing Earth); `/app` gated → 307 `/login`; protected APIs → 401.

Bugs found + fixed this pass (all committed):
1. `DrizzleQueryError` wraps the pg error → `23505` is on `.cause`, not
   `.code`. Ported repos read `.code` (undefined) so every duplicate
   group-member / reversed relationship silently 500'd. New
   `src/lib/db/errors.ts` `isUniqueViolation()` walks the cause chain.
2. **`middleware.ts` must live at `src/middleware.ts`** (src/ dir) or Next
   ignores it — `/auth/*` 404'd and gating never ran. Moved.
3. Breadcrumb separator `<li>` was nested inside item `<li>` → hydration
   error on pricing (+2). Emitted as sibling.

Local test rig: `docker run -d --name omnisx-pg -e POSTGRES_PASSWORD=omnisx
-e POSTGRES_DB=omnisx -p 5433:5432 pgvector/pgvector:pg16`. `.env.local`
currently holds local-dev values (local pg + placeholder Auth0 so the app
boots; login needs real Auth0). Git-ignored.

## DEPLOYED (2026-07-05) — live at https://omnisx.sahar-h-barak.workers.dev

All secrets live, all services wired, prod verified 21/21 authed + 19/19 anon
flow assertions (same scripts as local; scratchpad/authed-flows.mjs pattern).

- **Supabase**: password reset (new pw in .env.local), pooler URI runtime +
  session-pooler URI for migrations (direct host is IPv6-only — unreachable
  from this network). 21 tables + pgvector(384) migrated and verified.
- **Auth0** (tenant `dev-kaipd4klyg48p0ai.us`): Regular Web App "Pleiad",
  Google + Username-Password-Authentication enabled, callbacks/logout for
  :3100, :3000 and the workers.dev origin. NOTE: Universal Login default
  screen renders social-only; email path MUST pass
  `connection=Username-Password-Authentication` (fixed in use-auth.ts,
  commit 1fcd2f4).
- **Paddle sandbox** (account "Two Circles Studios"): products Pleiad
  Complete pri_01kws4k6zh22zxbg9efjd4cwqr ($9/mo) + Practitioner
  pri_01kws4k77743e1px763pv91hbq ($29/mo), API key `omnisx-server`
  (all scopes), client token `omnisx-web`, webhook →
  workers.dev/api/billing/webhook (secret captured). All in .env.local +
  wrangler secrets.
- **Cloudflare**: R2 subscription + Workers Paid ($5/mo) enabled by user
  (worker gzip is 5.2 MiB > 3 MiB free cap). Bucket omnisx-next-cache.
  Workers: `omnisx` (main) + `omnisx-cron` (3 schedules). 14 secrets pushed
  (APP_BASE_URL/NEXT_PUBLIC_SITE_URL = workers.dev origin at build+secret
  time; .env.local keeps localhost for dev).
- Test user: sahar.h.barak+omnisxtest1@gmail.com (pw was scratchpad-only —
  reset via Auth0 if needed).

## Remaining (small)

1. RESEND_API_KEY + GEMINI_API_KEY never provided — newsletter/daily-kin
   cron + AI interpret return 503/skip until set (push via wrangler secret).
2. Paddle checkout E2E (sandbox card 4242…) on live origin; then business
   verification → live Paddle keys.
3. knowledge `content_chunks` empty — search returns [] until content
   ingested (needs 384-dim bge-small embeddings).
4. Custom domain when ready: update Auth0 callbacks, Paddle webhook,
   APP_BASE_URL/NEXT_PUBLIC_SITE_URL secrets, rebuild+deploy.
5. omnisx-cron `SITE_URL` var still says omnis.app — update wrangler.jsonc.

## What this session shipped (chronological)

1. **Redesign docs** (`docs/redesign/`): USER_FLOWS (10 flows + gaps),
   DESIGN_LANGUAGE (railway.com anatomy from 19 live screenshots +
   cosmic-pilgrimage metaphor mapping + five folklore flavor tokens),
   MAIN_PURPOSE (**the thesis: living persistent map of your people across
   5 systems; docs are supporting cast**), HOMEPAGE_SPEC v2 (full copy
   deck — produced via multi-provider octo run: Codex + OpenCode + Claude
   drafts, cross-critique, synthesis; Gemini CLI is DEAD — deprecated auth
   tier), MOTION_SPEC (animation inventory: CODE vs HF-VIDEO lanes),
   ASSET_MAP (generation log + job IDs), TASTE_AUDIT (skill matrix findings
   + F-series typography/token audit).
2. **Assets via Higgsfield CLI** (auth session was user-approved; may
   expire): 10/10 stills approved first pass (GPT Image 2, style anchor in
   ASSET_MAP C7) → `public/images/redesign/{mural,motifs}/*.webp`. 2 video
   loops via **Kling 3.0** (`--start-image` from our stills; **Seedance 2.0
   is plan-gated** — needs Higgsfield Pro) → `public/videos/redesign/`.
   OG image composited via Playwright → `public/og-image.png`.
3. **Homepage rebuilt** (`src/components/landing-v2/` + `src/app/page.tsx`):
   split hero (promise left / live demo graph right), sigil band, 5 flavor
   zones (Zone grammar: pill → serif H2 → prose → embed → divide-y triad →
   lineage row), scroll-pinned FIVE LAYERS set piece, circles (asym grid),
   share demo, knowledge band w/ REAL vector search
   (`/api/knowledge/search`, new public rate-limited route), social proof +
   marquee, split-flap today board (live kin/moon/sun/hebrew via
   `src/lib/today-board.ts`), portal CTA (video), footer w/ live mono line.
   Thread-of-light rail + CSS comet traveler + star parallax + magnetic
   CTAs + AmbientVideo (IO pause, ping-pong, Save-Data/reduced-motion
   stills).
4. **Design system**: `src/lib/design/system-flavors.ts` (flavor tokens),
   `src/lib/design/landing-tokens.ts` (COLORS + TYPE ramp), tailwind theme
   gained `ground/surface/surface-2/gold/gold-soft/gold-bright` + Fraunces
   as `--font-display`/`font-display`. Text emphasis = exactly 4 steps
   (white/90·70·50·35).

## Conventions to keep (violating these = regression)

- All landing headings via `TYPE` ramp; no ad-hoc display classes.
- **Display face is Space Grotesk** (`--font-display`, swapped from
  Fraunces 2026-07-03 pm — user wants hightech/trustworthy, no serif
  mysticism). Space Grotesk has NO italics — never style
  `font-display italic` (browser fake-slant). Weight carries hierarchy
  (`font-semibold` on hero/zone/section).
- **Chrome accent is `brand` (Railway-family violet #7D5BC9 / soft
  #A78FDF / bright #EFEAFA)** — tailwind `brand/brand-soft/brand-bright`,
  constants `COLORS.brand*`. Gold classes are GONE. Per-system folklore
  accents (incl. astrology/gematria golds) still live in
  system-flavors.ts and are unchanged.
- Ground stays `#0B0D16` — murals are painted to fade into it; do not
  neutralize it without regenerating all mural art.
- Hero = Railway pattern: sky inside an inset `rounded-[2rem]` panel,
  centered promise, product surface w/ control chrome (breadcrumb + tabs)
  rising cropped from the panel floor. This centered hero is the ONE
  sanctioned centered hero (user mandated via Railway reference).
- Zones take `lean="left|right"` — alternate per zone (mural
  object-position + embed offset zig-zag). Keep alternating.
- Primary CTAs: `rounded-xl bg-brand text-white`, never text-ground on
  brand, no glow animations. Small pills stay rounded-full.
- No 3-equal-card rows; `min-h-[100dvh]` never `h-screen`;
  `active:scale-[0.98]` on interactive; videos only through
  `AmbientVideo`.
- Copy voice: calm/concrete, no mysticism-kitsch, no SaaS hype; dry humor
  only in persistence copy. Commits: semantic, no AI co-author lines.

## Tooling gotchas (hard-won)

- **Aside browser** (`aside repl`, Playwright-ish API): fine for public
  sites, **crashes ("CDP websocket disconnected"/"Page disposed") on our
  heavy localhost page** — use scratchpad Playwright instead (installed in
  scratchpad dir; pattern in git history commit messages). `page.waitForTimeout`
  doesn't exist in Aside; use custom sleep. `emulateMedia` missing too.
- **Next 16 Turbopack dev**: after layout.tsx edits may throw phantom
  "Could not find module ... global-error.js in React Client Manifest" —
  fix = `rm -rf .next` + restart, not a real bug.
- **Higgsfield**: `higgsfield generate create gpt_image_2 --prompt ... --wait --json`;
  result key = `result_url`. 502s happen — just retry. Kling 3.0 gives
  5s/720p; encode AV1 webm + h264 mp4, strip audio.
- **octo multi-LLM**: codex CLI + opencode work; `gemini` CLI returns
  IneligibleTierError (Antigravity migration required) — don't retry it.

## Next work (agreed backlog, in rough order)

1. ~~/learn docs redesign~~ — DONE (2026-07-03 pm): dark hub w/ knowledge
   search + flavored portal rows, DocHero banner bands on all 6 doc pages,
   flavored doc-accent vars + AA-safe ink split, QuickAnswer as codex
   gloss. **Leftover: 5 of 6 C2 banners are mural-crop stopgaps — GPT
   Image 2 monthly quota exhausted (starter plan); regen with C2 prompts
   when quota resets (see ASSET_MAP C2 log for CLI gotcha).**
2. Onboarding ritual backdrops (C4) + dashboard reskin (DASH-GROUND, C5,
   flap-number stat cards).
3. P3 leftovers: today-board GATE value (needs sun-longitude→gate table),
   footer featured cards, traveler spark trail, V3 map-nebula loop,
   /app/cards real people, per-system OG images.
4. Eventually: PR strategy — redesign branch stacks on cloudflare branch;
   decide merge order (cloudflare → main first, then redesign).

## Untracked/local

- Higgsfield + Aside CLIs authenticated locally (user did
  `higgsfield auth login` this session).
- Scratchpad (gone on session clear): raw PNGs of all generated assets +
  railway screenshot corpus + playwright shoot scripts. Repo webps are the
  durable copies; regenerate scripts trivially if needed.

## Mobile app build (2026-07-10, autonomous loop)

Spec set at `specs/mobile/` (7 docs — read README.md first). Build underway
on this branch:

- **Committed:** AUTH-M1 bearer-JWT API auth (additive, fails closed w/o
  AUTH0_API_AUDIENCE) · API-M3 birth_place PATCH fix · engine extracted to
  `packages/engine` (63 files, pure TS, shared web+mobile) ·
  `packages/api-client` (34 typed methods) · PUSH-M1 backend
  (device_push_tokens + Expo fan-out in digest cron) · Expo SDK 57 scaffold
  at `packages/mobile` (5-tab shell, locked tokens, on-device kin on Today).
  Suite: 995 tests, typecheck clean, root @types/react now v19 (types-only).
- **Blocked on user:** Auth0 Native app + API audience (task list #9),
  prod db:migrate + deploy + AUTH0_API_AUDIENCE secret (#10) — permission
  classifier stops agent-run prod mutations.
- **Gotcha:** don't add `"react"` to packages/mobile tsconfig paths — expo
  Metro reads tsconfig paths and will try to bundle @types/react.

### Mobile progress log (2026-07-10, cont.)

- **M1 COMPLETE** (auth+onboarding `834b962`, people+capture `a6e4067`,
  person detail six-pager `7d2432b`). Engine golden parity suite
  (`167dd36` + fix `2a7e294`), today service w/ real GATE (`ff44291` —
  also upgraded the WEB landing board to 5 cells), mobile split-flap
  Today board (`5d55bbc`). Suite 1006, both typechecks clean, iOS
  export green.
- M2a (Skia/SVG force map + pair compare) agent running.
- Free-tier gating on mobile = plan tier (subscription features has NO
  per-system array — spec corrected by build).

### Mobile build COMPLETE through M3 (2026-07-10 eve)

All autonomous work done; loop stopped. Commits this run: spec set,
AUTH-M1, API-M3, engine extraction, api-client, PUSH-M1, scaffold, M1a/b/c,
M2a/b, M3, goldens (+fix), today service w/ GATE, split-flap Today,
Maestro flows + RUNBOOK, prefs type fix. Suite 1007 · root+mobile
typecheck clean · iOS Hermes export green · prod (old deploy) smoked
read-only healthy.

**To go live (user, in order — specs/mobile/RUNBOOK.md §1):**
1. Auth0: create API https://api.pleiad.app + Native app "Pleiad Mobile"
   (callbacks incl. pleiad:// scheme + exp:// dev).
2. `wrangler secret put AUTH0_API_AUDIENCE` + .env.local.
3. `npm run db:migrate` against prod (device_push_tokens, additive).
4. `npm run deploy`.
5. packages/mobile/.env from .env.example (domain/client-id/audience/api).
6. `cd packages/mobile && npx expo start` (needs Xcode or Android SDK —
   NEITHER present on this machine; simulators unavailable was the hard
   stop for autonomous runtime verification).
7. Maestro flows in packages/mobile/.maestro (brew install maestro).

Known deferred (spec'd, not built): boards editing, PDF cards, native IAP
(RevenueCat), offline mutation queue, he/RTL, EAS build track (M4),
onboarding mural backdrops, geocoded place search, MMKV persistence.

### Verification pass (2026-07-11) — LIVE against real services

Driven via Playwright through the local dev server (user's :3100, which
runs prod Supabase + real Auth0). Results:

- Anonymous: landing renders w/ GATE cell (Gate x.y live), /calculate
  computes for real — 1988-08-17 → Kin 161 Overtone Dragon, EXACT match
  with committed golden vectors; bogus bearer → 401.
- Real Auth0 email SIGNUP (new test user sahar.h.barak+pleiadverify2@…,
  creds NOT in repo; reset via Auth0 if needed) → callback → session →
  onboarding → dashboard shell + content.
- People: create persisted to prod DB; computed_results dreamspell row
  kin 122 for 1994-03-21 — second exact golden parity match.
- API-M3 verified live: PATCH birth_place round-trips city + timezone.
- Profile + settings pages render (identity Kin 161, system toggles).
- Share: server-minted link; public viewer opens with NO auth and leaks
  no owner_id/password_hash. Test share revoked + test person deleted
  after the pass (account kept for future verification).
- Infra verified separately: migrations 0000+0001 clean-apply on fresh
  pgvector Postgres, repo smoke 12/12, push-token repo smoke 8/8,
  bearer path real-RS256 integration tests 7/7 (suite 1023).

Still pending (user-gated): Auth0 native app + audience secret + prod
deploy + on-device mobile run (no Xcode/Android SDK on this machine).

### Prod deploy + LIVE production E2E (2026-07-11, user-ordered push)

- **DEPLOYED** (version 8cafbe25…): AUTH-M1 bearer path, PUSH-M1 routes,
  API-M3 fix, GATE board cell — live on pleiad.io + workers.dev alias.
  Deploy gotcha: opennext patch-vercel-og ENOENT → fix is
  `rm -rf .next .open-next` first (stale build tree after workspace
  installs).
- **Full E2E re-run against PRODUCTION pleiad.io**: real Auth0 login,
  dashboard, people create → prod rows, computed kin 122 = golden,
  API-M3 birth_place roundtrip, profile/settings, share create + public
  viewer, no data leakage. Test artifacts cleaned after.
- **Found**: login initiated on the workers.dev alias breaks (state
  cookie on workers.dev, callback forced to pleiad.io by APP_BASE_URL) —
  alias is dead for login, fine for API. Mobile default API URL switched
  to pleiad.io.
- Auth0 dashboard unreachable for agent (no mgmt-API grant, no CLI, no
  browser session — Chrome extension disconnected, Aside logged out).

### PRODUCTION FULLY LIVE + END-TO-END VERIFIED (2026-07-11)

Auth0 configured entirely via Aside browser (user Touch-ID + named grants):
- API "Pleiad API" (https://api.pleiad.app) created.
- Native app "Pleiad Mobile" — client ID PcBpDL7E8HUkNwWG4j0w2E93M3J3q1FZ.
  Callback URLs (pleiad:// ios+android, com.pleiad.mobile.auth0://, exp://
  127.0.0.1:8081 + localhost:8081), Logout URLs, connections
  (Username-Password-Authentication + google-oauth2), and user-delegated
  API-access grant to Pleiad API (this tenant uses Auth0 API Access
  Policies — the grant is REQUIRED even for first-party native).
- AUTH0_API_AUDIENCE secret on worker + .env.local.
- device_push_tokens migrated to prod DB (verified present).
- packages/mobile/.env written (real client id/audience/pleiad.io).

**End-to-end proof (scratchpad/verify/pkce-prod.mjs) against deployed
worker:** real Auth0 PKCE login → audience-scoped access token → GET
/api/people 200 (AUTH-M1 bearer LIVE) → POST /api/notifications/devices
201 (PUSH-M1 + migration LIVE). Test token cleaned up after.

Gotchas learned: Auth0 callback/logout fields are tag-inputs — comma
strings become ONE malformed chip; must enter each URL + dispatch Enter
keydown/keypress/keyup. Aside `t.fill` marks redux-form dirty (native
value setter alone does not). Aside repl: one browser session per
invocation; `openTab` returns the page handle; screenshots come back as a
Buffer (pipe base64 through Bash, `fs` unavailable in the sandbox).

**REMAINING (real device only — no simulator on this machine):** open
packages/mobile in Expo Go (`npx expo start`), sign in, walk F1–F12;
EAS build + TestFlight (M4). Everything server/auth/data is proven live.
