# Session Handoff — Redesign (2026-07-03)

Continue point for the Omnis knowledge-experience redesign. Read this +
MAIN_PURPOSE.md first; everything else on demand.

## Branch state

- **Active branch: `redesign/knowledge-experience`** (17 commits, based on
  `feat/cloudflare-foundation` which itself is 16 unpushed commits ahead of
  main — the full platform migration: Cloudflare Workers, Mongo/Better
  Auth, Gemini, Paddle. Nothing pushed anywhere yet, no PRs).
- Working tree clean except `next-env.d.ts` (generated noise) and
  `.claude/settings.local.json`.
- Health at handoff: typecheck ✓ · lint 0 errors (12 pre-existing
  warnings) · 935/935 tests ✓ · `next build` ✓.

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
- No hardcoded hexes in landing-v2 — tailwind tokens or `COLORS`; only
  seal-family demo colors + system-flavors source are literal.
- Every mural band fades to `#0B0D16` at edges (one-continuous-painting).
- No 3-equal-card rows; no centered heroes; `min-h-[100dvh]` never
  `h-screen`; `active:scale-[0.98]` on interactive; videos only through
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
