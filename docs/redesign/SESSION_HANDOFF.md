# Session Handoff — Redesign (2026-07-05)

Continue point for the Omnis knowledge-experience redesign. Read this +
MAIN_PURPOSE.md first; everything else on demand.

## Branch state

- **Active branch: `redesign/knowledge-experience`**. Product renamed
  **OmnisX** (2026-07-04). Nothing pushed anywhere yet, no PRs.
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
  relative via metadataBase; OG wordmark omnis.app→OmnisX.
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

### Still-open backlog
1. **Explorer $5 tier + add-ons (#14)** — needs new Paddle sandbox prices
   (user) + billing.ts + entitlement fields.
2. **Pre-existing (#23)** — lint flat-config broken (above); Supabase
   pooler in Sydney → authed queries ~30s (region migration / caching).
3. **Deliberately left** — hello@/privacy@/support@omnis.app emails (need
   domain decision + Resend verification); env fallback strings
   `?? 'https://omnis.app'` (harmless, prod env set).
4. **Extra dead-code suspects (listed, not deleted)** — TzolkinGrid,
   landing-v1 {demo,how-it-works,scroll-reveal-quote,social-proof},
   ui/{form,scroll-area} (+deps), lib/analytics.ts, services/email.ts,
   dead barrels billing/index, types/index, data/index.

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
- **Auth0** (tenant `dev-kaipd4klyg48p0ai.us`): Regular Web App "OmnisX",
  Google + Username-Password-Authentication enabled, callbacks/logout for
  :3100, :3000 and the workers.dev origin. NOTE: Universal Login default
  screen renders social-only; email path MUST pass
  `connection=Username-Password-Authentication` (fixed in use-auth.ts,
  commit 1fcd2f4).
- **Paddle sandbox** (account "Two Circles Studios"): products OmnisX
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
