# Omnis — Release Plan

## Current State (March 2026)

**Build**: Clean (0 errors, 0 TypeScript issues)
**Deploy**: Vercel (auto-deploy on push to main)
**Stack**: Next.js 15 + Supabase + Stripe + Tailwind + shadcn/ui

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
- Auth flow: Supabase login/signup with callback
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
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
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
- AI interpretations: Claude API integration (`/api/ai/interpret`)
- Share system: shareable profile/group tokens

### Requires
- `ANTHROPIC_API_KEY` for AI interpretations
- Supabase tables for relationships, groups, boards (migrations 001-008)
- Testing AI prompt quality for chart interpretations

---

## Phase 4 — Monetization

**Goal**: Stripe billing, premium features, terminal UI.

### What's Ready (code complete)
- Billing page: subscription status, usage display, plan comparison
- Checkout flow: Stripe checkout sessions
- Portal: Stripe customer portal
- Webhook handler: subscription lifecycle events
- Pricing page: Free / Complete ($9/mo) / Practitioner ($29/mo)
- Usage limits: profiles, AI interpretations, boards per plan

### Requires
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- Stripe products/prices created in dashboard
- `STRIPE_PRICE_COMPLETE_MONTHLY` + `STRIPE_PRICE_PRACTITIONER_MONTHLY`
- Webhook endpoint registered in Stripe

### Deferred Features
- Terminal UI (#53) — in-browser symbolic terminal
- Knowledge base search (scraper output integration)
- Gematria calculations (Hebrew name numerology)

---

## Vercel Cron Jobs

Configured in `vercel.json`:
| Route | Schedule | Purpose |
|---|---|---|
| `/api/cron/daily-kin` | 6:00 AM UTC | Send daily kin emails |
| `/api/cron/daily-predictions` | 4:00 AM UTC | Generate daily predictions |
| `/api/cron/send-notifications` | 8:00 AM UTC | Send queued notifications |

---

## Architecture Notes

- **Supabase migrations**: 001-008 exist in `supabase/migrations/`. Don't apply 007-008 without Supabase access.
- **Knowledge scraper**: `packages/scraper/` is a separate concern (108 sources, MiniLM embeddings). Leave as-is.
- **Public assets**: Dreamspell GIFs in `public/dreamspell/`, system icons in `public/icons/`.
- **Content**: Blog and guides in `content/` directory.
