# Pleiad — Release Plan

## Current State (March 2026)

**Build**: Clean (0 errors, 0 TypeScript issues)
**Deploy**: Cloudflare Workers via OpenNext (`npm run deploy` / `wrangler`)
**Stack**: Next.js + MongoDB Atlas + Better Auth + Paddle + Gemini + Cloudflare + Tailwind + shadcn/ui

> **Platform migration:** The stack moved off Supabase/Stripe/Anthropic/Vercel to
> MongoDB Atlas (Mongoose) + Better Auth, Paddle (merchant of record), Google
> Gemini, and Cloudflare Workers (OpenNext + Cron Triggers + Web Analytics).
> Provider names below reflect the new stack. See `docs/MIGRATION_PLAN.md`.

### Merged Visual PRs
- #52 — Professional SVG Natal Chart Wheel (astrology)
- #55 — Enhanced OracleMap + BodygraphChart (473-line SVG bodygraph)
- #56 — Dreamspell/Tzolkin visual polish (TzolkinGrid, DreamspellSection, today-kin)

### Deferred
- #53 — In-Browser Terminal UI (cosmetic, deferred to Phase 4)
- #54 — Closed as duplicate of #55

---

## Phase 1 — MVP (NOW)

**Goal**: Presentable landing page + core Dreamspell/Tzolkin calculations.

### What's Live
- Landing page with Hero, SystemsShowcase, Features, Testimonials, Pricing, FAQ, CTA
- Full SEO: JSON-LD schemas (WebApp, WebSite, Organization, FAQ), sitemap, robots.txt, OpenGraph
- Auth flow: Better Auth login/signup with OAuth callback
- Dashboard: sidebar nav, mobile bottom nav, command palette (Cmd+K)
- People management: add/edit profiles with birth data
- Dreamspell calculations: kin, seal, tone, oracle cross, wavespell
- Tzolkin calculations: traditional day sign with TzolkinGrid
- Predictions: daily/weekly/monthly Dreamspell forecasts, personal timeline
- Cards: generated profile cards with Dreamspell/Tzolkin data
- Learn pages: educational content for all 6 systems
- Today page: daily kin with static regeneration (1h revalidation)
- Notification system: daily kin emails via Resend
- Calculator page: public calculation tool
- Compatibility page: relationship analysis

### Required Environment Variables
See `.env.example` for full list. Minimum for Phase 1:
- `MONGODB_URI`
- `BETTER_AUTH_SECRET` + `BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `CRON_SECRET`
- `RESEND_API_KEY` (for daily kin emails)

---

## Phase 2 — Visual Charts

**Goal**: Astrology natal chart + Human Design bodygraph as visual SVG components.

### What's Ready (code merged, needs data integration)
- `NatalChartWheel` — 577-line SVG astrology chart with houses, planets, aspects
- `BodygraphChart` — 473-line SVG Human Design bodygraph with centers, channels, gates
- `OracleMap` — Enhanced oracle cross visualization with color-coded seals
- `AstrologyDisplay` — Updated card section with natal chart integration
- `HumanDesignDisplay` — Card section with bodygraph integration

### Requires
- Astrology calculation engine (ephemeris data for planetary positions)
- Human Design calculation engine (gate activations from birth data)
- Birth time + birth location for both systems
- Consider: Swiss Ephemeris integration or API service

---

## Phase 3 — Social & AI

**Goal**: Group analysis, AI interpretations, relationship mapping.

### What's Ready (UI built, needs backend enrichment)
- Groups page: create groups, manage members, group analysis route
- Relationships page: CRUD with type/strength/bidirectionality
- Relationship Map (graph): visual network of connections
- Boards: kanban-style boards with drag-and-drop
- AI interpretations: Gemini API integration (`/api/ai/interpret`)
- Share system: shareable profile/group tokens

### Requires
- `GEMINI_API_KEY` for AI interpretations
- Mongo collections for relationships, groups, boards
- Testing AI prompt quality for chart interpretations

---

## Phase 4 — Monetization

**Goal**: Paddle billing, premium features, terminal UI.

### What's Ready (code complete)
- Billing page: subscription status, usage display, plan comparison
- Checkout flow: Paddle transaction / hosted checkout
- Portal: Paddle customer portal
- Webhook handler: subscription lifecycle events
- Pricing page: Free / Complete ($9/mo) / Practitioner ($29/mo)
- Usage limits: profiles, AI interpretations, boards per plan

### Requires
- `PADDLE_API_KEY` + `PADDLE_WEBHOOK_SECRET`
- Paddle products/prices created in dashboard (Paddle is merchant of record)
- `PADDLE_PRICE_COMPLETE` + `PADDLE_PRICE_PRACTITIONER`
- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` (for Paddle.js overlay) + `PADDLE_ENV`
- Webhook destination registered in Paddle

### Deferred Features
- Terminal UI (#53) — in-browser symbolic terminal
- Knowledge base search (scraper output integration)
- Gematria calculations (Hebrew name numerology)

---

## Cloudflare Cron Triggers

Configured as Cron Triggers (handler in `workers/cron`):
| Route | Schedule | Purpose |
|---|---|---|
| `/api/cron/daily-kin` | 6:00 AM UTC | Send daily kin emails |
| `/api/cron/daily-predictions` | 4:00 AM UTC | Generate daily predictions |
| `/api/cron/send-notifications` | 8:00 AM UTC | Send queued notifications |

---

## Architecture Notes

- **Mongo models**: Mongoose schemas live under `src/lib/db/models/` (ported from the former Supabase migrations). Atlas Vector Search backs knowledge search.
- **Knowledge scraper**: `packages/scraper/` is a separate concern. The offline scraper writes to Mongo and embeds the corpus with Workers AI `bge-small-en-v1.5` (384d). Leave as-is.
- **Public assets**: Dreamspell GIFs in `public/dreamspell/`, system icons in `public/icons/`.
- **Content**: Blog and guides in `content/` directory.
