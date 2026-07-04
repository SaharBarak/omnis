# Session Handoff — Redesign (2026-07-03)

Continue point for the Omnis knowledge-experience redesign. Read this +
MAIN_PURPOSE.md first; everything else on demand.

## Branch state

- **Active branch: `redesign/knowledge-experience`**. Product renamed
  **OmnisX** (2026-07-04). Nothing pushed anywhere yet, no PRs.
- Health: typecheck ✓ · lint 0 errors (11 pre-existing warnings) ·
  935/935 tests ✓ · `next build` ✓.

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

## Remaining (blocked on user-supplied secrets)

1. Fill `.env.local` from `.env.example` (Supabase pooler + direct URIs,
   Auth0 app creds, Paddle sandbox keys + price IDs) — `docs/SETUP.md`.
2. `npm run db:migrate` (creates tables + pgvector).
3. Walk all 10 USER_FLOWS end-to-end on the live stack (Playwright for
   localhost — Aside crashes on heavy local pages).
4. `wrangler r2 bucket create omnisx-next-cache`, `wrangler secret put …`
   (list in SETUP), `npm run deploy` + `npm run deploy:cron`; then point
   Auth0 callbacks + Paddle webhook at the deployed origin.

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
